import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  increment,
  arrayUnion,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NewsStory, UserVote, NewsFilters, UserNewsSubmission, NewsListResponse, MediaFile, NewsMedia } from '../types/news';
import { FormMediaFile } from '../types/navigation';
import { mediaService, UploadProgress } from './MediaService';
import { sanitizeForFirestore } from '../utils/sanitize';

export class NewsService {
  private static instance: NewsService;
  private newsCollection = collection(db, 'news');
  private userSubmissionsCollection = collection(db, 'userNewsSubmissions');

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  // Real-time news subscription
  subscribeToNews(
    filters: NewsFilters = {},
    callback: (response: NewsListResponse) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      let q = query(this.newsCollection);

      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.bias) {
        q = query(q, where(`biasScore.${filters.bias}`, '>', 60)); // Majority bias
      }

      if (filters.minCredibility) {
        q = query(q, where('averageCredibility', '>=', filters.minCredibility));
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'trending':
          q = query(q, where('isTrending', '==', true), orderBy('viewCount', 'desc'));
          break;
        case 'mostVoted':
          q = query(q, orderBy('totalVotes', 'desc'));
          break;
        case 'controversial':
          // Stories with high engagement but mixed bias scores
          q = query(q, orderBy('totalVotes', 'desc'));
          break;
        default:
          q = query(q, orderBy('createdAt', 'desc'));
      }

      q = query(q, limit(20)); // Pagination

