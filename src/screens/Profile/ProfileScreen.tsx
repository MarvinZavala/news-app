import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

type Props = { navigation: StackNavigationProp<ProfileStackParamList, 'ProfileScreen'>; };

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { title: 'My News Stories', icon: 'newspaper-outline', screen: 'UserNewsManager' as keyof ProfileStackParamList, description: 'Manage your submitted news' },
    { title: 'Settings', icon: 'settings-outline', screen: 'Settings' as keyof ProfileStackParamList },
    { title: 'Edit Profile', icon: 'person-outline', screen: 'EditProfile' as keyof ProfileStackParamList },
    { title: 'Notifications', icon: 'notifications-outline', screen: 'Notifications' as keyof ProfileStackParamList },
    { title: 'Privacy', icon: 'shield-outline', screen: 'Privacy' as keyof ProfileStackParamList },
    { title: 'Help & Support', icon: 'help-circle-outline', screen: 'Help' as keyof ProfileStackParamList },
    { title: 'About', icon: 'information-circle-outline', screen: 'About' as keyof ProfileStackParamList },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#666" />
          </View>
          <Text style={styles.name}>{user?.displayName || 'User Name'}</Text>
          <Text style={styles.email}>{user?.email || 'user@email.com'}</Text>
        </View>
        
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.title === 'My News Stories' && styles.featuredMenuItem
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.title === 'My News Stories' ? "#1DA1F2" : "#666"}
              />
              <View style={styles.menuTextContainer}>
                <Text style={[
                  styles.menuText,
                  item.title === 'My News Stories' && styles.featuredMenuText
                ]}>
                  {item.title}
                </Text>
                {'description' in item && (
                  <Text style={styles.menuDescription}>{item.description}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', padding: 30, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  email: { fontSize: 16, color: '#666' },
  menu: { padding: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  featuredMenuItem: { backgroundColor: '#F0F9FF', borderRadius: 8, paddingHorizontal: 12, marginBottom: 8, borderBottomWidth: 0 },
  menuTextContainer: { flex: 1, marginLeft: 16 },
  menuText: { fontSize: 16, color: '#333' },
  featuredMenuText: { color: '#1DA1F2', fontWeight: '600' },
  menuDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 20, padding: 16, backgroundColor: '#FFF5F5', borderRadius: 8 },
  logoutText: { marginLeft: 8, fontSize: 16, color: '#FF4444', fontWeight: '600' },
});

export default ProfileScreen;