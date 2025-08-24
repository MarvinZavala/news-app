import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NewsStackParamList } from '../../types/navigation';

type Props = {
  navigation: StackNavigationProp<NewsStackParamList, 'NewsDetails'>;
  route: RouteProp<NewsStackParamList, 'NewsDetails'>;
};

const NewsDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId, title } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>News content for ID: {newsId}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('NewsComments', { newsId, title })}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#1DA1F2" />
            <Text style={styles.buttonText}>View Comments</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 24, color: '#666' },
  button: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 },
  buttonText: { marginLeft: 8, color: '#1DA1F2', fontWeight: '600' },
});

export default NewsDetailsScreen;