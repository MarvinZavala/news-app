import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '../../types/navigation';
import { NewsStory } from '../../types/news';
import { newsService } from '../../services/NewsService';
import CommentSection from '../../components/CommentSection';
import CommunityVoting from '../../components/CommunityVoting';

type Props = {
  navigation: StackNavigationProp<NewsStackParamList, 'NewsDetails'>;
  route: RouteProp<NewsStackParamList, 'NewsDetails'>;
};

const NewsDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId } = route.params;
  const [story, setStory] = useState<NewsStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStory();
  }, [newsId]);

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* News Story Header */}
        <View style={styles.storyHeader}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{story.category.toUpperCase()}</Text>
            {story.isBreaking && (
              <View style={styles.breakingBadge}>
                <Text style={styles.breakingText}>🚨 BREAKING</Text>
              </View>
            )}
            {story.sourceReputation === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.timeAgo}>{formatTimeAgo(story.createdAt)}</Text>
        </View>

        {/* Title and Summary */}
        <View style={styles.content}>
          <Text style={styles.title}>{story.title}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Story header
  storyHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1DA1F2',
    letterSpacing: 0.5,
  },
  breakingBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  breakingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  
  // Content
  content: { 
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 16,
    lineHeight: 36,
    color: '#333'
  },
  summary: { 
    fontSize: 16, 
    lineHeight: 26, 
    color: '#666',
    marginBottom: 16 
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