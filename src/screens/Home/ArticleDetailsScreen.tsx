import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../types/navigation';

type ArticleDetailsScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ArticleDetails'>;
type ArticleDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'ArticleDetails'>;

interface Props {
  navigation: ArticleDetailsScreenNavigationProp;
  route: ArticleDetailsScreenRouteProp;
}

const ArticleDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { articleId, title } = route.params;

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this article: ${title}`,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookmark = () => {
    // Navigate to bookmarks or save article
    console.log('Bookmark article:', articleId);
  };

  const handleAuthorPress = () => {
    navigation.navigate('AuthorProfile', {
      authorId: 'author-1',
      authorName: 'John Doe'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.category}>
            <Text style={styles.categoryText}>Technology</Text>
          </View>
          <Text style={styles.title}>{title || 'Article Title'}</Text>
          <View style={styles.meta}>
            <TouchableOpacity onPress={handleAuthorPress}>
              <Text style={styles.author}>By John Doe</Text>
            </TouchableOpacity>
            <Text style={styles.date}>March 15, 2024</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.paragraph}>
            This is a sample article content. In a real app, this would be loaded from an API 
            based on the articleId: {articleId}
          </Text>
          
          <Text style={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
            nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Text>

          <Text style={styles.paragraph}>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
            in culpa qui officia deserunt mollit anim id est laborum.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
              <Ionicons name="bookmark-outline" size={24} color="#1DA1F2" />
              <Text style={styles.actionText}>Bookmark</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#1DA1F2" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  category: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 32,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    fontSize: 14,
    color: '#1DA1F2',
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionText: {
    fontSize: 14,
    color: '#1DA1F2',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default ArticleDetailsScreen;