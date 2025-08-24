import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Mock data - In a real app this would come from an API
const newsData = [
  {
    id: '1',
    title: 'Nueva actualización de React Native',
    summary: 'React Native acaba de lanzar su nueva versión con mejoras significativas de rendimiento.',
    category: 'Tecnología',
    date: '10 min',
  },
  {
    id: '2',
    title: 'Avances en inteligencia artificial',
    summary: 'Investigadores logran un avance importante en el campo de la inteligencia artificial.',
    category: 'Ciencia',
    date: '30 min',
  },
  {
    id: '3',
    title: 'Nuevas tendencias en desarrollo móvil',
    summary: 'Las aplicaciones móviles están evolucionando con estas nuevas tecnologías.',
    category: 'Tecnología',
    date: '1 hora',
  },
  {
    id: '4',
    title: 'Medidas económicas en Latinoamérica',
    summary: 'Países latinoamericanos implementan nuevas estrategias económicas.',
    category: 'Economía',
    date: '2 horas',
  },
];

type NewsItemProps = {
  title: string;
  summary: string;
  category: string;
  date: string;
};

const NewsItem: React.FC<NewsItemProps> = ({ title, summary, category, date }) => {
  return (
    <TouchableOpacity style={styles.newsItem}>
      <View style={styles.newsContent}>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary} numberOfLines={2}>
          {summary}
        </Text>
      </View>
      <View style={styles.newsImage} />
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>News App</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollableCategories />
      </View>
      
      <FlatList
        data={newsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsItem
            title={item.title}
            summary={item.summary}
            category={item.category}
            date={item.date}
          />
        )}
        contentContainerStyle={styles.newsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Scrollable Categories Component
const ScrollableCategories = () => {
  const categories = ['Todas', 'Tecnología', 'Ciencia', 'Economía', 'Deportes', 'Entretenimiento'];
  const [selectedCategory, setSelectedCategory] = React.useState('Todas');
  
  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === item && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedCategory(item)}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === item && styles.selectedCategoryButtonText,
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      )}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategoryButton: {
    backgroundColor: '#3498db',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  newsList: {
    padding: 16,
  },
  newsItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newsContent: {
    flex: 1,
    marginRight: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    color: '#999',
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  newsImage: {
    width: 80,
    height: 80,
    backgroundColor: '#e1e1e1',
    borderRadius: 8,
  },
});

export default HomeScreen;
