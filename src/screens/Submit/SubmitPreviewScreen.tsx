import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { SubmitStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { newsService } from '../../services/NewsService';

type Props = {
  navigation: StackNavigationProp<SubmitStackParamList, 'SubmitPreview'>;
  route: RouteProp<SubmitStackParamList, 'SubmitPreview'>;
};

const SubmitPreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { newsData } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit news');
      return;
    }

    setSubmitting(true);

    try {
      console.log('🚀 Submitting news:', newsData);
      
      // Submit to Firebase via NewsService
      const submissionId = await newsService.submitUserNews({
        title: newsData.title,
        primaryUrl: newsData.primaryUrl,
        summary: newsData.summary,
        category: newsData.category,
        submittedBy: user.uid,
        tags: newsData.tags,
        additionalSources: newsData.additionalSources,
        urgencyLevel: newsData.urgencyLevel,
        suggestedBias: newsData.suggestedBias,
        suggestedCredibility: newsData.suggestedCredibility,
        sourceReputation: newsData.sourceReputation,
      });

      console.log('✅ News submitted successfully:', submissionId);

      // Navigate to success screen
      navigation.navigate('SubmitSuccess', {
        newsId: submissionId,
      });

    } catch (error) {
      console.error('❌ Error submitting news:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your news. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleSubmit },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUrl = () => {
    Linking.openURL(newsData.primaryUrl);
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Technology: '#3B82F6',
      Politics: '#EF4444', 
      Business: '#10B981',
      Science: '#8B5CF6',
      Health: '#F59E0B',
      Sports: '#06B6D4',
      Entertainment: '#EC4899',
      Environment: '#22C55E',
      Education: '#F97316',
      Local: '#6366F1',
      International: '#84CC16',
      Other: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview & Submit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview Card - Simulating how it will appear in the news feed */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>📱 How it will appear in the news feed:</Text>
          
          <View style={styles.newsCard}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View 
                  style={[
                    styles.categoryBadge, 
                    { backgroundColor: getCategoryColor(newsData.category) }
                  ]}
                >
                  <Text style={styles.categoryText}>{newsData.category.toUpperCase()}</Text>
                </View>
                <View style={styles.userSubmittedBadge}>
                  <Ionicons name="person" size={10} color="#9B59B6" />
                  <Text style={styles.userSubmittedText}>Community Submitted</Text>
                </View>
              </View>
              <Text style={styles.timeAgo}>Just now</Text>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {newsData.title}
            </Text>

            {/* Summary */}
            <Text style={styles.cardSummary} numberOfLines={3}>
              {newsData.summary}
            </Text>

            {/* URL Preview */}
            <TouchableOpacity style={styles.urlPreview} onPress={handleOpenUrl}>
              <Ionicons name="link-outline" size={16} color="#1DA1F2" />
              <Text style={styles.urlText} numberOfLines={1}>
                {newsData.primaryUrl}
              </Text>
              <Ionicons name="open-outline" size={14} color="#666" />
            </TouchableOpacity>

            {/* Engagement Placeholder */}
            <View style={styles.cardEngagement}>
              <View style={styles.engagementLeft}>
                <View style={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons 
                      key={i} 
                      name={i < 4 ? "star" : "star-outline"} 
                      size={12} 
                      color={i < 4 ? "#FFD700" : "#DDD"}
                    />
                  ))}
                </View>
                <Text style={styles.credibilityScore}>Pending review</Text>
              </View>
              <View style={styles.actionButtons}>
                <View style={styles.actionButton}>
                  <Ionicons name="bookmark-outline" size={16} color="#666" />
                </View>
                <View style={styles.actionButton}>
                  <Ionicons name="share-outline" size={16} color="#666" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Submission Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>📋 Submission Details:</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Title:</Text>
            <Text style={styles.detailValue}>{newsData.title}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{newsData.category}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>URL:</Text>
            <TouchableOpacity onPress={handleOpenUrl}>
              <Text style={styles.detailLink} numberOfLines={2}>
                {newsData.url}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Summary:</Text>
            <Text style={styles.detailValue}>{newsData.summary}</Text>
          </View>
        </View>

        {/* Review Process Info */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>⏳ What happens next?</Text>
          
          <View style={styles.reviewStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Your news submission will be added to the community feed immediately
            </Text>
          </View>

          <View style={styles.reviewStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Community members will vote on bias and credibility
            </Text>
          </View>

          <View style={styles.reviewStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              High-quality submissions get promoted to trending
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backToEditButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="create-outline" size={20} color="#1DA1F2" />
          <Text style={styles.backToEditText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit News</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Section styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 24,
  },
  
  // Preview section
  previewSection: {
    marginTop: 16,
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userSubmittedBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userSubmittedText: {
    fontSize: 9,
    color: '#9B59B6',
    fontWeight: 'bold',
    marginLeft: 3,
  },
  timeAgo: {
    fontSize: 11,
    color: '#999',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: '#1DA1F2',
  },
  cardEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  credibilityScore: {
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic',
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
  
  // Details section
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailLink: {
    fontSize: 14,
    color: '#1DA1F2',
    textDecorationLine: 'underline',
  },
  
  // Review section
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 120,
  },
  reviewStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    flexDirection: 'row',
    gap: 12,
  },
  backToEditButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1DA1F2',
    gap: 8,
  },
  backToEditText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#1DA1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubmitPreviewScreen;