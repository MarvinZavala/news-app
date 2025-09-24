import { NavigatorScreenParams } from '@react-navigation/native';

// Root navigation structure
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainApp: NavigatorScreenParams<MainTabParamList>;
};

// Auth flow navigation
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main tabs navigation - with Submit News feature
export type MainTabParamList = {
  NewsTab: NavigatorScreenParams<NewsStackParamList>; // Main news feed (renamed from Home)
  SubmitTab: NavigatorScreenParams<SubmitStackParamList>; // Submit news (authenticated only)
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  BookmarksTab: NavigatorScreenParams<BookmarksStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Individual stack parameter lists
export type NewsStackParamList = {
  NewsList: undefined; // Main news feed with bias scoring
  NewsDetails: { 
    newsId: string; 
    title: string; 
  };
  NewsComments: { 
    newsId: string; 
    title: string; 
  };
  BiasAnalysis: {
    newsId: string;
    title: string;
  };
};

// Legacy compatibility (keeping for now)
export type HomeStackParamList = NewsStackParamList;

// Submit news stack - for user-generated content
export type SubmitStackParamList = {
  SubmitNewsScreen: undefined; // Main submission form
  SubmitPreview: {
    newsData: UserNewsSubmissionForm;
  };
  SubmitSuccess: {
    newsId: string;
  };
};

export type SearchStackParamList = {
  SearchScreen: undefined;
  SearchResults: { 
    query: string; 
    filters?: SearchFilters; 
  };
  SearchFilters: { 
    currentFilters?: SearchFilters; 
  };
  SavedSearches: undefined;
};

export type BookmarksStackParamList = {
  BookmarksList: undefined;
  BookmarkDetails: { 
    bookmarkId: string;
    newsId: string;
    title: string;
  };
  BookmarkCategories: undefined;
  ReadLater: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
  About: undefined;
  ChangePassword: undefined;
  AccountSettings: undefined;
  UserNewsManager: undefined;
};

// Utility types for search functionality
export interface SearchFilters {
  category?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: 'relevance' | 'date' | 'popularity';
  source?: string[];
}

// Media file for form handling
export interface FormMediaFile {
  id: string;
  type: 'photo' | 'video';
  uri: string; // Local URI for React Native
  fileName: string;
  size: number;
  duration?: number; // for videos in seconds
  width?: number;
  height?: number;
}

// User-generated content types
export interface UserNewsSubmissionForm {
  title: string;
  primaryUrl?: string; // Now optional
  summary: string;
  category: string;
  tags: string[];
  additionalSources: string[];
  urgencyLevel: 'normal' | 'breaking' | 'developing';
  sourceReputation: 'verified' | 'questionable' | 'unknown';
  hasMultipleSources: boolean;
  suggestedBias?: 'left' | 'center' | 'right';
  suggestedCredibility?: number;
  factCheckNotes?: string;
  // Media fields
  photos: FormMediaFile[];
  videos: FormMediaFile[];
  selectedCoverImageId?: string; // ID of the photo to use as cover
}
