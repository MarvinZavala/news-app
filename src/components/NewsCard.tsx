import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NewsStory } from '../types/news';
import { bookmarkService } from '../services/BookmarkService';
import { useAuth } from '../context/AuthContext';

interface Props {
  story: NewsStory;
  onPress: (story: NewsStory) => void;
  onBookmark?: (story: NewsStory) => void;
  onShare?: (story: NewsStory) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const NewsCard: React.FC<Props> = ({ story, onPress, onBookmark, onShare }) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Check bookmark status on mount
  useEffect(() => {
    checkBookmarkStatus();
  }, [story.id, user]);

  const checkBookmarkStatus = async () => {
    if (!user) return;
    
    try {
      const bookmarked = await bookmarkService.isBookmarked(user.uid, story.id);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleBookmarkPress = async () => {
    if (bookmarkLoading) return;
    
    setBookmarkLoading(true);
    
    // Call parent handler
    if (onBookmark) {
      await onBookmark(story);
      // Recheck bookmark status after parent handler
      await checkBookmarkStatus();
    }
    
    setBookmarkLoading(false);
  };

  const handleSharePress = () => {
    if (onShare) {
      onShare(story);
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

  const getBiasBarWidth = (score: number): number => {
    return Math.max(10, (score / 100) * 80); // Min 10px, max 80px
  };

  const getBiasColor = (bias: 'left' | 'center' | 'right'): string => {
    switch (bias) {
      case 'left': return '#1DA1F2'; // App blue for Left
      case 'center': return '#4ECDC4';
      case 'right': return '#FF6B6B'; // Red for Right
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
          
          {/* Enhanced urgency indicators */}
          {story.isBreaking && (
            <View style={styles.breakingBadge}>
              <Text style={styles.breakingText}>🚨 BREAKING</Text>
            </View>
          )}
          {story.isTrending && (
            <View style={styles.developingBadge}>
              <Text style={styles.developingText}>⏳ DEVELOPING</Text>
            </View>
          )}
          
          {/* Source reputation indicator */}
          {story.sourceReputation === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          {story.sourceReputation === 'questionable' && (
            <View style={styles.questionableBadge}>
              <Ionicons name="warning" size={12} color="#F59E0B" />
              <Text style={styles.questionableText}>Questionable</Text>
            </View>
          )}
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(story.createdAt)}</Text>
      </View>

      {/* Cover Image */}
      {story.media?.coverImageUrl && (
        <View style={styles.coverImageContainer}>
          <Image 
            source={{ uri: story.media.coverImageUrl }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
          {/* Media Count Badge */}
          {story.media.totalMediaCount > 1 && (
            <View style={styles.mediaCountBadge}>
              <Ionicons name="images" size={12} color="#fff" />
              <Text style={styles.mediaCountText}>+{story.media.totalMediaCount - 1}</Text>
            </View>
          )}
          {/* Video indicator */}
          {story.media.videos.length > 0 && (
            <View style={styles.videoIndicator}>
              <Ionicons name="play-circle" size={24} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Title and Summary */}
      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>
      
      <Text style={styles.summary} numberOfLines={2}>
        {story.summary}
      </Text>
      
      {/* Tags display */}
      {story.tags && story.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {story.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {story.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{story.tags.length - 3} more</Text>
          )}
        </View>
      )}

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

      {/* Bias Visualization - Only show if biasScore exists */}
      {story.biasScore && (
        <View style={styles.biasSection}>
          <View style={styles.biasHeader}>
            <Text style={styles.biasTitle}>Political Coverage</Text>
            <View style={styles.sourceCount}>
              <Ionicons name="newspaper-outline" size={12} color="#666" />
              <Text style={styles.sourceCountText}>
                {story.totalSources} {story.totalSources === 1 ? 'source' : 'sources'}
                {story.totalSources > 1 && ' ✓'}
              </Text>
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
                    width: getBiasBarWidth(story.biasScore.left || 0)
                  }
                ]} 
              />
              <Text style={styles.biasLabel}>Left</Text>
              <Text style={styles.biasPercentage}>{story.biasScore.left || 0}%</Text>
            </View>

            {/* Center bias */}
            <View style={styles.biasSegmentContainer}>
              <View 
                style={[
                  styles.biasSegment, 
                  { 
                    backgroundColor: getBiasColor('center'),
                    width: getBiasBarWidth(story.biasScore.center || 0)
                  }
                ]} 
              />
              <Text style={styles.biasLabel}>Center</Text>
              <Text style={styles.biasPercentage}>{story.biasScore.center || 0}%</Text>
            </View>

            {/* Right bias */}
            <View style={styles.biasSegmentContainer}>
              <View 
                style={[
                  styles.biasSegment, 
                  { 
                    backgroundColor: getBiasColor('right'),
                    width: getBiasBarWidth(story.biasScore.right || 0)
                  }
                ]} 
              />
              <Text style={styles.biasLabel}>Right</Text>
              <Text style={styles.biasPercentage}>{story.biasScore.right || 0}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Engagement section */}
      <View style={styles.engagementSection}>
        <View style={styles.credibilityContainer}>
          <View style={styles.credibilityRow}>
            <View style={styles.stars}>
              {getCredibilityStars(story.averageCredibility || 0)}
            </View>
            <Text style={styles.credibilityScore}>
              {(story.averageCredibility || 0).toFixed(1)}
            </Text>
          </View>
          {story.isUserGenerated && (
            <View style={styles.communitySubmittedRow}>
              <Ionicons name="people" size={10} color="#1DA1F2" />
              <Text style={styles.communitySubmittedText}>Community Submitted</Text>
            </View>
          )}
        </View>

        <View style={styles.votingContainer}>
          <View style={styles.voteCount}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.voteCountText}>{story.totalVotes} votes</Text>
          </View>
          <View style={styles.commentCount}>
            <Ionicons name="chatbubble-outline" size={14} color="#666" />
            <Text style={styles.commentCountText}>{story.commentCount} comments</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {onBookmark && (
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isBookmarked && styles.actionButtonBookmarked,
                bookmarkLoading && styles.actionButtonDisabled
              ]}
              onPress={handleBookmarkPress}
              disabled={bookmarkLoading}
            >
              {bookmarkLoading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={16} 
                  color={isBookmarked ? "#1DA1F2" : "#666"} 
                />
              )}
            </TouchableOpacity>
          )}
          
          {onShare && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSharePress}
            >
              <Ionicons name="share-outline" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced user generated content indicator */}
      {story.isUserGenerated && (
        <View style={styles.userGeneratedSection}>
          {/* Community validation indicators (keep top-right badges for status) */}
          {story.needsFactCheck && story.sourceReputation !== 'verified' && (
            <View style={styles.factCheckBadge}>
              <Ionicons name="search" size={10} color="#F59E0B" />
              <Text style={styles.factCheckText}>Fact Check Needed</Text>
            </View>
          )}
          {story.totalSources > 1 && (
            <View style={styles.multiSourceBadge}>
              <Ionicons name="link" size={10} color="#10B981" />
              <Text style={styles.multiSourceText}>Multiple Sources</Text>
            </View>
          )}
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
  developingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  developingText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: 'bold',
  },
  questionableBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  questionableText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 11,
    color: '#999',
  },

  // Cover Image styles
  coverImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  mediaCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mediaCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
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
    marginBottom: 8,
  },
  
  // Tags styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
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
    color: '#666',
    fontStyle: 'italic',
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  credibilityRow: {
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
    gap: 4,
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
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCountText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  communitySubmittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  communitySubmittedText: {
    fontSize: 10,
    color: '#black',
    fontWeight: 'bold',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  actionButtonBookmarked: {
    backgroundColor: '#EBF8FF',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },

  // Enhanced user generated content
  userGeneratedSection: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
  },
  userGeneratedBadge: {
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
  factCheckBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  factCheckText: {
    fontSize: 9,
    color: '#D97706',
    fontWeight: 'bold',
    marginLeft: 3,
  },
  multiSourceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiSourceText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: 'bold',
    marginLeft: 3,
  },
});

export default NewsCard;
