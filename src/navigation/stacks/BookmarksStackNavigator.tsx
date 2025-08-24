import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BookmarksStackParamList } from '../../types/navigation';

// Screens
import BookmarksListScreen from '../../screens/Bookmarks/BookmarksListScreen';
import BookmarkDetailsScreen from '../../screens/Bookmarks/BookmarkDetailsScreen';
import BookmarkCategoriesScreen from '../../screens/Bookmarks/BookmarkCategoriesScreen';
import ReadLaterScreen from '../../screens/Bookmarks/ReadLaterScreen';

const Stack = createStackNavigator<BookmarksStackParamList>();

export const BookmarksStackNavigator = () => {
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
        name="BookmarksList" 
        component={BookmarksListScreen}
        options={{ 
          headerShown: false // Bookmarks list handles its own header
        }}
      />
      <Stack.Screen 
        name="BookmarkDetails" 
        component={BookmarkDetailsScreen}
        options={{ 
          title: 'Bookmark Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="BookmarkCategories" 
        component={BookmarkCategoriesScreen}
        options={{ 
          title: 'Categories',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="ReadLater" 
        component={ReadLaterScreen}
        options={{ 
          title: 'Read Later',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default BookmarksStackNavigator;