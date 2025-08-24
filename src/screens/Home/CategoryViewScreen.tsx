import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../types/navigation';

type CategoryViewScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'CategoryView'>;
type CategoryViewScreenRouteProp = RouteProp<HomeStackParamList, 'CategoryView'>;

interface Props {
  navigation: CategoryViewScreenNavigationProp;
  route: CategoryViewScreenRouteProp;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  author: string;
  publishedAt: string;
}

const CategoryViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { category, categoryId } = route.params;

  // Mock data - in a real app, this would be fetched based on categoryId
  const articles: Article[] = [
    {
      id: '1',
      title: `Latest ${category} News #1`,
      summary: 'This is a summary of the first article in this category.',
      author: 'Jane Smith',
      publishedAt: '2 hours ago',
    },
    {
      id: '2',
      title: `Breaking ${category} Update`,
      summary: 'Important update in the category that you should know about.',
      author: 'Mike Johnson',
      publishedAt: '4 hours ago',
    },
    {
      id: '3',
      title: `${category} Analysis Report`,
      summary: 'In-depth analysis of recent developments in this category.',
      author: 'Sarah Wilson',
      publishedAt: '1 day ago',
    },
  ];

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => navigation.navigate('ArticleDetails', {
        articleId: item.id,
        title: item.title,
      })}
    >
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle}>{item.title}</Text>
        <Text style={styles.articleSummary}>{item.summary}</Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>By {item.author}</Text>
          <Text style={styles.articleDate}>{item.publishedAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{category}</Text>
        <Text style={styles.headerSubtitle}>
          Latest articles in {category.toLowerCase()}
        </Text>
      </View>

      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  articleItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleAuthor: {
    fontSize: 12,
    color: '#1DA1F2',
    fontWeight: '600',
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default CategoryViewScreen;