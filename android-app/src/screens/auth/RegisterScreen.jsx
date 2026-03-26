import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENTS, DESIGNATIONS } from '../../utils/constants';

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

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);

  const handleRegister = async () => {
    const { name, email, phone, department, designation, password, confirmPassword } = formData;

    // Validation
    if (!name || !email || !phone || !department || !designation || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }

    // Validate phone number
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    try {
      await register({ 
        name, 
        email, 
        phone, 
        department, 
        designation, 
        password 
      });
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              Create Account
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Join AIIMS Hand Hygiene Initiative
            </Text>
          </View>
        </View>
        
        <View style={{ 
          backgroundColor: COLORS.medicalGreen, 
          width: 48, 
          height: 48, 
          borderRadius: 24, 
          alignItems: 'center', 
          justifyContent: 'center',
          ...premiumShadow,
        }}>
          <Ionicons name="person-add" size={24} color="#ffffff" />
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
                  backgroundColor: COLORS.medicalBlue, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="person" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Full Name *</Text>
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
                <Ionicons name="person-outline" size={20} color="#64748b" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#0f172a' }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  backgroundColor: COLORS.medicalTeal, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="mail" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Email *</Text>
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
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  backgroundColor: COLORS.medicalPurple, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="call" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Phone Number *</Text>
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
                <Ionicons name="call-outline" size={20} color="#64748b" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: '#0f172a' }}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Enter 10-digit Indian mobile number</Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  backgroundColor: COLORS.medicalCyan, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="business" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Department *</Text>
              </View>
              <Pressable
                onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="business-outline" size={20} color="#64748b" />
                  <Text style={{ marginLeft: 12, color: formData.department ? '#0f172a' : '#94a3b8', fontSize: 15 }}>
                    {formData.department || 'Select your department'}
                  </Text>
                </View>
                <Ionicons name={showDepartmentPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
              </Pressable>

              {showDepartmentPicker && (
                <View style={{ backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 14, marginTop: 8, maxHeight: 192, ...premiumShadow }}>
                  <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    {DEPARTMENTS.map((dept, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          updateField('department', dept);
                          setShowDepartmentPicker(false);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9',
                        }}
                        className="active:opacity-70"
                      >
                        <Text style={{ color: '#0f172a' }}>{dept}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

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
                  <Ionicons name="briefcase" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Designation *</Text>
              </View>
              <Pressable
                onPress={() => setShowDesignationPicker(!showDesignationPicker)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="briefcase-outline" size={20} color="#64748b" />
                  <Text style={{ marginLeft: 12, color: formData.designation ? '#0f172a' : '#94a3b8', fontSize: 15 }}>
                    {formData.designation || 'Select your designation'}
                  </Text>
                </View>
                <Ionicons name={showDesignationPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
              </Pressable>

              {showDesignationPicker && (
                <View style={{ backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 14, marginTop: 8, maxHeight: 192, ...premiumShadow }}>
                  <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    {DESIGNATIONS.map((desig, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          updateField('designation', desig);
                          setShowDesignationPicker(false);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9',
                        }}
                        className="active:opacity-70"
                      >
                        <Text style={{ color: '#0f172a' }}>{desig}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 20 }}>
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
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Password *</Text>
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
                  placeholder="Create a password"
                  placeholderTextColor="#94a3b8"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} className="active:opacity-70">
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                </Pressable>
              </View>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                Min 8 characters with uppercase, lowercase & number
              </Text>
            </View>

            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ 
                  backgroundColor: COLORS.medicalPurple, 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Confirm Password *</Text>
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
                  placeholder="Confirm your password"
                  placeholderTextColor="#94a3b8"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Pressable onPress={handleRegister} disabled={loading} className="active:opacity-80">
              <View
                style={{
                  backgroundColor: COLORS.medicalGreen,
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
                    Creating Account...
                  </Text>
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                      Create Account
                    </Text>
                  </>
                )}
              </View>
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
              <Text style={{ fontSize: 14, color: '#64748b' }}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')} className="active:opacity-70">
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.medicalGreen }}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
