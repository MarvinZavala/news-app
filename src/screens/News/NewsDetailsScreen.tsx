import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Share, Linking, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const { width: screenWidth } = Dimensions.get('window');

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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    loadStory();
    checkBookmarkStatus();
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

  const handleScroll = (event: any) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Story not found</Text>
          <Text style={styles.errorSubtitle}>The news story you're looking for doesn't exist.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Header */}
      <View style={[
        styles.floatingHeader,
        { opacity: scrollY > 100 ? 0.95 : 0 }
      ]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.floatingTitle} numberOfLines={1}>
          {story?.title}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, bookmarkLoading && styles.headerButtonDisabled]} 
            onPress={handleBookmark}
            disabled={bookmarkLoading}
          >
            {bookmarkLoading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={isBookmarked ? "#1DA1F2" : "#666"} 
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            
            {/* Story Metadata */}
            <View style={styles.storyMeta}>
              <View style={styles.categoryRow}>
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
              
              <View style={styles.timeAndReadingRow}>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.timeAgo}>{formatTimeAgo(story.createdAt)}</Text>
                </View>
                <View style={styles.readingTime}>
                  <Ionicons name="reader-outline" size={14} color="#666" />
                  <Text style={styles.readingTimeText}>
                    {getReadingTime(story.summary + (story.content || ''))} min read
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.contentCard}>
          <Text style={styles.title}>{story.title}</Text>
          
          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={[styles.actionButton, bookmarkLoading && styles.actionButtonDisabled]} 
              onPress={handleBookmark}
              disabled={bookmarkLoading}
            >
              {bookmarkLoading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={isBookmarked ? "#1DA1F2" : "#666"} 
                />
              )}
              <Text style={[styles.actionText, isBookmarked && styles.actionTextActive]}>
                {isBookmarked ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#666" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <View style={styles.actionButton}>
              <Ionicons name="eye-outline" size={20} color="#666" />
              <Text style={styles.actionText}>{story.viewCount}</Text>
            </View>
          </View>
          
          <Text style={styles.summary}>{story.summary}</Text>
          
          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {story.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* AI Summary */}
          {story.aiSummary && (
            <View style={styles.aiSummaryContainer}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={16} color="#9B59B6" />
                <Text style={styles.aiLabel}>AI Analysis</Text>
              </View>
              <Text style={styles.aiSummary}>{story.aiSummary}</Text>
            </View>
          )}
          
          {/* Sources */}
          <View style={styles.sourcesSection}>
            <Text style={styles.sourcesTitle}>Sources ({story.totalSources})</Text>
            {story.sources.map((source, index) => (
              <View key={source.id} style={styles.sourceItem}>
                <Ionicons name="link" size={16} color="#1DA1F2" />
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceName}>{source.name}</Text>
                  <Text style={styles.sourceUrl} numberOfLines={1}>{source.url}</Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* Engagement Stats */}
          <View style={styles.engagementStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{story.viewCount} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.statText}>{story.totalVotes} votes</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{story.averageCredibility.toFixed(1)} credibility</Text>
            </View>
          </View>
        </View>
        
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  
  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(225, 232, 237, 0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  floatingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  shimmerEffect: {
    width: screenWidth - 32,
    gap: 12,
  },
  shimmerBar: {
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  goBackButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 12,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroContent: {
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyMeta: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  category: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369A1',
    letterSpacing: 0.8,
  },
  trendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeAndReadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readingTimeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  breakingBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  breakingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  
  // Main Content Card
  contentCard: { 
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Action Bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#1DA1F2',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 16,
    lineHeight: 36,
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  summary: { 
    fontSize: 17, 
    lineHeight: 28, 
    color: '#4B5563',
    marginBottom: 20,
    fontWeight: '400',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tagText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  
  // AI Summary
  aiSummaryContainer: {
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9B59B6',
  },
  aiSummary: {
    fontSize: 14,
    color: '#7D4CDB',
    lineHeight: 22,
  },
  
  // Sources
  sourcesSection: {
    marginBottom: 20,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 12,
    color: '#1DA1F2',
  },
  
  // Engagement stats
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  
  // Enhanced Sources Card
  sourcesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  multiSourceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  multiSourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  sourceIconContainer: {
    alignItems: 'center',
    gap: 6,
  },
  sourceBiasDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceScore: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceBias: {
    fontSize: 11,
    fontWeight: '600',
  },
  sourceDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // Enhanced Stats Card
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: 40,
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