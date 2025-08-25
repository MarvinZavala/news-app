import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { bookmarkService, Bookmark, BookmarkStats } from '../services/BookmarkService';
import { useAuth } from './AuthContext';

interface BookmarkContextType {
  // State
  bookmarks: Bookmark[];
  stats: BookmarkStats | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshBookmarks: () => Promise<void>;
  isBookmarked: (newsStoryId: string) => boolean;
  getBookmarkByStoryId: (newsStoryId: string) => Bookmark | null;
  clearError: () => void;
  
  // Real-time status
  isConnected: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

interface BookmarkProviderProps {
  children: React.ReactNode;
}

export const BookmarkProvider: React.FC<BookmarkProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  
  // Real-time subscription to user bookmarks
  useEffect(() => {
    if (!user) {
      // Clear data when user logs out
      setBookmarks([]);
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = bookmarkService.subscribeToUserBookmarks(
      user.uid,
      {}, // No filters - get all bookmarks
      (updatedBookmarks) => {
        setBookmarks(updatedBookmarks);
        setLoading(false);
        setError(null);
        setIsConnected(true);
        
        // Update stats whenever bookmarks change
        updateStats(updatedBookmarks);
      },
      (error) => {
        console.error('Bookmarks subscription error:', error);
        setError('Failed to sync bookmarks');
        setLoading(false);
        setIsConnected(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Update stats based on current bookmarks
  const updateStats = useCallback(async (currentBookmarks: Bookmark[]) => {
    if (!user) return;

    try {
      const statsData = await bookmarkService.getBookmarkStats(user.uid);
      setStats(statsData);
    } catch (error) {
      console.error('Error updating bookmark stats:', error);
    }
  }, [user]);

  // Refresh bookmarks manually
  const refreshBookmarks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Force refresh by reloading stats which will trigger bookmark refresh
      const statsData = await bookmarkService.getBookmarkStats(user.uid);
      setStats(statsData);
      setError(null);
    } catch (error) {
      console.error('Error refreshing bookmarks:', error);
      setError('Failed to refresh bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if a story is bookmarked (optimized with local state)
  const isBookmarked = useCallback((newsStoryId: string): boolean => {
    return bookmarks.some(bookmark => bookmark.newsStoryId === newsStoryId);
  }, [bookmarks]);

  // Get bookmark by story ID
  const getBookmarkByStoryId = useCallback((newsStoryId: string): Bookmark | null => {
    return bookmarks.find(bookmark => bookmark.newsStoryId === newsStoryId) || null;
  }, [bookmarks]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: BookmarkContextType = {
    // State
    bookmarks,
    stats,
    loading,
    error,
    
    // Actions
    refreshBookmarks,
    isBookmarked,
    getBookmarkByStoryId,
    clearError,
    
    // Real-time status
    isConnected,
  };

  return (
    <BookmarkContext.Provider value={contextValue}>
      {children}
    </BookmarkContext.Provider>
  );
};

export default BookmarkProvider;