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
  { key: 'normal', label: 'Regular News', color: '#64748B', icon: 'newspaper-outline' },
  { key: 'developing', label: 'Developing Story', color: '#F59E0B', icon: 'time-outline' },
  { key: 'breaking', label: 'Breaking News', color: '#EF4444', icon: 'alert-circle-outline' },
];

const BIAS_OPTIONS = [
  { key: 'left', label: 'Left Leaning', color: '#EF4444', icon: 'chevron-back-circle-outline' },
  { key: 'center', label: 'Center/Neutral', color: '#6B7280', icon: 'ellipse-outline' },
  { key: 'right', label: 'Right Leaning', color: '#3B82F6', icon: 'chevron-forward-circle-outline' },
];

const SOURCE_REPUTATION = [
  { key: 'verified', label: 'Verified Source', description: 'Well-known, credible news outlet', icon: 'checkmark-circle' },
  { key: 'questionable', label: 'Questionable Source', description: 'Known for bias or misinformation', icon: 'warning' },
  { key: 'unknown', label: 'Unknown Source', description: 'Not in our database', icon: 'help-circle' },
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
            <View style={styles.labelContainer}>
              <Ionicons name="link-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>Primary News URL</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
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
                <View style={styles.reputationBadge}>
                  <Ionicons
                    name={
                      urlAnalysis.reputation === 'verified' ? 'checkmark-circle' :
                      urlAnalysis.reputation === 'questionable' ? 'warning' : 'help-circle'
                    }
                    size={14}
                    color={
                      urlAnalysis.reputation === 'verified' ? '#059669' :
                      urlAnalysis.reputation === 'questionable' ? '#D97706' : '#6B7280'
                    }
                  />
                  <Text style={[
                    styles.reputationText,
                    { color:
                      urlAnalysis.reputation === 'verified' ? '#059669' :
                      urlAnalysis.reputation === 'questionable' ? '#D97706' : '#6B7280'
                    }
                  ]}>
                    {urlAnalysis.reputation === 'verified' && 'Verified Source'}
                    {urlAnalysis.reputation === 'questionable' && 'Questionable Source'}
                    {urlAnalysis.reputation === 'unknown' && 'Unknown Source'}
                  </Text>
                </View>
              </View>
            )}
            
            <Text style={styles.hint}>
              Enter the main source URL for this news story (optional - you can submit news without external sources)
            </Text>
          </View>

          {/* Title Field */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="text-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>Title</Text>
              <Text style={styles.required}>*</Text>
            </View>
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
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="grid-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>Category</Text>
              <Text style={styles.required}>*</Text>
            </View>
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
            <View style={styles.labelContainer}>
              <Ionicons name="document-text-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>Summary</Text>
              <Text style={styles.required}>*</Text>
            </View>
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
              </Text>
              {getCharCountWithoutSpaces(formData.summary) >= 50 && (
                <Text style={styles.charCountSuccess}>✓</Text>
              )}
            </View>
          </View>
          
          {/* Media Upload Section */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="images-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>Photos & Videos</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
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
            <View style={styles.labelContainer}>
              <Ionicons name="speedometer-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>News Urgency</Text>
            </View>
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
                  <Ionicons
                    name={urgency.icon as any}
                    size={18}
                    color={formData.urgencyLevel === urgency.key ? '#fff' : urgency.color}
                  />
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
            <View style={styles.labelContainer}>
              <Ionicons name="analytics-outline" size={18} color="#1DA1F2" />
              <Text style={styles.label}>Bias Assessment</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
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
                  <Ionicons
                    name={bias.icon as any}
                    size={18}
                    color={formData.suggestedBias === bias.key ? '#fff' : bias.color}
                  />
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
              <View style={styles.labelContainer}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#1DA1F2" />
                <Text style={styles.label}>Credibility Rating</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
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
            <View style={styles.guidelinesTitleContainer}>
              <Ionicons name="document-outline" size={20} color="#1DA1F2" />
              <Text style={styles.guidelinesTitle}>Submission Guidelines</Text>
            </View>
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
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },

  // Header styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
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
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userName: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 6,
    fontWeight: '600',
  },
  
  // Content styles
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '500',
  },
  charCountWarning: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  charCountDanger: {
    color: '#EF4444',
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonSelected: {
    backgroundColor: '#1DA1F2',
    borderColor: '#1DA1F2',
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // URL Analysis styles
  urlAnalysis: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlDomain: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    gap: 10,
    marginTop: 8,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  urgencyText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  
  
  
  // Bias assessment styles
  biasContainer: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  biasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  biasText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 120, // Space for submit button
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  guidelinesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  guidelineText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#1DA1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Media upload styles
  mediaButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1DA1F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    opacity: 0.5,
    shadowOpacity: 0,
  },
  mediaButtonText: {
    fontSize: 13,
    color: '#1DA1F2',
    fontWeight: '700',
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
