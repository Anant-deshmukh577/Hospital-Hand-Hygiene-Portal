import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Loader from '../../components/common/Loader';

// ─── Design system (exact match: all other screens) ───────────────────────────
const COLORS = {
  medicalBlue:   { primary: '#0EA5E9', light: '#E0F2FE', muted: '#BAE6FD' },
  medicalGreen:  { primary: '#10B981', light: '#D1FAE5', muted: '#A7F3D0' },
  medicalTeal:   { primary: '#14B8A6', light: '#CCFBF1', muted: '#99F6E4' },
  medicalPurple: { primary: '#8B5CF6', light: '#EDE9FE', muted: '#DDD6FE' },
  medicalCyan:   { primary: '#06B6D4', light: '#CFFAFE', muted: '#A5F3FC' },
  gold:          { primary: '#F59E0B', light: '#FEF3C7', muted: '#FDE68A' },
  rose:          { primary: '#F43F5E', light: '#FFE4E6', muted: '#FECDD3' },
  emerald:       { primary: '#059669', light: '#ECFDF5', muted: '#A7F3D0' },
  indigo:        { primary: '#6366F1', light: '#EEF2FF', muted: '#C7D2FE' },
};

const premiumShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 6,
};

const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const getComplianceColor = (rate) => {
  if (rate >= 90) return COLORS.emerald;
  if (rate >= 75) return COLORS.gold;
  return COLORS.rose;
};

// ─── Stat Card (fully colored, matches ObservationHistoryScreen) ──────────────
const StatCard = ({ icon, value, label, color }) => (
  <View style={{ flex: 1, backgroundColor: color.light, borderRadius: 30, padding: 18, alignItems: 'center', ...premiumShadow }}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      shadowColor: color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    }}>
      <Ionicons name={icon} size={22} color="#ffffff" />
    </View>
    <Text style={{ fontSize: 22, fontWeight: '900', color: color.primary, letterSpacing: -1 }}>{value}</Text>
    <Text style={{ fontSize: 11, color: color.primary, marginTop: 3, fontWeight: '700', opacity: 0.7 }}>{label}</Text>
  </View>
);

// ─── Info Row (inside profile info card) ─────────────────────────────────────
const InfoRow = ({ icon, label, value, color }) => (
  <View style={{
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: color.light, borderRadius: 20, padding: 14,
  }}>
    <View style={{
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14,
      shadowColor: color.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
    }}>
      <Ionicons name={icon} size={18} color="#ffffff" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: color.primary, letterSpacing: 0.5, marginBottom: 3 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>
        {value || 'Not specified'}
      </Text>
    </View>
  </View>
);

