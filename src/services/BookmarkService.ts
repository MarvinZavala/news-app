import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  increment,
  getDoc,
  writeBatch,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NewsStory } from '../types/news';

export interface Bookmark {
  id: string;
  newsStoryId: string;
  userId: string;
  title: string;
  summary: string;
  category: string;
  imageUrl?: string;
  
  // Bookmark-specific metadata
  bookmarkedAt: Date;
  tags: string[];
  notes?: string;
  isRead: boolean;
  readAt?: Date;
  readingProgress?: number; // 0-100%
  
  // Cached story data for offline access
  cachedStory?: NewsStory;
  
  // Organization
  collectionId?: string; // For bookmark collections/folders
  priority: 'normal' | 'high' | 'urgent';
}

export interface BookmarkCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  bookmarkCount: number;
  color?: string;
  icon?: string;
}

export interface BookmarkStats {
  totalBookmarks: number;
  unreadCount: number;
  collectionsCount: number;
  recentlyAdded: Bookmark[];
  mostBookmarkedCategories: { category: string; count: number }[];
}

class BookmarkService {
  private bookmarksCache: Map<string, Bookmark[]> = new Map();
  private collectionsCache: Map<string, BookmarkCollection[]> = new Map();
  
  /**
   * Add a news story to bookmarks with optimistic updates
   */
  async addBookmark(
    userId: string, 
    story: NewsStory, 
    options: {
      collectionId?: string;
      tags?: string[];
      notes?: string;
      priority?: 'normal' | 'high' | 'urgent';
    } = {}
  ): Promise<Bookmark> {
    const bookmarkData: Omit<Bookmark, 'id'> = {
      newsStoryId: story.id,
      userId,
      title: story.title,
      summary: story.summary,
      category: story.category,
      bookmarkedAt: new Date(),
      tags: options.tags || [],
      ...(options.notes && { notes: options.notes }), // Only include if defined
      isRead: false,
      cachedStory: story,
      ...(options.collectionId && { collectionId: options.collectionId }), // Only include if defined
      priority: options.priority || 'normal'
    };

    // Optimistic update to cache
    const optimisticBookmark: Bookmark = {
      id: `temp-${Date.now()}`,
      ...bookmarkData
    };

    this.updateCacheOptimistically(userId, optimisticBookmark, 'add');

    try {
      // Clean data for Firebase (remove undefined fields)
      const cleanBookmarkData = Object.fromEntries(
        Object.entries({
          ...bookmarkData,
          bookmarkedAt: Timestamp.fromDate(bookmarkData.bookmarkedAt),
          cachedStory: story
        }).filter(([_, value]) => value !== undefined)
      );

      // Create bookmark in Firebase
      const bookmarkRef = await addDoc(collection(db, 'bookmarks'), cleanBookmarkData);

      // Try to update story bookmark count (optional - may not exist)
      try {
        const batch = writeBatch(db);
        const storyRef = doc(db, 'newsStories', story.id);
        
        // Check if story document exists first
        const storyDoc = await getDoc(storyRef);
        if (storyDoc.exists()) {
          batch.update(storyRef, {
            bookmarkCount: increment(1)
          });
        }

        // Update collection bookmark count if applicable
        if (options.collectionId) {
          const collectionRef = doc(db, 'bookmarkCollections', options.collectionId);
          const collectionDoc = await getDoc(collectionRef);
          if (collectionDoc.exists()) {
            batch.update(collectionRef, {
              bookmarkCount: increment(1),
              updatedAt: Timestamp.now()
            });
          }
        }

        await batch.commit();
      } catch (batchError) {
        console.warn('Could not update story/collection counts:', batchError);
        // Don't throw error - bookmark was created successfully
      }

      const finalBookmark: Bookmark = {
        id: bookmarkRef.id,
        ...bookmarkData
      };

      // Update cache with real ID
      this.updateCacheWithRealId(userId, optimisticBookmark.id, finalBookmark);

      return finalBookmark;

    } catch (error) {
      // Remove optimistic update on error
      this.revertOptimisticUpdate(userId, optimisticBookmark.id);
      console.error('Error adding bookmark:', error);
      throw new Error('Failed to add bookmark. Please try again.');
    }
  }

