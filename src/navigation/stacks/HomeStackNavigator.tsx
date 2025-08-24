import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../../types/navigation';

// Screens - Using our enhanced news screens
import NewsListScreen from '../../screens/News/NewsListScreen'; // Main news feed with bias scoring
import NewsDetailsScreen from '../../screens/News/NewsDetailsScreen';
import NewsCommentsScreen from '../../screens/News/NewsCommentsScreen';
// TODO: Add BiasAnalysis, SubmitNews, UserNewsPreview screens

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="HomeScreen" 
        component={NewsListScreen} // Using our enhanced news list with bias scoring
        options={{ 
          headerShown: false // News screen handles its own header
        }}
      />
      <Stack.Screen 
        name="NewsDetails" 
        component={NewsDetailsScreen}
        options={({ route }) => ({ 
          title: route.params.title || 'News',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="NewsComments" 
        component={NewsCommentsScreen}
        options={({ route }) => ({ 
          title: 'Comments',
          headerBackTitleVisible: false,
        })}
      />
      {/* TODO: Add these screens when ready
      <Stack.Screen 
        name="BiasAnalysis" 
        component={BiasAnalysisScreen}
        options={({ route }) => ({ 
          title: 'Bias Analysis',
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="SubmitNews" 
        component={SubmitNewsScreen}
        options={{ 
          title: 'Submit News',
          headerBackTitleVisible: false,
        }}
      />
      */}
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;