      return onSnapshot(q, (snapshot) => {
        const stories: NewsStory[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          stories.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            sources: data.sources?.map((source: any) => ({
              ...source,
              publishedAt: source.publishedAt?.toDate() || new Date()
            })) || [],
            userVotes: data.userVotes?.map((vote: any) => ({
              ...vote,
              votedAt: vote.votedAt?.toDate() || new Date()
            })) || []
          } as NewsStory);
        });

        const response: NewsListResponse = {
          stories,
          hasMore: stories.length === 20,
          lastDoc: snapshot.docs[snapshot.docs.length - 1]
        };

        callback(response);
      }, (error) => {
        console.error('News subscription error:', error);
        errorCallback?.(error as Error);
      });

    } catch (error) {
      console.error('Error setting up news subscription:', error);
      errorCallback?.(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Get single news story with real-time updates
  subscribeToNewsStory(
    newsId: string,
    callback: (story: NewsStory | null) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const docRef = doc(this.newsCollection, newsId);
      
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const story: NewsStory = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            sources: data.sources?.map((source: any) => ({
              ...source,
              publishedAt: source.publishedAt?.toDate() || new Date()
            })) || [],
            userVotes: data.userVotes?.map((vote: any) => ({
              ...vote,
              votedAt: vote.votedAt?.toDate() || new Date()
            })) || []
          } as NewsStory;
          
          callback(story);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error('News story subscription error:', error);
        errorCallback?.(error as Error);
      });

    } catch (error) {
      console.error('Error setting up news story subscription:', error);
      errorCallback?.(error as Error);
      return () => {};
    }
  }

  // Vote on news story
  async voteOnStory(newsId: string, userId: string, vote: Omit<UserVote, 'userId' | 'votedAt'>): Promise<void> {
    try {
      const docRef = doc(this.newsCollection, newsId);
      
      const userVote: UserVote = {
        userId,
        ...vote,
        votedAt: new Date()
      };

      // Add vote and increment counters atomically
      await updateDoc(docRef, {
        userVotes: arrayUnion(userVote),
        totalVotes: increment(1),
        updatedAt: serverTimestamp()
      });

      console.log('Vote submitted successfully');
    } catch (error) {
      console.error('Error voting on story:', error);
      throw error;
    }
  }

  // Increment view count
  async incrementViewCount(newsId: string): Promise<void> {
    try {
      const docRef = doc(this.newsCollection, newsId);
      await updateDoc(docRef, {
        viewCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  // Increment share count
  async incrementShareCount(newsId: string): Promise<void> {
    try {
      const docRef = doc(this.newsCollection, newsId);
      await updateDoc(docRef, {
        shareCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing share count:', error);
    }
  }

  // Submit user-generated news - Enhanced with media support
  async submitUserNews(submission: {
    title: string;
    primaryUrl?: string; // Now optional
    summary: string;
    category: string;
    submittedBy: string;
    tags?: string[];
    additionalSources?: string[];
    urgencyLevel?: 'normal' | 'breaking' | 'developing';
    suggestedBias?: 'left' | 'center' | 'right';
    suggestedCredibility?: number;
    sourceReputation?: 'verified' | 'questionable' | 'unknown';
    photos?: FormMediaFile[];
    videos?: FormMediaFile[];
    selectedCoverImageId?: string;
  }, onMediaUploadProgress?: (progresses: UploadProgress[]) => void): Promise<string> {
    try {
      console.log('🚀 Creating user-generated news story:', submission);
      
      // First, validate media files if present
      const allMedia = [...(submission.photos || []), ...(submission.videos || [])];
      if (allMedia.length > 0) {
        const validation = mediaService.validateMediaFiles(
          submission.photos || [],
          submission.videos || []
        );
        
        if (!validation.isValid) {
          throw new Error(`Media validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Create the news story first to get an ID
      const tempStoryData = {
        title: submission.title,
        summary: submission.summary,
        category: submission.category,
        submittedBy: submission.submittedBy,
        isUserGenerated: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(this.newsCollection, tempStoryData);
      const newsId = docRef.id;
      
      // Upload media files if present
      let newsMedia: NewsMedia | undefined;
      let uploadedPhotos: MediaFile[] = [];
      let uploadedVideos: MediaFile[] = [];
      
      if (allMedia.length > 0) {
        console.log('📁 Uploading media files...');
        const uploadedFiles = await mediaService.uploadMediaFiles(
          allMedia,
          newsId,
          submission.submittedBy,
          onMediaUploadProgress
        );
        
        // Separate photos and videos
        uploadedPhotos = uploadedFiles.filter(f => f.type === 'photo');
        uploadedVideos = uploadedFiles.filter(f => f.type === 'video');
        
        // Find cover image
        let coverImageUrl: string | undefined;
        if (submission.selectedCoverImageId && uploadedPhotos.length > 0) {
          const coverImage = uploadedPhotos.find(p => 
            p.id.includes(submission.selectedCoverImageId!)
          );
          coverImageUrl = coverImage?.url;
        } else if (uploadedPhotos.length > 0) {
          // Use first photo as cover if no specific selection
          coverImageUrl = uploadedPhotos[0].url;
        }
        
        newsMedia = {
          photos: uploadedPhotos,
          videos: uploadedVideos,
          coverImageUrl,
          totalMediaCount: uploadedPhotos.length + uploadedVideos.length
        };
      }
      
      // Create enhanced NewsStory object for user-generated content
      const allSources = [
        ...(submission.primaryUrl ? [submission.primaryUrl] : []),
        ...(submission.additionalSources || [])
      ];
      const totalSourceCount = allSources.length;
      
      // Create sources array
      const sources = allSources.map((url, index) => {
        const domain = this.extractDomain(url);
        const isPrimarySource = submission.primaryUrl && url === submission.primaryUrl;
        const sourceNumber = submission.primaryUrl ? index : index + 1;
        
        return {
          id: `user-source-${Date.now()}-${index}`,
          name: isPrimarySource ? 'Primary Source' : `Additional Source ${sourceNumber}`,
          url,
          bias: submission.suggestedBias || 'center' as const,
          credibilityScore: submission.suggestedCredibility || this.getSourceCredibilityScore(submission.sourceReputation),
          publishedAt: new Date()
        };
      });
      
      // Enhanced bias scoring based on user input and source reputation
      const biasScore = this.calculateInitialBiasScore(
        submission.suggestedBias,
        submission.sourceReputation,
        totalSourceCount
      );
      
      // Generate content based on available sources
      let content = `User-submitted news: ${submission.summary}`;
      if (submission.primaryUrl) {
        content += `\n\nPrimary Source: ${submission.primaryUrl}`;
      }
      if (submission.additionalSources?.length) {
        content += `\n\nAdditional Sources:\n${submission.additionalSources.join('\n')}`;
      }
      if (!submission.primaryUrl && !submission.additionalSources?.length) {
        content += '\n\nNo external sources provided.';
      }
      
      const storyData: any = {
        title: submission.title,
        summary: submission.summary,
        content,
        category: submission.category,
      };

      // Add all story properties to storyData
      storyData.biasScore = biasScore;
      storyData.totalSources = totalSourceCount;
      storyData.sources = sources;
      storyData.userVotes = [];
      storyData.totalVotes = 0;
      storyData.averageCredibility = submission.suggestedCredibility || this.getSourceCredibilityScore(submission.sourceReputation);
      storyData.averageQuality = submission.suggestedCredibility || this.getSourceCredibilityScore(submission.sourceReputation);
      storyData.isBreaking = submission.urgencyLevel === 'breaking';
      storyData.isTrending = submission.urgencyLevel === 'developing';
      storyData.isUserGenerated = true;
      storyData.submittedBy = submission.submittedBy;
      storyData.tags = submission.tags || [];
      storyData.urgencyLevel = submission.urgencyLevel || 'normal';
      storyData.sourceReputation = submission.sourceReputation || 'unknown';
      storyData.communityFlags = {
        spam: 0,
        misinformation: 0,
        duplicate: 0,
        inappropriate: 0
      };
      const isVerifiedSource = submission.sourceReputation === 'verified';
      const lowOrMissingCred = !submission.suggestedCredibility || submission.suggestedCredibility < 3;
      storyData.needsFactCheck = !isVerifiedSource && (submission.sourceReputation === 'questionable' || lowOrMissingCred);
      storyData.viewCount = 0;
      storyData.shareCount = 0;
      storyData.bookmarkCount = 0;
      storyData.commentCount = 0;
      storyData.createdAt = new Date();
      storyData.updatedAt = new Date();

      // Add media only if it exists
      if (newsMedia) {
        storyData.media = newsMedia;
      }

      // Update the existing document with complete story data
      const cleanStoryData = sanitizeForFirestore(storyData);
      await updateDoc(docRef, {
        ...cleanStoryData,
        updatedAt: serverTimestamp()
      });

      console.log('✅ User-generated news story created successfully:', newsId);
      return newsId;
    } catch (error) {
      console.error('❌ Error submitting user news:', error);
      throw error;
    }
  }

  // Get trending topics (could be used for suggestions)
  async getTrendingTopics(limitCount = 10): Promise<string[]> {
    try {
      const q = query(
        this.newsCollection,
        where('isTrending', '==', true),
        orderBy('viewCount', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const categories: string[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category && !categories.includes(data.category)) {
          categories.push(data.category);
        }
      });

      return categories;
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  // Cache AI summary into Firestore to avoid repeated API calls
  async setAISummary(newsId: string, summary: string): Promise<void> {
    try {
      const docRef = doc(this.newsCollection, newsId);
      await updateDoc(docRef, {
        aiSummary: summary,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error caching AI summary:', error);
      // Do not throw; failure to cache should not break UI
    }
  }
  
  // Get user-generated content stats
  async getUserSubmissionStats(userId: string): Promise<{
    totalSubmissions: number;
    approvedSubmissions: number;
    totalVotes: number;
    averageRating: number;
  }> {
    try {
      const q = query(
        this.newsCollection,
        where('submittedBy', '==', userId),
        where('isUserGenerated', '==', true)
      );

      const snapshot = await getDocs(q);
      let totalVotes = 0;
      let totalRating = 0;
      let ratingCount = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        totalVotes += data.totalVotes || 0;
        if (data.averageCredibility > 0) {
          totalRating += data.averageCredibility;
          ratingCount++;
        }
      });

      return {
        totalSubmissions: snapshot.size,
        approvedSubmissions: snapshot.size, // All submissions are immediately approved
        totalVotes,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0
      };
    } catch (error) {
      console.error('Error getting user submission stats:', error);
      return {
        totalSubmissions: 0,
        approvedSubmissions: 0,
        totalVotes: 0,
        averageRating: 0
      };
    }
  }

  // Search news stories
  async searchNews(searchTerm: string, filters: NewsFilters = {}): Promise<NewsStory[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - you might want to use Algolia or similar for better search
      let q = query(this.newsCollection);

      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(50));

      const snapshot = await getDocs(q);
      const allStories: NewsStory[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allStories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          sources: data.sources?.map((source: any) => ({
            ...source,
            publishedAt: source.publishedAt?.toDate() || new Date()
          })) || [],
          userVotes: data.userVotes?.map((vote: any) => ({
            ...vote,
            votedAt: vote.votedAt?.toDate() || new Date()
          })) || []
        } as NewsStory);
      });

      // Filter by search term (basic text matching)
      const filteredStories = allStories.filter(story => 
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filteredStories;
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }

  // Cache AI bias result (percentages and detected class)
  async setAIBiasResult(newsId: string, result: {
    left: number; center: number; right: number;
    detectedBias: 'left' | 'center' | 'right';
    confidence?: number;
    justification?: string;
    aligned_elements?: string[];
    provider?: string;
  }): Promise<void> {
    try {
      const docRef = doc(this.newsCollection, newsId);
      await updateDoc(docRef, {
        biasScore: {
          left: result.left,
          center: result.center,
          right: result.right,
        },
        aiDetectedBias: result.detectedBias,
        aiBiasConfidence: typeof result.confidence === 'number' ? result.confidence : null,
        aiBiasJustification: result.justification || null,
        aiBiasAlignedElements: result.aligned_elements || null,
        aiBiasProvider: result.provider || null,
        aiBiasGeneratedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error caching AI bias result:', error);
    }
  }
  
  // Helper functions for enhanced submission handling
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
  
  private getSourceCredibilityScore(reputation?: 'verified' | 'questionable' | 'unknown'): number {
    switch (reputation) {
      case 'verified': return 4.0;
      case 'questionable': return 2.0;
      case 'unknown': 
      default: return 3.0;
    }
  }
  
  private calculateInitialBiasScore(
    suggestedBias?: 'left' | 'center' | 'right',
    sourceReputation?: 'verified' | 'questionable' | 'unknown',
    sourceCount: number = 1
  ): BiasScore {
    // Base neutral score
    let biasScore = { left: 33, center: 34, right: 33 };
    
    // Adjust based on user's bias assessment
    if (suggestedBias) {
      switch (suggestedBias) {
        case 'left':
          biasScore = { left: 60, center: 25, right: 15 };
          break;
        case 'right':
          biasScore = { left: 15, center: 25, right: 60 };
          break;
        case 'center':
          biasScore = { left: 20, center: 60, right: 20 };
          break;
      }
    }
    
    // Adjust confidence based on source reputation and count
    const reliabilityFactor = sourceReputation === 'verified' ? 1.2 : 
                            sourceReputation === 'questionable' ? 0.8 : 1.0;
    
    const sourceCountFactor = Math.min(1 + (sourceCount - 1) * 0.1, 1.5);
    
    // Apply factors (keep within bounds)
    const factor = reliabilityFactor * sourceCountFactor;
    if (factor !== 1.0) {
      const dominant = suggestedBias || 'center';
      if (factor > 1.0) {
        // Increase confidence in the dominant bias
        biasScore[dominant] = Math.min(biasScore[dominant] * factor, 80);
      } else {
        // Decrease confidence, move toward neutral
        biasScore = { left: 30, center: 40, right: 30 };
      }
    }
    
    return biasScore;
  }
}

// Export singleton instance
export const newsService = NewsService.getInstance();
