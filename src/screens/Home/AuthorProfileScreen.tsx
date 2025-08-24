import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../types/navigation';

type AuthorProfileScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'AuthorProfile'>;
type AuthorProfileScreenRouteProp = RouteProp<HomeStackParamList, 'AuthorProfile'>;

interface Props {
  navigation: AuthorProfileScreenNavigationProp;
  route: AuthorProfileScreenRouteProp;
}

const AuthorProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authorId, authorName } = route.params;

  // Mock author data - in a real app, this would be fetched based on authorId
  const authorData = {
    name: authorName,
    bio: 'Technology journalist with 10+ years of experience covering the latest trends in tech, startups, and innovation.',
    followers: 15420,
    articles: 156,
    joined: 'March 2018',
    location: 'San Francisco, CA',
    website: 'www.johndoe.com',
  };

  const recentArticles = [
    {
      id: '1',
      title: 'The Future of Artificial Intelligence in 2024',
      publishedAt: '2 days ago',
    },
    {
      id: '2',
      title: 'Breaking Down the Latest Tech Startups',
      publishedAt: '1 week ago',
    },
    {
      id: '3',
      title: 'Cryptocurrency Trends to Watch',
      publishedAt: '2 weeks ago',
    },
  ];

  const handleFollow = () => {
    // Implement follow/unfollow logic
    console.log('Toggle follow for author:', authorId);
  };

  const handleArticlePress = (articleId: string, title: string) => {
    navigation.navigate('ArticleDetails', {
      articleId,
      title,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Author Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          </View>
          
          <Text style={styles.authorName}>{authorData.name}</Text>
          <Text style={styles.authorBio}>{authorData.bio}</Text>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{authorData.followers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{authorData.articles}</Text>
              <Text style={styles.statLabel}>Articles</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Author Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{authorData.location}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Joined {authorData.joined}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{authorData.website}</Text>
          </View>
        </View>

        {/* Recent Articles */}
        <View style={styles.articlesSection}>
          <Text style={styles.sectionTitle}>Recent Articles</Text>
          {recentArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleItem}
              onPress={() => handleArticlePress(article.id, article.title)}
            >
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDate}>{article.publishedAt}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  authorBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  articlesSection: {
    padding: 20,
  },
  articleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  articleDate: {
    fontSize: 14,
    color: '#666',
  },
});

export default AuthorProfileScreen;