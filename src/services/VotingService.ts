import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  Firestore,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserVote, NewsStory, BiasScore } from '../types/news';

interface VoteSubmission {
  newsStoryId: string;
  biasVote: 'left' | 'center' | 'right';
  credibilityVote: number; // 1-5
  qualityVote: number; // 1-5
}

interface VotingStats {
  totalVotes: number;
  biasDistribution: BiasScore;
  averageCredibility: number;
  averageQuality: number;
  userVote?: UserVote;
}

class VotingService {
  private static instance: VotingService;
  private db: Firestore;
  private votesCollection;
  private newsCollection;

  private constructor() {
    this.db = db;
    this.votesCollection = collection(this.db, 'votes');
    this.newsCollection = collection(this.db, 'news');
  }

  static getInstance(): VotingService {
    if (!VotingService.instance) {
      VotingService.instance = new VotingService();
    }
    return VotingService.instance;
  }

  // Submit or update a vote
  async submitVote(userId: string, userName: string, voteData: VoteSubmission): Promise<void> {
    try {
      console.log('🗳️ Submitting vote:', voteData);

      // Check if user has already voted on this story
      const existingVoteQuery = query(
        this.votesCollection,
        where('userId', '==', userId),
        where('newsStoryId', '==', voteData.newsStoryId)
      );

      const existingVoteSnapshot = await getDocs(existingVoteQuery);
      
      const batch = writeBatch(this.db);
      let isNewVote = true;

      // If user has already voted, update the existing vote
      if (!existingVoteSnapshot.empty) {
        isNewVote = false;
        const existingVoteDoc = existingVoteSnapshot.docs[0];
        const voteRef = doc(this.votesCollection, existingVoteDoc.id);
        
        batch.update(voteRef, {
          biasVote: voteData.biasVote,
          credibilityVote: voteData.credibilityVote,
          qualityVote: voteData.qualityVote,
          votedAt: serverTimestamp()
        });
      } else {
        // Create new vote
        const newVoteRef = doc(this.votesCollection);
        batch.set(newVoteRef, {
          newsStoryId: voteData.newsStoryId,
          userId,
          userName,
          biasVote: voteData.biasVote,
          credibilityVote: voteData.credibilityVote,
          qualityVote: voteData.qualityVote,
          votedAt: serverTimestamp()
        });
      }

      // Commit the batch
      await batch.commit();

      // Recalculate and update story statistics
      await this.updateStoryStatistics(voteData.newsStoryId, isNewVote);

      console.log('✅ Vote submitted successfully');

    } catch (error) {
      console.error('❌ Error submitting vote:', error);
      throw error;
    }
  }

  // Get voting statistics for a story
  async getVotingStats(newsStoryId: string, userId?: string): Promise<VotingStats> {
    try {
      // Get all votes for this story
      const votesQuery = query(
        this.votesCollection,
        where('newsStoryId', '==', newsStoryId)
      );

      const votesSnapshot = await getDocs(votesQuery);
      const votes: UserVote[] = [];
      let userVote: UserVote | undefined;

      votesSnapshot.forEach((doc) => {
        const data = doc.data();
        const vote: UserVote = {
          userId: data.userId,
          biasVote: data.biasVote,
          credibilityVote: data.credibilityVote,
          qualityVote: data.qualityVote,
          votedAt: data.votedAt?.toDate() || new Date()
        };
        
        votes.push(vote);
        
        // Check if this is the current user's vote
        if (userId && data.userId === userId) {
          userVote = vote;
        }
      });

      // Calculate statistics
      const totalVotes = votes.length;
      let averageCredibility = 0;
      let averageQuality = 0;
      
      // Bias distribution
      const leftVotes = votes.filter(v => v.biasVote === 'left').length;
      const centerVotes = votes.filter(v => v.biasVote === 'center').length;
      const rightVotes = votes.filter(v => v.biasVote === 'right').length;

      const biasDistribution: BiasScore = {
        left: totalVotes > 0 ? Math.round((leftVotes / totalVotes) * 100) : 33,
        center: totalVotes > 0 ? Math.round((centerVotes / totalVotes) * 100) : 34,
        right: totalVotes > 0 ? Math.round((rightVotes / totalVotes) * 100) : 33
      };

      // Average ratings
      if (totalVotes > 0) {
        averageCredibility = votes.reduce((sum, v) => sum + v.credibilityVote, 0) / totalVotes;
        averageQuality = votes.reduce((sum, v) => sum + v.qualityVote, 0) / totalVotes;
      }

      return {
        totalVotes,
        biasDistribution,
        averageCredibility,
        averageQuality,
        userVote
      };

    } catch (error) {
      console.error('❌ Error getting voting stats:', error);
      return {
        totalVotes: 0,
        biasDistribution: { left: 33, center: 34, right: 33 },
        averageCredibility: 0,
        averageQuality: 0
      };
    }
  }

