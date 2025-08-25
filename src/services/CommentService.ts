import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Firestore
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Comment, CommentSubmission } from '../types/news';

class CommentService {
  private static instance: CommentService;
  private db: Firestore;
  private commentsCollection;
  private newsCollection;

  private constructor() {
    this.db = db;
    this.commentsCollection = collection(this.db, 'comments');
    this.newsCollection = collection(this.db, 'news');
  }

  static getInstance(): CommentService {
    if (!CommentService.instance) {
      CommentService.instance = new CommentService();
    }
    return CommentService.instance;
  }

  // Submit a new comment
  async submitComment(submission: CommentSubmission, userId: string, userName: string, userAvatar?: string): Promise<string> {
    try {
      console.log('💬 Submitting comment:', submission);

      const newComment = {
        newsStoryId: submission.newsStoryId,
        userId,
        userName,
        userAvatar: userAvatar || '',
        content: submission.content,
        
        // Engagement
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        
        // Moderation
        isReported: false,
        reportCount: 0,
        isHidden: false,
        
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false,
        
        // Threading
        parentCommentId: submission.parentCommentId || null,
        replies: [],
        replyCount: 0,
      };

      // Add comment to Firestore
      const docRef = await addDoc(this.commentsCollection, newComment);

      // Update news story comment count
      const newsRef = doc(this.newsCollection, submission.newsStoryId);
      await updateDoc(newsRef, {
        commentCount: increment(1)
      });

      // If it's a reply, update parent comment's reply count
      if (submission.parentCommentId) {
        const parentRef = doc(this.commentsCollection, submission.parentCommentId);
        await updateDoc(parentRef, {
          replyCount: increment(1)
        });
      }

      console.log('✅ Comment submitted successfully:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ Error submitting comment:', error);
      throw error;
    }
  }

  // Get comments for a news story
  async getComments(newsStoryId: string, limitCount = 50): Promise<Comment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('newsStoryId', '==', newsStoryId),
        where('parentCommentId', '==', null), // Only top-level comments
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const comments: Comment[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Get replies for this comment
        const replies = await this.getReplies(docSnap.id);

        comments.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          replies,
        } as Comment);
      }

      return comments;

    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return [];
    }
  }

  // Get replies for a comment
  async getReplies(parentCommentId: string): Promise<Comment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('parentCommentId', '==', parentCommentId),
        orderBy('createdAt', 'asc'),
        limit(10) // Limit replies per comment
      );

      const snapshot = await getDocs(q);
      const replies: Comment[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        replies.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          replies: [], // No nested replies for now
        } as Comment);
      });

      return replies;

    } catch (error) {
      console.error('❌ Error getting replies:', error);
      return [];
    }
  }

  // Like a comment
  async likeComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(this.commentsCollection, commentId);
      
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
        dislikedBy: arrayRemove(userId), // Remove from dislikes if exists
        updatedAt: serverTimestamp()
      });

      console.log('👍 Comment liked successfully');

    } catch (error) {
      console.error('❌ Error liking comment:', error);
      throw error;
    }
  }

  // Dislike a comment
  async dislikeComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(this.commentsCollection, commentId);
      
      await updateDoc(commentRef, {
        dislikes: increment(1),
        dislikedBy: arrayUnion(userId),
        likedBy: arrayRemove(userId), // Remove from likes if exists
        updatedAt: serverTimestamp()
      });

      console.log('👎 Comment disliked successfully');

    } catch (error) {
      console.error('❌ Error disliking comment:', error);
      throw error;
    }
  }

  // Remove like/dislike
  async removeLikeDislike(commentId: string, userId: string, type: 'like' | 'dislike'): Promise<void> {
    try {
      const commentRef = doc(this.commentsCollection, commentId);
      
      if (type === 'like') {
        await updateDoc(commentRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(commentRef, {
          dislikes: increment(-1),
          dislikedBy: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
      }

      console.log(`🔄 ${type} removed successfully`);

    } catch (error) {
      console.error(`❌ Error removing ${type}:`, error);
      throw error;
    }
  }

  // Report a comment
  async reportComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(this.commentsCollection, commentId);
      
      await updateDoc(commentRef, {
        isReported: true,
        reportCount: increment(1),
        updatedAt: serverTimestamp()
      });

      console.log('🚨 Comment reported successfully');

    } catch (error) {
      console.error('❌ Error reporting comment:', error);
      throw error;
    }
  }

  // Edit a comment (only by original author)
  async editComment(commentId: string, newContent: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(this.commentsCollection, commentId);
      
      await updateDoc(commentRef, {
        content: newContent,
        isEdited: true,
        updatedAt: serverTimestamp()
      });

      console.log('✏️ Comment edited successfully');

    } catch (error) {
      console.error('❌ Error editing comment:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const commentService = CommentService.getInstance();