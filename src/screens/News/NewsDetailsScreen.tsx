import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Share, 
  Alert, 
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '../../types/navigation';
import { NewsStory } from '../../types/news';
import { newsService } from '../../services/NewsService';
import { bookmarkService } from '../../services/BookmarkService';
import { summarizationService } from '../../services/SummarizationService';
import { biasClassificationService } from '../../services/BiasClassificationService';
import CommentSection from '../../components/CommentSection';
import CommunityVoting from '../../components/CommunityVoting';
import { useAuth } from '../../context/AuthContext';
// import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
// import AnimatedCard from '../../components/ui/AnimatedCard';

const { width: screenWidth } = Dimensions.get('window');


type Props = {
  navigation: StackNavigationProp<NewsStackParamList, 'NewsDetails'>;
  route: RouteProp<NewsStackParamList, 'NewsDetails'>;
};

const NewsDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId } = route.params;
  const { user } = useAuth();
  const [story, setStory] = useState<NewsStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isBiasLoading, setIsBiasLoading] = useState<boolean>(false);
  // const [fadeAnim] = useState(new Animated.Value(0));

  // Subscribe to story updates by ID for real-time data and to pick up cached AI summary
  useEffect(() => {
    setLoading(true);
    const unsubscribe = newsService.subscribeToNewsStory(
      newsId,
      (s) => {
        setStory(s);
        if (s?.aiSummary && !summary) {
          setSummary(s.aiSummary);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    checkBookmarkStatus();
    return unsubscribe;
  }, [newsId]);

  useEffect(() => {
    // Generar resumen solo si hay contenido y aún no hay resumen (ni local ni en Firestore)
    if (story && story.content && !summary && !story.aiSummary && !isSummaryLoading) {
      const fetchSummary = async () => {
        setIsSummaryLoading(true);
        try {
          const generatedSummary = await summarizationService.getSummary(story.content || '', story.title);
          setSummary(generatedSummary);
          // Cachear en Firestore para futuros accesos
          await newsService.setAISummary(story.id, generatedSummary);
        } catch (error) {
          console.error(error);
          setSummary("Resumen no disponible en este momento.");
        } finally {
          setIsSummaryLoading(false);
        }
      };
      fetchSummary();
    }
  }, [story, summary, isSummaryLoading]);

  const analyzeBias = async () => {
    if (!story || isBiasLoading) return;
    try {
      setIsBiasLoading(true);
      // Prefer full content; fallback to summary; else title+summary
      const text = story.content?.trim() || summary || `${story.title}. ${story.summary}`;
      const result = await biasClassificationService.classify(text);
      // Update Firestore cache and UI via subscription
      await newsService.setAIBiasResult(story.id, {
        left: result.left,
        center: result.center,
        right: result.right,
        detectedBias: result.detectedBias,
        confidence: result.confidence,
        justification: result.justification,
        aligned_elements: result.aligned_elements,
        provider: result.provider,
      });
    } catch (e) {
      console.error('Bias analysis error:', e);
      Alert.alert('Bias Analysis', 'No se pudo calcular el sesgo en este momento.');
    } finally {
      setIsBiasLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user) return;
    
    try {
      const bookmarked = await bookmarkService.isBookmarked(user.uid, newsId);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  // loadStory ya no se usa; migrado a suscripción en tiempo real

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

  const handleShare = async () => {
    if (!story) return;
    try {
      await Share.share({
        message: `${story.title}\n\n${story.summary}\n\nRead more on NewsApp`,
        title: story.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user || !story || bookmarkLoading) return;

    setBookmarkLoading(true);
    
    try {
      if (isBookmarked) {
        // Find existing bookmark and remove it
        const bookmarks = await bookmarkService.getBookmarksForUser(user.uid);
        const existingBookmark = bookmarks.find(b => b.newsStoryId === story.id);
        
        if (existingBookmark) {
          await bookmarkService.removeBookmark(user.uid, existingBookmark.id);
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        await bookmarkService.addBookmark(user.uid, story, {
          tags: story.tags || [],
          priority: story.isBreaking ? 'urgent' : story.isTrending ? 'high' : 'normal'
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    } finally {
      setBookmarkLoading(false);
    }
  };


  const getReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = text.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };


  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      // Use a shorter title or generic title for header to avoid overlap
      title: loading ? 'Loading...' : (story ? 'News Details' : 'News Details'),
      headerRight: () => (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          paddingRight: 16,
          gap: 8
        }}>
          <TouchableOpacity
            onPress={handleBookmark}
            disabled={bookmarkLoading}
            style={{ 
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 20,
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              opacity: bookmarkLoading ? 0.5 : 1 
            }}
            activeOpacity={0.7}
          >
            {bookmarkLoading ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color="#374151" 
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={{ 
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 20,
              backgroundColor: 'rgba(107, 114, 128, 0.1)'
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      ),
      // Use custom header title component for multiline support
      headerTitle: () => (
        <View style={{
          flex: 1,
          paddingRight: 100, // Space for buttons
          paddingLeft: 16,
          justifyContent: 'center'
        }}>
          <Text 
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              lineHeight: 20,
              textAlign: 'left'
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {loading ? 'Loading...' : (story?.title || 'News Details')}
          </Text>
        </View>
      ),
    });
  }, [navigation, loading, story?.title, isBookmarked, bookmarkLoading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F2937" />
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Story not found</Text>
          <Text style={styles.errorSubtitle}>The news story you're looking for doesn't exist.</Text>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.container}>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Story Metadata */}
        <Card style={styles.metaCard} padding="medium" shadow={true}>
          <View style={styles.badgesRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.category}>{story.category.toUpperCase()}</Text>
            </View>
            
            {story.isBreaking && (
              <View style={styles.breakingBadge}>
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={styles.breakingText}>BREAKING</Text>
              </View>
            )}
            
            {story.isTrending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={12} color="#fff" />
                <Text style={styles.trendingText}>TRENDING</Text>
              </View>
            )}
            
            {story.sourceReputation === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{formatTimeAgo(story.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="reader-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {getReadingTime(story.summary + (story.content || ''))} min read
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{story.viewCount} views</Text>
            </View>
          </View>
        </Card>

        {/* Main Content */}
        <Card style={styles.contentCard} padding="large" shadow={true}>
          <Text style={styles.title}>{story.title}</Text>
          <Text style={styles.summary}>{story.summary}</Text>
          
          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {story.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
        </Card>

        {/* AI Summary Card */}
        {(isSummaryLoading || summary) && (
          <Card style={styles.aiCard} padding="medium" shadow={true}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color="#8B5CF6" />
              <Text style={styles.aiLabel}>AI Summary</Text>
            </View>
            {isSummaryLoading ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Text style={styles.aiSummary}>{summary}</Text>
            )}
          </Card>
        )}
        
        {/* Media Gallery */}
        {story.media && (story.media.photos.length > 0 || story.media.videos.length > 0) && (
          <Card style={styles.mediaCard} padding="medium" shadow={true}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Media</Text>
              <View style={styles.mediaCountBadge}>
                <Text style={styles.mediaCountText}>
                  {story.media.totalMediaCount}
                </Text>
              </View>
            </View>
            
            {/* Photos Grid */}
            {story.media.photos.length > 0 && (
              <View style={styles.photosSection}>
                <Text style={styles.mediaSubtitle}>Photos</Text>
                <View style={styles.photosGrid}>
                  {story.media.photos.map((photo, index) => (
                    <TouchableOpacity 
                      key={photo.id} 
                      style={styles.photoContainer}
                      onPress={() => {
                        // Could implement photo viewer modal here
                        console.log('Photo pressed:', photo.url);
                      }}
                    >
                      <Image 
                        source={{ uri: photo.url }} 
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />
                      {/* Photo index */}
                      <View style={styles.photoIndex}>
                        <Text style={styles.photoIndexText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Videos */}
            {story.media.videos.length > 0 && (
              <View style={styles.videosSection}>
                <Text style={styles.mediaSubtitle}>Videos</Text>
                {story.media.videos.map((video) => (
                  <View key={video.id} style={styles.videoContainer}>
                    <Video
                      source={{ uri: video.url }}
                      style={styles.videoPlayer}
                      useNativeControls
                      resizeMode="contain"
                      shouldPlay={false}
                    />
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={1}>
                        {video.fileName}
                      </Text>
                      <View style={styles.videoMeta}>
                        {video.duration && (
                          <View style={styles.videoMetaItem}>
                            <Ionicons name="time-outline" size={12} color="#6B7280" />
                            <Text style={styles.videoMetaText}>
                              {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                            </Text>
                          </View>
                        )}
                        <View style={styles.videoMetaItem}>
                          <Ionicons name="download-outline" size={12} color="#6B7280" />
                          <Text style={styles.videoMetaText}>
                            {formatFileSize(video.size)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* AI Bias */}
        <Card style={styles.aiCard} padding="medium" shadow={true}>
          <View style={[styles.aiHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="analytics-outline" size={18} color="#2563EB" />
              <Text style={[styles.aiLabel, { color: '#2563EB' }]}>AI Bias</Text>
            </View>
            <TouchableOpacity
              onPress={analyzeBias}
              disabled={isBiasLoading}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: isBiasLoading ? '#BFDBFE' : '#3B82F6',
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                opacity: isBiasLoading ? 0.7 : 1,
              }}
              activeOpacity={0.8}
            >
              {isBiasLoading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
              )}
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {story.aiBiasGeneratedAt ? 'Recalculate' : 'Analyze Bias'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* When loading, show a clear calculating state and hide previous placeholder */}
          {isBiasLoading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.aiSummary}>Calculating bias…</Text>
            </View>
          )}

          {/* After analysis is saved (has timestamp), show detected and bars */}
          {!isBiasLoading && story.aiBiasGeneratedAt && (
            <>
              {/* Analysis Header with Provider Info */}
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  {story.aiDetectedBias && (
                    <>
                      <Text style={[styles.aiSummary, { fontWeight: '600', color: '#374151' }]}>
                        Detected: {story.aiDetectedBias.toUpperCase()}
                        {story.biasScore && ` (${
                          story.aiDetectedBias === 'left' ? story.biasScore.left :
                          story.aiDetectedBias === 'center' ? story.biasScore.center :
                          story.aiDetectedBias === 'right' ? story.biasScore.right : 0
                        }%)`}
                      </Text>
                      {typeof story.aiBiasConfidence === 'number' && (
                        <Text style={[styles.aiSummary, { fontSize: 11, color: '#6B7280', marginTop: 2 }]}>
                          Confidence: {Math.round((story.aiBiasConfidence || 0) * 100)}%
                        </Text>
                      )}
                    </>
                  )}
                </View>
                {story.aiBiasProvider && (
                  <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      {story.aiBiasProvider}
                    </Text>
                  </View>
                )}
              </View>

              {/* Enhanced Justification */}
              {story.aiBiasJustification && (
                <View style={{ marginTop: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#2563EB' }}>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' }}>
                    {story.aiBiasJustification}
                  </Text>
                </View>
              )}

              {/* Aligned Elements Tags */}
              {story.aiBiasAlignedElements && story.aiBiasAlignedElements.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                    Detected Elements:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {story.aiBiasAlignedElements.map((element, index) => (
                      <View key={index} style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '500' }}>
                          {element}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Bias Distribution Bars */}
              {(story.biasScore) && (
                <View style={{ marginTop: 16, gap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 }}>
                    Bias Distribution:
                  </Text>
                  {([
                    { label: 'Left', color: '#EF4444', value: story.biasScore.left },
                    { label: 'Center', color: '#6B7280', value: story.biasScore.center },
                    { label: 'Right', color: '#3B82F6', value: story.biasScore.right },
                  ] as const).map((b) => (
                    <View key={b.label}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13 }}>{b.label}</Text>
                        <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13 }}>{b.value}%</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.max(0, Math.min(100, b.value))}%`, height: '100%', backgroundColor: b.color }} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* If never analyzed and not loading, show a friendly hint instead of placeholder bars */}
          {!isBiasLoading && !story.aiBiasGeneratedAt && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.aiSummary}>No bias calculated yet. Tap “Analyze Bias”.</Text>
            </View>
          )}
        </Card>
        
        {/* Sources */}
        <Card style={styles.sourcesCard} padding="medium" shadow={true}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sources</Text>
            <View style={styles.sourcesBadge}>
              <Text style={styles.sourcesBadgeText}>{story.totalSources}</Text>
            </View>
          </View>
          {story.sources.map((source) => (
            <View key={source.id} style={styles.sourceItem}>
              <View style={styles.sourceIcon}>
                <Ionicons name="link" size={16} color="#6B7280" />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceUrl} numberOfLines={1}>{source.url}</Text>
              </View>
            </View>
          ))}
        </Card>
        
        {/* Community Voting Section */}
        <CommunityVoting 
          newsStoryId={story.id}
        />
        
        {/* Discussions Section */}
        <CommentSection 
          newsStoryId={story.id} 
          initialCommentCount={story.commentCount}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Metadata Card
  metaCard: {
    margin: 16,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  trendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  breakingBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  breakingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  // Content Card
  contentCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  summary: {
    fontSize: 16,
    lineHeight: 26,
    color: '#4B5563',
    fontWeight: '400',
  },
  // AI Card
  aiCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  aiLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  aiSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Sources Card
  sourcesCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  sourcesBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sourcesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sourceIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },

  // Media Gallery styles
  mediaCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  mediaCountBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  mediaCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  mediaSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  // Photos styles
  photosSection: {
    marginBottom: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    width: (screenWidth - 80) / 3, // 3 columns with gaps and margins
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoIndex: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoIndexText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Videos styles
  videosSection: {
    marginTop: 12,
  },
  videoContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: 200,
  },
  videoInfo: {
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  videoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
});


export default NewsDetailsScreen;
