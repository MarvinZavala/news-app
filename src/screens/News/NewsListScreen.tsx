import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { NewsStackParamList } from '../../types/navigation';
import { NewsStory, NewsFilters } from '../../types/news';
import { newsService } from '../../services/NewsService';
import { bookmarkService } from '../../services/BookmarkService';
import NewsCard from '../../components/NewsCard';
import { useAuth } from '../../context/AuthContext';

type NewsListScreenNavigationProp = StackNavigationProp<NewsStackParamList, 'NewsList'>;

interface Props {
  navigation: NewsListScreenNavigationProp;
}

// Categories available for filtering
const CATEGORIES = [
  'All',
  'Politics',
  'International',
  'Business',
  'Technology',
  'Science',
  'Health',
  'Environment',
  'Sports',
  'Entertainment',
  'Education',
  'Local',
  'Crime',
  'Weather',
  'Other'
];

const NewsListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<NewsFilters>({ sortBy: 'newest' });
  const [error, setError] = useState<string | null>(null);
  
  // Real-time subscription to news
  useEffect(() => {
    const unsubscribe = newsService.subscribeToNews(
      filters,
      (response) => {
        setStories(response.stories);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('News subscription error:', error);
        setError('Failed to load news. Please try again.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filters]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Force re-subscription to get fresh data
    setFilters({ ...filters });
    setTimeout(() => setRefreshing(false), 1000);
  }, [filters]);

  // Handle story press
  const handleStoryPress = useCallback((story: NewsStory) => {
    // Increment view count
    newsService.incrementViewCount(story.id);
    
    navigation.navigate('NewsDetails', {
      newsId: story.id,
      title: story.title,
    });
  }, [navigation]);

  // Handle bookmark
  const handleBookmark = useCallback(async (story: NewsStory) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark articles.');
      return;
    }

    try {
      // Check if already bookmarked
      const isBookmarked = await bookmarkService.isBookmarked(user.uid, story.id);
      
      if (isBookmarked) {
        // Find and remove existing bookmark
        const bookmarks = await bookmarkService.getBookmarksForUser(user.uid);
        const existingBookmark = bookmarks.find(b => b.newsStoryId === story.id);
        
        if (existingBookmark) {
          await bookmarkService.removeBookmark(user.uid, existingBookmark.id);
          Alert.alert('Removed', `"${story.title}" removed from bookmarks.`);
        }
      } else {
        // Add bookmark
        await bookmarkService.addBookmark(user.uid, story, {
          tags: story.tags || [],
          priority: story.isBreaking ? 'urgent' : story.isTrending ? 'high' : 'normal'
        });
        Alert.alert('Bookmarked', `"${story.title}" has been bookmarked!`);
      }
    } catch (error) {
      console.error('Error bookmarking story:', error);
      Alert.alert('Error', 'Failed to bookmark story. Please try again.');
    }
  }, [user]);

  // Handle share
  const handleShare = useCallback(async (story: NewsStory) => {
    try {
      // Increment share count
      await newsService.incrementShareCount(story.id);
      
      // Native sharing
      await Share.share({
        message: `${story.title}\n\n${story.summary}\n\nRead more on NewsApp`,
        title: story.title,
      });
    } catch (error) {
      console.error('Error sharing story:', error);
      Alert.alert('Error', 'Failed to share story. Please try again.');
    }
  }, []);

  // Filter handlers
  const handleFilterChange = (newFilters: Partial<NewsFilters>) => {
    setLoading(true);
    setFilters({ ...filters, ...newFilters });
  };

  // Category filter handler
  const handleCategoryChange = (category: string) => {
    const categoryFilter = category === 'All' ? undefined : category;
    handleFilterChange({ category: categoryFilter });
  };

  const renderNewsItem = ({ item }: { item: NewsStory }) => (
    <NewsCard
      story={item}
      onPress={handleStoryPress}
      onBookmark={handleBookmark}
      onShare={handleShare}
    />
  );

  // Render filter button component
  const renderFilterButton = (
    title: string,
    isActive: boolean,
    onPress: () => void,
    icon?: React.ReactNode,
    buttonStyle?: any,
    activeStyle?: any,
    textStyle?: any,
    activeTextStyle?: any
  ) => (
    <TouchableOpacity
      style={[
        buttonStyle || styles.headerButton,
        isActive && (activeStyle || styles.headerButtonActive)
      ]}
      onPress={onPress}
    >
      {icon}
      <Text style={[
        textStyle || styles.headerButtonText,
        isActive && (activeTextStyle || styles.headerButtonTextActive)
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && stories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Latest News</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && stories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Latest News</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true);
              setError(null);
              setFilters({ ...filters });
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Latest News</Text>

        {/* Categories Filter Row */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.headerActions}
          >
            {CATEGORIES.map((category) => {
              const isActive = (category === 'All' && !filters.category) || filters.category === category;
              return (
                <View key={category}>
                  {renderFilterButton(
                    category,
                    isActive,
                    () => handleCategoryChange(category),
                    undefined,
                    styles.categoryButton,
                    styles.categoryButtonActive,
                    styles.categoryButtonText,
                    styles.categoryButtonTextActive
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Sort By Filter Row */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Sort By</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.headerActions}
          >
            {renderFilterButton(
              'Latest',
              filters.sortBy === 'newest',
              () => handleFilterChange({ sortBy: 'newest' }),
              <Ionicons
                name="time-outline"
                size={16}
                color={filters.sortBy === 'newest' ? '#fff' : '#1DA1F2'}
              />
            )}

            {renderFilterButton(
              'Trending',
              filters.sortBy === 'trending',
              () => handleFilterChange({ sortBy: 'trending' }),
              <Ionicons
                name="trending-up"
                size={16}
                color={filters.sortBy === 'trending' ? '#fff' : '#1DA1F2'}
              />
            )}

            {renderFilterButton(
              'Popular',
              filters.sortBy === 'mostVoted',
              () => handleFilterChange({ sortBy: 'mostVoted' }),
              <Ionicons
                name="people-outline"
                size={16}
                color={filters.sortBy === 'mostVoted' ? '#fff' : '#1DA1F2'}
              />
            )}

            {renderFilterButton(
              'Under-the-Radar',
              filters.sortBy === 'underTheRadar',
              () => handleFilterChange({ sortBy: 'underTheRadar' }),
              <MaterialIcons
                name="radar"
                size={16}
                color={filters.sortBy === 'underTheRadar' ? '#fff' : '#1DA1F2'}
              />
            )}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={stories}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={stories.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#DDD" />
              <Text style={styles.emptyStateTitle}>No news available</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
  },
  headerButtonActive: {
    backgroundColor: '#1DA1F2',
  },
  headerButtonText: {
    fontSize: 11,
    color: '#1DA1F2',
    fontWeight: '600',
    marginLeft: 4,
  },
  headerButtonTextActive: {
    color: '#fff',
  },

  // Filter sections
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category-specific styles
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#475569',
    borderColor: '#475569',
  },
  categoryButtonText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },

  listContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Empty state
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});

export default NewsListScreen;