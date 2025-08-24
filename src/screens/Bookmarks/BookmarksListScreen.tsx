import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BookmarksListScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Bookmarks</Text>
    </View>
    <View style={styles.content}>
      <Ionicons name="bookmark-outline" size={64} color="#ccc" />
      <Text style={styles.subtitle}>No bookmarks yet</Text>
      <Text style={styles.body}>Your saved articles will appear here.</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 },
  body: { fontSize: 16, color: '#999', marginTop: 8, textAlign: 'center' },
});

export default BookmarksListScreen;