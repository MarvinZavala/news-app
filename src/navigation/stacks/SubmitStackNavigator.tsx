import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SubmitStackParamList } from '../../types/navigation';

// Screens
import SubmitNewsScreen from '../../screens/Submit/SubmitNewsScreen';
import SubmitPreviewScreen from '../../screens/Submit/SubmitPreviewScreen';
import SubmitSuccessScreen from '../../screens/Submit/SubmitSuccessScreen';

const Stack = createStackNavigator<SubmitStackParamList>();

export const SubmitStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 1,
          shadowOpacity: 0.1,
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="SubmitNewsScreen" 
        component={SubmitNewsScreen}
        options={{ 
          title: 'Submit News',
          headerShown: false, // Screen handles its own header for better UX
        }}
      />
      
      <Stack.Screen 
        name="SubmitPreview" 
        component={SubmitPreviewScreen}
        options={{ 
          title: 'Preview & Submit',
          headerLeft: () => null, // Prevent going back to maintain flow
        }}
      />
      
      <Stack.Screen 
        name="SubmitSuccess" 
        component={SubmitSuccessScreen}
        options={{ 
          title: 'Success',
          headerLeft: () => null, // Prevent going back after success
        }}
      />
    </Stack.Navigator>
  );
};

export default SubmitStackNavigator;