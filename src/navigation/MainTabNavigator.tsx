import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { MainTabParamList } from '../types/navigation';

// Stack Navigators
import { HomeStackNavigator } from './stacks/HomeStackNavigator'; // Main news feed
import { SubmitStackNavigator } from './stacks/SubmitStackNavigator'; // Submit news for authenticated users
import { SearchStackNavigator } from './stacks/SearchStackNavigator';
import { BookmarksStackNavigator } from './stacks/BookmarksStackNavigator';
import { ProfileStackNavigator } from './stacks/ProfileStackNavigator';

// Context for authentication check
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  const { user } = useAuth(); // Check if user is authenticated for Submit tab
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
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'SubmitTab':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
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
          title: 'News',
          // Example: tabBarBadge: breakingNewsCount > 0 ? 'New' : undefined,
        }}
      />
      
      <Tab.Screen 
        name="SubmitTab" 
        component={SubmitStackNavigator}
        options={{ 
          title: 'Submit',
          // Only show tab if user is authenticated
          tabBarStyle: user ? undefined : { display: 'none' },
          tabBarButton: user ? undefined : () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent access if not authenticated (double security)
            if (!user) {
              e.preventDefault();
              // Optional: Show alert or navigate to login
            }
          },
        })}
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