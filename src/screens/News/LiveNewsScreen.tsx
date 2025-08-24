import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LiveNewsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>🔴 LIVE</Text>
        </View>
        <Text style={styles.title}>Live News Feed</Text>
        <Text style={styles.body}>Real-time news updates will appear here.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 },
  liveIndicator: { marginBottom: 20 },
  liveText: { fontSize: 18, fontWeight: 'bold', color: '#FF4444' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  body: { fontSize: 16, color: '#666', textAlign: 'center' },
});

export default LiveNewsScreen;