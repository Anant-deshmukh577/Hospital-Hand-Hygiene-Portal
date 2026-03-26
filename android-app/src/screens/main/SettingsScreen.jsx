import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { downloadMyData } from '../../utils/downloadMyData';
import { userService } from '../../services/userService';

// Medical theme colors
const COLORS = {
  medicalBlue: { primary: '#0EA5E9', light: '#E0F2FE', muted: '#BAE6FD' },
  medicalGreen: { primary: '#10B981', light: '#D1FAE5', muted: '#A7F3D0' },
  medicalTeal: { primary: '#14B8A6', light: '#CCFBF1', muted: '#99F6E4' },
  medicalPurple: { primary: '#8B5CF6', light: '#EDE9FE', muted: '#DDD6FE' },
  medicalCyan: { primary: '#06B6D4', light: '#CFFAFE', muted: '#A5F3FC' },
  gold: { primary: '#F59E0B', light: '#FEF3C7', muted: '#FDE68A' },
  rose: { primary: '#F43F5E', light: '#FFE4E6', muted: '#FECDD3' },
};

// Premium shadow style
const premiumShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
};

const SETTINGS_STORAGE_KEY = 'aiims_user_settings';

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  badgeAlerts: true,
  leaderboardUpdates: false,
  weeklyReports: true,
};

const SettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [fetchingSettings, setFetchingSettings] = useState(true);

  // Load settings from backend on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setFetchingSettings(true);
      const response = await userService.getNotificationPreferences();
      if (response.notificationPreferences) {
        setNotificationSettings(response.notificationPreferences);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      // Fallback to local storage
      try {
        const savedSettings = await SecureStore.getItemAsync(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.notificationSettings) {
            setNotificationSettings(parsed.notificationSettings);
          }
        }
      } catch (err) {
        console.error('Failed to load local settings:', err);
      }
    } finally {
      setFetchingSettings(false);
    }
  };

  const handleNotificationChange = async (name) => {
    const newValue = !notificationSettings[name];
    
    // Optimistically update UI
    setNotificationSettings(prev => ({
      ...prev,
      [name]: newValue,
    }));

    try {
      // Send update to backend
      await userService.updateNotificationPreferences({
        [name]: newValue,
      });
      
      // Also save to local storage as backup
      const settingsToSave = {
        notificationSettings: {
          ...notificationSettings,
          [name]: newValue,
        },
      };
      await SecureStore.setItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // Revert on error
      setNotificationSettings(prev => ({
        ...prev,
        [name]: !newValue,
      }));
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save to backend
      await userService.updateNotificationPreferences(notificationSettings);
      
      // Also save to local storage as backup
      const settingsToSave = {
        notificationSettings,
      };
      await SecureStore.setItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
      
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
            await SecureStore.deleteItemAsync(SETTINGS_STORAGE_KEY);
            Alert.alert('Success', 'Settings reset to defaults');
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await SecureStore.deleteItemAsync(SETTINGS_STORAGE_KEY);
              setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenHelp = () => {
    Alert.alert(
      'Help & Support',
      'For assistance, please contact:\n\nEmail: support@aiims.edu\nPhone: +91-11-26588500',
      [{ text: 'OK' }]
    );
  };

  const handleDownloadMyData = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    Alert.alert(
      'Download My Data',
      'This will download all your observation data as a CSV file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            setLoading(true);
            try {
              await downloadMyData(user.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to download data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getMemberSinceDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('en-IN', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return 'Not available';
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Premium Header - Matching Dashboard/Leaderboard Style */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
              Settings
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
              Manage your preferences
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 20 }}>
          
          {/* Account Settings - Premium Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 20,
              marginBottom: 20,
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.medicalBlue.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="person" size={20} color={COLORS.medicalBlue.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                Account Settings
              </Text>
            </View>
            
            <View>
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '700' }}>Account Type</Text>
                <View
                  style={{
                    backgroundColor: COLORS.medicalCyan.light,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ color: COLORS.medicalCyan.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
                    {user?.role || 'STAFF'}
                  </Text>
                </View>
              </View>
              
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '700' }}>Email Address</Text>
                <Text style={{ fontSize: 15, color: '#1F2937', fontWeight: '600' }}>
                  {user?.email}
                </Text>
              </View>
              
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '700' }}>Member Since</Text>
                <Text style={{ fontSize: 15, color: '#1F2937', fontWeight: '600' }}>
                  {getMemberSinceDate()}
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Settings - Premium Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 20,
              marginBottom: 20,
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.medicalPurple.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="notifications" size={20} color={COLORS.medicalPurple.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                Notifications
              </Text>
            </View>
            
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 15, color: '#1F2937', fontWeight: '700', marginBottom: 4 }}>
                    Email Notifications
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                    Receive updates via email
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.emailNotifications}
                  onValueChange={() => handleNotificationChange('emailNotifications')}
                  trackColor={{ false: '#D1D5DB', true: COLORS.medicalGreen.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 15, color: '#1F2937', fontWeight: '700', marginBottom: 4 }}>
                    Badge Achievement Alerts
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                    Get notified when you earn badges
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.badgeAlerts}
                  onValueChange={() => handleNotificationChange('badgeAlerts')}
                  trackColor={{ false: '#D1D5DB', true: COLORS.medicalGreen.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 15, color: '#1F2937', fontWeight: '700', marginBottom: 4 }}>
                    Leaderboard Updates
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                    Rank changes and updates
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.leaderboardUpdates}
                  onValueChange={() => handleNotificationChange('leaderboardUpdates')}
                  trackColor={{ false: '#D1D5DB', true: COLORS.medicalGreen.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 15, color: '#1F2937', fontWeight: '700', marginBottom: 4 }}>
                    Weekly Compliance Reports
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                    Receive weekly summaries
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.weeklyReports}
                  onValueChange={() => handleNotificationChange('weeklyReports')}
                  trackColor={{ false: '#D1D5DB', true: COLORS.medicalGreen.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </View>

          {/* Data & Privacy - Premium Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 20,
              marginBottom: 20,
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.medicalGreen.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="shield-checkmark" size={20} color={COLORS.medicalGreen.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                Data & Privacy
              </Text>
            </View>
            
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleClearCache}
                disabled={loading}
                className="active:opacity-70"
                style={{
                  backgroundColor: COLORS.rose.light,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: '#ffffff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.rose.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 4 }}>
                      Clear Cache
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                      Free up space by clearing cached data
                    </Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={handleDownloadMyData}
                disabled={loading}
                className="active:opacity-70"
                style={{
                  backgroundColor: COLORS.medicalBlue.light,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: '#ffffff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="download-outline" size={20} color={COLORS.medicalBlue.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 4 }}>
                      Download My Data
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
                      Export your observation data
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Actions - Premium Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 20,
              marginBottom: 20,
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.gold.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="flash" size={20} color={COLORS.gold.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                Quick Actions
              </Text>
            </View>
            
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleSaveSettings}
                disabled={loading}
                className="active:opacity-70"
                style={{
                  backgroundColor: COLORS.medicalCyan.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  ...premiumShadow,
                }}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleResetToDefaults}
                className="active:opacity-70"
                style={{
                  backgroundColor: '#F3F4F6',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="refresh" size={20} color="#6B7280" />
                <Text style={{ color: '#374151', fontWeight: '800', fontSize: 15 }}>
                  Reset to Defaults
                </Text>
              </Pressable>

              <Pressable
                onPress={handleOpenHelp}
                className="active:opacity-70"
                style={{
                  backgroundColor: COLORS.medicalBlue.light,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="help-circle" size={20} color={COLORS.medicalBlue.primary} />
                <Text style={{ color: COLORS.medicalBlue.primary, fontWeight: '800', fontSize: 15 }}>
                  Help & Support
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Privacy Notice - Premium Alert */}
          <View
            style={{
              backgroundColor: COLORS.gold.light,
              borderWidth: 2,
              borderColor: COLORS.gold.muted,
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="warning" size={20} color={COLORS.gold.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#92400e', marginBottom: 6 }}>
                  Privacy Notice
                </Text>
                <Text style={{ fontSize: 13, color: '#78350f', lineHeight: 18, fontWeight: '600' }}>
                  Your settings are stored locally on your device and are not shared with third parties.
                </Text>
              </View>
            </View>
          </View>

          {/* App Info - Premium Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: COLORS.medicalCyan.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="information-circle" size={20} color={COLORS.medicalCyan.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                App Information
              </Text>
            </View>
            
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>Version</Text>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '800' }}>1.0.0</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>Build</Text>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '800' }}>2024.02</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '700' }}>Platform</Text>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '800' }}>React Native</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
  );
};

export default SettingsScreen;
