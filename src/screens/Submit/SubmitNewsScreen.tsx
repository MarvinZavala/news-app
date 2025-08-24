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
  'Technology',
  'Politics', 
  'Business',
  'Science',
  'Health',
  'Sports',
  'Entertainment',
  'Environment',
  'Education',
  'Local',
  'International',
  'Other'
];

const SubmitNewsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserNewsSubmissionForm>({
    title: '',
    url: '',
    summary: '',
    category: 'Technology',
    tags: [],
  });

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

    if (!formData.url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    if (!isValidUrl(formData.url)) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://example.com)');
      return;
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

  const updateFormData = (key: keyof UserNewsSubmissionForm, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
          {/* URL Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              News URL <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/article"
              value={formData.url}
              onChangeText={(text) => updateFormData('url', text)}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Enter the full URL of the news article
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
              Summary <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write a brief summary of the news article... (50-500 characters)"
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

          {/* Guidelines */}
          <View style={styles.guidelinesContainer}>
            <Text style={styles.guidelinesTitle}>📋 Submission Guidelines</Text>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Share credible, factual news from reputable sources
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Write clear, unbiased summaries
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Select appropriate category for your news
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={styles.guidelineText}>
                News will be reviewed by community before publishing
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