import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { votingService } from '../services/VotingService';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import ActionButton from './ui/ActionButton';
// import AnimatedCard from './ui/AnimatedCard';


interface Props {
  newsStoryId: string;
  onVoteUpdate?: (stats: any) => void;
}

interface VotingStats {
  totalVotes: number;
  biasDistribution: {
    left: number;
    center: number;
    right: number;
  };
  averageCredibility: number;
  averageQuality: number;
  userVote?: {
    biasVote: 'left' | 'center' | 'right';
    credibilityVote: number;
    qualityVote: number;
  };
}

const CommunityVoting: React.FC<Props> = ({ newsStoryId, onVoteUpdate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<VotingStats>({
    totalVotes: 0,
    biasDistribution: { left: 33, center: 34, right: 33 },
    averageCredibility: 0,
    averageQuality: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showVotingPanel, setShowVotingPanel] = useState(false);
  
  // Voting state
  const [selectedBias, setSelectedBias] = useState<'left' | 'center' | 'right' | null>(null);
  const [credibilityRating, setCredibilityRating] = useState<number>(0);
  const [qualityRating, setQualityRating] = useState<number>(0);

  // Animation values
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadVotingStats();
  }, [newsStoryId]);

  useEffect(() => {
    // Auto-slide animation for bias bars
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [stats]);

  const loadVotingStats = async () => {
    try {
      setLoading(true);
      const votingStats = await votingService.getVotingStats(newsStoryId, user?.uid);
      setStats(votingStats);
      
      // If user has voted, populate the form
      if (votingStats.userVote) {
        setSelectedBias(votingStats.userVote.biasVote);
        setCredibilityRating(votingStats.userVote.credibilityVote);
        setQualityRating(votingStats.userVote.qualityVote);
      }
      
      onVoteUpdate?.(votingStats);
    } catch (error) {
      console.error('Error loading voting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!user || !selectedBias || credibilityRating === 0 || qualityRating === 0) {
      Alert.alert('Incomplete Vote', 'Please select bias, credibility, and quality ratings.');
      return;
    }

    try {
      setSubmitting(true);
      
      await votingService.submitVote(
        user.uid,
        user.displayName || user.email || 'Anonymous',
        {
          newsStoryId,
          biasVote: selectedBias,
          credibilityVote: credibilityRating,
          qualityVote: qualityRating,
        }
      );

      // Refresh stats
      await loadVotingStats();
      setShowVotingPanel(false);
      
      Alert.alert('Vote Submitted', 'Thank you for contributing to the community!');

    } catch (error) {
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
      console.error('Error submitting vote:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getBiasColor = (bias: 'left' | 'center' | 'right'): string => {
    switch (bias) {
      case 'left': return '#DC2626';
      case 'center': return '#64748B';
      case 'right': return '#2563EB';
    }
  };

  const getBiasIcon = (bias: 'left' | 'center' | 'right'): string => {
    switch (bias) {
      case 'left': return 'arrow-back';
      case 'center': return 'remove';
      case 'right': return 'arrow-forward';
    }
  };

  const renderStars = (rating: number, onPress?: (rating: number) => void, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onPress?.(star)}
            disabled={!interactive}
            style={interactive ? styles.interactiveStar : undefined}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={interactive ? 28 : 16}
              color={star <= rating ? "#FFD700" : "#DDD"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <Card style={styles.container} padding="medium" shadow={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6B7280" />
          <Text style={styles.loadingText}>Loading votes...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container} padding="medium" shadow={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.title}>Community Assessment</Text>
            <Text style={styles.subtitle}>
              {stats.totalVotes} {stats.totalVotes === 1 ? 'vote' : 'votes'}
            </Text>
          </View>
        </View>
        
        {user && (
          <ActionButton
            text={showVotingPanel ? 'Close' : stats.userVote ? 'Edit' : 'Vote'}
            onPress={() => setShowVotingPanel(!showVotingPanel)}
            variant={stats.userVote ? 'secondary' : 'primary'}
            size="small"
          />
        )}
      </View>

      {/* Compact Voting Panel */}
      {showVotingPanel && user && (
        <View style={styles.votingPanel}>
          {/* Bias Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Political Lean</Text>
            <View style={styles.biasOptions}>
              {(['left', 'center', 'right'] as const).map((bias) => (
                <TouchableOpacity
                  key={bias}
                  style={[
                    styles.biasChip,
                    selectedBias === bias && styles.biasChipSelected,
                    { backgroundColor: selectedBias === bias ? getBiasColor(bias) : '#F3F4F6' }
                  ]}
                  onPress={() => setSelectedBias(bias)}
                >
                  <Text style={[
                    styles.biasChipText,
                    selectedBias === bias && styles.biasChipTextSelected
                  ]}>
                    {bias.charAt(0).toUpperCase() + bias.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingsRow}>
            <View style={styles.ratingGroup}>
              <Text style={styles.ratingLabel}>Credibility</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setCredibilityRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= credibilityRating ? "star" : "star-outline"}
                      size={20}
                      color={star <= credibilityRating ? "#F59E0B" : "#E5E7EB"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.ratingGroup}>
              <Text style={styles.ratingLabel}>Quality</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setQualityRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= qualityRating ? "star" : "star-outline"}
                      size={20}
                      color={star <= qualityRating ? "#F59E0B" : "#E5E7EB"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit */}
          <ActionButton
            text={stats.userVote ? 'Update Vote' : 'Submit Vote'}
            onPress={handleSubmitVote}
            loading={submitting}
            disabled={!selectedBias || credibilityRating === 0 || qualityRating === 0}
            variant="primary"
            size="medium"
            style={styles.submitButton}
          />
        </View>
      )}
      
      {/* Results - Only show if no voting panel */}
      {!showVotingPanel && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Results</Text>
            {stats.totalVotes > 0 && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {stats.totalVotes > 10 ? 'High' : stats.totalVotes > 5 ? 'Medium' : 'Low'} confidence
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.biasVisualization}>
            {/* Combined Bias Bar */}
            <View style={styles.combinedBiasBar}>
              <Animated.View 
                style={[
                  styles.combinedSegment,
                  {
                    flex: stats.biasDistribution.left,
                    backgroundColor: getBiasColor('left'),
                    opacity: slideAnim,
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.combinedSegment,
                  {
                    flex: stats.biasDistribution.center,
                    backgroundColor: getBiasColor('center'),
                    opacity: slideAnim,
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.combinedSegment,
                  {
                    flex: stats.biasDistribution.right,
                    backgroundColor: getBiasColor('right'),
                    opacity: slideAnim,
                  }
                ]}
              />
            </View>
            
            {/* Individual Bias Items */}
            <View style={styles.biasItemsGrid}>
              {(['left', 'center', 'right'] as const).map((bias) => (
                <View key={bias} style={styles.biasItem}>
                  <Text style={styles.biasLabel}>
                    {bias.charAt(0).toUpperCase() + bias.slice(1)}
                  </Text>
                  <Text style={[styles.biasPercentage, { color: getBiasColor(bias) }]}>
                    {stats.biasDistribution[bias]}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Quality Metrics - Only show if no voting panel */}
      {!showVotingPanel && (
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Quality Scores</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Credibility</Text>
              <View style={styles.metricStarsRow}>
                {renderStars(Math.round(stats.averageCredibility))}
              </View>
              <Text style={styles.metricScore}>
                {stats.averageCredibility.toFixed(1)}/5.0
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Quality</Text>
              <View style={styles.metricStarsRow}>
                {renderStars(Math.round(stats.averageQuality))}
              </View>
              <Text style={styles.metricScore}>
                {stats.averageQuality.toFixed(1)}/5.0
              </Text>
            </View>
          </View>
        </View>
      )}


      {/* Login Prompt */}
      {!user && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Sign in to vote and contribute</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Results Section
  resultsSection: {
    paddingTop: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  biasBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  biasSegment: {
    minWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Voting Panel
  votingPanel: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  biasOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  biasChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  biasChipSelected: {
    // backgroundColor set dynamically
  },
  biasChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  biasChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  ratingGroup: {
    flex: 1,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  submitButton: {
    marginTop: 8,
  },
  // Bias Visualization
  biasVisualization: {
    marginTop: 8,
  },
  combinedBiasBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  combinedSegment: {
    minWidth: 1,
  },
  biasItemsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  biasItem: {
    alignItems: 'center',
    flex: 1,
  },
  biasLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  biasPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Quality Metrics
  metricsCard: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  metricStarsRow: {
    marginBottom: 4,
  },
  metricScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  interactiveStar: {
    padding: 4,
  },
  // Login Prompt
  loginPrompt: {
    paddingTop: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  loginText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default CommunityVoting;