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
  
  // Metadata
  isBreaking: boolean;
  isTrending: boolean;
  isUserGenerated: boolean;
  submittedBy?: string; // userId for user-generated content
  
  createdAt: Date;
  updatedAt: Date;
  
  // Engagement metrics
  viewCount: number;
  shareCount: number;
  bookmarkCount: number;
}

export interface UserNewsSubmission {
  id: string;
  title: string;
  url: string;
  summary: string;
  category: string;
  submittedBy: string; // userId
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
  rejectionReason?: string;
}

// For real-time updates
export interface NewsListResponse {
  stories: NewsStory[];
  lastDoc?: any; // For pagination
  hasMore: boolean;
}

// Filter and search options
export interface NewsFilters {
  category?: string;
  bias?: 'left' | 'center' | 'right';
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  sortBy?: 'newest' | 'trending' | 'mostVoted' | 'controversial';
  minCredibility?: number;
}