// ─── Styled text input for edit mode ─────────────────────────────────────────
const EditField = ({ icon, label, color, ...props }) => (
  <View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={{
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: color.light, alignItems: 'center', justifyContent: 'center', marginRight: 8,
      }}>
        <Ionicons name={icon} size={13} color={color.primary} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{label}</Text>
    </View>
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
      borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    }}>
      <TextInput
        placeholderTextColor="#9CA3AF"
        style={{ flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' }}
        {...props}
      />
    </View>
  </View>
);

// ─── Password field ───────────────────────────────────────────────────────────
const PasswordField = ({ label, icon, value, onChangeText, placeholder, visible, onToggle }) => (
  <View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={{
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: COLORS.medicalPurple.light, alignItems: 'center', justifyContent: 'center', marginRight: 8,
      }}>
        <Ionicons name={icon} size={13} color={COLORS.medicalPurple.primary} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{label}</Text>
    </View>
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
      borderRadius: 16, paddingHorizontal: 14,
    }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={!visible}
        style={{ flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500', paddingVertical: 12 }}
      />
      <Pressable onPress={onToggle} style={{ padding: 6 }}>
        <Ionicons name={visible ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
      </Pressable>
    </View>
  </View>
);

// ══════════════════════════════════════════════════════════════════════════════
const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const isOAuthUser = user?.googleId || user?.facebookId;

  const [loading, setLoading]                       = useState(false);
  const [refreshing, setRefreshing]                 = useState(false);
  const [editMode, setEditMode]                     = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileImage, setProfileImage]             = useState(null);

  const [showPassword, setShowPassword] = useState({
    currentPassword: false, newPassword: false, confirmPassword: false,
  });

  const [formData, setFormData] = useState({
    name: user?.name || '', phone: user?.phone || '',
    department: user?.department || '', designation: user?.designation || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => { loadProfileImage(); }, [user]);

  const loadProfileImage = () => {
    if (user?.avatar) setProfileImage(user.avatar);
    else if (user?.profilePicture) setProfileImage(user.profilePicture);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await userService.getProfile();
      if (response.user) updateUser(response.user);
      loadProfileImage();
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, [updateUser]);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        setProfileImage(result.assets[0].uri);
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setLoading(true);
      const filename  = imageUri.split('/').pop();
      const match     = /\.(\w+)$/.exec(filename);
      const ext       = match ? match[1].toLowerCase() : 'jpg';
      const mimeTypes = { png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
      const mimeType  = mimeTypes[ext] || 'image/jpeg';

      const fd = new FormData();
      fd.append('file', { uri: imageUri, name: filename || 'avatar.jpg', type: mimeType });
      fd.append('upload_preset', 'ml_default');
      fd.append('folder', 'aiims-avatars');

      const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dymcklg2j/image/upload', {
        method: 'POST', body: fd, headers: { Accept: 'application/json' },
      });
      if (!cloudRes.ok) { const e = await cloudRes.json(); throw new Error(e.error?.message || 'Upload failed'); }
      const { secure_url } = await cloudRes.json();

      const userId   = user?.id || user?._id;
      if (!userId) throw new Error('User ID not found');
      const response = await userService.updateAvatarUrl(userId, secure_url);

      if (response.success && response.user) {
        updateUser(response.user);
        setProfileImage(response.user.avatar);
        Alert.alert('Success', 'Profile picture updated successfully');
      } else throw new Error(response.message || 'Update failed');
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture.');
      loadProfileImage();
    } finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const userId  = user?.id || user?._id;
      const updated = await userService.updateProfile(userId, formData);
      if (updated.user) {
        updateUser(updated.user);
        Alert.alert('Success', 'Profile updated successfully');
        setEditMode(false);
      }
    } catch (e) { Alert.alert('Error', e.message || 'Failed to update profile'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!isOAuthUser && !passwordData.currentPassword) { Alert.alert('Error', 'Please enter your current password'); return; }
    if (!passwordData.newPassword) { Alert.alert('Error', 'Please enter a new password'); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { Alert.alert('Error', 'New passwords do not match'); return; }
    if (passwordData.newPassword.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(passwordData.newPassword) || !/[a-z]/.test(passwordData.newPassword) || !/\d/.test(passwordData.newPassword)) {
      Alert.alert('Invalid Password', 'Password must contain uppercase, lowercase, and a number'); return;
    }
    setLoading(true);
    try {
      const payload = isOAuthUser
        ? { newPassword: passwordData.newPassword }
        : { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword };
      await userService.changePassword(payload);
      Alert.alert('Success', isOAuthUser ? 'Password set successfully!' : 'Password changed successfully');
      setPasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword({ currentPassword: false, newPassword: false, confirmPassword: false });
    } catch (e) { Alert.alert('Error', e.message || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading && !editMode && !passwordModalVisible) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  const complianceColor = getComplianceColor(user?.complianceRate || 0);

  // Info rows config
  const infoRows = [
    { icon: 'person',   label: 'Full Name',   value: user?.name,        color: COLORS.medicalBlue },
    { icon: 'mail',     label: 'Email',       value: user?.email,       color: COLORS.indigo },
    { icon: 'call',     label: 'Phone',       value: user?.phone,       color: COLORS.medicalTeal },
    { icon: 'business', label: 'Department',  value: user?.department,  color: COLORS.medicalPurple },
    { icon: 'briefcase',label: 'Designation', value: user?.designation, color: COLORS.medicalCyan },
    ...(user?.ward ? [{ icon: 'medical', label: 'Ward', value: user.ward, color: COLORS.emerald }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.medicalBlue.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>Profile</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>Your account details</Text>
            </View>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: COLORS.medicalBlue.light, alignItems: 'center', justifyContent: 'center',
              shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
            }}>
              <Ionicons name="person" size={28} color={COLORS.medicalBlue.primary} />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ── Avatar Card ── */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 28, marginBottom: 16, alignItems: 'center', ...premiumShadow }}>

            {/* Avatar */}
            <View style={{ position: 'relative', marginBottom: 20 }}>
              {/* Outer ring */}
              <View style={{
                width: 132, height: 132, borderRadius: 66,
                backgroundColor: COLORS.medicalBlue.light,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
              }}>
                {/* Inner avatar */}
                <View style={{
                  width: 116, height: 116, borderRadius: 58,
                  backgroundColor: COLORS.medicalBlue.light,
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  borderWidth: 3, borderColor: '#ffffff',
                }}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 44, fontWeight: '900', color: COLORS.medicalBlue.primary }}>
                      {getInitials(user?.name)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Camera button */}
              <Pressable
                onPress={handlePickImage}
                style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: COLORS.medicalBlue.primary,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 3, borderColor: '#ffffff',
                  shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
                }}
              >
                <Ionicons name="camera" size={17} color="#ffffff" />
              </Pressable>
            </View>

            {/* Name */}
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#1F2937', letterSpacing: -0.8, textAlign: 'center', marginBottom: 6 }}>
              {user?.name}
            </Text>

            {/* Email */}
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, textAlign: 'center' }}>
              {user?.email}
            </Text>

            {/* Role badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: COLORS.medicalBlue.light, borderRadius: 20,
              paddingHorizontal: 18, paddingVertical: 9,
              borderWidth: 1.5, borderColor: COLORS.medicalBlue.muted,
            }}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.medicalBlue.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.medicalBlue.primary, textTransform: 'capitalize', letterSpacing: 0.3 }}>
                {user?.role || 'Staff'}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ width: '100%', height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 }} />

            {/* Quick stats row inside avatar card */}
            <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
              {[
                { icon: 'star',           value: user?.totalPoints || 0,       label: 'Points',     color: COLORS.gold },
                { icon: 'checkmark-circle', value: `${user?.complianceRate || 0}%`, label: 'Compliance', color: complianceColor },
                { icon: 'trophy',         value: `#${user?.rank || '-'}`,       label: 'Rank',       color: COLORS.medicalPurple },
              ].map(s => (
                <View key={s.label} style={{
                  flex: 1, backgroundColor: s.color.light, borderRadius: 20, padding: 14, alignItems: 'center',
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: s.color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                    shadowColor: s.color.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
                  }}>
                    <Ionicons name={s.icon} size={18} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: s.color.primary, letterSpacing: -0.5 }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, color: s.color.primary, fontWeight: '700', opacity: 0.7, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Profile Information Card ── */}
          {!editMode ? (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 22, marginBottom: 16, ...premiumShadow }}>
              {/* Section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: COLORS.medicalTeal.light, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    shadowColor: COLORS.medicalTeal.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
                  }}>
                    <Ionicons name="id-card-outline" size={22} color={COLORS.medicalTeal.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.4 }}>Information</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Your profile details</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setEditMode(true)}
                  style={{
                    backgroundColor: COLORS.medicalBlue.primary, borderRadius: 20,
                    paddingHorizontal: 18, paddingVertical: 10,
                    shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Edit</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10 }}>
                {infoRows.map((row, i) => (
                  <InfoRow key={i} {...row} />
                ))}
              </View>
            </View>
          ) : (
            /* ── Edit Mode Card ── */
            <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 22, marginBottom: 16, ...premiumShadow }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: COLORS.medicalBlue.light, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons name="create-outline" size={22} color={COLORS.medicalBlue.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.4 }}>Edit Profile</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Update your details</Text>
                </View>
              </View>

              <View style={{ gap: 16 }}>
                <EditField icon="person"    label="Full Name"   color={COLORS.medicalBlue}   value={formData.name}        onChangeText={t => setFormData({ ...formData, name: t })}        placeholder="Enter your name" />
                <EditField icon="call"      label="Phone"       color={COLORS.medicalTeal}   value={formData.phone}       onChangeText={t => setFormData({ ...formData, phone: t })}       placeholder="Enter your phone" keyboardType="phone-pad" />
                <EditField icon="business"  label="Department"  color={COLORS.medicalPurple} value={formData.department}  onChangeText={t => setFormData({ ...formData, department: t })}  placeholder="Enter your department" />
                <EditField icon="briefcase" label="Designation" color={COLORS.medicalCyan}   value={formData.designation} onChangeText={t => setFormData({ ...formData, designation: t })} placeholder="Enter your designation" />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Pressable
                  onPress={() => {
                    setEditMode(false);
                    setFormData({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '', designation: user?.designation || '' });
                  }}
                  style={{
                    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
                    paddingVertical: 15, alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#6B7280', fontWeight: '800', fontSize: 14 }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveProfile}
                  disabled={loading}
                  style={{
                    flex: 1, backgroundColor: COLORS.medicalBlue.primary, borderRadius: 20,
                    paddingVertical: 15, alignItems: 'center',
                    opacity: loading ? 0.6 : 1,
                    shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View style={{ gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Change Password', sublabel: 'Update your account password', icon: 'lock-closed',  color: COLORS.medicalPurple, action: () => setPasswordModalVisible(true) },
              { label: 'Settings',        sublabel: 'App preferences & notifications', icon: 'settings',  color: COLORS.medicalTeal,   action: () => navigation.navigate('Settings') },
              { label: 'Logout',          sublabel: 'Sign out of your account',      icon: 'log-out',     color: COLORS.rose,          action: handleLogout, isDestructive: true },
            ].map((item, i) => (
              <Pressable
                key={i}
                onPress={item.action}
                style={{
                  backgroundColor: '#ffffff', borderRadius: 26, padding: 18,
                  flexDirection: 'row', alignItems: 'center', ...premiumShadow,
                }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: item.color.light, alignItems: 'center', justifyContent: 'center', marginRight: 16,
                  shadowColor: item.color.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
                }}>
                  <Ionicons name={item.icon} size={24} color={item.color.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: item.isDestructive ? item.color.primary : '#1F2937', letterSpacing: -0.2 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.sublabel}</Text>
                </View>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: item.color.light, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="chevron-forward" size={16} color={item.color.primary} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* ── App version footer ── */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 11, color: '#D1D5DB', fontWeight: '600' }}>AIIMS Hygiene Audit · v1.0.0</Text>
          </View>

        </View>
      </ScrollView>

      {/* ══ Change Password Modal ══════════════════════════════════════════════ */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: '#F8F9FA', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '90%' }}>

            {/* Modal handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />

            {/* Modal header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: COLORS.medicalPurple.light, alignItems: 'center', justifyContent: 'center', marginRight: 14,
                }}>
                  <Ionicons name="lock-closed" size={24} color={COLORS.medicalPurple.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1F2937', letterSpacing: -0.6 }}>
                    {isOAuthUser ? 'Set Password' : 'Change Password'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Keep your account secure</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setPasswordModalVisible(false)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 20, marginBottom: 16, ...premiumShadow }}>

                {/* OAuth banner */}
                {isOAuthUser && (
                  <View style={{
                    backgroundColor: COLORS.medicalBlue.light, borderRadius: 20, padding: 16,
                    borderWidth: 1.5, borderColor: COLORS.medicalBlue.muted, marginBottom: 20,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: COLORS.medicalBlue.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                      }}>
                        <Ionicons name="information-circle" size={20} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1F2937', marginBottom: 4 }}>Google Account</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>
                          Set a password to also enable email/password login.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Password fields */}
                <View style={{ gap: 16 }}>
                  {[
                    ...(!isOAuthUser ? [{ label: 'Current Password', key: 'currentPassword', placeholder: 'Enter current password', icon: 'lock-closed' }] : []),
                    { label: 'New Password',     key: 'newPassword',     placeholder: 'Enter new password',     icon: 'key' },
                    { label: 'Confirm Password', key: 'confirmPassword', placeholder: 'Confirm new password',    icon: 'checkmark-circle' },
                  ].map(f => (
                    <PasswordField
                      key={f.key}
                      label={f.label}
                      icon={f.icon}
                      value={passwordData[f.key]}
                      onChangeText={t => setPasswordData({ ...passwordData, [f.key]: t })}
                      placeholder={f.placeholder}
                      visible={showPassword[f.key]}
                      onToggle={() => setShowPassword({ ...showPassword, [f.key]: !showPassword[f.key] })}
                    />
                  ))}
                </View>
              </View>

              {/* Requirements card */}
              <View style={{
                backgroundColor: COLORS.gold.light, borderRadius: 30, padding: 20, marginBottom: 20,
                borderWidth: 1.5, borderColor: COLORS.gold.muted, ...softShadow,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: COLORS.gold.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10,
                  }}>
                    <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.gold.primary, letterSpacing: 0.3 }}>
                    PASSWORD REQUIREMENTS
                  </Text>
                </View>
                {[
                  'At least 8 characters',
                  'One uppercase and one lowercase letter',
                  'At least one number',
                ].map((req, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.gold.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    </View>
                    <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '600' }}>{req}</Text>
                  </View>
                ))}
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => { setPasswordModalVisible(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                  style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: '#6B7280', fontWeight: '800', fontSize: 14 }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleChangePassword}
                  disabled={loading}
                  style={{
                    flex: 1, backgroundColor: COLORS.medicalPurple.primary, borderRadius: 20,
                    paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                    opacity: loading ? 0.6 : 1,
                    shadowColor: COLORS.medicalPurple.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
                  }}
                >
                  {loading
                    ? <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                        {isOAuthUser ? 'Setting...' : 'Updating...'}
                      </Text>
                    : <>
                        <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                          {isOAuthUser ? 'Set Password' : 'Update'}
                        </Text>
                      </>
                  }
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;