import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { votingService } from '../services/VotingService';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Loading community votes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Clean Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={24} color="#64748B" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Community Assessment</Text>
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.headerSubtitle}>
                  {stats.totalVotes} {stats.totalVotes === 1 ? 'vote' : 'votes'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {user && (
          <TouchableOpacity
            style={[
              styles.voteButton,
              stats.userVote && styles.voteButtonVoted
            ]}
            onPress={() => setShowVotingPanel(!showVotingPanel)}
          >
            <Text style={styles.voteButtonText}>
              {showVotingPanel ? 'Close' : stats.userVote ? 'Edit Vote' : 'Vote Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Voting Panel - Right after header */}
      {showVotingPanel && user && (
        <View style={styles.votingPanel}>
          <View style={styles.votingContent}>
            <Text style={styles.votingTitle}>Rate This Story</Text>
            
            {/* Political Bias */}
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Political lean:</Text>
              <View style={styles.optionRow}>
                {(['left', 'center', 'right'] as const).map((bias) => (
                  <TouchableOpacity
                    key={bias}
                    style={[
                      styles.optionButton,
                      selectedBias === bias && styles.optionButtonSelected
                    ]}
                    onPress={() => setSelectedBias(bias)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedBias === bias && styles.optionTextSelected
                    ]}>
                      {bias.charAt(0).toUpperCase() + bias.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Credibility */}
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Credibility:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setCredibilityRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= credibilityRating ? "star" : "star-outline"}
                      size={28}
                      color={star <= credibilityRating ? "#FFD700" : "#E2E8F0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quality */}
            <View style={styles.questionGroup}>
              <Text style={styles.questionLabel}>Overall quality:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setQualityRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= qualityRating ? "star" : "star-outline"}
                      size={28}
                      color={star <= qualityRating ? "#FFD700" : "#E2E8F0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedBias || credibilityRating === 0 || qualityRating === 0 || submitting) && 
                styles.submitButtonDisabled
              ]}
              onPress={handleSubmitVote}
              disabled={!selectedBias || credibilityRating === 0 || qualityRating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {stats.userVote ? 'Update Vote' : 'Submit Vote'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Bias Distribution - Only show if no voting panel */}
      {!showVotingPanel && (
        <View style={styles.biasCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Community Results</Text>
            {stats.totalVotes > 0 && (
              <View style={styles.reliabilityBadge}>
                <Text style={styles.reliabilityText}>
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


      {/* Enhanced Login Prompt */}
      {!user && (
        <View style={styles.loginPromptCard}>
          <View style={styles.loginPromptContent}>
            <View style={styles.loginIconContainer}>
              <Ionicons name="person-add-outline" size={32} color="#1DA1F2" />
            </View>
            <Text style={styles.loginPromptTitle}>Join the Community</Text>
            <Text style={styles.loginPromptText}>
              Sign in to contribute your assessment and help others understand news bias and quality
            </Text>
            <View style={styles.loginBenefits}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.benefitText}>Vote on news bias</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.benefitText}>Rate credibility</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.benefitText}>See detailed insights</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Clean Header
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  participationText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  voteButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  voteButtonVoted: {
    backgroundColor: '#059669',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Clean Bias Section
  biasCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  reliabilityBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reliabilityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  biasVisualization: {
    gap: 16,
  },
  combinedBiasBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  combinedSegment: {
    minWidth: 2,
  },
  biasItemsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  biasItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  biasIconContainer: {
    alignItems: 'center',
  },
  biasIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biasLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  biasPercentage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Clean Metrics Section
  metricsCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricStarsRow: {
    marginVertical: 4,
  },
  metricScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  metricBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Stars
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  interactiveStar: {
    padding: 4,
  },

  // Clean Voting Panel
  votingPanel: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  votingContent: {
    padding: 20,
  },
  votingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  votingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
  },
  questionGroup: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  starButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Clean Login Prompt
  loginPromptCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  loginPromptContent: {
    alignItems: 'center',
  },
  loginIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  loginBenefits: {
    gap: 8,
    alignSelf: 'stretch',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
});

export default CommunityVoting;