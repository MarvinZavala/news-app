import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types/navigation';
import { NewsStory } from '../../types/news';
import { newsService } from '../../services/NewsService';
import { useAuth } from '../../context/AuthContext';
import NewsCard from '../../components/NewsCard';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'UserNewsManager'>;
};

const { width: screenWidth } = Dimensions.get('window');

const UserNewsManagerScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingStories, setDeletingStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUserNews();
  }, []);

  const fetchUserNews = async (isRefresh = false) => {
    if (!user) return;

    try {
      if (!isRefresh) setLoading(true);
      const userStories = await newsService.getUserSubmittedNews(user.uid);
      setStories(userStories);
    } catch (error) {
      console.error('Error fetching user news:', error);
      Alert.alert(
        'Error',
        'Failed to load your news stories. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserNews(true);
  };

  const handleDeleteNews = (story: NewsStory) => {
    Alert.alert(
      'Delete News Story',
      `Are you sure you want to delete "${story.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteNews(story),
        },
      ]
    );
  };

  const confirmDeleteNews = async (story: NewsStory) => {
    if (!user) return;

    try {
      // Add to deleting set to show loading state
      setDeletingStories(prev => new Set(prev).add(story.id));

      await newsService.deleteUserNews(story.id, user.uid);

      // Remove from local state
      setStories(prev => prev.filter(s => s.id !== story.id));

      Alert.alert(
        'Success',
        'Your news story has been deleted successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error deleting news:', error);
      Alert.alert(
        'Error',
        'Failed to delete the news story. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Remove from deleting set
      setDeletingStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(story.id);
        return newSet;
      });
    }
  };

  const handleNewsPress = (story: NewsStory) => {
    // Navigate to news details - we need to navigate to the Home tab
    // Since this is in Profile stack, we need to use the main navigation
    navigation.getParent()?.getParent()?.navigate('HomeTab', {
      screen: 'NewsDetails',
      params: { newsId: story.id, title: story.title }
    });
  };

  const renderNewsItem = ({ item: story }: { item: NewsStory }) => {
    const isDeleting = deletingStories.has(story.id);

    return (
      <View style={styles.newsItemContainer}>
        {/* News Card Container */}
        <View style={styles.cardContainer}>
          <NewsCard
            story={story}
            onPress={handleNewsPress}
          />
        </View>

        {/* Action Bar with Stats and Delete Button */}
        <View style={styles.actionBar}>
          {/* Story Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{story.viewCount || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#666" />
              <Text style={styles.statText}>{story.commentCount || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="thumbs-up-outline" size={16} color="#666" />
              <Text style={styles.statText}>{story.totalVotes || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bookmark-outline" size={16} color="#666" />
              <Text style={styles.statText}>{story.bookmarkCount || 0}</Text>
            </View>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={() => handleDeleteNews(story)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.deleteButtonText}>Deleting...</Text>
              </>
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="newspaper-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No News Stories Yet</Text>
      <Text style={styles.emptyMessage}>
        You haven't submitted any news stories yet. Start sharing news with the community!
      </Text>
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => navigation.getParent()?.getParent()?.navigate('SubmitTab')}
      >
        <Ionicons name="add-outline" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>Submit News</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My News Stories</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Loading your news stories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My News Stories</Text>
        <View style={styles.placeholder} />
      </View>

      {stories.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.statsHeader}>
            <Text style={styles.statsHeaderText}>
              {stories.length} {stories.length === 1 ? 'Story' : 'Stories'} Published
            </Text>
            <Text style={styles.statsSubText}>
              Swipe or tap the delete button to remove stories
            </Text>
          </View>

          <FlatList
            data={stories}
            keyExtractor={(item) => item.id}
            renderItem={renderNewsItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1DA1F2']}
                tintColor="#1DA1F2"
              />
            }
          />
        </>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  statsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statsSubText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingVertical: 8,
  },
  newsItemContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContainer: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButtonDisabled: {
    backgroundColor: '#999',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: '#1DA1F2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserNewsManagerScreen;