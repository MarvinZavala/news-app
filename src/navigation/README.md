# Navigation Structure

This document explains the navigation architecture used in the News App.

## Structure Overview

The navigation structure follows a hierarchical pattern:

```
NavigationContainer
└── RootNavigator (Stack)
    ├── OnboardingScreen (Stack Screen)
    ├── AuthNavigator (Stack Screen)
    │   └── LoginScreen (Stack Screen)
    └── MainTabNavigator (Stack Screen)
        └── HomeScreen (Tab Screen)
```

## Navigation Types

1. **RootStackNavigator**:
   - Main app container
   - Controls the flow between Onboarding, Auth, and Main App flows
   - Determines which flow to show based on authentication and onboarding state

2. **AuthNavigator**:
   - Handles authentication-related screens
   - Contains Login, Register (future), and Forgot Password (future) screens

3. **MainTabNavigator**:
   - Main app functionality after authentication
   - Bottom tab navigation for app features
   - Currently includes Home screen, can be expanded with Profile, Search, etc.

## Navigation Logic

- **Authentication Flow**: Uses AuthContext to track the user's authentication state
- **Onboarding Flow**: Uses useOnboarding hook to track whether the user has completed onboarding
- **Deep Linking**: (To be implemented in future)

## Best Practices Used

1. **Type Safety**: All navigation parameters are typed using TypeScript
2. **Screen Preloading**: Auth and onboarding states are checked before showing UI
3. **Navigation Reset**: Using reset instead of navigate when changing major flows
4. **Abstracted Navigation Logic**: Navigation logic is separated from UI components
5. **Context-Based Auth**: Authentication state drives navigation structure

## Adding New Screens

To add new screens:

1. Add screen component in the appropriate directory
2. Add screen name and params to the correct navigation type
3. Add the screen to the appropriate navigator

Example:
```typescript
// Add to types/navigation.ts
export type MainTabParamList = {
  Home: undefined;
  Profile: { userId: string }; // New screen with parameter
};

// Add to MainTabNavigator
<Tab.Screen name="Profile" component={ProfileScreen} />
```
