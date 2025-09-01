import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CommentSubmission } from '../types/news';
import { commentService } from '../services/CommentService';
import { useAuth } from '../context/AuthContext';

interface Props {
  newsStoryId: string;
  initialCommentCount?: number;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  currentUserId: string;
  level?: number; // For nested comment styling
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onReply, 
  onLike, 
  onDislike, 
  currentUserId, 
  level = 0 
}) => {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const isLikedByUser = comment.likedBy.includes(currentUserId);
  const isDislikedByUser = comment.dislikedBy.includes(currentUserId);

  return (
    <View style={[styles.commentItem, { marginLeft: level * 20 }]}>
      {/* Comment Header */}
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
          <Text style={styles.userName}>{comment.userName}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
          {comment.isEdited && (
            <Text style={styles.editedLabel}>(edited)</Text>
          )}
        </View>
      </View>

      {/* Comment Content */}
      <Text style={styles.commentContent}>{comment.content}</Text>

      {/* Comment Actions */}
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={[styles.actionButton, isLikedByUser && styles.actionButtonActive]}
          onPress={() => onLike(comment.id)}
        >
          <Ionicons 
            name={isLikedByUser ? "thumbs-up" : "thumbs-up-outline"} 
            size={14} 
            color={isLikedByUser ? "#1DA1F2" : "#666"} 
          />
          <Text style={[styles.actionText, isLikedByUser && styles.actionTextActive]}>
            {comment.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isDislikedByUser && styles.actionButtonActive]}
          onPress={() => onDislike(comment.id)}
        >
          <Ionicons 
            name={isDislikedByUser ? "thumbs-down" : "thumbs-down-outline"} 
            size={14} 
            color={isDislikedByUser ? "#EF4444" : "#666"} 
          />
          <Text style={[styles.actionText, isDislikedByUser && styles.actionTextActive]}>
            {comment.dislikes}
          </Text>
        </TouchableOpacity>

        {level < 2 && ( // Limit nesting to 2 levels
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply(comment.id)}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#666" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="flag-outline" size={14} color="#666" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
              currentUserId={currentUserId}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CommentSection: React.FC<Props> = ({ newsStoryId, initialCommentCount = 0 }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  useEffect(() => {
    loadComments();
  }, [newsStoryId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await commentService.getComments(newsStoryId);
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user) return;

    try {
      setSubmitting(true);
      
      const submission: CommentSubmission = {
        newsStoryId,
        content: commentText.trim(),
        parentCommentId: replyingTo || undefined,
      };

      await commentService.submitComment(
        submission,
        user.uid,
        user.displayName || user.email || 'Anonymous',
        user.photoURL || undefined
      );

      setCommentText('');
      setReplyingTo(null);
      setCommentCount(prev => prev + 1);
      
      // Reload comments to show the new one
      loadComments();

    } catch (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Optionally scroll to comment input or show reply input inline
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;
    
    try {
      await commentService.likeComment(commentId, user.uid);
      loadComments(); // Refresh to show updated counts
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!user) return;
    
    try {
      await commentService.dislikeComment(commentId, user.uid);
      loadComments(); // Refresh to show updated counts
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles-outline" size={20} color="#1DA1F2" />
          <Text style={styles.headerTitle}>Discussions ({commentCount})</Text>
        </View>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Please log in to view and post comments</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={20} color="#1DA1F2" />
        <Text style={styles.headerTitle}>Comments ({commentCount})</Text>
      </View>

      {/* Comment Input */}
      <View style={styles.commentInput}>
        {replyingTo && (
          <View style={styles.replyingBanner}>
            <Text style={styles.replyingText}>Replying to comment</Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!commentText.trim() || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.charCount}>{commentText.length}/500</Text>
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color="#DDD" />
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share your thoughts!</Text>
        </View>
      ) : (
        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onDislike={handleDislike}
              currentUserId={user.uid}
            />
          ))}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Comment input styles
  commentInput: {
    marginBottom: 20,
  },
  replyingBanner: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 12,
    color: '#1DA1F2',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  charCount: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  
  // Comments list styles
  commentsList: {
    maxHeight: 400,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  editedLabel: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionButtonActive: {
    backgroundColor: '#F0F9FF',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  actionTextActive: {
    color: '#1DA1F2',
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 12,
  },
  
  // Empty and loading states
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default CommentSection;