  // Update story statistics in news collection
  private async updateStoryStatistics(newsStoryId: string, incrementVoteCount: boolean): Promise<void> {
    try {
      // Get current voting stats
      const stats = await this.getVotingStats(newsStoryId);
      
      // Update the news story document
      const newsRef = doc(this.newsCollection, newsStoryId);
      const updateData: any = {
        biasScore: stats.biasDistribution,
        averageCredibility: stats.averageCredibility,
        averageQuality: stats.averageQuality,
        totalVotes: stats.totalVotes,
        updatedAt: serverTimestamp()
      };

      // Only increment if it's a new vote (not an update)
      if (incrementVoteCount) {
        updateData.totalVotes = increment(1);
      }

      await updateDoc(newsRef, updateData);

      console.log('📊 Story statistics updated');

    } catch (error) {
      console.error('❌ Error updating story statistics:', error);
    }
  }

  // Remove a user's vote
  async removeVote(userId: string, newsStoryId: string): Promise<void> {
    try {
      // Find user's vote
      const voteQuery = query(
        this.votesCollection,
        where('userId', '==', userId),
        where('newsStoryId', '==', newsStoryId)
      );

      const voteSnapshot = await getDocs(voteQuery);
      
      if (!voteSnapshot.empty) {
        const voteDoc = voteSnapshot.docs[0];
        await deleteDoc(doc(this.votesCollection, voteDoc.id));
        
        // Update story statistics
        await this.updateStoryStatistics(newsStoryId, false);
        
        console.log('🗑️ Vote removed successfully');
      }

    } catch (error) {
      console.error('❌ Error removing vote:', error);
      throw error;
    }
  }

  // Get recent voting activity for a user
  async getUserVotingHistory(userId: string, limitCount = 10): Promise<UserVote[]> {
    try {
      const votesQuery = query(
        this.votesCollection,
        where('userId', '==', userId),
        orderBy('votedAt', 'desc'),
        limit(limitCount)
      );

      const votesSnapshot = await getDocs(votesQuery);
      const votes: UserVote[] = [];

      votesSnapshot.forEach((doc) => {
        const data = doc.data();
        votes.push({
          userId: data.userId,
          biasVote: data.biasVote,
          credibilityVote: data.credibilityVote,
          qualityVote: data.qualityVote,
          votedAt: data.votedAt?.toDate() || new Date()
        });
      });

      return votes;

    } catch (error) {
      console.error('❌ Error getting user voting history:', error);
      return [];
    }
  }

  // Get top contributors (users with most votes)
  async getTopContributors(limitCount = 10): Promise<Array<{userId: string, userName: string, voteCount: number}>> {
    try {
      const votesSnapshot = await getDocs(this.votesCollection);
      const contributorMap = new Map<string, {userName: string, count: number}>();

      votesSnapshot.forEach((doc) => {
        const data = doc.data();
        const existing = contributorMap.get(data.userId);
        
        if (existing) {
          existing.count++;
        } else {
          contributorMap.set(data.userId, {
            userName: data.userName,
            count: 1
          });
        }
      });

      // Sort by vote count and return top contributors
      const topContributors = Array.from(contributorMap.entries())
        .map(([userId, data]) => ({
          userId,
          userName: data.userName,
          voteCount: data.count
        }))
        .sort((a, b) => b.voteCount - a.voteCount)
        .slice(0, limitCount);

      return topContributors;

    } catch (error) {
      console.error('❌ Error getting top contributors:', error);
      return [];
    }
  }

  // Calculate user's voting accuracy (how often they agree with community consensus)
  async getUserAccuracyScore(userId: string): Promise<number> {
    try {
      const userVotes = await this.getUserVotingHistory(userId, 50);
      let accuracySum = 0;

      for (const vote of userVotes) {
        // Get community stats for this story
        const stats = await this.getVotingStats(vote.newsStoryId || '');
        
        // Calculate how close user's bias vote was to community consensus
        const communityBias = this.getDominantBias(stats.biasDistribution);
        const biasMatch = vote.biasVote === communityBias ? 1 : 0.5;
        
        // Calculate credibility accuracy (closer to average = higher score)
        const credibilityAccuracy = 1 - Math.abs(vote.credibilityVote - stats.averageCredibility) / 4;
        
        accuracySum += (biasMatch + credibilityAccuracy) / 2;
      }

      return userVotes.length > 0 ? (accuracySum / userVotes.length) * 100 : 0;

    } catch (error) {
      console.error('❌ Error calculating user accuracy:', error);
      return 0;
    }
  }

  private getDominantBias(biasScore: BiasScore): 'left' | 'center' | 'right' {
    if (biasScore.left >= biasScore.center && biasScore.left >= biasScore.right) {
      return 'left';
    } else if (biasScore.right >= biasScore.center && biasScore.right >= biasScore.left) {
      return 'right';
    }
    return 'center';
  }
}

// Export singleton instance
export const votingService = VotingService.getInstance();