import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NewsStory } from '../types/news';

interface Props {
  story: NewsStory;
  onPress: (story: NewsStory) => void;
  onBookmark?: (story: NewsStory) => void;
  onShare?: (story: NewsStory) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const NewsCard: React.FC<Props> = ({ story, onPress, onBookmark, onShare }) => {
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

  const getBiasBarWidth = (score: number): number => {
    return Math.max(10, (score / 100) * 80); // Min 10px, max 80px
  };

  const getBiasColor = (bias: 'left' | 'center' | 'right'): string => {
    switch (bias) {
      case 'left': return '#FF6B6B';
      case 'center': return '#4ECDC4';
      case 'right': return '#45B7D1';
      default: return '#DDD';
    }
  };

  const getCredibilityStars = (score: number): JSX.Element[] => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={12} color="#FFD700" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={12} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={12} color="#DDD" />
        );
      }
    }
    
    return stars;
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(story)}
      activeOpacity={0.7}
    >
      {/* Header with category and indicators */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.category}>{story.category.toUpperCase()}</Text>
          {story.isBreaking && (
            <View style={styles.breakingBadge}>
              <Text style={styles.breakingText}>BREAKING</Text>
            </View>
          )}
          {story.isTrending && (
            <Ionicons name="trending-up" size={14} color="#FF6B6B" />
          )}
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(story.createdAt)}</Text>
      </View>

      {/* Title and Summary */}
      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>
      
      <Text style={styles.summary} numberOfLines={2}>
        {story.summary}
      </Text>

      {/* AI Summary (if available) */}
      {story.aiSummary && (
        <View style={styles.aiSummaryContainer}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={12} color="#9B59B6" />
            <Text style={styles.aiLabel}>AI Analysis</Text>
          </View>
          <Text style={styles.aiSummary} numberOfLines={2}>
            {story.aiSummary}
          </Text>
        </View>
      )}

      {/* Bias Visualization */}
      <View style={styles.biasSection}>
        <View style={styles.biasHeader}>
          <Text style={styles.biasTitle}>Political Coverage</Text>
          <View style={styles.sourceCount}>
            <Ionicons name="newspaper-outline" size={12} color="#666" />
            <Text style={styles.sourceCountText}>{story.totalSources} sources</Text>
          </View>
        </View>
        
        <View style={styles.biasBar}>
          {/* Left bias */}
          <View style={styles.biasSegmentContainer}>
            <View 
              style={[
                styles.biasSegment, 
                { 
                  backgroundColor: getBiasColor('left'),
                  width: getBiasBarWidth(story.biasScore.left)
                }
              ]} 
            />
            <Text style={styles.biasLabel}>Left</Text>
            <Text style={styles.biasPercentage}>{story.biasScore.left}%</Text>
          </View>

          {/* Center bias */}
          <View style={styles.biasSegmentContainer}>
            <View 
              style={[
                styles.biasSegment, 
                { 
                  backgroundColor: getBiasColor('center'),
                  width: getBiasBarWidth(story.biasScore.center)
                }
              ]} 
            />
            <Text style={styles.biasLabel}>Center</Text>
            <Text style={styles.biasPercentage}>{story.biasScore.center}%</Text>
          </View>

          {/* Right bias */}
          <View style={styles.biasSegmentContainer}>
            <View 
              style={[
                styles.biasSegment, 
                { 
                  backgroundColor: getBiasColor('right'),
                  width: getBiasBarWidth(story.biasScore.right)
                }
              ]} 
            />
            <Text style={styles.biasLabel}>Right</Text>
            <Text style={styles.biasPercentage}>{story.biasScore.right}%</Text>
          </View>
        </View>
      </View>

      {/* Engagement section */}
      <View style={styles.engagementSection}>
        <View style={styles.credibilityContainer}>
          <View style={styles.stars}>
            {getCredibilityStars(story.averageCredibility)}
          </View>
          <Text style={styles.credibilityScore}>
            {story.averageCredibility.toFixed(1)}
          </Text>
        </View>

        <View style={styles.votingContainer}>
          <View style={styles.voteCount}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.voteCountText}>{story.totalVotes} votes</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {onBookmark && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onBookmark(story)}
            >
              <Ionicons name="bookmark-outline" size={16} color="#666" />
            </TouchableOpacity>
          )}
          
          {onShare && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onShare(story)}
            >
              <Ionicons name="share-outline" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* User generated content indicator */}
      {story.isUserGenerated && (
        <View style={styles.userGeneratedBadge}>
          <Ionicons name="person" size={10} color="#9B59B6" />
          <Text style={styles.userGeneratedText}>Community Submitted</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1DA1F2',
    letterSpacing: 0.5,
  },
  breakingBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breakingText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 11,
    color: '#999',
  },

  // Content styles
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  // AI Summary styles
  aiSummaryContainer: {
    backgroundColor: '#F8F5FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9B59B6',
    marginLeft: 4,
  },
  aiSummary: {
    fontSize: 12,
    color: '#7D4CDB',
    lineHeight: 16,
  },

  // Bias visualization styles
  biasSection: {
    marginBottom: 16,
  },
  biasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  biasTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  sourceCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceCountText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  biasBar: {
    gap: 8,
  },
  biasSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  biasSegment: {
    height: 6,
    borderRadius: 3,
  },
  biasLabel: {
    fontSize: 11,
    color: '#666',
    minWidth: 35,
  },
  biasPercentage: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
  },

  // Engagement styles
  engagementSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  credibilityScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  votingContainer: {
    flex: 1,
    alignItems: 'center',
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCountText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },

  // User generated content
  userGeneratedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userGeneratedText: {
    fontSize: 9,
    color: '#9B59B6',
    fontWeight: 'bold',
    marginLeft: 3,
  },
});

export default NewsCard;