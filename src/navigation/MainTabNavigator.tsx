import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { MainTabParamList } from '../types/navigation';

// Stack Navigators
import { HomeStackNavigator } from './stacks/HomeStackNavigator'; // This will be our main news feed
import { SearchStackNavigator } from './stacks/SearchStackNavigator';
import { BookmarksStackNavigator } from './stacks/BookmarksStackNavigator';
import { ProfileStackNavigator } from './stacks/ProfileStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Hide the header as each stack handles its own headers
        headerShown: false,
        
        // Tab bar styling
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e1e8ed',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        
        // Tab bar label styling
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        
        // Tab bar colors
        tabBarActiveTintColor: '#1DA1F2',
        tabBarInactiveTintColor: '#657786',
        
        // Tab bar icon configuration
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'newspaper' : 'newspaper-outline'; // Changed to newspaper since it's our main news feed
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'BookmarksTab':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }
          
          return (
            <Ionicons 
              name={iconName} 
              size={size} 
              color={color} 
            />
          );
        },
        
        // Badge configuration (for future notifications)
        tabBarBadgeStyle: {
          backgroundColor: '#FF3B30',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator}
        options={{ 
          title: 'News', // Changed from 'Home' to 'News' to be clear
          // Example: tabBarBadge: breakingNewsCount > 0 ? 'New' : undefined,
        }}
      />
      
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStackNavigator}
        options={{ 
          title: 'Search',
        }}
      />
      
      <Tab.Screen 
        name="BookmarksTab" 
        component={BookmarksStackNavigator}
        options={{ 
          title: 'Bookmarks',
          // Example: tabBarBadge: newBookmarks > 0 ? newBookmarks : undefined,
        }}
      />
      
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator}
        options={{ 
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;