  /**
   * Remove bookmark with optimistic updates
   */
  async removeBookmark(userId: string, bookmarkId: string): Promise<void> {
    // Get current bookmark for rollback
    const currentBookmarks = this.bookmarksCache.get(userId) || [];
    const bookmarkToRemove = currentBookmarks.find(b => b.id === bookmarkId);
    
    if (!bookmarkToRemove) {
      throw new Error('Bookmark not found');
    }

    // Optimistic removal from cache
    this.updateCacheOptimistically(userId, bookmarkToRemove, 'remove');

    try {
      // Delete bookmark document first
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      await deleteDoc(bookmarkRef);

      // Try to update story bookmark count (optional - may not exist)
      try {
        const batch = writeBatch(db);
        
        // Update story bookmark count if exists
        const storyRef = doc(db, 'newsStories', bookmarkToRemove.newsStoryId);
        const storyDoc = await getDoc(storyRef);
        if (storyDoc.exists()) {
          batch.update(storyRef, {
            bookmarkCount: increment(-1)
          });
        }

        // Update collection count if applicable
        if (bookmarkToRemove.collectionId) {
          const collectionRef = doc(db, 'bookmarkCollections', bookmarkToRemove.collectionId);
          const collectionDoc = await getDoc(collectionRef);
          if (collectionDoc.exists()) {
            batch.update(collectionRef, {
              bookmarkCount: increment(-1),
              updatedAt: Timestamp.now()
            });
          }
        }

        await batch.commit();
      } catch (batchError) {
        console.warn('Could not update story/collection counts during removal:', batchError);
        // Don't throw error - bookmark was deleted successfully
      }

    } catch (error) {
      // Rollback optimistic update
      this.updateCacheOptimistically(userId, bookmarkToRemove, 'add');
      console.error('Error removing bookmark:', error);
      throw new Error('Failed to remove bookmark. Please try again.');
    }
  }

  /**
   * Get user bookmarks with real-time updates
   */
  subscribeToUserBookmarks(
    userId: string,
    options: {
      collectionId?: string;
      category?: string;
      isRead?: boolean;
      limit?: number;
    } = {},
    onUpdate: (bookmarks: Bookmark[]) => void,
    onError: (error: Error) => void
  ): () => void {
    let q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      orderBy('bookmarkedAt', 'desc')
    );

