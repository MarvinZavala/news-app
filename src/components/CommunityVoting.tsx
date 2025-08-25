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
      {/* Enhanced Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={28} color="#1DA1F2" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Community Assessment</Text>
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Ionicons name="bar-chart" size={14} color="#666" />
                <Text style={styles.headerSubtitle}>
                  {stats.totalVotes} {stats.totalVotes === 1 ? 'vote' : 'votes'}
                </Text>
              </View>
              {stats.totalVotes > 0 && (
                <View style={styles.statChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.participationText}>Active</Text>
                </View>
              )}
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
            <Ionicons 
              name={stats.userVote ? "checkmark" : "add"} 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.voteButtonText}>
              {stats.userVote ? 'Update' : 'Vote'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Enhanced Bias Distribution Card */}
      <View style={styles.biasCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="analytics" size={20} color="#666" />
            <Text style={styles.sectionTitle}>Political Coverage Analysis</Text>
          </View>
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
                <View style={styles.biasIconContainer}>
                  <View style={[styles.biasIconCircle, { backgroundColor: getBiasColor(bias) }]}>
                    <Ionicons 
                      name={getBiasIcon(bias)} 
                      size={16} 
                      color="#fff" 
                    />
                  </View>
                </View>
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

      {/* Enhanced Quality Metrics Card */}
      <View style={styles.metricsCard}>
        <View style={styles.metricsHeader}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={styles.metricsTitle}>Quality Assessment</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            </View>
            <Text style={styles.metricLabel}>Credibility</Text>
            <View style={styles.metricStarsRow}>
              {renderStars(Math.round(stats.averageCredibility))}
            </View>
            <Text style={styles.metricScore}>
              {stats.averageCredibility.toFixed(1)}/5.0
            </Text>
            <View style={styles.metricBar}>
              <Animated.View 
                style={[
                  styles.metricBarFill,
                  {
                    width: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${(stats.averageCredibility / 5) * 100}%`]
                    }),
                    backgroundColor: '#10B981',
                  }
                ]}
              />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="ribbon" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.metricLabel}>Quality</Text>
            <View style={styles.metricStarsRow}>
              {renderStars(Math.round(stats.averageQuality))}
            </View>
            <Text style={styles.metricScore}>
              {stats.averageQuality.toFixed(1)}/5.0
            </Text>
            <View style={styles.metricBar}>
              <Animated.View 
                style={[
                  styles.metricBarFill,
                  {
                    width: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${(stats.averageQuality / 5) * 100}%`]
                    }),
                    backgroundColor: '#F59E0B',
                  }
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Simplified Voting Panel */}
      {showVotingPanel && user && (
        <View style={styles.votingPanel}>
          <View style={styles.votingHeader}>
            <Text style={styles.votingTitle}>Quick Assessment</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowVotingPanel(false)}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          {/* Step 1: Bias Selection */}
          <View style={styles.votingStep}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepTitle}>What's the political lean?</Text>
            </View>
            <View style={styles.simplebiasOptions}>
              {(['left', 'center', 'right'] as const).map((bias) => (
                <TouchableOpacity
                  key={bias}
                  style={[
                    styles.simplebiasButton,
                    selectedBias === bias && styles.simplebiasButtonSelected
                  ]}
                  onPress={() => setSelectedBias(bias)}
                >
                  <Text style={[
                    styles.simplebiasText,
                    selectedBias === bias && styles.simplebiasTextSelected
                  ]}>
                    {bias.charAt(0).toUpperCase() + bias.slice(1)}
                  </Text>
                  {selectedBias === bias && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 2: Credibility */}
          <View style={styles.votingStep}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepTitle}>How credible is this?</Text>
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Poor</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setCredibilityRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= credibilityRating ? "star" : "star-outline"}
                      size={32}
                      color={star <= credibilityRating ? "#FFD700" : "#E2E8F0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingLabel}>Great</Text>
            </View>
            {credibilityRating > 0 && (
              <Text style={styles.ratingFeedback}>
                {credibilityRating <= 2 ? 'Low credibility' :
                 credibilityRating <= 3 ? 'Moderate' :
                 credibilityRating <= 4 ? 'Good' : 'Excellent'}
              </Text>
            )}
          </View>

          {/* Step 3: Quality */}
          <View style={styles.votingStep}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepTitle}>Overall quality?</Text>
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Poor</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setQualityRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= qualityRating ? "star" : "star-outline"}
                      size={32}
                      color={star <= qualityRating ? "#FFD700" : "#E2E8F0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingLabel}>Great</Text>
            </View>
            {qualityRating > 0 && (
              <Text style={styles.ratingFeedback}>
                {qualityRating <= 2 ? 'Poor quality' :
                 qualityRating <= 3 ? 'Average' :
                 qualityRating <= 4 ? 'Good' : 'Outstanding'}
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButtonLarge,
              (!selectedBias || credibilityRating === 0 || qualityRating === 0) && 
              styles.submitButtonDisabled
            ]}
            onPress={handleSubmitVote}
            disabled={!selectedBias || credibilityRating === 0 || qualityRating === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.submitButtonLargeText}>
                  {stats.userVote ? 'Update My Assessment' : 'Submit My Assessment'}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  voteButtonVoted: {
    backgroundColor: '#059669',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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

  // Improved Voting Panel
  votingPanel: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  votingStep: {
    marginBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  simplebiasOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  simplebiasButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  simplebiasButtonSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  simplebiasText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  simplebiasTextSelected: {
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    minWidth: 35,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  ratingFeedback: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    marginTop: 4,
  },
  submitButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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