import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Share, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '../../types/navigation';
import { NewsStory } from '../../types/news';
import { newsService } from '../../services/NewsService';
import { bookmarkService } from '../../services/BookmarkService';
import CommentSection from '../../components/CommentSection';
import CommunityVoting from '../../components/CommunityVoting';
import { useAuth } from '../../context/AuthContext';
// import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import ActionButton from '../../components/ui/ActionButton';
// import AnimatedCard from '../../components/ui/AnimatedCard';


type Props = {
  navigation: StackNavigationProp<NewsStackParamList, 'NewsDetails'>;
  route: RouteProp<NewsStackParamList, 'NewsDetails'>;
};

const NewsDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId } = route.params;
  const { user } = useAuth();
  const [story, setStory] = useState<NewsStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  // const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadStory();
    checkBookmarkStatus();
    
    // // Fade in animation
    // Animated.timing(fadeAnim, {
    //   toValue: 1,
    //   duration: 300,
    //   useNativeDriver: true,
    // }).start();
  }, [newsId]);

  const checkBookmarkStatus = async () => {
    if (!user) return;
    
    try {
      const bookmarked = await bookmarkService.isBookmarked(user.uid, newsId);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const loadStory = async () => {
    try {
      setLoading(true);
      // Get all stories and find the one with matching ID
      const stories = await newsService.searchNews('', {});
      const foundStory = stories.find(s => s.id === newsId);
      setStory(foundStory || null);
    } catch (error) {
      console.error('Error loading story:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleShare = async () => {
    if (!story) return;
    try {
      await Share.share({
        message: `${story.title}\n\n${story.summary}\n\nRead more on NewsApp`,
        title: story.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user || !story || bookmarkLoading) return;

    setBookmarkLoading(true);
    
    try {
      if (isBookmarked) {
        // Find existing bookmark and remove it
        const bookmarks = await bookmarkService.getBookmarksForUser(user.uid);
        const existingBookmark = bookmarks.find(b => b.newsStoryId === story.id);
        
        if (existingBookmark) {
          await bookmarkService.removeBookmark(user.uid, existingBookmark.id);
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        await bookmarkService.addBookmark(user.uid, story, {
          tags: story.tags || [],
          priority: story.isBreaking ? 'urgent' : story.isTrending ? 'high' : 'normal'
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleOpenSource = (url: string) => {
    Linking.openURL(url);
  };

  const getReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = text.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };


  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: loading ? 'Loading...' : story?.title || 'News Details',
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8, marginRight: 8 }}>
          <ActionButton
            icon={isBookmarked ? "bookmark" : "bookmark-outline"}
            text={isBookmarked ? "Saved" : "Save"}
            onPress={handleBookmark}
            loading={bookmarkLoading}
            variant="ghost"
            size="small"
          />
          <ActionButton
            icon="share-outline"
            text="Share"
            onPress={handleShare}
            variant="ghost"
            size="small"
          />
        </View>
      ),
    });
  }, [navigation, loading, story?.title, isBookmarked, bookmarkLoading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F2937" />
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Story not found</Text>
          <Text style={styles.errorSubtitle}>The news story you're looking for doesn't exist.</Text>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.container}>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Story Metadata */}
        <Card style={styles.metaCard} padding="medium" shadow={true}>
          <View style={styles.badgesRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.category}>{story.category.toUpperCase()}</Text>
            </View>
            
            {story.isBreaking && (
              <View style={styles.breakingBadge}>
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={styles.breakingText}>BREAKING</Text>
              </View>
            )}
            
            {story.isTrending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={12} color="#fff" />
                <Text style={styles.trendingText}>TRENDING</Text>
              </View>
            )}
            
            {story.sourceReputation === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{formatTimeAgo(story.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="reader-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {getReadingTime(story.summary + (story.content || ''))} min read
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{story.viewCount} views</Text>
            </View>
          </View>
        </Card>

        {/* Main Content */}
        <Card style={styles.contentCard} padding="large" shadow={true}>
          <Text style={styles.title}>{story.title}</Text>
          <Text style={styles.summary}>{story.summary}</Text>
          
          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {story.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
        </Card>
        
        {/* AI Summary */}
        {story.aiSummary && (
          <Card style={styles.aiCard} padding="medium" shadow={true}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color="#8B5CF6" />
              <Text style={styles.aiLabel}>AI Analysis</Text>
            </View>
            <Text style={styles.aiSummary}>{story.aiSummary}</Text>
          </Card>
        )}
        
        {/* Sources */}
        <Card style={styles.sourcesCard} padding="medium" shadow={true}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sources</Text>
            <View style={styles.sourcesBadge}>
              <Text style={styles.sourcesBadgeText}>{story.totalSources}</Text>
            </View>
          </View>
          {story.sources.map((source, index) => (
            <View key={source.id} style={styles.sourceItem}>
              <View style={styles.sourceIcon}>
                <Ionicons name="link" size={16} color="#6B7280" />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceUrl} numberOfLines={1}>{source.url}</Text>
              </View>
            </View>
          ))}
        </Card>
        
        {/* Community Voting Section */}
        <CommunityVoting 
          newsStoryId={story.id}
        />
        
        {/* Comments Section */}
        <CommentSection 
          newsStoryId={story.id} 
          initialCommentCount={story.commentCount}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Metadata Card
  metaCard: {
    margin: 16,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  trendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  breakingBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  breakingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  // Content Card
  contentCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  summary: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4B5563',
    fontWeight: '400',
  },
  // AI Card
  aiCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  aiLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  aiSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Sources Card
  sourcesCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  sourcesBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sourcesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sourceIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
});

// Helper method for source bias colors
const getSourceBiasColor = (bias: 'left' | 'center' | 'right'): string => {
  switch (bias) {
    case 'left': return '#EF4444';
    case 'center': return '#6B7280';
    case 'right': return '#3B82F6';
  }
};

export default NewsDetailsScreen;