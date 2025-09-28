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
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SubmitStackParamList, UserNewsSubmissionForm, FormMediaFile } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { mediaService } from '../../services/MediaService';

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

const { width: screenWidth } = Dimensions.get('window');

const SubmitNewsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserNewsSubmissionForm>({
    title: '',
    primaryUrl: '',
    summary: '',
    category: 'Politics',
    urgencyLevel: 'normal',
    sourceReputation: 'unknown',
    photos: [],
    videos: [],
    selectedCoverImageId: undefined,
  });
  
  const [urlAnalysis, setUrlAnalysis] = useState<{
    domain: string;
    isAnalyzed: boolean;
    reputation?: 'verified' | 'questionable' | 'unknown';
  } | null>(null);
  const [urlError, setUrlError] = useState<string>('');
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  // Validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Helper to count characters without spaces
  const getCharCountWithoutSpaces = (text: string): number => {
    return text.replace(/\s/g, '').length;
  };

  // Media picker permissions
  const ensureLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is needed to pick photos or videos from your gallery.'
      );
      return false;
    }
    return true;
  };

  const ensureCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos or record videos.'
      );
      return false;
    }
    return true;
  };

  const pickPhotos = async () => {
    if (mediaLoading) return;

    const hasLibrary = await ensureLibraryPermission();
    if (!hasLibrary) return;

    const currentPhotoCount = formData.photos.length;
    const remainingSlots = mediaService.getFileSizeLimits().maxPhotos - currentPhotoCount;

    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `Maximum ${mediaService.getFileSizeLimits().maxPhotos} photos allowed`);
      return;
    }

    Alert.alert(
      'Add Photos',
      `Add up to ${remainingSlots} more photos`,
      [
        { text: 'Camera', onPress: async () => { if (await ensureCameraPermission()) { takePicture(); } } },
        { text: 'Photo Library', onPress: () => pickFromLibrary('photo') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickVideo = async () => {
    const hasLibrary = await ensureLibraryPermission();
    if (!hasLibrary) return;

    if (formData.videos.length >= 1) {
      Alert.alert('Limit Reached', 'Maximum 1 video allowed');
      return;
    }

    Alert.alert(
      'Select Video',
      'Choose how you want to add a video',
      [
        { text: 'Record Video', onPress: async () => { if (await ensureCameraPermission()) { recordVideo(); } } },
        { text: 'Video Library', onPress: () => pickFromLibrary('video') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePicture = async () => {
    setMediaLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addMediaFile(result.assets[0], 'photo');
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const recordVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 180, // 3 minutes
      // quality is a number between 0 and 1 in expo-image-picker
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      addMediaFile(result.assets[0], 'video');
    }
  };

  const pickFromLibrary = async (type: 'photo' | 'video') => {
    setMediaLoading(true);
    try {
      const mediaTypeOptions = type === 'photo'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeOptions,
        allowsMultipleSelection: type === 'photo',
        allowsEditing: type === 'video',
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 180, // 3 minutes
      });

      if (!result.canceled) {
        // Respect remaining photo slots when adding multiple
        const limits = mediaService.getFileSizeLimits();
        const currentCount = type === 'photo' ? formData.photos.length : formData.videos.length;
        const maxCount = type === 'photo' ? limits.maxPhotos : 1;
        const remaining = Math.max(0, maxCount - currentCount);
        const assetsToAdd = type === 'photo' ? result.assets.slice(0, remaining) : result.assets.slice(0, 1);

        assetsToAdd.forEach(asset => {
          addMediaFile(asset, type);
        });
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const addMediaFile = (asset: ImagePicker.ImagePickerAsset, type: 'photo' | 'video') => {
    const fileName = asset.fileName || `${type}_${Date.now()}.${asset.uri.split('.').pop()}`;

    const newMediaFile: FormMediaFile = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      uri: asset.uri,
      fileName,
      size: asset.fileSize || 0,
      duration: asset.duration ?? undefined,
      width: asset.width,
      height: asset.height,
    };

    // Validate file size
    const limits = mediaService.getFileSizeLimits();
    const maxSize = type === 'photo' ? limits.maxPhotoSize : limits.maxVideoSize;
    if (newMediaFile.size > maxSize) {
      Alert.alert(
        'File Too Large',
        `${type === 'photo' ? 'Photo' : 'Video'} exceeds ${mediaService.formatFileSize(maxSize)} limit`
      );
      return;
    }

    // Validate video duration
    if (type === 'video' && newMediaFile.duration && newMediaFile.duration > limits.maxVideoDuration) {
      Alert.alert(
        'Video Too Long',
        `Video exceeds ${mediaService.formatDuration(limits.maxVideoDuration)} limit`
      );
      return;
    }

    // Functional state update to avoid stale closures when adding multiple files
    setFormData(prev => {
      if (type === 'photo') {
        const nextPhotos = [...prev.photos, newMediaFile];
        const nextCover = prev.selectedCoverImageId || (prev.photos.length === 0 ? newMediaFile.id : prev.selectedCoverImageId);
        return { ...prev, photos: nextPhotos, selectedCoverImageId: nextCover };
      } else {
        const nextVideos = [...prev.videos, newMediaFile];
        return { ...prev, videos: nextVideos };
      }
    });
  };

  const removeMediaFile = (fileId: string, type: 'photo' | 'video') => {
    if (type === 'photo') {
      const newPhotos = formData.photos.filter(photo => photo.id !== fileId);
      updateFormData('photos', newPhotos);
      
      // Update cover image if removed photo was the cover
      if (formData.selectedCoverImageId === fileId) {
        updateFormData('selectedCoverImageId', newPhotos.length > 0 ? newPhotos[0].id : undefined);
      }
    } else {
      updateFormData('videos', formData.videos.filter(video => video.id !== fileId));
    }
  };

  const selectCoverImage = (photoId: string) => {
    updateFormData('selectedCoverImageId', photoId);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (getCharCountWithoutSpaces(formData.title) > 200) {
      Alert.alert('Error', 'Title must be less than 200 characters (excluding spaces)');
      return;
    }

    // Validate primary URL only if provided
    if (formData.primaryUrl && formData.primaryUrl.trim() && !isValidUrl(formData.primaryUrl)) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    

    if (!formData.summary.trim()) {
      Alert.alert('Error', 'Please enter a summary');
      return;
    }

    const summaryCharCount = getCharCountWithoutSpaces(formData.summary);

    if (summaryCharCount < 50) {
      Alert.alert('Error', 'Summary must be at least 50 characters long (excluding spaces)');
      return;
    }

    if (summaryCharCount > 2500) {
      Alert.alert('Error', 'Summary must be less than 2500 characters (excluding spaces)');
      return;
    }

    // Validate media files
    const allMedia = [...formData.photos, ...formData.videos];
    if (allMedia.length > 0) {
      const validation = mediaService.validateMediaFiles(formData.photos, formData.videos);
      if (!validation.isValid) {
        Alert.alert('Media Validation Error', validation.errors.join('\n'));
        return;
      }
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
              🔗 Primary News URL (Optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/article (optional)"
              value={formData.primaryUrl}
              onChangeText={(text) => {
                updateFormData('primaryUrl', text);
                setUrlError('');
                if (text.trim()) {
                  if (isValidUrl(text.trim())) {
                    analyzeUrl(text.trim());
                  } else {
                    setUrlAnalysis(null);
                    setUrlError('Please enter a valid URL (e.g., https://example.com)');
                  }
                } else {
                  setUrlAnalysis(null);
                }
              }}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {/* URL Analysis or Error */}
            {urlError ? (
              <View style={styles.urlError}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.urlErrorText}>{urlError}</Text>
              </View>
            ) : urlAnalysis && (
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
              Enter the main source URL for this news story (optional - you can submit news without external sources)
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
              maxLength={300}
            />
            <Text style={[
              styles.charCount,
              getCharCountWithoutSpaces(formData.title) > 180 && styles.charCountWarning,
              getCharCountWithoutSpaces(formData.title) > 195 && styles.charCountDanger
            ]}>
              {getCharCountWithoutSpaces(formData.title)}/200 characters
              {getCharCountWithoutSpaces(formData.title) > 180 && ' ⚠️'}
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
              placeholder="Write a clear, objective summary of the news article... (50-2500 characters, spaces not counted)"
              value={formData.summary}
              onChangeText={(text) => updateFormData('summary', text)}
              multiline
              numberOfLines={6}
              maxLength={4000}
              textAlignVertical="top"
            />
            <View style={styles.charCountContainer}>
              <Text style={[
                styles.charCount,
                getCharCountWithoutSpaces(formData.summary) < 50 && styles.charCountWarning,
                getCharCountWithoutSpaces(formData.summary) > 2400 && styles.charCountWarning,
                getCharCountWithoutSpaces(formData.summary) > 2450 && styles.charCountDanger
              ]}>
                {getCharCountWithoutSpaces(formData.summary)}/2500 characters
                {getCharCountWithoutSpaces(formData.summary) < 50 && ' (minimum 50)'}
                {getCharCountWithoutSpaces(formData.summary) > 2400 && ' ⚠️'}
              </Text>
              {getCharCountWithoutSpaces(formData.summary) >= 50 && (
                <Text style={styles.charCountSuccess}>✓</Text>
              )}
            </View>
          </View>
          
          {/* Media Upload Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              📷 Photos & Videos (Optional)
            </Text>
            <Text style={styles.hint}>
              Enhance your story with visuals • Up to 8 photos and 1 video (max 3 min)
            </Text>
            
            {/* Media Upload Buttons */}
            <View style={styles.mediaButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.mediaButton,
                  (formData.photos.length >= mediaService.getFileSizeLimits().maxPhotos || mediaLoading) && styles.mediaButtonDisabled
                ]}
                onPress={pickPhotos}
                disabled={formData.photos.length >= mediaService.getFileSizeLimits().maxPhotos || mediaLoading}
              >
                {mediaLoading ? (
                  <ActivityIndicator size="small" color="#1DA1F2" />
                ) : (
                  <Ionicons name="camera" size={20} color="#1DA1F2" />
                )}
                <Text style={styles.mediaButtonText}>
                  {mediaLoading ? 'Adding...' : `Add Photos (${formData.photos.length}/8)`}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.mediaButton,
                  (formData.videos.length >= 1 || mediaLoading) && styles.mediaButtonDisabled
                ]}
                onPress={pickVideo}
                disabled={formData.videos.length >= 1 || mediaLoading}
              >
                {mediaLoading ? (
                  <ActivityIndicator size="small" color="#1DA1F2" />
                ) : (
                  <Ionicons name="videocam" size={20} color="#1DA1F2" />
                )}
                <Text style={styles.mediaButtonText}>
                  {mediaLoading ? 'Adding...' : `Add Video (${formData.videos.length}/1)`}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Photo Preview Grid */}
            {formData.photos.length > 0 && (
              <View style={styles.mediaPreviewSection}>
                <Text style={styles.mediaPreviewTitle}>Photos</Text>
                <View style={styles.photoGrid}>
                  {formData.photos.map((photo) => (
                    <View key={photo.id} style={styles.photoPreviewContainer}>
                      <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                      
                      {/* Cover Image Selector */}
                      <TouchableOpacity 
                        style={[
                          styles.coverImageButton,
                          formData.selectedCoverImageId === photo.id && styles.coverImageButtonSelected
                        ]}
                        onPress={() => selectCoverImage(photo.id)}
                      >
                        <Ionicons 
                          name={formData.selectedCoverImageId === photo.id ? "star" : "star-outline"} 
                          size={16} 
                          color={formData.selectedCoverImageId === photo.id ? "#FFD700" : "#fff"} 
                        />
                      </TouchableOpacity>
                      
                      {/* Remove Button */}
                      <TouchableOpacity 
                        style={styles.removeMediaButton}
                        onPress={() => removeMediaFile(photo.id, 'photo')}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF4444" />
                      </TouchableOpacity>
                      
                      {/* File Info */}
                      <View style={styles.mediaFileInfo}>
                        <Text style={styles.mediaFileName} numberOfLines={1}>
                          {photo.fileName}
                        </Text>
                        <Text style={styles.mediaFileSize}>
                          {mediaService.formatFileSize(photo.size)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                
                {formData.selectedCoverImageId && (
                  <View style={styles.coverImageHintContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.coverImageHint}>
                      This photo will be used as the cover image
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Video Preview */}
            {formData.videos.length > 0 && (
              <View style={styles.mediaPreviewSection}>
                <Text style={styles.mediaPreviewTitle}>Video</Text>
                {formData.videos.map((video) => (
                  <View key={video.id} style={styles.videoPreviewContainer}>
                    <Video
                      source={{ uri: video.uri }}
                      style={styles.videoPreview}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                    
                    {/* Remove Button */}
                    <TouchableOpacity 
                      style={styles.removeMediaButton}
                      onPress={() => removeMediaFile(video.id, 'video')}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF4444" />
                    </TouchableOpacity>
                    
                    {/* Video Info */}
                    <View style={styles.mediaFileInfo}>
                      <Text style={styles.mediaFileName} numberOfLines={1}>
                        {video.fileName}
                      </Text>
                      <View style={styles.videoInfoRow}>
                        <Text style={styles.mediaFileSize}>
                          {mediaService.formatFileSize(video.size)}
                        </Text>
                        {video.duration && (
                          <Text style={styles.videoDuration}>
                            {mediaService.formatDuration(video.duration)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
                Share from credible, verifiable news sources (optional but recommended)
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
    minHeight: 120,
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
  charCountDanger: {
    color: '#EF4444',
    fontWeight: '600',
  },
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  charCountSuccess: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
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

  // URL Error styles
  urlError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    gap: 6,
  },
  urlErrorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
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
  
  // Media upload styles
  mediaButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#1DA1F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  mediaButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#DDD',
    opacity: 0.6,
  },
  mediaButtonText: {
    fontSize: 14,
    color: '#1DA1F2',
    fontWeight: '600',
  },
  
  // Media preview styles
  mediaPreviewSection: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  
  // Photo grid styles
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoPreviewContainer: {
    width: (screenWidth - 72) / 3, // 3 columns with gaps
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  
  // Cover image selector
  coverImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  coverImageButtonSelected: {
    backgroundColor: 'rgba(255,215,0,0.8)',
  },
  
  // Remove button
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
  },
  
  // Media file info
  mediaFileInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 4,
  },
  mediaFileName: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  mediaFileSize: {
    fontSize: 9,
    color: '#ccc',
  },
  
  // Video preview styles
  videoPreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDuration: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: '600',
  },
  
  // Cover image hint
  coverImageHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  coverImageHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default SubmitNewsScreen;
