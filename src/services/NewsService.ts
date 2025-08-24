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
import { NewsStory, UserVote, NewsFilters, UserNewsSubmission, NewsListResponse } from '../types/news';

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

  // Submit user-generated news - Now creates a real NewsStory immediately
  async submitUserNews(submission: Omit<UserNewsSubmission, 'id' | 'submittedAt' | 'status'>): Promise<string> {
    try {
      console.log('🚀 Creating user-generated news story:', submission);
      
      // Create a full NewsStory object for user-generated content
      const userGeneratedStory = {
        title: submission.title,
        summary: submission.summary,
        content: `User-submitted news: ${submission.summary}\n\nSource: ${submission.url}`,
        category: submission.category,
        
        // Default bias score for user-generated content (will be updated by community votes)
        biasScore: {
          left: 33,
          center: 34,
          right: 33
        },
        
        // Single source (user-provided URL)
        totalSources: 1,
        sources: [{
          id: `user-source-${Date.now()}`,
          name: 'User Submission',
          url: submission.url,
          bias: 'center' as const,
          credibilityScore: 3.0, // Neutral starting score
          publishedAt: new Date()
        }],
        
        // Community engagement (starts empty)
        userVotes: [],
        totalVotes: 0,
        averageCredibility: 0,
        averageQuality: 0,
        
        // AI analysis (none initially)
        aiSummary: undefined,
        aiCredibilityScore: undefined,
        aiDetectedBias: undefined,
        
        // Metadata
        isBreaking: false,
        isTrending: false,
        isUserGenerated: true,
        submittedBy: submission.submittedBy,
        
        // Engagement metrics
        viewCount: 0,
        shareCount: 0,
        bookmarkCount: 0,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add directly to news collection (not user submissions)
      const docRef = await addDoc(this.newsCollection, {
        ...userGeneratedStory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sources: userGeneratedStory.sources.map(source => ({
          ...source,
          publishedAt: serverTimestamp()
        }))
      });

      console.log('✅ User-generated news story created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting user news:', error);
      throw error;
    }
  }

  // Get trending topics (could be used for suggestions)
  async getTrendingTopics(limit = 10): Promise<string[]> {
    try {
      const q = query(
        this.newsCollection,
        where('isTrending', '==', true),
        orderBy('viewCount', 'desc'),
        limit(limit)
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
}

// Export singleton instance
export const newsService = NewsService.getInstance();