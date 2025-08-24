# 📰 News App - Bias-Aware News Aggregator

> A modern React Native news application featuring bias analysis, real-time updates, and community-driven content validation.

## 🎯 Overview

**News App** is an innovative news aggregation platform that helps users understand news through multiple perspectives. Unlike traditional news apps, it provides **bias scoring**, **source comparison**, and **community validation** to promote informed news consumption.

### ✨ Key Features

- 🔍 **Bias Analysis**: Visual breakdown of left/center/right political coverage
- 🔄 **Real-time Updates**: Firebase-powered live news feed
- 🤖 **AI Summaries**: Intelligent content analysis and credibility scoring
- 👥 **Community Voting**: User-driven bias and credibility validation
- 📱 **Modern UX**: Clean, intuitive interface with bias visualization
- 🔐 **Secure Authentication**: Firebase Auth integration
- 📊 **Source Transparency**: Multi-source aggregation with credibility ratings

## 📱 App Architecture

### Navigation Structure
```
📱 News App
├── 🔐 Authentication Flow
│   ├── Onboarding (First-time users)
│   ├── Login
│   ├── Register
│   └── Forgot Password
│
└── 📰 Main App (Bottom Tabs)
    ├── News (Main Feed) - Simplified from Home/News
    │   ├── NewsListScreen (Main feed with bias cards)
    │   ├── NewsDetailsScreen (Article details + sources)
    │   └── NewsCommentsScreen (Community discussion)
    │
    ├── 🔍 Search
    ├── 🔖 Bookmarks
    └── 👤 Profile
```

## 🛠️ Technical Stack

### Core Technologies
- **React Native** + **Expo SDK 53** (Cross-platform mobile)
- **TypeScript** (Type safety)
- **React Navigation v6** (Nested navigation)
- **Firebase** (Auth + Firestore real-time DB)

### Key Libraries
- `@react-navigation/native` - Navigation framework
- `firebase` - Backend services
- `@react-native-async-storage/async-storage` - Local storage
- `lottie-react-native` - Animations

## 📁 Current Project Structure

```
src/
├── components/                    # Reusable UI components
│   ├── common/Button.tsx         # Custom button component
│   └── NewsCard.tsx              # ⭐ Enhanced news card with bias visualization
│
├── config/
│   └── firebase.ts               # Firebase configuration
│
├── context/                      # React Context providers
│   ├── AuthContext.tsx           # ✅ Authentication state
│   └── OnboardingContext.tsx     # ✅ Onboarding flow state
│
├── navigation/                   # ✅ Navigation configuration
│   ├── stacks/
│   │   ├── HomeStackNavigator.tsx    # ⭐ News feed (simplified)
│   │   ├── SearchStackNavigator.tsx  # Search screens
│   │   ├── BookmarksStackNavigator.tsx # Bookmark screens
│   │   └── ProfileStackNavigator.tsx # Profile screens
│   ├── AppNavigator.tsx          # ✅ Root navigation
│   ├── AuthNavigator.tsx         # ✅ Auth flow
│   └── MainTabNavigator.tsx      # ✅ Main tabs (simplified)
│
├── screens/                      # Screen components
│   ├── Auth/                     # ✅ Authentication screens
│   │   ├── LoginScreen.tsx       # ✅ Working login
│   │   ├── RegisterScreen.tsx    # ✅ Working registration
│   │   └── ForgotPasswordScreen.tsx
│   ├── News/                     # ⭐ News screens (active)
│   │   ├── NewsListScreen.tsx    # ✅ Main feed with Firebase + bias
│   │   ├── NewsDetailsScreen.tsx # ✅ Article details
│   │   └── NewsCommentsScreen.tsx # ✅ Comments
│   ├── Search/                   # 🚧 Search screens (placeholders)
│   ├── Bookmarks/                # 🚧 Bookmark screens (placeholders)
│   ├── Profile/                  # 🚧 Profile screens (placeholders)
│   └── Onboarding/               # ✅ Onboarding flow
│
├── services/                     # ⭐ Business logic & API
│   ├── NewsService.ts            # ✅ Firebase real-time news operations
│   └── SeedDataService.ts        # ✅ Development data seeding
│
└── types/                        # ⭐ TypeScript definitions
    ├── navigation.ts             # ✅ Navigation type safety
    └── news.ts                   # ✅ News data models
```

