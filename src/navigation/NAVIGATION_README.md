# 🧭 Navigation Architecture - News App

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Navigation Types](#navigation-types)
5. [How to Add New Screens](#how-to-add-new-screens)
6. [Navigation Examples](#navigation-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This News App uses a **professional nested navigation architecture** that's:

- ✅ **Scalable**: Easy to add new screens without breaking existing code
- ✅ **Type-Safe**: Full TypeScript support with navigation parameters
- ✅ **Maintainable**: Organized code structure with clear separation
- ✅ **Performance**: Optimized for large-scale applications

## 🏗️ Architecture

```
Root Stack Navigator
├── Onboarding (First-time users)
├── Auth Stack Navigator
│   ├── Login
│   ├── Register
│   └── Forgot Password
└── Main Tab Navigator
    ├── Home Tab → Home Stack Navigator
    │   ├── HomeScreen
    │   ├── ArticleDetails
    │   ├── CategoryView
    │   └── AuthorProfile
    ├── News Tab → News Stack Navigator
    │   ├── NewsList
    │   ├── NewsDetails
    │   ├── NewsComments
    │   ├── LiveNews
    │   └── TrendingNews
    ├── Search Tab → Search Stack Navigator
    │   ├── SearchScreen
    │   ├── SearchResults
    │   ├── SearchFilters
    │   └── SavedSearches
    ├── Bookmarks Tab → Bookmarks Stack Navigator
    │   ├── BookmarksList
    │   ├── BookmarkDetails
    │   ├── BookmarkCategories
    │   └── ReadLater
    └── Profile Tab → Profile Stack Navigator
        ├── ProfileScreen
        ├── Settings
        ├── EditProfile
        ├── Notifications
        ├── Privacy
        ├── Help
        ├── About
        ├── ChangePassword
        └── AccountSettings
```

## 📁 File Structure

```
src/navigation/
├── AppNavigator.tsx              # Main navigation container
├── AuthNavigator.tsx             # Authentication flow
├── MainTabNavigator.tsx          # Main bottom tabs
├── NAVIGATION_README.md          # This documentation
└── stacks/
    ├── HomeStackNavigator.tsx    # Home section screens
    ├── NewsStackNavigator.tsx    # News section screens
    ├── SearchStackNavigator.tsx  # Search section screens
    ├── BookmarksStackNavigator.tsx # Bookmarks section screens
    └── ProfileStackNavigator.tsx # Profile section screens

src/types/
└── navigation.ts                 # All navigation type definitions

src/screens/
├── Auth/                         # Authentication screens
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── ForgotPasswordScreen.tsx
├── Home/                         # Home section screens
│   ├── HomeScreen.tsx
│   ├── ArticleDetailsScreen.tsx
│   ├── CategoryViewScreen.tsx
│   └── AuthorProfileScreen.tsx
├── News/                         # News section screens
│   ├── NewsListScreen.tsx
│   ├── NewsDetailsScreen.tsx
│   ├── NewsCommentsScreen.tsx
│   ├── LiveNewsScreen.tsx
│   └── TrendingNewsScreen.tsx
├── Search/                       # Search section screens
│   ├── SearchScreen.tsx
│   ├── SearchResultsScreen.tsx
│   ├── SearchFiltersScreen.tsx
│   └── SavedSearchesScreen.tsx
├── Bookmarks/                    # Bookmarks section screens
│   ├── BookmarksListScreen.tsx
│   ├── BookmarkDetailsScreen.tsx
│   ├── BookmarkCategoriesScreen.tsx
│   └── ReadLaterScreen.tsx
├── Profile/                      # Profile section screens
│   ├── ProfileScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── EditProfileScreen.tsx
│   ├── NotificationsScreen.tsx
│   ├── PrivacyScreen.tsx
│   ├── HelpScreen.tsx
│   ├── AboutScreen.tsx
│   ├── ChangePasswordScreen.tsx
│   └── AccountSettingsScreen.tsx
└── Onboarding/
    └── OnboardingScreen.tsx
```

## 🔧 Navigation Types

All navigation types are defined in `src/types/navigation.ts`:

```typescript
// Root level navigation
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainApp: NavigatorScreenParams<MainTabParamList>;
};

// Main tabs (each tab has its own stack)
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  NewsTab: NavigatorScreenParams<NewsStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  BookmarksTab: NavigatorScreenParams<BookmarksStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Individual stack parameters with typed parameters
export type HomeStackParamList = {
  HomeScreen: undefined;
  ArticleDetails: { 
    articleId: string; 
    title?: string; 
  };
  CategoryView: { 
    category: string; 
    categoryId: string; 
  };
  // ... more screens
};
```

## 🆕 How to Add New Screens

### 1. Add Screen Type Definition

```typescript
// In src/types/navigation.ts
export type HomeStackParamList = {
  // ... existing screens
  NewScreen: { 
    parameterName: string;
    optionalParam?: number;
  };
};
```

### 2. Create the Screen Component

```typescript
// In src/screens/Home/NewScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../types/navigation';

type Props = {
  navigation: StackNavigationProp<HomeStackParamList, 'NewScreen'>;
  route: RouteProp<HomeStackParamList, 'NewScreen'>;
};

const NewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { parameterName, optionalParam } = route.params;
  
  return (
    <View>
      <Text>New Screen: {parameterName}</Text>
    </View>
  );
};

export default NewScreen;
```

### 3. Add Screen to Stack Navigator

```typescript
// In src/navigation/stacks/HomeStackNavigator.tsx
import NewScreen from '../../screens/Home/NewScreen';

export const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      {/* ... existing screens */}
      <Stack.Screen 
        name="NewScreen" 
        component={NewScreen}
        options={{ title: 'My New Screen' }}
      />
    </Stack.Navigator>
  );
};
```

### 4. Navigate to the New Screen

```typescript
// From any screen in the same stack
navigation.navigate('NewScreen', { 
  parameterName: 'Hello',
  optionalParam: 42 
});

// From a different tab
navigation.navigate('HomeTab', {
  screen: 'NewScreen',
  params: { 
    parameterName: 'Hello',
    optionalParam: 42 
  }
});
```

## 🚀 Navigation Examples

### Basic Navigation (Within Same Stack)

```typescript
// Navigate to article details
navigation.navigate('ArticleDetails', {
  articleId: 'article-123',
  title: 'Breaking News'
});

// Go back
navigation.goBack();

// Navigate and replace current screen
navigation.replace('HomeScreen');
```

### Cross-Tab Navigation

```typescript
// Navigate to a different tab
navigation.navigate('NewsTab', {
  screen: 'NewsDetails',
  params: {
    newsId: 'news-456',
    title: 'Important Update'
  }
});

// Navigate to tab root screen
navigation.navigate('SearchTab');
```

### Reset Navigation Stack

```typescript
// Reset to specific screen (useful after logout)
navigation.reset({
  index: 0,
  routes: [{ name: 'Auth' }],
});
```

### Deep Linking Example

```typescript
// Configure in AppNavigator.tsx
const linkingConfiguration = {
  prefixes: ['newsapp://'],
  config: {
    screens: {
      MainApp: {
        screens: {
          HomeTab: {
            screens: {
              ArticleDetails: 'article/:articleId',
            },
          },
        },
      },
    },
  },
};

// URL: newsapp://article/123 → ArticleDetails screen
```

## 🎯 Best Practices

### ✅ DO

1. **Always use TypeScript navigation types**
   ```typescript
   // Good
   navigation.navigate('ArticleDetails', { articleId: '123' });
   
   // Bad - no type checking
   (navigation as any).navigate('ArticleDetail', { id: '123' });
   ```

2. **Use descriptive parameter names**
   ```typescript
   // Good
   ArticleDetails: { articleId: string; title?: string };
   
   // Bad
   ArticleDetails: { id: string; t?: string };
   ```

3. **Handle navigation state properly**
   ```typescript
   const handlePress = useCallback(() => {
     if (navigation.canGoBack()) {
       navigation.goBack();
     } else {
       navigation.navigate('HomeTab');
     }
   }, [navigation]);
   ```

4. **Use proper screen options**
   ```typescript
   <Stack.Screen 
     name="ArticleDetails"
     component={ArticleDetailsScreen}
     options={({ route }) => ({
       title: route.params.title || 'Article',
       headerBackTitleVisible: false,
     })}
   />
   ```

### ❌ DON'T

1. **Don't hardcode screen names**
   ```typescript
   // Bad
   navigation.navigate('ArticleDetails');
   
   // Good - use constants or enums
   navigation.navigate('ArticleDetails' as keyof HomeStackParamList);
   ```

2. **Don't ignore TypeScript errors**
   ```typescript
   // Bad - missing required parameter
   navigation.navigate('ArticleDetails'); // TS Error!
   
   // Good
   navigation.navigate('ArticleDetails', { articleId: '123' });
   ```

3. **Don't use nested navigation without types**
   ```typescript
   // Bad
   navigation.navigate('HomeTab', { screen: 'SomeScreen' });
   
   // Good
   navigation.navigate('HomeTab', {
     screen: 'ArticleDetails',
     params: { articleId: '123' }
   });
   ```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. **Screen not found error**
```
Error: The action 'NAVIGATE' with payload {"name":"ArticleDetail"} was not handled by any navigator.
```

**Solution:** Check screen name spelling and ensure it's registered in the stack navigator.

#### 2. **TypeScript parameter errors**
```
Argument of type '{}' is not assignable to parameter of type '{ articleId: string; }'
```

**Solution:** Provide all required parameters as defined in navigation types.

#### 3. **Navigation prop undefined**
```
Cannot read property 'navigate' of undefined
```

**Solution:** Ensure the component is wrapped in a navigator or use `useNavigation()` hook:

```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  // Now you can use navigation.navigate()
};
```

#### 4. **Tab navigation doesn't work**
```
Cannot navigate to tab that doesn't exist
```

**Solution:** Ensure tab names match exactly with MainTabParamList definitions.

#### 5. **Deep linking not working**

**Solution:** Check linking configuration and ensure URL patterns match your navigation structure.

### Debug Navigation State

```typescript
import { useNavigationState } from '@react-navigation/native';

const MyComponent = () => {
  const state = useNavigationState(state => state);
  console.log('Navigation State:', JSON.stringify(state, null, 2));
};
```

## 📚 Additional Resources

- [React Navigation v6 Documentation](https://reactnavigation.org/docs/getting-started)
- [TypeScript with React Navigation](https://reactnavigation.org/docs/typescript)
- [Deep Linking Guide](https://reactnavigation.org/docs/deep-linking)
- [Navigation Performance](https://reactnavigation.org/docs/performance)

---

**👨‍💻 Maintained by:** News App Development Team  
**📅 Last Updated:** March 2024  
**🔄 Version:** 1.0.0

> 💡 **Tip:** Keep this README updated whenever you add new screens or modify navigation structure!