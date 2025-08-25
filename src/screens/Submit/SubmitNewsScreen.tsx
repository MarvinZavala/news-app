import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SubmitStackParamList, UserNewsSubmissionForm } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<SubmitStackParamList, 'SubmitNewsScreen'>;
};

const CATEGORIES = [
  'Politics',
  'International', 
  'Business',
  'Technology',
  'Science',
  'Health',
  'Environment',
  'Sports',
  'Entertainment',
  'Education',
  'Local',
  'Crime',
  'Weather',
  'Other'
];

const URGENCY_LEVELS = [
  { key: 'normal', label: '📰 Regular News', color: '#64748B' },
  { key: 'developing', label: '⏳ Developing Story', color: '#F59E0B' },
  { key: 'breaking', label: '🚨 Breaking News', color: '#EF4444' },
];

const BIAS_OPTIONS = [
  { key: 'left', label: '🔴 Left Leaning', color: '#EF4444' },
  { key: 'center', label: '⚪ Center/Neutral', color: '#6B7280' },
  { key: 'right', label: '🔵 Right Leaning', color: '#3B82F6' },
];

const SOURCE_REPUTATION = [
  { key: 'verified', label: '✅ Verified Source', description: 'Well-known, credible news outlet' },
  { key: 'questionable', label: '⚠️ Questionable Source', description: 'Known for bias or misinformation' },
  { key: 'unknown', label: '❓ Unknown Source', description: 'Not in our database' },
];

const SubmitNewsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserNewsSubmissionForm>({
    title: '',
    primaryUrl: '',
    summary: '',
    category: 'Politics',
    tags: [],
    additionalSources: [],
    urgencyLevel: 'normal',
    sourceReputation: 'unknown',
    hasMultipleSources: false,
  });
  
  const [newTag, setNewTag] = useState('');
  const [newSource, setNewSource] = useState('');
  const [urlAnalysis, setUrlAnalysis] = useState<{
    domain: string;
    isAnalyzed: boolean;
    reputation?: 'verified' | 'questionable' | 'unknown';
  } | null>(null);

  // Validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!formData.primaryUrl.trim()) {
      Alert.alert('Error', 'Please enter a primary URL');
      return;
    }

    if (!isValidUrl(formData.primaryUrl)) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    // Validate additional sources
    for (let i = 0; i < formData.additionalSources.length; i++) {
      if (!isValidUrl(formData.additionalSources[i])) {
        Alert.alert('Error', `Additional source ${i + 1} is not a valid URL`);
        return;
      }
    }

    if (!formData.summary.trim()) {
      Alert.alert('Error', 'Please enter a summary');
      return;
    }

    if (formData.summary.length < 50) {
      Alert.alert('Error', 'Summary must be at least 50 characters long');
      return;
    }

    if (formData.summary.length > 500) {
      Alert.alert('Error', 'Summary must be less than 500 characters');
      return;
    }

    // Navigate to preview screen
    navigation.navigate('SubmitPreview', {
      newsData: formData,
    });
  };

  const updateFormData = (key: keyof UserNewsSubmissionForm, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  
  const analyzeUrl = async (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      setUrlAnalysis({
        domain,
        isAnalyzed: true,
        reputation: getSourceReputation(domain)
      });
      
      // Auto-update form based on analysis
      updateFormData('sourceReputation', getSourceReputation(domain));
    } catch (error) {
      setUrlAnalysis(null);
    }
  };
  
  const getSourceReputation = (domain: string): 'verified' | 'questionable' | 'unknown' => {
    // Basic reputation database - in real app this would be more comprehensive
    const verifiedSources = [
      'reuters.com', 'apnews.com', 'bbc.com', 'npr.org', 'pbs.org',
      'cnn.com', 'foxnews.com', 'nytimes.com', 'washingtonpost.com',
      'wsj.com', 'bloomberg.com', 'economist.com'
    ];
    
    const questionableSources = [
      'breitbart.com', 'infowars.com', 'dailymail.co.uk'
    ];
    
    if (verifiedSources.includes(domain)) return 'verified';
    if (questionableSources.includes(domain)) return 'questionable';
    return 'unknown';
  };
  
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };
  
  const addAdditionalSource = () => {
    if (newSource.trim() && isValidUrl(newSource.trim())) {
      updateFormData('additionalSources', [...formData.additionalSources, newSource.trim()]);
      updateFormData('hasMultipleSources', true);
      setNewSource('');
    } else {
      Alert.alert('Error', 'Please enter a valid URL for additional source');
    }
  };
  
  const removeAdditionalSource = (index: number) => {
    const newSources = formData.additionalSources.filter((_, i) => i !== index);
    updateFormData('additionalSources', newSources);
    updateFormData('hasMultipleSources', newSources.length > 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="newspaper-outline" size={28} color="#1DA1F2" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Submit News</Text>
              <Text style={styles.headerSubtitle}>
                Share news with the community
              </Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle-outline" size={20} color="#666" />
            <Text style={styles.userName}>{user?.displayName || user?.email}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Primary URL Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              🔗 Primary News URL <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/article"
              value={formData.primaryUrl}
              onChangeText={(text) => {
                updateFormData('primaryUrl', text);
                if (text.trim() && isValidUrl(text.trim())) {
                  analyzeUrl(text.trim());
                }
              }}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {/* URL Analysis */}
            {urlAnalysis && (
              <View style={[
                styles.urlAnalysis,
                { backgroundColor: 
                  urlAnalysis.reputation === 'verified' ? '#DCFCE7' :
                  urlAnalysis.reputation === 'questionable' ? '#FEF3C7' : '#F3F4F6'
                }
              ]}>
                <Text style={styles.urlDomain}>{urlAnalysis.domain}</Text>
                <Text style={[
                  styles.reputationText,
                  { color: 
                    urlAnalysis.reputation === 'verified' ? '#059669' :
                    urlAnalysis.reputation === 'questionable' ? '#D97706' : '#6B7280'
                  }
                ]}>
                  {urlAnalysis.reputation === 'verified' && '✅ Verified Source'}
                  {urlAnalysis.reputation === 'questionable' && '⚠️ Questionable Source'}
                  {urlAnalysis.reputation === 'unknown' && '❓ Unknown Source'}
                </Text>
              </View>
            )}
            
            <Text style={styles.hint}>
              Enter the main source URL for this news story
            </Text>
          </View>

          {/* Title Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter news headline..."
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              maxLength={200}
            />
            <Text style={styles.charCount}>
              {formData.title.length}/200
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonSelected,
                  ]}
                  onPress={() => updateFormData('category', category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === category && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Summary Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              📝 Summary <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write a clear, objective summary of the news article... (50-500 characters)"
              value={formData.summary}
              onChangeText={(text) => updateFormData('summary', text)}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[
              styles.charCount,
              formData.summary.length < 50 && styles.charCountWarning
            ]}>
              {formData.summary.length}/500 {formData.summary.length < 50 && '(min 50)'}
            </Text>
          </View>
          
          {/* Urgency Level */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              ⏱️ News Urgency
            </Text>
            <View style={styles.urgencyContainer}>
              {URGENCY_LEVELS.map((urgency) => (
                <TouchableOpacity
                  key={urgency.key}
                  style={[
                    styles.urgencyButton,
                    formData.urgencyLevel === urgency.key && {
                      backgroundColor: urgency.color,
                      borderColor: urgency.color,
                    },
                  ]}
                  onPress={() => updateFormData('urgencyLevel', urgency.key)}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      formData.urgencyLevel === urgency.key && { color: '#fff' },
                    ]}
                  >
                    {urgency.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              🏷️ Tags (Optional)
            </Text>
            
            {/* Tag Input */}
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.input, styles.tagInput]}
                placeholder="Add relevant tags (e.g., election, healthcare)"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                returnKeyType="done"
                maxLength={30}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Ionicons name="add" size={20} color="#1DA1F2" />
              </TouchableOpacity>
            </View>
            
            {/* Existing Tags */}
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close" size={14} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Additional Sources */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              🔗 Additional Sources (Optional)
            </Text>
            <Text style={styles.hint}>
              Add more sources covering the same story to improve credibility
            </Text>
            
            {/* Add Source Input */}
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.input, styles.tagInput]}
                placeholder="https://another-source.com/same-story"
                value={newSource}
                onChangeText={setNewSource}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addAdditionalSource}>
                <Ionicons name="add" size={20} color="#1DA1F2" />
              </TouchableOpacity>
            </View>
            
            {/* Existing Additional Sources */}
            {formData.additionalSources.map((source, index) => (
              <View key={index} style={styles.sourceItem}>
                <View style={styles.sourceInfo}>
                  <Ionicons name="link-outline" size={16} color="#1DA1F2" />
                  <Text style={styles.sourceUrl} numberOfLines={1}>
                    {source}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeAdditionalSource(index)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Bias Assessment (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              ⚖️ Your Bias Assessment (Optional)
            </Text>
            <Text style={styles.hint}>
              How do you perceive the bias of this news source?
            </Text>
            <View style={styles.biasContainer}>
              {BIAS_OPTIONS.map((bias) => (
                <TouchableOpacity
                  key={bias.key}
                  style={[
                    styles.biasButton,
                    formData.suggestedBias === bias.key && {
                      backgroundColor: bias.color,
                      borderColor: bias.color,
                    },
                  ]}
                  onPress={() => updateFormData('suggestedBias', 
                    formData.suggestedBias === bias.key ? undefined : bias.key
                  )}
                >
                  <Text
                    style={[
                      styles.biasText,
                      formData.suggestedBias === bias.key && { color: '#fff' },
                    ]}
                  >
                    {bias.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Credibility Rating (Optional) */}
          {formData.suggestedBias && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                ⭐ Credibility Rating (Optional)
              </Text>
              <View style={styles.credibilityContainer}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={styles.starButton}
                    onPress={() => updateFormData('suggestedCredibility', rating)}
                  >
                    <Ionicons
                      name={formData.suggestedCredibility && rating <= formData.suggestedCredibility ? "star" : "star-outline"}
                      size={28}
                      color={formData.suggestedCredibility && rating <= formData.suggestedCredibility ? "#FFD700" : "#DDD"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.credibilityHint}>
                {formData.suggestedCredibility ? 
                  `You rated this ${formData.suggestedCredibility}/5 stars` : 
                  'Tap to rate source credibility (1-5 stars)'
                }
              </Text>
            </View>
          )}
          
          {/* Enhanced Guidelines */}
          <View style={styles.guidelinesContainer}>
            <Text style={styles.guidelinesTitle}>📝 Submission Guidelines</Text>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Share from credible, verifiable news sources
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Write objective summaries without personal opinions
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Add multiple sources when possible for better credibility
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="information-circle-outline" size={16} color="#1DA1F2" />
              <Text style={styles.guidelineText}>
                Community will vote on bias and credibility
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={styles.guidelineText}>
                Misinformation and spam will be flagged and removed
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Preview & Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header styles
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  
  // Content styles
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 6,
  },
  charCountWarning: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  
  // Category styles
  categoryScroll: {
    marginVertical: 8,
  },
  categoryButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // URL Analysis styles
  urlAnalysis: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urlDomain: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reputationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Urgency styles
  urgencyContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  urgencyButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  urgencyText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Tags styles
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#1DA1F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
  },
  
  // Additional sources styles
  sourceItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sourceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceUrl: {
    flex: 1,
    fontSize: 12,
    color: '#1DA1F2',
  },
  
  // Bias assessment styles
  biasContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  biasButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  biasText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Credibility rating styles
  credibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  starButton: {
    padding: 4,
  },
  credibilityHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Guidelines styles
  guidelinesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 120, // Space for submit button
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  
  // Footer styles
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  submitButton: {
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

export default SubmitNewsScreen;