## 🔥 Key Features Explained

### 1. 📊 Enhanced News Cards

Each news story displays a comprehensive bias-aware card:

```
┌─────────────────────────────────┐
│ TECHNOLOGY    🔥     2h ago     │
│ Tech Giants Report Record...    │
│ Major technology companies...   │
│ ┌─────────────────────────────┐ │
│ │ 🤖 AI Analysis: Multiple   │ │
│ │ sources confirm strong...   │ │
│ └─────────────────────────────┘ │
│ Political Coverage  📊 15 sources│
│ 🔴●●● Left 25%                 │
│ ⚪●●● Center 50%                │
│ 🔵●●● Right 25%                │
│ ⭐⭐⭐⭐⚪ 4.5  👥 2 votes      │
│ 🔖 📤                          │
└─────────────────────────────────┘
```

### 2. 🔄 Real-time Data Flow

```
Firebase Firestore → NewsService → NewsListScreen → NewsCard
                        ↑                              ↓
                   Auto-updates              User interactions
```

- **Live updates**: Changes appear immediately
- **Pull-to-refresh**: Manual refresh capability
- **Filter system**: Latest/Trending/Popular

### 3. 🎯 Simplified Navigation

**Before (Confusing):**
- 🏠 Home (basic news)
- 📰 News (advanced news)

**Now (Clear):**
- 📰 News (single, comprehensive feed)

## 🏗️ Data Models

### News Story Structure
```typescript
interface NewsStory {
  id: string;
  title: string;
  summary: string;
  
  // Bias Analysis
  biasScore: {
    left: number;    // 0-100%
    center: number;  // 0-100%
    right: number;   // 0-100%
  };
  
  // Sources & Credibility
  totalSources: number;
  sources: NewsSource[];
  averageCredibility: number;
  
  // Community Features
  userVotes: UserVote[];
  totalVotes: number;
  
  // AI Features
  aiSummary?: string;
  aiCredibilityScore?: number;
  
  // Metadata
  isBreaking: boolean;
  isTrending: boolean;
  isUserGenerated: boolean;
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- Expo CLI
- iOS Simulator/Android Emulator
- Firebase project

### Installation

1. **Clone and install**
```bash
git clone <repository>
cd news-app
npm install
```

2. **Configure Firebase**
   - Update `src/config/firebase.ts` with your Firebase config

3. **Seed development data** (optional)
```typescript
import { seedDataService } from './src/services/SeedDataService';
await seedDataService.seedNewsData();
```

4. **Start the app**
```bash
npm start
# or
npx expo start
```

## 🧪 Current Status

### ✅ Fully Implemented & Working
- **Authentication System** (Login/Register with Firebase)
- **News Feed** (Real-time Firebase + bias visualization)
- **Navigation** (Simplified, professional structure)
- **NewsCard Component** (Bias bars, credibility, AI summaries)
- **Type Safety** (Full TypeScript integration)

### 🚧 Placeholder Screens (Ready for Development)
- Search functionality
- Bookmark management  
- Profile settings
- Advanced bias analysis
- User-generated content

### 🔄 Recent Changes & Cleanup
- ✅ Removed duplicate Home/News confusion
- ✅ Simplified to single News tab with comprehensive features
- ✅ Cleaned up obsolete files (old Home screens, unused navigators)
- ✅ Fixed authentication navigation flow
- ✅ Enhanced error handling and loading states

## 📊 How It Works Now

1. **User opens app** → Authentication check
2. **New user** → Onboarding → Register/Login → News Feed
3. **Returning user** → Direct to News Feed
4. **News Feed** → Real-time Firebase data → Bias-aware cards
5. **Interaction** → Tap card → Detailed view with sources

## 🎯 Next Development Priorities

1. **Enhanced News Details** - Source comparison, detailed bias analysis
2. **User-Generated Content** - Community news submission
3. **Advanced Search** - Filter by bias, source, credibility
4. **Bookmarking System** - Save and organize articles
5. **Profile Features** - Settings, preferences, history

## 🔧 Development Commands

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

---

**🎯 Current Status**: MVP with core bias analysis features ✅  
**📱 Platform**: iOS & Android via React Native + Expo  
**🚀 Ready for**: Feature expansion and user testing
