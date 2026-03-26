import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userService } from '../../services/userService';
import { DEPARTMENTS, DESIGNATIONS } from '../../utils/constants';
import Loader from '../../components/common/Loader';

// ─── Design System ────────────────────────────────────────────────────────────
const COLORS = {
  medicalBlue:   { primary: '#0EA5E9', light: '#E0F2FE', muted: '#BAE6FD' },
  medicalGreen:  { primary: '#10B981', light: '#D1FAE5', muted: '#A7F3D0' },
  medicalTeal:   { primary: '#14B8A6', light: '#CCFBF1', muted: '#99F6E4' },
  medicalPurple: { primary: '#8B5CF6', light: '#EDE9FE', muted: '#DDD6FE' },
  medicalCyan:   { primary: '#06B6D4', light: '#CFFAFE', muted: '#A5F3FC' },
  gold:          { primary: '#F59E0B', light: '#FEF3C7', muted: '#FDE68A' },
  indigo:        { primary: '#6366F1', light: '#EEF2FF', muted: '#C7D2FE' },
};

const premiumShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 12,
  elevation: 5,
};

const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

// ─── Reusable Input Field ─────────────────────────────────────────────────────
const FormField = ({ label, required, error, children }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 8, letterSpacing: 0.4 }}>
      {label}{required && <Text style={{ color: COLORS.indigo.primary }}> *</Text>}
    </Text>
    {children}
    {error && (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 }}>
        <Ionicons name="alert-circle" size={12} color={COLORS.indigo.primary} />
        <Text style={{ color: COLORS.indigo.primary, fontSize: 11, fontWeight: '600' }}>{error}</Text>
      </View>
    )}
  </View>
);

