import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AboutScreen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>About News App</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.body}>Stay informed with the latest news from around the world.</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  version: { fontSize: 16, color: '#1DA1F2', marginBottom: 16 },
  body: { fontSize: 16, color: '#666' },
});

export default AboutScreen;