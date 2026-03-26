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
import { wardService } from '../../services/wardService';
import Loader from '../../components/common/Loader';

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

const ManageWardsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wards, setWards] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);

  // Add ward form state
  const [newWard, setNewWard] = useState({
    name: '',
    capacity: '',
    floor: '',
    building: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadWards();
  }, []);

  const loadWards = async () => {
    try {
      setLoading(true);
      const response = await wardService.getWards();
      setWards(response.wards || []);
    } catch (error) {
      console.error('Error loading wards:', error);
      Alert.alert('Error', 'Failed to load wards');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWards();
    setRefreshing(false);
  };

  const handleAddWard = async () => {
    // Validate
    const errors = {};
    if (!newWard.name.trim()) errors.name = 'Ward name required';
    if (!newWard.capacity || parseInt(newWard.capacity) <= 0) errors.capacity = 'Valid capacity required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await wardService.createWard({
        ...newWard,
        capacity: parseInt(newWard.capacity),
      });
      setWards([response.ward, ...wards]);
      setShowAddModal(false);
      setNewWard({
        name: '',
        capacity: '',
        floor: '',
        building: '',
        description: '',
      });
      setFormErrors({});
      Alert.alert('Success', 'Ward added successfully');
    } catch (error) {
      console.error('Error adding ward:', error);
      Alert.alert('Error', error.message || 'Failed to add ward');
    }
  };

  const handleUpdateWard = async () => {
    if (!selectedWard) return;

    // Validate
    const errors = {};
    if (!selectedWard.name.trim()) errors.name = 'Ward name required';
    if (!selectedWard.capacity || parseInt(selectedWard.capacity) <= 0) errors.capacity = 'Valid capacity required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await wardService.updateWard(selectedWard._id, {
        name: selectedWard.name,
        capacity: parseInt(selectedWard.capacity),
        floor: selectedWard.floor,
        building: selectedWard.building,
        description: selectedWard.description,
      });
      setWards(wards.map(w => w._id === selectedWard._id ? response.ward : w));
      setShowEditModal(false);
      setSelectedWard(null);
      setFormErrors({});
      Alert.alert('Success', 'Ward updated successfully');
    } catch (error) {
      console.error('Error updating ward:', error);
      Alert.alert('Error', 'Failed to update ward');
    }
  };

  const handleDelete = async (wardId) => {
    const ward = wards.find(w => w._id === wardId);

    Alert.alert(
      'Delete Ward',
      `Are you sure you want to delete ${ward.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await wardService.deleteWard(wardId);
              setWards(wards.filter(w => w._id !== wardId));
              Alert.alert('Success', 'Ward deleted successfully');
            } catch (error) {
              console.error('Error deleting ward:', error);
              Alert.alert('Error', error.message || 'Failed to delete ward');
            }
          },
        },
      ]
    );
  };

  // Stats
  const stats = {
    total: wards.length,
    totalBeds: wards.reduce((sum, w) => sum + (w.capacity || 0), 0),
    totalObservations: wards.reduce((sum, w) => sum + (w.totalObservations || 0), 0),
    activeWards: wards.filter(w => w.isActive !== false).length,
  };

  // Ward colors
  const getWardColor = (index) => {
    const colors = [
      COLORS.medicalCyan,
      COLORS.medicalBlue,
      COLORS.medicalPurple,
      COLORS.gold,
      COLORS.rose,
      COLORS.medicalGreen,
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="Loading Wards..." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', position: 'relative' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.medicalTeal.primary} />
        }
      >
        {/* Header - Matching Dashboard/Leaderboard Style */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
                Manage Wards
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
                Configure hospital wards
              </Text>
            </View>
          </View>
        </View>

        {/* Stats - Colorful Premium Cards */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Total Wards', value: stats.total, icon: 'business', color: COLORS.medicalTeal },
              { label: 'Total Beds', value: stats.totalBeds, icon: 'bed', color: COLORS.medicalBlue },
              { label: 'Observations', value: stats.totalObservations, icon: 'clipboard', color: COLORS.medicalPurple },
              { label: 'Active Wards', value: stats.activeWards, icon: 'checkmark-circle', color: COLORS.medicalGreen },
            ].map((stat, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: stat.color.light,
                  borderRadius: 24,
                  padding: 16,
                  ...premiumShadow,
                }}
              >
                <Ionicons name={stat.icon} size={28} color={stat.color.primary} style={{ marginBottom: 10 }} />
                <Text style={{ fontSize: 24, fontWeight: '900', color: stat.color.primary, letterSpacing: -1 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 11, color: stat.color.primary, marginTop: 2, fontWeight: '700', opacity: 0.8 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Wards List - Premium Design */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {wards.length === 0 ? (
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 30,
                padding: 32,
                alignItems: 'center',
                ...premiumShadow,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.medicalTeal.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="business" size={40} color={COLORS.medicalTeal.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 8 }}>
                No wards available
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                Start by adding your first ward
              </Text>
              <Pressable
                onPress={() => setShowAddModal(true)}
                className="active:scale-95"
                style={{
                  backgroundColor: COLORS.medicalTeal.primary,
                  borderRadius: 14,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: COLORS.medicalTeal.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name="add-circle" size={18} color="white" />
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                  Create First Ward
                </Text>
              </Pressable>
            </View>
          ) : (
            wards.map((ward, index) => {
              const colors = getWardColor(index);
              return (
                <View
                  key={ward._id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 24,
                    marginBottom: 16,
                    overflow: 'hidden',
                    ...premiumShadow,
                  }}
                >
                  {/* Color Bar */}
                  <View style={{ height: 4, backgroundColor: colors.primary }} />

                  {/* Ward Content */}
                  <View style={{ padding: 16 }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 16,
                          backgroundColor: colors.light,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="business" size={28} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937', marginBottom: 6 }}>
                          {ward.name}
                        </Text>
                        <View
                          style={{
                            backgroundColor: ward.isActive !== false ? COLORS.medicalGreen.light : '#F3F4F6',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: ward.isActive !== false ? COLORS.medicalGreen.primary : '#6B7280',
                            }}
                          >
                            {ward.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                      <View
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 14,
                          backgroundColor: colors.light,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="bed" size={14} color={colors.primary} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, marginLeft: 6, letterSpacing: 0.5, opacity: 0.8 }}>
                            BEDS
                          </Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>
                          {ward.capacity}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 14,
                          backgroundColor: '#F9FAFB',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="clipboard" size={14} color="#6B7280" />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#6B7280', marginLeft: 6, letterSpacing: 0.5 }}>
                            OBS.
                          </Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: '#6B7280' }}>
                          {ward.totalObservations || 0}
                        </Text>
                      </View>
                    </View>

                    {/* Additional Info */}
                    {(ward.floor || ward.building) && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {ward.floor && (
                          <View
                            style={{
                              backgroundColor: '#F3F4F6',
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Ionicons name="layers" size={12} color="#6B7280" />
                            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700' }}>
                              {ward.floor}
                            </Text>
                          </View>
                        )}
                        {ward.building && (
                          <View
                            style={{
                              backgroundColor: '#F3F4F6',
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Ionicons name="location" size={12} color="#6B7280" />
                            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700' }}>
                              {ward.building}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Description */}
                    {ward.description && (
                      <Text
                        style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 18 }}
                        numberOfLines={2}
                      >
                        {ward.description}
                      </Text>
                    )}

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => {
                          setSelectedWard(ward);
                          setShowEditModal(true);
                        }}
                        className="active:opacity-70"
                        style={{
                          flex: 1,
                          backgroundColor: COLORS.medicalBlue.light,
                          paddingVertical: 10,
                          borderRadius: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons name="create" size={16} color={COLORS.medicalBlue.primary} />
                        <Text style={{ color: COLORS.medicalBlue.primary, fontWeight: '800', fontSize: 13 }}>
                          Edit
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(ward._id)}
                        className="active:opacity-70"
                        style={{
                          backgroundColor: COLORS.rose.light,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.rose.primary} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Ward Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>
                Add New Ward
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} className="active:opacity-70">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </View>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Ward Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                  Ward Name *
                </Text>
                <TextInput
                  placeholder="e.g., ICU, General Ward A"
                  value={newWard.name}
                  onChangeText={(text) => setNewWard({ ...newWard, name: text })}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: '#1F2937',
                  }}
                />
                {formErrors.name && (
                  <Text style={{ color: COLORS.rose.primary, fontSize: 12, marginTop: 4 }}>
                    {formErrors.name}
                  </Text>
                )}
              </View>

              {/* Capacity */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                  Bed Capacity *
                </Text>
                <TextInput
                  placeholder="e.g., 20"
                  value={newWard.capacity}
                  onChangeText={(text) => setNewWard({ ...newWard, capacity: text })}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: '#1F2937',
                  }}
                />
                {formErrors.capacity && (
                  <Text style={{ color: COLORS.rose.primary, fontSize: 12, marginTop: 4 }}>
                    {formErrors.capacity}
                  </Text>
                )}
              </View>

              {/* Floor */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                  Floor (Optional)
                </Text>
                <TextInput
                  placeholder="e.g., 3rd Floor"
                  value={newWard.floor}
                  onChangeText={(text) => setNewWard({ ...newWard, floor: text })}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: '#1F2937',
                  }}
                />
              </View>

              {/* Building */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                  Building (Optional)
                </Text>
                <TextInput
                  placeholder="e.g., Main Building"
                  value={newWard.building}
                  onChangeText={(text) => setNewWard({ ...newWard, building: text })}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: '#1F2937',
                  }}
                />
              </View>

              {/* Description */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                  Description (Optional)
                </Text>
                <TextInput
                  placeholder="Add any additional notes..."
                  value={newWard.description}
                  onChangeText={(text) => setNewWard({ ...newWard, description: text })}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: '#1F2937',
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  className="active:opacity-70"
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#6B7280' }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAddWard}
                  className="active:opacity-70"
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.medicalTeal.primary,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    shadowColor: COLORS.medicalTeal.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                    Add Ward
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Ward Modal */}
      {selectedWard && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>
                  Edit Ward
                </Text>
                <Pressable onPress={() => setShowEditModal(false)} className="active:opacity-70">
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </View>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ward Name */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                    Ward Name *
                  </Text>
                  <TextInput
                    placeholder="e.g., ICU, General Ward A"
                    value={selectedWard.name}
                    onChangeText={(text) => setSelectedWard({ ...selectedWard, name: text })}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#1F2937',
                    }}
                  />
                  {formErrors.name && (
                    <Text style={{ color: COLORS.rose.primary, fontSize: 12, marginTop: 4 }}>
                      {formErrors.name}
                    </Text>
                  )}
                </View>

                {/* Capacity */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                    Bed Capacity *
                  </Text>
                  <TextInput
                    placeholder="e.g., 20"
                    value={String(selectedWard.capacity)}
                    onChangeText={(text) => setSelectedWard({ ...selectedWard, capacity: text })}
                    keyboardType="number-pad"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#1F2937',
                    }}
                  />
                  {formErrors.capacity && (
                    <Text style={{ color: COLORS.rose.primary, fontSize: 12, marginTop: 4 }}>
                      {formErrors.capacity}
                    </Text>
                  )}
                </View>

                {/* Floor */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                    Floor (Optional)
                  </Text>
                  <TextInput
                    placeholder="e.g., 3rd Floor"
                    value={selectedWard.floor || ''}
                    onChangeText={(text) => setSelectedWard({ ...selectedWard, floor: text })}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#1F2937',
                    }}
                  />
                </View>

                {/* Building */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                    Building (Optional)
                  </Text>
                  <TextInput
                    placeholder="e.g., Main Building"
                    value={selectedWard.building || ''}
                    onChangeText={(text) => setSelectedWard({ ...selectedWard, building: text })}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#1F2937',
                    }}
                  />
                </View>

                {/* Description */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 }}>
                    Description (Optional)
                  </Text>
                  <TextInput
                    placeholder="Add any additional notes..."
                    value={selectedWard.description || ''}
                    onChangeText={(text) => setSelectedWard({ ...selectedWard, description: text })}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                      color: '#1F2937',
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setShowEditModal(false)}
                    className="active:opacity-70"
                    style={{
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#6B7280' }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdateWard}
                    className="active:opacity-70"
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.medicalTeal.primary,
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: 'center',
                      shadowColor: COLORS.medicalTeal.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                      Update Ward
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Add Button - Bottom Right */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        className="active:scale-95"
        style={{
          position: 'absolute',
          bottom: 110,
          right: 20,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORS.medicalTeal.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 10,
          zIndex: 1000,
        }}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </Pressable>
    </View>
  );
};

export default ManageWardsScreen;
