import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TrendingNewsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="trending-up" size={64} color="#FF6B6B" />
        <Text style={styles.title}>Trending News</Text>
        <Text style={styles.body}>The most popular stories right now.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 16 },
  body: { fontSize: 16, color: '#666', textAlign: 'center' },
});

export default TrendingNewsScreen;