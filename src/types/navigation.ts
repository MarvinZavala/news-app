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
  HomeTab: NavigatorScreenParams<HomeStackParamList>; // Main news feed
  SubmitTab: NavigatorScreenParams<SubmitStackParamList>; // Submit news (authenticated only)
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  BookmarksTab: NavigatorScreenParams<BookmarksStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Individual stack parameter lists
export type HomeStackParamList = {
  HomeScreen: undefined; // Main news feed with bias scoring
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

// Submit news stack - for user-generated content
export type SubmitStackParamList = {
  SubmitNewsScreen: undefined; // Main submission form
  SubmitPreview: {
    newsData: {
      title: string;
      url: string;
      summary: string;
      category: string;
    };
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

// User-generated content types
export interface UserNewsSubmissionForm {
  title: string;
  url: string;
  summary: string;
  category: string;
  tags?: string[];
}
