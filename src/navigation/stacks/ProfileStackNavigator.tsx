import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types/navigation';

// Screens
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import SettingsScreen from '../../screens/Profile/SettingsScreen';
import EditProfileScreen from '../../screens/Profile/EditProfileScreen';
import NotificationsScreen from '../../screens/Profile/NotificationsScreen';
import PrivacyScreen from '../../screens/Profile/PrivacyScreen';
import HelpScreen from '../../screens/Profile/HelpScreen';
import AboutScreen from '../../screens/Profile/AboutScreen';
import ChangePasswordScreen from '../../screens/Profile/ChangePasswordScreen';
import AccountSettingsScreen from '../../screens/Profile/AccountSettingsScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        options={{ 
          headerShown: false // Profile screen handles its own header
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          title: 'Notifications',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{ 
          title: 'Privacy',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ 
          title: 'Help & Support',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          title: 'About',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ 
          title: 'Change Password',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="AccountSettings" 
        component={AccountSettingsScreen}
        options={{ 
          title: 'Account Settings',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;