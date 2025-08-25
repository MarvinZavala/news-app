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
      case 'left': return '#EF4444';
      case 'center': return '#6B7280';
      case 'right': return '#3B82F6';
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={24} color="#1DA1F2" />
          <View>
            <Text style={styles.headerTitle}>Community Assessment</Text>
            <Text style={styles.headerSubtitle}>
              {stats.totalVotes} {stats.totalVotes === 1 ? 'vote' : 'votes'}
            </Text>
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
              size={16} 
              color="#fff" 
            />
            <Text style={styles.voteButtonText}>
              {stats.userVote ? 'Update Vote' : 'Vote'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bias Distribution */}
      <View style={styles.biasSection}>
        <Text style={styles.sectionTitle}>Political Bias Coverage</Text>
        
        <View style={styles.biasBarContainer}>
          {(['left', 'center', 'right'] as const).map((bias) => (
            <View key={bias} style={styles.biasItem}>
              <View style={styles.biasHeader}>
                <View style={styles.biasLabelContainer}>
                  <Ionicons 
                    name={getBiasIcon(bias)} 
                    size={14} 
                    color={getBiasColor(bias)} 
                  />
                  <Text style={[styles.biasLabel, { color: getBiasColor(bias) }]}>
                    {bias.charAt(0).toUpperCase() + bias.slice(1)}
                  </Text>
                </View>
                <Text style={styles.biasPercentage}>
                  {stats.biasDistribution[bias]}%
                </Text>
              </View>
              
              <Animated.View 
                style={[
                  styles.biasBar,
                  {
                    width: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.max(5, stats.biasDistribution[bias])}%`]
                    }),
                    backgroundColor: getBiasColor(bias),
                  }
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Quality Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            <Text style={styles.metricLabel}>Credibility</Text>
          </View>
          <View style={styles.metricValue}>
            {renderStars(Math.round(stats.averageCredibility))}
            <Text style={styles.metricScore}>
              {stats.averageCredibility.toFixed(1)}/5
            </Text>
          </View>
        </View>

        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <Ionicons name="ribbon" size={18} color="#F59E0B" />
            <Text style={styles.metricLabel}>Quality</Text>
          </View>
          <View style={styles.metricValue}>
            {renderStars(Math.round(stats.averageQuality))}
            <Text style={styles.metricScore}>
              {stats.averageQuality.toFixed(1)}/5
            </Text>
          </View>
        </View>
      </View>

      {/* Voting Panel */}
      {showVotingPanel && user && (
        <View style={styles.votingPanel}>
          <Text style={styles.votingTitle}>Cast Your Vote</Text>
          
          {/* Bias Selection */}
          <View style={styles.votingSection}>
            <Text style={styles.votingLabel}>How do you perceive the bias?</Text>
            <View style={styles.biasOptions}>
              {(['left', 'center', 'right'] as const).map((bias) => (
                <TouchableOpacity
                  key={bias}
                  style={[
                    styles.biasOption,
                    selectedBias === bias && styles.biasOptionSelected,
                    { borderColor: getBiasColor(bias) }
                  ]}
                  onPress={() => setSelectedBias(bias)}
                >
                  <Ionicons 
                    name={getBiasIcon(bias)} 
                    size={20} 
                    color={selectedBias === bias ? '#fff' : getBiasColor(bias)} 
                  />
                  <Text style={[
                    styles.biasOptionText,
                    selectedBias === bias && styles.biasOptionTextSelected
                  ]}>
                    {bias.charAt(0).toUpperCase() + bias.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Credibility Rating */}
          <View style={styles.votingSection}>
            <Text style={styles.votingLabel}>Rate the credibility (1-5 stars)</Text>
            {renderStars(credibilityRating, setCredibilityRating, true)}
          </View>

          {/* Quality Rating */}
          <View style={styles.votingSection}>
            <Text style={styles.votingLabel}>Rate the overall quality (1-5 stars)</Text>
            {renderStars(qualityRating, setQualityRating, true)}
          </View>

          {/* Submit Button */}
          <View style={styles.votingActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowVotingPanel(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
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
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {stats.userVote ? 'Update Vote' : 'Submit Vote'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Login Prompt */}
      {!user && (
        <View style={styles.loginPrompt}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.loginPromptText}>
            Log in to vote and see detailed community assessment
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  voteButton: {
    backgroundColor: '#1DA1F2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  voteButtonVoted: {
    backgroundColor: '#10B981',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bias section
  biasSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  biasBarContainer: {
    gap: 12,
  },
  biasItem: {
    gap: 8,
  },
  biasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biasLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  biasLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  biasPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  biasBar: {
    height: 6,
    borderRadius: 3,
    minWidth: 10,
  },

  // Metrics section
  metricsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  metric: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  metricValue: {
    alignItems: 'center',
    gap: 4,
  },
  metricScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },

  // Stars
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  interactiveStar: {
    padding: 4,
  },

  // Voting panel
  votingPanel: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  votingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  votingSection: {
    marginBottom: 20,
  },
  votingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  biasOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  biasOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
    gap: 6,
  },
  biasOptionSelected: {
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2',
  },
  biasOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  biasOptionTextSelected: {
    color: '#fff',
  },
  votingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1DA1F2',
    gap: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Login prompt
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default CommunityVoting;