import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔑 Starting login process...', { email });
      const result = await login(email, password);
      console.log('📝 Login result:', result);
      
      if (!result.success) {
        console.log('❌ Login failed:', result.error);
        Alert.alert('Login Error', result.error || 'Failed to login');
      } else {
        console.log('✅ Login successful! User will be automatically navigated to MainApp');
        // Clear form after successful login
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('💥 Unexpected error during login:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="newspaper-outline" size={48} color="#1DA1F2" />
            </View>
            <Text style={styles.welcomeText}>👋 Welcome to</Text>
            <Text style={styles.title}>NewsApp</Text>
            <Text style={styles.subtitle}>Stay informed with bias-aware news from multiple perspectives</Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="analytics-outline" size={16} color="#1DA1F2" />
                <Text style={styles.featureText}>Bias Analysis</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="people-outline" size={16} color="#1DA1F2" />
                <Text style={styles.featureText}>Community Votes</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#1DA1F2" />
                <Text style={styles.featureText}>Verified Sources</Text>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
                email && styles.inputWrapperFilled
              ]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailFocused ? "#1DA1F2" : "#9CA3AF"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
                password && styles.inputWrapperFilled
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordFocused ? "#1DA1F2" : "#9CA3AF"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (isSubmitting || isLoading) && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isSubmitting || isLoading}
              activeOpacity={0.8}
            >
              {(isSubmitting || isLoading) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to NewsApp? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Create free account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 60,
  },

  // Header Section
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1DA1F2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },

  // Form Section
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: '#1DA1F2',
    backgroundColor: '#FEFEFE',
    shadowColor: '#1DA1F2',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFilled: {
    backgroundColor: '#FEFEFE',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  eyeIcon: {
    padding: 4,
  },

  // Forgot Password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#1DA1F2',
    fontSize: 14,
    fontWeight: '500',
  },

  // Login Button
  loginButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1DA1F2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupText: {
    fontSize: 14,
    color: '#1DA1F2',
    fontWeight: '600',
  },
});

export default LoginScreen;
