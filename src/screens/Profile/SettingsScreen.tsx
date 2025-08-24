import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types/navigation';

type Props = { navigation: StackNavigationProp<ProfileStackParamList, 'Settings'>; };

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const settingsItems = [
    { title: 'Account Settings', icon: 'person-circle-outline', screen: 'AccountSettings' as keyof ProfileStackParamList },
    { title: 'Change Password', icon: 'lock-closed-outline', screen: 'ChangePassword' as keyof ProfileStackParamList },
    { title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' as keyof ProfileStackParamList },
    { title: 'Privacy Settings', icon: 'shield-outline', screen: 'Privacy' as keyof ProfileStackParamList },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.settingItem} onPress={() => navigation.navigate(item.screen)}>
            <Ionicons name={item.icon as any} size={24} color="#666" />
            <Text style={styles.settingText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#333' },
});

export default SettingsScreen;