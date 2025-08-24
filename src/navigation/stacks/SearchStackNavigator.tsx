import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchStackParamList } from '../../types/navigation';

// Screens
import SearchScreen from '../../screens/Search/SearchScreen';
import SearchResultsScreen from '../../screens/Search/SearchResultsScreen';
import SearchFiltersScreen from '../../screens/Search/SearchFiltersScreen';
import SavedSearchesScreen from '../../screens/Search/SavedSearchesScreen';

const Stack = createStackNavigator<SearchStackParamList>();

export const SearchStackNavigator = () => {
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
        name="SearchScreen" 
        component={SearchScreen}
        options={{ 
          headerShown: false // Search screen handles its own header
        }}
      />
      <Stack.Screen 
        name="SearchResults" 
        component={SearchResultsScreen}
        options={({ route }) => ({ 
          title: `Results for "${route.params.query}"`,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="SearchFilters" 
        component={SearchFiltersScreen}
        options={{ 
          title: 'Search Filters',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="SavedSearches" 
        component={SavedSearchesScreen}
        options={{ 
          title: 'Saved Searches',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default SearchStackNavigator;