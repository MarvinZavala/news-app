import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

// Navigators
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';

// Screens
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';

// Context & Hooks
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';

// Types
import { RootStackParamList } from '../types/navigation';

// Loading Screen Component
const LoadingScreen = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  }}>
    <ActivityIndicator size="large" color="#1DA1F2" />
  </View>
);

// Root Navigator
const Stack = createStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();

  // DEV MODE: Set to true to always show onboarding first
  const FORCE_ONBOARDING_DEV = false; // Set to true only when working on onboarding
  
  console.log('🔍 Navigation Debug:', {
    user: user ? `Logged in: ${user.email}` : 'Not logged in',
    authLoading,
    hasCompletedOnboarding,
    onboardingLoading,
    FORCE_ONBOARDING_DEV
  });

  // Show loading screen while checking auth and onboarding status
  if (authLoading || onboardingLoading) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen />;
  }

  // DEV MODE: Force show onboarding (only when developing onboarding)
  if (FORCE_ONBOARDING_DEV) {
    console.log('🔧 DEV MODE: Forcing onboarding screen');
    return (
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="MainApp" 
          component={MainTabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  // PRIORITY 1: If user is authenticated, show main app immediately
  if (user) {
    console.log('✅ User authenticated, showing MainApp:', user.email);
    return (
      <Stack.Navigator 
        initialRouteName="MainApp"
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen 
          name="MainApp" 
          component={MainTabNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  // PRIORITY 2: If user is not authenticated and hasn't completed onboarding
  if (!hasCompletedOnboarding) {
    console.log('📝 Showing onboarding flow');
    return (
      <Stack.Navigator 
        initialRouteName="Onboarding"
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  // PRIORITY 3: User completed onboarding but not authenticated - show auth
  console.log('🔐 Showing auth flow');
  return (
    <Stack.Navigator 
      initialRouteName="Auth"
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen 
        name="Auth" 
        component={AuthNavigator}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Main Navigator Container
const AppNavigator = () => {
  return (
    <NavigationContainer
      // Optional: Add linking configuration for deep linking
      // linking={linkingConfiguration}
      // Optional: Add fallback component
      // fallback={<LoadingScreen />}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;