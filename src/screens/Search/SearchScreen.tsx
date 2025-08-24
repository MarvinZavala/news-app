import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SearchStackParamList } from '../../types/navigation';

type Props = {
  navigation: StackNavigationProp<SearchStackParamList, 'SearchScreen'>;
};

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      navigation.navigate('SearchResults', { query: query.trim() });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search News</Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for news, topics, authors..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => navigation.navigate('SearchFilters', {})}>
          <Ionicons name="filter-outline" size={20} color="#1DA1F2" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.savedSearches} onPress={() => navigation.navigate('SavedSearches')}>
        <Ionicons name="bookmark-outline" size={20} color="#666" />
        <Text style={styles.savedSearchesText}>Saved Searches</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  searchContainer: { flexDirection: 'row', padding: 20, gap: 10 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 25, paddingHorizontal: 15, backgroundColor: '#f8f9fa' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, paddingVertical: 12 },
  filterButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
  savedSearches: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa', margin: 20, borderRadius: 12 },
  savedSearchesText: { marginLeft: 10, fontSize: 16, color: '#666' },
});

export default SearchScreen;