    // Add filters
    if (options.collectionId) {
      q = query(q, where('collectionId', '==', options.collectionId));
    }
    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }
    if (options.isRead !== undefined) {
      q = query(q, where('isRead', '==', options.isRead));
    }
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const bookmarks: Bookmark[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          bookmarks.push({
            id: doc.id,
            ...data,
            bookmarkedAt: data.bookmarkedAt?.toDate() || new Date(),
            readAt: data.readAt?.toDate(),
          } as Bookmark);
        });

        // Update cache
        this.bookmarksCache.set(userId, bookmarks);
        onUpdate(bookmarks);
      },
      (error) => {
        console.error('Error subscribing to bookmarks:', error);
        onError(new Error('Failed to load bookmarks'));
      }
    );

    return unsubscribe;
  }

  /**
   * Check if a story is bookmarked by user
   */
  async isBookmarked(userId: string, newsStoryId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'bookmarks'),
        where('userId', '==', userId),
        where('newsStoryId', '==', newsStoryId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  /**
   * Update bookmark metadata
   */
  async updateBookmark(
    bookmarkId: string,
    updates: {
      tags?: string[];
      notes?: string;
      isRead?: boolean;
      readingProgress?: number;
      collectionId?: string;
      priority?: 'normal' | 'high' | 'urgent';
    }
  ): Promise<void> {
    try {
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      let updateData: any = { ...updates };

      if (updates.isRead === true && !updates.readingProgress) {
        updateData.readAt = Timestamp.now();
        updateData.readingProgress = 100;
      }

      // Clean data for Firebase (remove undefined fields)
      updateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(bookmarkRef, updateData);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw new Error('Failed to update bookmark');
    }
  }

  /**
   * Create bookmark collection
   */
  async createCollection(
    userId: string,
    name: string,
    options: {
      description?: string;
      color?: string;
      icon?: string;
    } = {}
  ): Promise<BookmarkCollection> {
    try {
      const collectionData: Omit<BookmarkCollection, 'id'> = {
        userId,
        name,
        ...(options.description && { description: options.description }),
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        bookmarkCount: 0,
        ...(options.color && { color: options.color }),
        ...(options.icon && { icon: options.icon })
      };

      // Clean data for Firebase (remove undefined fields)
      const cleanCollectionData = Object.fromEntries(
        Object.entries({
          ...collectionData,
          createdAt: Timestamp.fromDate(collectionData.createdAt),
          updatedAt: Timestamp.fromDate(collectionData.updatedAt)
        }).filter(([_, value]) => value !== undefined)
      );

      const collectionRef = await addDoc(collection(db, 'bookmarkCollections'), cleanCollectionData);

      return {
        id: collectionRef.id,
        ...collectionData
      };
    } catch (error) {
      console.error('Error creating bookmark collection:', error);
      throw new Error('Failed to create collection');
    }
  }

  /**
   * Get user bookmark collections
   */
  async getUserCollections(userId: string): Promise<BookmarkCollection[]> {
    try {
      const q = query(
        collection(db, 'bookmarkCollections'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const collections: BookmarkCollection[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        collections.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as BookmarkCollection);
      });

      this.collectionsCache.set(userId, collections);
      return collections;
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  /**
   * Get bookmark statistics
   */
  async getBookmarkStats(userId: string): Promise<BookmarkStats> {
    try {
      const bookmarks = this.bookmarksCache.get(userId) || 
                       await this.getBookmarksForUser(userId);

      const unreadCount = bookmarks.filter(b => !b.isRead).length;
      const recentlyAdded = bookmarks.slice(0, 5);
      
      // Calculate most bookmarked categories
      const categoryCount = bookmarks.reduce((acc, bookmark) => {
        acc[bookmark.category] = (acc[bookmark.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostBookmarkedCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const collections = this.collectionsCache.get(userId) || 
                         await this.getUserCollections(userId);

      return {
        totalBookmarks: bookmarks.length,
        unreadCount,
        collectionsCount: collections.length,
        recentlyAdded,
        mostBookmarkedCategories
      };
    } catch (error) {
      console.error('Error getting bookmark stats:', error);
      return {
        totalBookmarks: 0,
        unreadCount: 0,
        collectionsCount: 0,
        recentlyAdded: [],
        mostBookmarkedCategories: []
      };
    }
  }

  /**
   * Search bookmarks
   */
  async searchBookmarks(
    userId: string, 
    searchTerm: string,
    filters: {
      category?: string;
      collectionId?: string;
      isRead?: boolean;
    } = {}
  ): Promise<Bookmark[]> {
    try {
      const bookmarks = this.bookmarksCache.get(userId) || 
                       await this.getBookmarksForUser(userId);

      return bookmarks.filter(bookmark => {
        // Text search
        const searchMatch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        // Apply filters
        if (filters.category && bookmark.category !== filters.category) return false;
        if (filters.collectionId && bookmark.collectionId !== filters.collectionId) return false;
        if (filters.isRead !== undefined && bookmark.isRead !== filters.isRead) return false;

        return searchMatch;
      });
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      return [];
    }
  }

  // Private helper methods
  private async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    const q = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      orderBy('bookmarkedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookmarks: Bookmark[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookmarks.push({
        id: doc.id,
        ...data,
        bookmarkedAt: data.bookmarkedAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate(),
      } as Bookmark);
    });

    this.bookmarksCache.set(userId, bookmarks);
    return bookmarks;
  }

  /**
   * Public accessor for getUserBookmarks (needed by context)
   */
  async getBookmarksForUser(userId: string): Promise<Bookmark[]> {
    const cached = this.bookmarksCache.get(userId);
    if (cached) {
      return cached;
    }
    return this.getUserBookmarks(userId);
  }

  private updateCacheOptimistically(userId: string, bookmark: Bookmark, action: 'add' | 'remove') {
    const currentBookmarks = this.bookmarksCache.get(userId) || [];
    
    if (action === 'add') {
      this.bookmarksCache.set(userId, [bookmark, ...currentBookmarks]);
    } else {
      this.bookmarksCache.set(userId, currentBookmarks.filter(b => b.id !== bookmark.id));
    }
  }

  private updateCacheWithRealId(userId: string, tempId: string, realBookmark: Bookmark) {
    const currentBookmarks = this.bookmarksCache.get(userId) || [];
    const updatedBookmarks = currentBookmarks.map(b => 
      b.id === tempId ? realBookmark : b
    );
    this.bookmarksCache.set(userId, updatedBookmarks);
  }

  private revertOptimisticUpdate(userId: string, tempId: string) {
    const currentBookmarks = this.bookmarksCache.get(userId) || [];
    this.bookmarksCache.set(userId, currentBookmarks.filter(b => b.id !== tempId));
  }

  /**
   * Clear cache (useful for logout)
   */
  clearCache(): void {
    this.bookmarksCache.clear();
    this.collectionsCache.clear();
  }
}

export const bookmarkService = new BookmarkService();