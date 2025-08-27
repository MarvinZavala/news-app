import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '../../types/navigation';
import { commentService } from '../../services/CommentService';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';
import ActionButton from '../../components/ui/ActionButton';
import AnimatedCard from '../../components/ui/AnimatedCard';

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    id: string;
  };
  createdAt: Date;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
  replies: Comment[];
  replyCount: number;
}

type Props = {
  navigation: StackNavigationProp<NewsStackParamList, 'NewsComments'>;
  route: RouteProp<NewsStackParamList, 'NewsComments'>;
};

const NewsCommentsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId, title } = route.params;
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [newsId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentService.getCommentsForStory(newsId, user?.uid);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);
      await commentService.addComment({
        newsStoryId: newsId,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
      });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteComment = async (commentId: string, voteType: 'like' | 'dislike') => {
    if (!user) return;

    try {
      await commentService.voteComment(commentId, user.uid, voteType);
      await loadComments();
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const renderComment = React.memo(({ item: comment, index }: { item: Comment; index: number }) => (
    <AnimatedCard style={styles.commentCard} padding="medium" delay={index * 100}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthor}>
          <View style={styles.authorAvatar}>
            <Ionicons name="person" size={16} color="#6B7280" />
          </View>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>
      </View>
      
      <Text style={styles.commentContent}>{comment.content}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleVoteComment(comment.id, 'like')}
        >
          <Ionicons 
            name={comment.userVote === 'like' ? 'heart' : 'heart-outline'} 
            size={16} 
            color={comment.userVote === 'like' ? '#EF4444' : '#6B7280'} 
          />
          <Text style={styles.actionText}>{comment.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleVoteComment(comment.id, 'dislike')}
        >
          <Ionicons 
            name={comment.userVote === 'dislike' ? 'heart-dislike' : 'heart-dislike-outline'} 
            size={16} 
            color={comment.userVote === 'dislike' ? '#6366F1' : '#6B7280'} 
          />
          <Text style={styles.actionText}>{comment.dislikes}</Text>
        </TouchableOpacity>
        
        {user && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {replyingTo === comment.id && user && (
        <View style={styles.replyBox}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <View style={styles.replyActions}>
            <ActionButton
              text="Cancel"
              onPress={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
              variant="ghost"
              size="small"
            />
            <ActionButton
              text="Reply"
              onPress={async () => {
                if (!replyText.trim()) return;
                // Handle reply submission
                setReplyingTo(null);
                setReplyText('');
              }}
              variant="primary"
              size="small"
              disabled={!replyText.trim()}
            />
          </View>
        </View>
      )}
    </AnimatedCard>
  ));

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Comments" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F2937" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Comments" onBackPress={() => navigation.goBack()} />
      
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        style={styles.commentsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No comments yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to share your thoughts</Text>
          </View>
        }
      />
      
      {user && (
        <AnimatedCard style={styles.commentInputCard} padding="medium" delay={200}>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your thoughts..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={1000}
          />
          <View style={styles.inputActions}>
            <Text style={styles.charCount}>{newComment.length}/1000</Text>
            <ActionButton
              text="Comment"
              onPress={handleSubmitComment}
              loading={submitting}
              disabled={!newComment.trim() || submitting}
              variant="primary"
              size="small"
            />
          </View>
        </AnimatedCard>
      )}
      
      {!user && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Sign in to join the discussion</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentCard: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  replyBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  commentInputCard: {
    margin: 16,
    marginTop: 0,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loginPrompt: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default NewsCommentsScreen;