const inputStyle = {
  backgroundColor: '#F8FAFF',
  borderWidth: 1.5,
  borderColor: '#E5E7EB',
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 13,
  fontSize: 14,
  color: '#1F2937',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ManageUsersScreen = () => {
  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [users, setUsers]                         = useState([]);
  const [searchQuery, setSearchQuery]             = useState('');
  const [filterRole, setFilterRole]               = useState('all');
  const [showAddModal, setShowAddModal]           = useState(false);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [selectedUser, setSelectedUser]           = useState(null);
  const [showDepartmentPicker, setShowDepartmentPicker]   = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', phone: '',
    department: '', designation: '', role: 'staff',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({ limit: 100 });
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleAddUser = async () => {
    const errors = {};
    if (!newUser.name.trim())                          errors.name       = 'Name required';
    if (!newUser.email.trim())                         errors.email      = 'Email required';
    if (!newUser.password || newUser.password.length < 8) errors.password = 'Password must be 8+ characters';
    if (!newUser.phone.trim())                         errors.phone      = 'Phone required';
    if (!newUser.department.trim())                    errors.department = 'Department required';

    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    try {
      const response = await userService.createUser(newUser);
      setUsers([response.user, ...users]);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', phone: '', department: '', designation: '', role: 'staff' });
      setFormErrors({});
      Alert.alert('Success', 'User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      setShowEditModal(false);
      setSelectedUser(null);
      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleToggleStatus = async (userId) => {
    const user = users.find(u => u._id === userId);
    const action = user.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              await userService.toggleUserStatus(userId);
              setUsers(users.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
              Alert.alert('Success', `User ${action}d successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to ${action} user`);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (userId) => {
    const user = users.find(u => u._id === userId);
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(userId);
              setUsers(users.filter(u => u._id !== userId));
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total:    users.length,
    active:   users.filter(u => u.isActive !== false).length,
    admins:   users.filter(u => u.role === 'admin').length,
    auditors: users.filter(u => u.role === 'auditor').length,
  };

  const getRoleColor = (role) => ({
    admin:   COLORS.medicalPurple,
    auditor: COLORS.medicalBlue,
    staff:   COLORS.medicalCyan,
  }[role] || COLORS.medicalCyan);

  const getRoleIcon = (role) => ({
    admin:   'shield-checkmark',
    auditor: 'eye',
    staff:   'person',
  }[role] || 'person');

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="Loading Users..." />
      </View>
    );
  }

  // ── Picker Modal (reusable) ────────────────────────────────────────────────
  const PickerModal = ({ visible, title, items, selected, onSelect, onClose }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '72%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>{title}</Text>
            <Pressable onPress={onClose}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </View>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <Pressable
                key={item}
                onPress={() => { onSelect(item); onClose(); }}
                style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ fontSize: 15, fontWeight: selected === item ? '800' : '500', color: selected === item ? COLORS.medicalPurple.primary : '#1F2937' }}>
                  {item}
                </Text>
                {selected === item && <Ionicons name="checkmark-circle" size={22} color={COLORS.medicalPurple.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.medicalPurple.primary} />}
      >

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>Manage Users</Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>Add, edit, and manage accounts</Text>
        </View>

        {/* ── STATS 2×2 COLORED CARDS ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Total Users', value: stats.total,    icon: 'people',           color: COLORS.medicalBlue },
              { label: 'Active',      value: stats.active,   icon: 'checkmark-circle', color: COLORS.medicalGreen },
            ].map((s, i) => (
              <View key={i} style={{
                flex: 1, backgroundColor: s.color.light, borderRadius: 28, padding: 20, ...premiumShadow,
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: s.color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                  shadowColor: s.color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                }}>
                  <Ionicons name={s.icon} size={21} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 26, fontWeight: '900', color: s.color.primary, letterSpacing: -1 }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: s.color.primary, marginTop: 3, fontWeight: '700', opacity: 0.7 }}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { label: 'Admins',   value: stats.admins,   icon: 'shield-checkmark', color: COLORS.medicalPurple },
              { label: 'Auditors', value: stats.auditors, icon: 'eye',              color: COLORS.gold },
            ].map((s, i) => (
              <View key={i} style={{
                flex: 1, backgroundColor: s.color.light, borderRadius: 28, padding: 20, ...premiumShadow,
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: s.color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                  shadowColor: s.color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                }}>
                  <Ionicons name={s.icon} size={21} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 26, fontWeight: '900', color: s.color.primary, letterSpacing: -1 }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: s.color.primary, marginTop: 3, fontWeight: '700', opacity: 0.7 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SEARCH & FILTER ─────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 28, padding: 18, ...premiumShadow }}>
            {/* Search bar */}
            <View style={{
              backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#F0F0F0',
              borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 14,
            }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.medicalPurple.light, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Ionicons name="search" size={16} color={COLORS.medicalPurple.primary} />
              </View>
              <TextInput
                placeholder="Search by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, paddingVertical: 11, fontSize: 14, color: '#1F2937' }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { value: 'all', label: 'All Roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'auditor', label: 'Auditor' },
                  { value: 'staff', label: 'Staff' },
                ].map((role) => (
                  <Pressable
                    key={role.value}
                    onPress={() => setFilterRole(role.value)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: filterRole === role.value ? COLORS.medicalPurple.primary : '#ffffff',
                      borderWidth: 1.5,
                      borderColor: filterRole === role.value ? COLORS.medicalPurple.primary : COLORS.medicalPurple.muted,
                    }}
                  >
                    <Text style={{
                      fontSize: 12, fontWeight: '700',
                      color: filterRole === role.value ? '#ffffff' : COLORS.medicalPurple.primary,
                    }}>
                      {role.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, fontWeight: '600' }}>
              Showing {filteredUsers.length} of {users.length} users
            </Text>
          </View>
        </View>

        {/* ── USERS LIST ──────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          {filteredUsers.length === 0 ? (
            <View style={{ backgroundColor: '#ffffff', borderRadius: 28, padding: 36, alignItems: 'center', ...premiumShadow }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.medicalBlue.light, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="people-outline" size={34} color={COLORS.medicalBlue.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 6 }}>No users found</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                {searchQuery || filterRole !== 'all' ? 'Try adjusting your filters' : 'No users have been added yet'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => {
              const roleColor = getRoleColor(user.role);
              return (
                <View key={user._id} style={{ backgroundColor: '#ffffff', borderRadius: 28, padding: 18, marginBottom: 14, ...premiumShadow }}>

                  {/* Top row: avatar + name/email + status */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    {/* Avatar with role color glow */}
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: roleColor.primary,
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                      shadowColor: roleColor.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                    }}>
                      <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 17, letterSpacing: -0.5 }}>
                        {getInitials(user.name)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>{user.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{user.email}</Text>
                    </View>

                    {/* Status badge */}
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
                      backgroundColor: user.isActive !== false ? COLORS.medicalGreen.light : '#F3F4F6',
                    }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '800',
                        color: user.isActive !== false ? COLORS.medicalGreen.primary : '#9CA3AF',
                      }}>
                        {user.isActive !== false ? '● Active' : '○ Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Department + Role pill */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 }}>
                      <Ionicons name="business-outline" size={13} color="#9CA3AF" />
                      <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }} numberOfLines={1}>
                        {user.department || 'No department'}
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      backgroundColor: roleColor.light, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
                    }}>
                      <Ionicons name={getRoleIcon(user.role)} size={12} color={roleColor.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: roleColor.primary, textTransform: 'capitalize' }}>
                        {user.role}
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => { setSelectedUser(user); setShowEditModal(true); }}
                      style={{
                        flex: 1, backgroundColor: COLORS.medicalBlue.light,
                        paddingVertical: 11, borderRadius: 16, alignItems: 'center',
                        flexDirection: 'row', justifyContent: 'center', gap: 5,
                      }}
                    >
                      <Ionicons name="create-outline" size={14} color={COLORS.medicalBlue.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.medicalBlue.primary }}>Edit Role</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleToggleStatus(user._id)}
                      style={{
                        flex: 1,
                        backgroundColor: user.isActive !== false ? COLORS.gold.light : COLORS.medicalGreen.light,
                        paddingVertical: 11, borderRadius: 16, alignItems: 'center',
                        flexDirection: 'row', justifyContent: 'center', gap: 5,
                      }}
                    >
                      <Ionicons
                        name={user.isActive !== false ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={14}
                        color={user.isActive !== false ? COLORS.gold.primary : COLORS.medicalGreen.primary}
                      />
                      <Text style={{
                        fontSize: 13, fontWeight: '800',
                        color: user.isActive !== false ? COLORS.gold.primary : COLORS.medicalGreen.primary,
                      }}>
                        {user.isActive !== false ? 'Deactivate' : 'Activate'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDelete(user._id)}
                      style={{
                        width: 44, backgroundColor: '#FEE2E2',
                        borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── ADD USER MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '92%' }}>

            {/* Modal header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>Add New User</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Fill in the details below</Text>
              </View>
              <Pressable onPress={() => setShowAddModal(false)}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={18} color="#6B7280" />
                </View>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FormField label="Name" required error={formErrors.name}>
                <TextInput placeholder="Full name" value={newUser.name}
                  onChangeText={(t) => setNewUser({ ...newUser, name: t })}
                  placeholderTextColor="#9CA3AF" style={inputStyle} />
              </FormField>

              <FormField label="Email" required error={formErrors.email}>
                <TextInput placeholder="email@example.com" value={newUser.email}
                  onChangeText={(t) => setNewUser({ ...newUser, email: t })}
                  keyboardType="email-address" autoCapitalize="none"
                  placeholderTextColor="#9CA3AF" style={inputStyle} />
              </FormField>

              <FormField label="Password" required error={formErrors.password}>
                <TextInput placeholder="Min 8 characters" value={newUser.password}
                  onChangeText={(t) => setNewUser({ ...newUser, password: t })}
                  secureTextEntry placeholderTextColor="#9CA3AF" style={inputStyle} />
              </FormField>

              <FormField label="Phone" required error={formErrors.phone}>
                <TextInput placeholder="10 digit number" value={newUser.phone}
                  onChangeText={(t) => setNewUser({ ...newUser, phone: t })}
                  keyboardType="phone-pad" maxLength={10}
                  placeholderTextColor="#9CA3AF" style={inputStyle} />
              </FormField>

              <FormField label="Department" required error={formErrors.department}>
                <Pressable onPress={() => setShowDepartmentPicker(true)}
                  style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={{ fontSize: 14, color: newUser.department ? '#1F2937' : '#9CA3AF' }}>
                    {newUser.department || 'Select department'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </Pressable>
              </FormField>

              <FormField label="Designation">
                <Pressable onPress={() => setShowDesignationPicker(true)}
                  style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={{ fontSize: 14, color: newUser.designation ? '#1F2937' : '#9CA3AF' }}>
                    {newUser.designation || 'Select designation'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </Pressable>
              </FormField>

              {/* Role selector */}
              <FormField label="Role" required>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['staff', 'auditor', 'admin'].map((role) => {
                    const rc = getRoleColor(role);
                    const active = newUser.role === role;
                    return (
                      <Pressable key={role} onPress={() => setNewUser({ ...newUser, role })}
                        style={{
                          flex: 1, paddingVertical: 12, borderRadius: 16,
                          backgroundColor: active ? rc.primary : rc.light,
                          alignItems: 'center',
                          shadowColor: active ? rc.primary : 'transparent',
                          shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: active ? 3 : 0,
                        }}>
                        <Ionicons name={getRoleIcon(role)} size={16} color={active ? '#fff' : rc.primary} style={{ marginBottom: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'capitalize', color: active ? '#fff' : rc.primary }}>
                          {role}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </FormField>

              {/* Submit buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 }}>
                <Pressable onPress={() => setShowAddModal(false)}
                  style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 15, borderRadius: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#6B7280' }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleAddUser}
                  style={{
                    flex: 1, backgroundColor: COLORS.medicalPurple.primary,
                    paddingVertical: 15, borderRadius: 16, alignItems: 'center',
                    shadowColor: COLORS.medicalPurple.primary,
                    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                  }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>Add User</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── EDIT ROLE MODAL ─────────────────────────────────────────────────── */}
      {selectedUser && (
        <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>Change User Role</Text>
                <Pressable onPress={() => setShowEditModal(false)}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </View>
                </Pressable>
              </View>

              {/* User info card */}
              <View style={{
                backgroundColor: getRoleColor(selectedUser.role).light,
                borderRadius: 20, padding: 16, marginBottom: 20,
                flexDirection: 'row', alignItems: 'center', gap: 14,
              }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: getRoleColor(selectedUser.role).primary,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: getRoleColor(selectedUser.role).primary,
                  shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3,
                }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{getInitials(selectedUser.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937' }}>{selectedUser.name}</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{selectedUser.email}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Current role:</Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: getRoleColor(selectedUser.role).primary, textTransform: 'capitalize' }}>
                      {selectedUser.role}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 12, letterSpacing: 0.4 }}>SELECT NEW ROLE</Text>

              <View style={{ gap: 10, marginBottom: 20 }}>
                {['staff', 'auditor', 'admin'].map((role) => {
                  const rc = getRoleColor(role);
                  const active = selectedUser.role === role;
                  return (
                    <Pressable key={role} onPress={() => handleUpdateRole(selectedUser._id, role)}
                      style={{
                        padding: 16, borderRadius: 20,
                        backgroundColor: active ? rc.light : '#ffffff',
                        borderWidth: 2,
                        borderColor: active ? rc.primary : '#F0F0F0',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: active ? rc.primary : rc.light, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={getRoleIcon(role)} size={20} color={active ? '#fff' : rc.primary} />
                        </View>
                        <View>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: '#1F2937', textTransform: 'capitalize' }}>{role}</Text>
                          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                            {role === 'admin' ? 'Full system access' : role === 'auditor' ? 'Record observations' : 'View personal stats'}
                          </Text>
                        </View>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color={rc.primary} />}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => setShowEditModal(false)}
                style={{ backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#6B7280' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ── PICKER MODALS ───────────────────────────────────────────────────── */}
      <PickerModal
        visible={showDepartmentPicker} title="Select Department"
        items={DEPARTMENTS} selected={newUser.department}
        onSelect={(d) => setNewUser({ ...newUser, department: d })}
        onClose={() => setShowDepartmentPicker(false)}
      />
      <PickerModal
        visible={showDesignationPicker} title="Select Designation"
        items={DESIGNATIONS} selected={newUser.designation}
        onSelect={(d) => setNewUser({ ...newUser, designation: d })}
        onClose={() => setShowDesignationPicker(false)}
      />

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        style={{
          position: 'absolute', bottom: 110, right: 20,
          width: 62, height: 62, borderRadius: 31,
          backgroundColor: COLORS.medicalPurple.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: COLORS.medicalPurple.primary,
          shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
          zIndex: 1000,
        }}
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>
    </View>
  );
};

export default ManageUsersScreen;