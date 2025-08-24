import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { SubmitStackParamList } from '../../types/navigation';
import LottieView from 'lottie-react-native';

type Props = {
  navigation: StackNavigationProp<SubmitStackParamList, 'SubmitSuccess'>;
  route: RouteProp<SubmitStackParamList, 'SubmitSuccess'>;
};

const { width } = Dimensions.get('window');

const SubmitSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { newsId } = route.params;

  // Auto-navigate to news feed after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGoToNewsFeed();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToNewsFeed = () => {
    // Navigate back to News tab (home)
    navigation.reset({
      index: 0,
      routes: [{ name: 'SubmitNewsScreen' }],
    });
    
    // Then switch to HomeTab to see the submitted news
    // Note: This requires navigation to parent navigator
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('HomeTab');
    }
  };

  const handleSubmitAnother = () => {
    // Navigate back to submit form
    navigation.reset({
      index: 0,
      routes: [{ name: 'SubmitNewsScreen' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <View style={styles.animationContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          
          {/* Optional: Add Lottie animation if you have one */}
          {/* <LottieView
            source={require('../../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
          /> */}
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>🎉 News Submitted Successfully!</Text>
          <Text style={styles.description}>
            Your news has been added to the community feed and is now visible to all users.
          </Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="newspaper-outline" size={20} color="#1DA1F2" />
              <Text style={styles.infoText}>
                Your submission is now live in the news feed
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                Community members can now vote and interact with it
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
              <Text style={styles.infoText}>
                High-quality submissions may get promoted to trending
              </Text>
            </View>
          </View>

          <View style={styles.submissionInfo}>
            <Text style={styles.submissionLabel}>Submission ID:</Text>
            <Text style={styles.submissionId}>{newsId.slice(-8)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToNewsFeed}
          >
            <Ionicons name="newspaper-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View in News Feed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSubmitAnother}
          >
            <Ionicons name="add-outline" size={20} color="#1DA1F2" />
            <Text style={styles.secondaryButtonText}>Submit Another</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-redirect info */}
        <Text style={styles.autoRedirectText}>
          📱 Redirecting to news feed in a few seconds...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Animation styles
  animationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  
  // Message styles
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: width - 60,
  },
  
  // Info card styles
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  
  // Submission info
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submissionLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  submissionId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1DA1F2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Button styles
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1DA1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1DA1F2',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Auto-redirect text
  autoRedirectText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default SubmitSuccessScreen;