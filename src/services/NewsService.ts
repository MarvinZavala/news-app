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

  // Submit user-generated news
  async submitUserNews(submission: Omit<UserNewsSubmission, 'id' | 'submittedAt' | 'status'>): Promise<string> {
    try {
      const newSubmission: Omit<UserNewsSubmission, 'id'> = {
        ...submission,
        status: 'pending',
        submittedAt: new Date()
      };

      const docRef = await addDoc(this.userSubmissionsCollection, {
        ...newSubmission,
        submittedAt: serverTimestamp()
      });

      console.log('News submission created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting user news:', error);
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