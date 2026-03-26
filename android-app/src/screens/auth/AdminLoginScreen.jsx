import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  medicalBlue: '#0EA5E9',
  medicalGreen: '#10B981',
  medicalTeal: '#14B8A6',
  medicalPurple: '#8B5CF6',
  medicalCyan: '#06B6D4',
  gold: '#F59E0B',
  rose: '#F43F5E',
};

const premiumShadow = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

const AdminLoginScreen = ({ navigation }) => {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await adminLogin({ email, password });
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header - matching Dashboard/Leaderboard style */}
      <View
        style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...premiumShadow,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            className="active:opacity-70"
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0f172a' }}>
              Admin Login
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Restricted access for administrators only
            </Text>
          </View>
        </View>
        
        <View style={{ 
          backgroundColor: COLORS.gold, 
          width: 48, 
          height: 48, 
          borderRadius: 24, 
          alignItems: 'center', 
          justifyContent: 'center',
          ...premiumShadow,
        }}>
          <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
        </View>
      </View>

      <ScrollView 
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: '#f8fafc' }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        {/* Form Card */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 30,
              padding: 24,
              ...premiumShadow,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  backgroundColor: COLORS.gold, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="mail" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>
                  Admin Email
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Ionicons name="mail-outline" size={20} color="#64748b" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#0f172a' }}
                  placeholder="Enter admin email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  backgroundColor: COLORS.rose, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="lock-closed" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>
                  Password
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#0f172a' }}
                  placeholder="Enter password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} className="active:opacity-70">
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={handleLogin} disabled={loading} className="active:opacity-80">
              <View
                style={{
                  backgroundColor: COLORS.gold,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  ...premiumShadow,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                    Signing In...
                  </Text>
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                      Admin Sign In
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>

          {/* Warning Card */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 24,
              padding: 20,
              marginTop: 20,
              borderWidth: 2,
              borderColor: '#FDE68A',
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: COLORS.gold,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="warning" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 }}>
                  Administrator Access Only
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309', lineHeight: 18 }}>
                  This area is restricted to system administrators. Unauthorized access attempts will be logged.
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminLoginScreen;
