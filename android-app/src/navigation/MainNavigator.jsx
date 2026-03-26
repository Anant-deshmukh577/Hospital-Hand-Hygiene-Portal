import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import FloatingTabBar from '../components/common/FloatingTabBar';

// Import main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ObservationEntryScreen from '../screens/main/ObservationEntryScreen';
import ObservationHistoryScreen from '../screens/main/ObservationHistoryScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import RewardsScreen from '../screens/main/RewardsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Import admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ManageWardsScreen from '../screens/admin/ManageWardsScreen';
import ManageRewardsScreen from '../screens/admin/ManageRewardsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Dashboard and related screens
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
    <Stack.Screen name="ObservationEntry" component={ObservationEntryScreen} />
    <Stack.Screen name="ObservationHistory" component={ObservationHistoryScreen} />
  </Stack.Navigator>
);

// Stack navigator for Profile and related screens
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// Stack navigator for Admin Dashboard and related screens
const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboardMain" component={AdminDashboardScreen} />
    <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
    <Stack.Screen name="ManageWards" component={ManageWardsScreen} />
    <Stack.Screen name="ManageRewards" component={ManageRewardsScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator for Regular Users (Auditor/Staff)
const UserTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Tab.Screen name="Rewards" component={RewardsScreen} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Main Tab Navigator for Admin Users
const AdminTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen 
      name="AdminDashboard" 
      component={AdminStack}
      options={{ tabBarLabel: 'Dashboard' }}
    />
    <Tab.Screen name="Reports" component={ReportsScreen} />
    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Main Navigator - switches between User and Admin tabs based on role
const MainNavigator = () => {
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  return isAdmin ? <AdminTabNavigator /> : <UserTabNavigator />;
};

export default MainNavigator;
