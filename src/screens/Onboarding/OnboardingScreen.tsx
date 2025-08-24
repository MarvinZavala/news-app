import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useOnboarding } from '../../context/OnboardingContext';
import LottieView from 'lottie-react-native';

// Import Lottie animation
const welcomeAnimation = require('../../assets/onboardingscreen/welcomenews.json');

type OnboardingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const lottieRef = useRef<LottieView>(null);
  
  const onboardingData = [
    {
      title: "Welcome to News App",
      description: "Your daily source for the most relevant news",
    },
    {
      title: "News",
      description: "Receive content with a bias score and make your own analysis",
    },
    {
      title: "Stay Informed",
      description: "Access news locally, domestically and globally",
    },
  ];
  
  // Import useOnboarding at the top of the file
  const { completeOnboarding } = useOnboarding();
  
  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
      // Restart animation when changing pages
      if (lottieRef.current) {
        lottieRef.current.reset();
        lottieRef.current.play();
      }
    } else {
      // Mark onboarding as complete
      completeOnboarding();
      
      // Navigate to Auth stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };
  
  const handleSkip = () => {
    // Mark onboarding as complete
    completeOnboarding();
    
    // Navigate to Auth stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        {/* Lottie Animation */}
        <View style={styles.imageContainer}>
          <LottieView
            ref={lottieRef}
            source={welcomeAnimation}
            autoPlay
            loop
            style={styles.animation}
          />
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
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleNext} style={[styles.button, styles.primaryButton]}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
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
  animation: {
    width: 300,
    height: 300,
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
