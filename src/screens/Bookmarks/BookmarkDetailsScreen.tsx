import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { BookmarksStackParamList } from '../../types/navigation';

type Props = { route: RouteProp<BookmarksStackParamList, 'BookmarkDetails'>; };

const BookmarkDetailsScreen: React.FC<Props> = ({ route }) => {
  const { bookmarkId } = route.params;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bookmark Details</Text>
        <Text style={styles.body}>Details for bookmark ID: {bookmarkId}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  body: { fontSize: 16, color: '#666' },
});

export default BookmarkDetailsScreen;