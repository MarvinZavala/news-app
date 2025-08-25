import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookmarksStackParamList } from '../../types/navigation';
import { bookmarkService, Bookmark, BookmarkCollection, BookmarkStats } from '../../services/BookmarkService';
import { useAuth } from '../../context/AuthContext';
import { newsService } from '../../services/NewsService';

type BookmarksListScreenNavigationProp = StackNavigationProp<BookmarksStackParamList, 'BookmarksList'>;

interface Props {
  navigation: BookmarksListScreenNavigationProp;
}

const BookmarksListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to bookmarks
  useEffect(() => {
    if (!user) return;

    const unsubscribe = bookmarkService.subscribeToUserBookmarks(
      user.uid,
      {
        collectionId: selectedCollection || undefined,
        isRead: showOnlyUnread ? false : undefined,
      },
      (updatedBookmarks) => {
        setBookmarks(updatedBookmarks);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Bookmarks subscription error:', error);
        setError('Failed to load bookmarks');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, selectedCollection, showOnlyUnread]);

  // Load collections and stats
  useEffect(() => {
    if (!user) return;
    loadCollectionsAndStats();
  }, [user]);

  const loadCollectionsAndStats = async () => {
    if (!user) return;
    
    try {
      const [collectionsData, statsData] = await Promise.all([
        bookmarkService.getUserCollections(user.uid),
        bookmarkService.getBookmarkStats(user.uid)
      ]);
      
      setCollections(collectionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading collections/stats:', error);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCollectionsAndStats();
    setRefreshing(false);
  }, []);

  // Handle bookmark tap
  const handleBookmarkPress = useCallback(async (bookmark: Bookmark) => {
    // Mark as read if not already
    if (!bookmark.isRead) {
      try {
        await bookmarkService.updateBookmark(bookmark.id, { isRead: true });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate to news details
    navigation.navigate('BookmarkDetails', {
      bookmarkId: bookmark.id,
      newsId: bookmark.newsStoryId,
      title: bookmark.title,
    });
  }, [navigation]);

  // Handle bookmark removal
  const handleRemoveBookmark = useCallback(async (bookmark: Bookmark) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove "${bookmark.title}" from bookmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookmarkService.removeBookmark(user!.uid, bookmark.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  }, [user]);

  // Handle search
  const handleSearch = useCallback(async (term: string) => {
    if (!user) return;
    
    if (term.trim()) {
      try {
        const searchResults = await bookmarkService.searchBookmarks(
          user.uid,
          term,
          {
            collectionId: selectedCollection || undefined,
            isRead: showOnlyUnread ? false : undefined,
          }
        );
        setBookmarks(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  }, [user, selectedCollection, showOnlyUnread]);

  // Create new collection
  const handleCreateCollection = useCallback(async (name: string) => {
    if (!user || !name.trim()) return;
    
    try {
      await bookmarkService.createCollection(user.uid, name.trim());
      await loadCollectionsAndStats();
      setShowCollectionModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  }, [user]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={styles.bookmarkCard}
      onPress={() => handleBookmarkPress(item)}
      onLongPress={() => handleRemoveBookmark(item)}
    >
      <View style={styles.bookmarkHeader}>
        <View style={styles.bookmarkBadges}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
          {item.priority === 'high' && (
            <Ionicons name="flag" size={12} color="#F59E0B" />
          )}
          {item.priority === 'urgent' && (
            <Ionicons name="flag" size={12} color="#EF4444" />
          )}
        </View>
        <Text style={styles.bookmarkTime}>{formatTimeAgo(item.bookmarkedAt)}</Text>
      </View>

      <Text style={styles.bookmarkTitle} numberOfLines={2}>
        {item.title}
      </Text>
      
      <Text style={styles.bookmarkSummary} numberOfLines={2}>
        {item.summary}
      </Text>

      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.bookmarkFooter}>
        <View style={styles.collectionInfo}>
          {item.collectionId && (
            <>
              <Ionicons name="folder" size={14} color="#666" />
              <Text style={styles.collectionName}>
                {collections.find(c => c.id === item.collectionId)?.name || 'Collection'}
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.bookmarkActions}>
          {item.readingProgress && item.readingProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${item.readingProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{item.readingProgress}%</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveBookmark(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalBookmarks}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.collectionsCount}</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={() => handleSearch(searchTerm)}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm('');
                handleSearch('');
              }}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowCollectionModal(true)}
        >
          <Ionicons name="folder-outline" size={16} color="#1DA1F2" />
          <Text style={styles.filterChipText}>
            {selectedCollection ? 
              collections.find(c => c.id === selectedCollection)?.name || 'Collection'
              : 'All Collections'
            }
          </Text>
          <Ionicons name="chevron-down" size={16} color="#1DA1F2" />
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Unread only</Text>
          <Switch
            value={showOnlyUnread}
            onValueChange={setShowOnlyUnread}
            trackColor={{ false: '#E2E8F0', true: '#1DA1F2' }}
            thumbColor={showOnlyUnread ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  // Loading state
  if (loading && bookmarks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bookmarks</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (bookmarks.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Bookmarks</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#DDD" />
          <Text style={styles.emptyTitle}>
            {searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchTerm 
              ? `No results for "${searchTerm}"`
              : 'Your saved articles will appear here'}
          </Text>
          {searchTerm && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => {
                setSearchTerm('');
                handleSearch('');
              }}
            >
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookmarks</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowCollectionModal(true)}
        >
          <Ionicons name="add" size={24} color="#1DA1F2" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={bookmarks}
        renderItem={renderBookmarkItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* Collection Selection Modal */}
      <Modal
        visible={showCollectionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCollectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Collection</Text>
              <TouchableOpacity
                onPress={() => setShowCollectionModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.collectionOption,
                !selectedCollection && styles.collectionOptionSelected
              ]}
              onPress={() => {
                setSelectedCollection(null);
                setShowCollectionModal(false);
              }}
            >
              <Ionicons name="apps" size={20} color="#1DA1F2" />
              <Text style={styles.collectionOptionText}>All Collections</Text>
              {!selectedCollection && (
                <Ionicons name="checkmark" size={20} color="#1DA1F2" />
              )}
            </TouchableOpacity>

            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={[
                  styles.collectionOption,
                  selectedCollection === collection.id && styles.collectionOptionSelected
                ]}
                onPress={() => {
                  setSelectedCollection(collection.id);
                  setShowCollectionModal(false);
                }}
              >
                <Ionicons name="folder" size={20} color={collection.color || "#1DA1F2"} />
                <View style={styles.collectionOptionInfo}>
                  <Text style={styles.collectionOptionText}>{collection.name}</Text>
                  <Text style={styles.collectionCount}>
                    {collection.bookmarkCount} bookmarks
                  </Text>
                </View>
                {selectedCollection === collection.id && (
                  <Ionicons name="checkmark" size={20} color="#1DA1F2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  clearSearchButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Header Components
  headerContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    color: '#1DA1F2',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Bookmark Cards
  bookmarkCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookmarkBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DA1F2',
  },
  bookmarkTime: {
    fontSize: 12,
    color: '#64748B',
  },
  bookmarkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 8,
  },
  bookmarkSummary: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tagText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  
  // Bookmark Footer
  bookmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectionName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  bookmarkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DA1F2',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  collectionOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  collectionOptionInfo: {
    flex: 1,
  },
  collectionOptionText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  collectionCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default BookmarksListScreen;