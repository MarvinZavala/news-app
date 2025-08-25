// News data types for Firebase integration
export interface BiasScore {
  left: number;    // 0-100 percentage
  center: number;  // 0-100 percentage  
  right: number;   // 0-100 percentage
}

export interface NewsSource {
  id: string;
  name: string;           // "CNN", "Fox News", etc.
  url: string;
  bias: 'left' | 'center' | 'right';
  credibilityScore: number; // 1-5
  publishedAt: Date;
}

export interface UserVote {
  userId: string;
  biasVote: 'left' | 'center' | 'right';
  credibilityVote: number; // 1-5
  qualityVote: number;     // 1-5
  votedAt: Date;
}

// Comment system interfaces
export interface Comment {
  id: string;
  newsStoryId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  
  // Engagement
  likes: number;
  dislikes: number;
  likedBy: string[]; // userIds
  dislikedBy: string[]; // userIds
  
  // Moderation
  isReported: boolean;
  reportCount: number;
  isHidden: boolean;
  moderatedBy?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  
  // Threading (for replies)
  parentCommentId?: string; // null for top-level comments
  replies: Comment[];
  replyCount: number;
}

export interface CommentSubmission {
  newsStoryId: string;
  content: string;
  parentCommentId?: string; // For replies
}

export interface NewsStory {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  
  // Bias Analysis
  biasScore: BiasScore;
  totalSources: number;
  sources: NewsSource[];
  
  // User Engagement
  userVotes: UserVote[];
  totalVotes: number;
  averageCredibility: number; // Calculated from votes
  averageQuality: number;     // Calculated from votes
  
  // AI Analysis
  aiSummary?: string;
  aiCredibilityScore?: number; // 0-1
  aiDetectedBias?: 'left' | 'center' | 'right';
  
  // Enhanced metadata (from new submission system)
  isBreaking: boolean;
  isTrending: boolean;
  isUserGenerated: boolean;
  submittedBy?: string; // userId for user-generated content
  
  // New fields from enhanced submission
  tags?: string[];
  urgencyLevel?: 'normal' | 'breaking' | 'developing';
  sourceReputation?: 'verified' | 'questionable' | 'unknown';
  communityFlags?: {
    spam: number;
    misinformation: number;
    duplicate: number;
    inappropriate: number;
  };
  needsFactCheck?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Engagement metrics
  viewCount: number;
  shareCount: number;
  bookmarkCount: number;
  
  // Comments
  commentCount: number;
  comments?: Comment[]; // Loaded separately for performance
}

export interface UserNewsSubmission {
  id: string;
  title: string;
  primaryUrl: string; // Main source URL
  summary: string;
  category: string;
  
  // Enhanced submission fields
  tags: string[]; // Relevant tags/keywords
  suggestedBias?: 'left' | 'center' | 'right'; // User's bias assessment
  suggestedCredibility?: number; // 1-5 rating
  additionalSources?: string[]; // Additional URLs for same story
  urgencyLevel: 'normal' | 'breaking' | 'developing';
  
  // Verification fields
  isFactCheckRequired: boolean;
  hasMultipleSources: boolean;
  sourceReputation: 'verified' | 'questionable' | 'unknown';
  
  // Metadata
  submittedBy: string; // userId
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  submittedAt: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
  rejectionReason?: string;
  
  // Community feedback during review
  communityFlags: {
    spam: number;
    misinformation: number;
    duplicate: number;
    inappropriate: number;
  };
  reviewNotes?: string;
}

// For real-time updates
export interface NewsListResponse {
  stories: NewsStory[];
  lastDoc?: any; // For pagination
  hasMore: boolean;
}

// Note: UserNewsSubmissionForm is now defined in navigation.ts to avoid circular dependencies

// Source reputation database
export interface SourceReputation {
  domain: string;
  name: string;
  overallBias: 'left' | 'center' | 'right';
  credibilityScore: number; // 1-5
  factualReporting: 'very_high' | 'high' | 'mostly_factual' | 'mixed' | 'low';
  isVerified: boolean;
  notes?: string;
}

// Filter and search options
export interface NewsFilters {
  category?: string;
  bias?: 'left' | 'center' | 'right';
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  sortBy?: 'newest' | 'trending' | 'mostVoted' | 'controversial';
  minCredibility?: number;
  sourceReputation?: 'verified' | 'questionable' | 'unknown';
  urgencyLevel?: 'normal' | 'breaking' | 'developing';
}