import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type OnboardingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const onboardingData = [
    {
      title: "Bienvenido a News App",
      description: "Tu fuente diaria para las noticias más relevantes",
      image: require('../../assets/images/onboarding1.png'),
    },
    {
      title: "Noticias Personalizadas",
      description: "Recibe contenido basado en tus intereses",
      image: require('../../assets/images/onboarding2.png'),
    },
    {
      title: "Mantente Informado",
      description: "Accede a noticias en cualquier momento y lugar",
      image: require('../../assets/images/onboarding3.png'),
    },
  ];
  
  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('Login');
    }
  };
  
  const handleSkip = () => {
    navigation.navigate('Login');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        {/* Placeholder for image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder} />
          {/* <Image source={onboardingData[currentPage].image} style={styles.image} /> */}
        </View>
        
        <Text style={styles.title}>{onboardingData[currentPage].title}</Text>
        <Text style={styles.description}>{onboardingData[currentPage].description}</Text>
        
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.paginationDot, 
                currentPage === index && styles.paginationDotActive
              ]} 
            />
          ))}
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkip} style={styles.button}>
          <Text style={styles.buttonText}>Omitir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleNext} style={[styles.button, styles.primaryButton]}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {currentPage === onboardingData.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 20,
    backgroundColor: '#e1e1e1',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#3498db',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    padding: 15,
  },
  buttonText: {
    fontSize: 16,
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    paddingHorizontal: 25,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
