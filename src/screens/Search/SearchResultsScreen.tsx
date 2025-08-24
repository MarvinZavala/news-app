import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { SearchStackParamList } from '../../types/navigation';

type Props = { route: RouteProp<SearchStackParamList, 'SearchResults'>; };

const SearchResultsScreen: React.FC<Props> = ({ route }) => {
  const { query } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Search Results</Text>
        <Text style={styles.query}>Results for: "{query}"</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  query: { fontSize: 16, color: '#666' },
});

export default SearchResultsScreen;