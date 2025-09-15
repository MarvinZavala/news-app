import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SearchStackParamList } from '../../types/navigation';
import { NewsStory } from '../../types/news';
import { newsService } from '../../services/NewsService';
import { bookmarkService } from '../../services/BookmarkService';
import NewsCard from '../../components/NewsCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

type Props = { 
  route: RouteProp<SearchStackParamList, 'SearchResults'>; 
  navigation: StackNavigationProp<SearchStackParamList, 'SearchResults'>;
};

const SearchResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = useAuth();
  const { query } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NewsStory[]>([]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stories = await newsService.searchNews(query);
      setResults(stories);
    } catch (e) {
      console.error('Search error:', e);
      setError('Failed to load search results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchResults();
    setRefreshing(false);
  }, [fetchResults]);

  const handleStoryPress = useCallback((story: NewsStory) => {
    // Increment view count then navigate to details (in Home stack)
    newsService.incrementViewCount(story.id);
    // Navigate to sibling tab's nested screen via parent navigator
    const parentNav = navigation.getParent?.();
    parentNav?.navigate('HomeTab' as never, { 
      screen: 'NewsDetails', 
      params: { newsId: story.id, title: story.title } 
    } as never);
  }, [navigation]);

  const handleBookmark = useCallback(async (story: NewsStory) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to bookmark articles.');
      return;
    }

    try {
      const isBookmarked = await bookmarkService.isBookmarked(user.uid, story.id);
      if (isBookmarked) {
        const bookmarks = await bookmarkService.getBookmarksForUser(user.uid);
        const existingBookmark = bookmarks.find(b => b.newsStoryId === story.id);
        if (existingBookmark) {
          await bookmarkService.removeBookmark(user.uid, existingBookmark.id);
          Alert.alert('Removed', `"${story.title}" removed from bookmarks.`);
        }
      } else {
        await bookmarkService.addBookmark(user.uid, story, {
          tags: story.tags || [],
          priority: story.isBreaking ? 'urgent' : story.isTrending ? 'high' : 'normal',
        });
        Alert.alert('Bookmarked', `"${story.title}" has been bookmarked!`);
      }
    } catch (e) {
      console.error('Bookmark error:', e);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  }, [user]);

  const handleShare = useCallback(async (story: NewsStory) => {
    try {
      await newsService.incrementShareCount(story.id);
      await Share.share({
        message: `${story.title}\n\n${story.summary}\n\nRead more on NewsApp`,
        title: story.title,
      });
    } catch (e) {
      console.error('Share error:', e);
      Alert.alert('Error', 'Failed to share story. Please try again.');
    }
  }, []);

  const renderNewsItem = ({ item }: { item: NewsStory }) => (
    <NewsCard
      story={item}
      onPress={handleStoryPress}
      onBookmark={handleBookmark}
      onShare={handleShare}
    />
  );

  if (loading && results.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Results</Text>
          <Text style={styles.subtitle}>Results for: "{query}"</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Searching news...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && results.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Results</Text>
          <Text style={styles.subtitle}>Results for: "{query}"</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResults}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Results</Text>
        <Text style={styles.subtitle}>Results for: "{query}"</Text>
      </View>
      <FlatList
        data={results}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="search-outline" size={64} color="#DDD" />
              <Text style={styles.emptyStateTitle}>No results</Text>
              <Text style={styles.emptyStateText}>Try a different search term</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#666' },
  listContainer: { paddingVertical: 8 },
  emptyContainer: { flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24, paddingHorizontal: 40, lineHeight: 22 },
  retryButton: { backgroundColor: '#1DA1F2', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});

export default SearchResultsScreen;
