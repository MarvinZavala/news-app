import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '../../types/navigation';

type Props = {
  route: RouteProp<NewsStackParamList, 'NewsComments'>;
};

const NewsCommentsScreen: React.FC<Props> = ({ route }) => {
  const { newsId, title } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Comments</Text>
        <Text style={styles.subtitle}>Comments for: {title}</Text>
        <Text style={styles.body}>News ID: {newsId}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 16 },
  body: { fontSize: 14, color: '#999' },
});

export default NewsCommentsScreen;