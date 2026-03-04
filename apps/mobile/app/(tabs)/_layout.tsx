import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ראשי',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'ארנק',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'חשבוניות',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-upload" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'הטבות',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gift" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(6,15,31,0.95)',
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
    paddingBottom: 25,
    paddingTop: 10,
    height: 85,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabBarItem: {
    paddingTop: 5,
  },
});
