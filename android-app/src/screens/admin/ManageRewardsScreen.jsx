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
import { rewardService } from '../../services/rewardService';
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

const ManageRewardsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [pendingRewards, setPendingRewards] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedUserReward, setSelectedUserReward] = useState(null);
  const [approvalType, setApprovalType] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    pointsRequired: '',
    icon: '🎁',
  });
  const [formErrors, setFormErrors] = useState({});

  const emojiOptions = [
    '🎁', '🎀', '🎉', '🎊', '🎈', '🎆', '🎇', '✨', '💝', '🎗️',
    '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💎', '💍', '📜',
    '⭐', '🌟', '💫', '✨', '🌠', '⚡', '🔥', '💥', '🎯', '🎪',
    '☕', '🍕', '🍔', '🍟', '🍿', '🍩', '🍪', '🍰', '🧁', '🍦',
    '🥤', '🧃', '🍹', '🥗', '🍱', '🍜', '🍝', '🍛', '🍲', '🥘',
    '💰', '💵', '💴', '💶', '💷', '💳', '🪙', '💸', '🤑', '💲',
    '🎮', '🎲', '🎰', '🎳', '🎯', '🎪', '🎭', '🎬', '🎤', '🎧',
    '🎸', '🎹', '🎺', '🎻', '🥁', '🎨', '🖼️', '📚', '📖', '✏️',
    '✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
    '🚐', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🚁', '🛩️',
    '⛵', '🚤', '⛴️', '🛳️', '🚢', '🏖️', '🏝️', '🏔️', '⛰️', '🏕️',
    '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '📹', '🎥',
    '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '⏰', '⏱️', '⏲️',
    '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌱', '🌿', '🍀',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
    '❤️', '💛', '💚', '💙', '💜', '🧡', '🖤', '🤍', '🤎', '💕',
    '💖', '💗', '💓', '💞', '💝', '❣️', '💟', '☮️', '✝️', '☪️',
    '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
    '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
  ];

  useEffect(() => {
    loadRewards();
    loadPendingRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const response = await rewardService.getRewards();
      setRewards(response.rewards || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRewards = async () => {
    try {
      const response = await rewardService.getPendingRewards();
      setPendingRewards(response.rewards || []);
    } catch (error) {
      console.error('Error loading pending rewards:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRewards(), loadPendingRewards()]);
    setRefreshing(false);
  };

  const handleAddReward = async () => {
    const errors = {};
    if (!newReward.title.trim()) errors.title = 'Title required';
    if (!newReward.pointsRequired || parseInt(newReward.pointsRequired) <= 0) {
      errors.pointsRequired = 'Valid points required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await rewardService.createReward({
        ...newReward,
        pointsRequired: parseInt(newReward.pointsRequired),
      });
      setRewards([response.reward, ...rewards]);
      setShowAddModal(false);
      setNewReward({
        title: '',
        description: '',
        pointsRequired: '',
        icon: '🎁',
      });
      setFormErrors({});
      Alert.alert('Success', 'Reward added successfully');
    } catch (error) {
      console.error('Error adding reward:', error);
      Alert.alert('Error', error.message || 'Failed to add reward');
    }
  };

  const handleUpdateReward = async () => {
    if (!selectedReward) return;

    const errors = {};
    if (!selectedReward.title.trim()) errors.title = 'Title required';
    if (!selectedReward.pointsRequired || parseInt(selectedReward.pointsRequired) <= 0) {
      errors.pointsRequired = 'Valid points required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await rewardService.updateReward(selectedReward._id, {
        title: selectedReward.title,
        description: selectedReward.description,
        pointsRequired: parseInt(selectedReward.pointsRequired),
        icon: selectedReward.icon,
      });
      setRewards(rewards.map(r => r._id === selectedReward._id ? response.reward : r));
      setShowEditModal(false);
      setSelectedReward(null);
      setFormErrors({});
      Alert.alert('Success', 'Reward updated successfully');
    } catch (error) {
      console.error('Error updating reward:', error);
      Alert.alert('Error', 'Failed to update reward');
    }
  };

  const handleDelete = async (rewardId) => {
    const reward = rewards.find(r => r._id === rewardId);

    Alert.alert(
      'Delete Reward',
      `Are you sure you want to delete "${reward.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await rewardService.deleteReward(rewardId);
              setRewards(rewards.filter(r => r._id !== rewardId));
              Alert.alert('Success', 'Reward deleted successfully');
            } catch (error) {
              console.error('Error deleting reward:', error);
              Alert.alert('Error', error.message || 'Failed to delete reward');
            }
          },
        },
      ]
    );
  };

  const handleOpenApprovalModal = (userReward, type) => {
    setSelectedUserReward(userReward);
    setApprovalType(type);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const handleCloseApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedUserReward(null);
    setApprovalNotes('');
    setApprovalType('');
  };

  const handleConfirmApproval = async () => {
    if (!selectedUserReward) return;

    if (approvalType === 'reject' && !approvalNotes.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      if (approvalType === 'approve') {
        await rewardService.approveReward(selectedUserReward._id, approvalNotes);
        Alert.alert('Success', 'Reward approved successfully! Reward code generated.');
      } else {
        const response = await rewardService.rejectReward(selectedUserReward._id, approvalNotes);
        Alert.alert('Success', `Reward rejected. ${response.refundedPoints} points refunded to user.`);
      }
      await loadPendingRewards();
      handleCloseApprovalModal();
    } catch (error) {
      console.error('Error processing reward:', error);
      Alert.alert('Error', error.message || 'Failed to process reward');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: rewards.length,
    active: rewards.filter(r => r.isActive !== false).length,
    totalClaims: rewards.reduce((sum, r) => sum + (r.claimedCount || 0), 0),
    pending: pendingRewards.length,
  };

  const getTierColor = (points) => {
    if (points >= 500) return { ...COLORS.medicalPurple, label: 'Legendary', icon: 'trophy' };
    if (points >= 300) return { ...COLORS.gold, label: 'Epic', icon: 'star' };
    if (points >= 150) return { ...COLORS.medicalBlue, label: 'Rare', icon: 'diamond' };
    return { ...COLORS.medicalCyan, label: 'Common', icon: 'gift' };
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="Loading Rewards..." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', position: 'relative' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold.primary} />
        }
      >
        {/* Header - Matching Dashboard/Leaderboard Style */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
                Manage Rewards
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
                Set up rewards and incentives
              </Text>
            </View>
          </View>
        </View>

        {/* Stats - Colorful Premium Cards */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Pending', value: stats.pending, icon: 'time', color: COLORS.gold },
              { label: 'Total Rewards', value: stats.total, icon: 'gift', color: COLORS.medicalCyan },
              { label: 'Active', value: stats.active, icon: 'checkmark-circle', color: COLORS.medicalGreen },
              { label: 'Total Claims', value: stats.totalClaims, icon: 'people', color: COLORS.medicalPurple },
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

        {/* Tab Selector */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 16, padding: 4, gap: 4 }}>
            <Pressable
              onPress={() => setActiveTab('pending')}
              className="active:scale-98"
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: activeTab === 'pending' ? '#ffffff' : 'transparent',
                shadowColor: activeTab === 'pending' ? '#0f172a' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: activeTab === 'pending' ? 0.08 : 0,
                shadowRadius: 8,
                elevation: activeTab === 'pending' ? 2 : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons
                  name="time"
                  size={16}
                  color={activeTab === 'pending' ? COLORS.gold.primary : '#64748b'}
                />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: activeTab === 'pending' ? COLORS.gold.primary : '#64748b'
                }}>
                  Pending
                </Text>
                {pendingRewards.length > 0 && (
                  <View style={{
                    backgroundColor: activeTab === 'pending' ? COLORS.gold.primary : '#94a3b8',
                    borderRadius: 9999,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                      {pendingRewards.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('catalog')}
              className="active:scale-98"
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: activeTab === 'catalog' ? '#ffffff' : 'transparent',
                shadowColor: activeTab === 'catalog' ? '#0f172a' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: activeTab === 'catalog' ? 0.08 : 0,
                shadowRadius: 8,
                elevation: activeTab === 'catalog' ? 2 : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons
                  name="grid"
                  size={16}
                  color={activeTab === 'catalog' ? COLORS.medicalCyan.primary : '#64748b'}
                />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: activeTab === 'catalog' ? COLORS.medicalCyan.primary : '#64748b'
                }}>
                  Catalog
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Content based on active tab */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {activeTab === 'pending' ? (
            // Pending Rewards Tab
            pendingRewards.length === 0 ? (
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
                    backgroundColor: COLORS.medicalGreen.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={40} color={COLORS.medicalGreen.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 8 }}>
                  All Caught Up!
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                  No pending reward approvals at the moment.
                </Text>
              </View>
            ) : (
              pendingRewards.map((userReward) => (
                <View
                  key={userReward._id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 24,
                    marginBottom: 16,
                    overflow: 'hidden',
                    ...premiumShadow,
                  }}
                >
                  {/* Gold indicator bar */}
                  <View style={{ height: 4, backgroundColor: COLORS.gold.primary }} />

                  <View style={{ padding: 16 }}>
                    {/* Reward Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 16,
                          backgroundColor: COLORS.gold.light,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 32 }}>{userReward.reward?.icon || '🎁'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 4 }}>
                          {userReward.reward?.title || 'Reward'}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: COLORS.gold.light,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.gold.primary }}>
                            PENDING APPROVAL
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* User Details */}
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                        <Ionicons name="person" size={16} color={COLORS.medicalBlue.primary} />
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937' }}>
                          {userReward.user?.name || 'Unknown'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                        <Ionicons name="mail" size={16} color="#64748b" />
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                          {userReward.user?.email || 'N/A'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="business" size={16} color="#64748b" />
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                          {userReward.user?.department || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Points and Date */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                      <View>
                        <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Points Spent</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="star" size={16} color={COLORS.gold.primary} />
                          <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.gold.primary }}>
                            {userReward.pointsSpent}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Claimed On</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1F2937' }}>
                          {formatDate(userReward.claimedAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable
                        onPress={() => handleOpenApprovalModal(userReward, 'approve')}
                        className="active:opacity-70"
                        style={{
                          flex: 1,
                          backgroundColor: COLORS.medicalGreen.primary,
                          paddingVertical: 12,
                          borderRadius: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                          Approve
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleOpenApprovalModal(userReward, 'reject')}
                        className="active:opacity-70"
                        style={{
                          flex: 1,
                          backgroundColor: COLORS.rose.light,
                          paddingVertical: 12,
                          borderRadius: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Ionicons name="close-circle" size={18} color={COLORS.rose.primary} />
                        <Text style={{ color: COLORS.rose.primary, fontWeight: '800', fontSize: 14 }}>
                          Reject
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )
          ) : (
            // Rewards Catalog Tab
            rewards.length === 0 ? (
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
                    backgroundColor: COLORS.gold.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="gift" size={40} color={COLORS.gold.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 8 }}>
                  No rewards available
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                  Create your first reward to motivate staff members
                </Text>
                <Pressable
                  onPress={() => setShowAddModal(true)}
                  className="active:scale-95"
                  style={{
                    backgroundColor: COLORS.gold.primary,
                    borderRadius: 14,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    shadowColor: COLORS.gold.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Ionicons name="add-circle" size={18} color="white" />
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                    Create First Reward
                  </Text>
                </Pressable>
              </View>
            ) : (
              rewards.map((reward) => {
                const tier = getTierColor(reward.pointsRequired);
                return (
                  <View
                    key={reward._id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 24,
                      marginBottom: 16,
                      overflow: 'hidden',
                      ...premiumShadow,
                    }}
                  >
                    {/* Color Bar */}
                    <View style={{ height: 4, backgroundColor: tier.primary }} />

                    {/* Reward Content */}
                    <View style={{ padding: 16 }}>
                      {/* Header with Icon */}
                      <View style={{ alignItems: 'center', marginBottom: 14 }}>
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                            backgroundColor: tier.light,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                          }}
                        >
                          <Text style={{ fontSize: 48 }}>{reward.icon || '🎁'}</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 6 }}>
                          {reward.title}
                        </Text>
                        {reward.description && (
                          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 }} numberOfLines={2}>
                            {reward.description}
                          </Text>
                        )}
                      </View>

                      {/* Points Badge */}
                      <View style={{ alignItems: 'center', marginBottom: 14 }}>
                        <View
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 14,
                            backgroundColor: tier.light,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Ionicons name="star" size={18} color={tier.primary} />
                          <Text style={{ fontSize: 18, fontWeight: '900', color: tier.primary }}>
                            {reward.pointsRequired} points
                          </Text>
                        </View>
                      </View>

                      {/* Tier & Stats Row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: tier.light,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Ionicons name={tier.icon} size={12} color={tier.primary} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: tier.primary, letterSpacing: 0.5 }}>
                            {tier.label.toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="people" size={14} color="#64748b" />
                          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                            {reward.claimedCount || 0} claims
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View style={{ alignItems: 'center', marginBottom: 14 }}>
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: reward.isActive !== false ? COLORS.medicalGreen.light : '#F3F4F6',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Ionicons
                            name={reward.isActive !== false ? 'checkmark-circle' : 'close-circle'}
                            size={12}
                            color={reward.isActive !== false ? COLORS.medicalGreen.primary : '#6B7280'}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: reward.isActive !== false ? COLORS.medicalGreen.primary : '#6B7280',
                              letterSpacing: 0.5,
                            }}
                          >
                            {reward.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable
                          onPress={() => {
                            setSelectedReward(reward);
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
                          onPress={() => handleDelete(reward._id)}
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
            )
          )}
        </View>
      </ScrollView>

      {/* Add Reward Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937' }}>Add New Reward</Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="active:opacity-70"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Icon Selection */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: COLORS.gold.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="happy" size={18} color={COLORS.gold.primary} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937' }}>Choose Icon</Text>
                </View>
                <View style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -6 }}
                    contentContainerStyle={{ paddingHorizontal: 6 }}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: emojiOptions.length / 3 * 56, gap: 8 }}>
                      {emojiOptions.map((emoji, index) => (
                        <Pressable
                          key={`emoji-add-${index}`}
                          onPress={() => setNewReward({ ...newReward, icon: emoji })}
                          className="active:scale-95"
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: newReward.icon === emoji ? COLORS.gold.primary : 'transparent',
                            backgroundColor: newReward.icon === emoji ? COLORS.gold.light : '#ffffff',
                          }}
                        >
                          <Text style={{ fontSize: 24 }}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center', fontWeight: '600' }}>
                    ← Swipe to see more emojis →
                  </Text>
                </View>
              </View>

              {/* Title */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="text" size={16} color={COLORS.medicalBlue.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Reward Title *</Text>
                </View>
                <TextInput
                  placeholder="e.g., Coffee Voucher"
                  placeholderTextColor="#9CA3AF"
                  value={newReward.title}
                  onChangeText={(text) => setNewReward({ ...newReward, title: text })}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 2,
                    borderColor: formErrors.title ? COLORS.rose.primary : '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: '#1F2937',
                    fontWeight: '600',
                  }}
                />
                {formErrors.title && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.rose.primary} />
                    <Text style={{ color: COLORS.rose.primary, fontSize: 12, fontWeight: '600' }}>{formErrors.title}</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="document-text" size={16} color={COLORS.medicalPurple.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Description</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>(Optional)</Text>
                </View>
                <TextInput
                  placeholder="Describe the reward..."
                  placeholderTextColor="#9CA3AF"
                  value={newReward.description}
                  onChangeText={(text) => setNewReward({ ...newReward, description: text })}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 2,
                    borderColor: '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 14,
                    color: '#1F2937',
                    textAlignVertical: 'top',
                    minHeight: 80,
                  }}
                />
              </View>

              {/* Points Required */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="star" size={16} color={COLORS.gold.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Points Required *</Text>
                </View>
                <TextInput
                  placeholder="e.g., 100"
                  placeholderTextColor="#9CA3AF"
                  value={newReward.pointsRequired}
                  onChangeText={(text) => setNewReward({ ...newReward, pointsRequired: text })}
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 2,
                    borderColor: formErrors.pointsRequired ? COLORS.rose.primary : '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: '#1F2937',
                    fontWeight: '600',
                  }}
                />
                {formErrors.pointsRequired && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.rose.primary} />
                    <Text style={{ color: COLORS.rose.primary, fontSize: 12, fontWeight: '600' }}>{formErrors.pointsRequired}</Text>
                  </View>
                )}
              </View>

              {/* Preview Card */}
              <View style={{
                backgroundColor: COLORS.gold.light,
                borderRadius: 20,
                padding: 20,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: COLORS.gold.muted,
                ...premiumShadow,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Ionicons name="eye" size={16} color={COLORS.gold.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.gold.primary, letterSpacing: 0.5 }}>PREVIEW</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    ...premiumShadow,
                  }}>
                    <Text style={{ fontSize: 40 }}>{newReward.icon}</Text>
                  </View>
                  <Text style={{ fontWeight: '900', color: '#1F2937', marginBottom: 6, fontSize: 17 }}>
                    {newReward.title || 'Reward Title'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 12, lineHeight: 18 }}>
                    {newReward.description || 'Reward description will appear here'}
                  </Text>
                  <View style={{
                    backgroundColor: COLORS.gold.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Ionicons name="star" size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 16 }}>
                      {newReward.pointsRequired || '0'} points
                    </Text>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  className="active:opacity-70"
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                  <Text style={{ color: '#374151', fontWeight: '800', fontSize: 15 }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddReward}
                  className="active:opacity-70"
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.gold.primary,
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    ...premiumShadow,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Add Reward</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Reward Modal */}
      {selectedReward && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937' }}>Edit Reward</Text>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  className="active:opacity-70"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Icon Selection */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: COLORS.gold.light,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="happy" size={18} color={COLORS.gold.primary} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937' }}>Choose Icon</Text>
                  </View>
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: -6 }}
                      contentContainerStyle={{ paddingHorizontal: 6 }}
                    >
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: emojiOptions.length / 3 * 56, gap: 8 }}>
                        {emojiOptions.map((emoji, index) => (
                          <Pressable
                            key={`emoji-edit-${index}`}
                            onPress={() => setSelectedReward({ ...selectedReward, icon: emoji })}
                            className="active:scale-95"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 2,
                              borderColor: selectedReward.icon === emoji ? COLORS.gold.primary : 'transparent',
                              backgroundColor: selectedReward.icon === emoji ? COLORS.gold.light : '#ffffff',
                            }}
                          >
                            <Text style={{ fontSize: 24 }}>{emoji}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center', fontWeight: '600' }}>
                      ← Swipe to see more emojis →
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="text" size={16} color={COLORS.medicalBlue.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Reward Title *</Text>
                  </View>
                  <TextInput
                    placeholder="e.g., Coffee Voucher"
                    placeholderTextColor="#9CA3AF"
                    value={selectedReward.title}
                    onChangeText={(text) => setSelectedReward({ ...selectedReward, title: text })}
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 2,
                      borderColor: formErrors.title ? COLORS.rose.primary : '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: '#1F2937',
                      fontWeight: '600',
                    }}
                  />
                  {formErrors.title && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Ionicons name="alert-circle" size={14} color={COLORS.rose.primary} />
                      <Text style={{ color: COLORS.rose.primary, fontSize: 12, fontWeight: '600' }}>{formErrors.title}</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="document-text" size={16} color={COLORS.medicalPurple.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Description</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>(Optional)</Text>
                  </View>
                  <TextInput
                    placeholder="Describe the reward..."
                    placeholderTextColor="#9CA3AF"
                    value={selectedReward.description || ''}
                    onChangeText={(text) => setSelectedReward({ ...selectedReward, description: text })}
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 2,
                      borderColor: '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 14,
                      color: '#1F2937',
                      textAlignVertical: 'top',
                      minHeight: 80,
                    }}
                  />
                </View>

                {/* Points Required */}
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="star" size={16} color={COLORS.gold.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Points Required *</Text>
                  </View>
                  <TextInput
                    placeholder="e.g., 100"
                    placeholderTextColor="#9CA3AF"
                    value={String(selectedReward.pointsRequired)}
                    onChangeText={(text) => setSelectedReward({ ...selectedReward, pointsRequired: text })}
                    keyboardType="number-pad"
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 2,
                      borderColor: formErrors.pointsRequired ? COLORS.rose.primary : '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: '#1F2937',
                      fontWeight: '600',
                    }}
                  />
                  {formErrors.pointsRequired && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Ionicons name="alert-circle" size={14} color={COLORS.rose.primary} />
                      <Text style={{ color: COLORS.rose.primary, fontSize: 12, fontWeight: '600' }}>{formErrors.pointsRequired}</Text>
                    </View>
                  )}
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setShowEditModal(false)}
                    className="active:opacity-70"
                    style={{
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                    <Text style={{ color: '#374151', fontWeight: '800', fontSize: 15 }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdateReward}
                    className="active:opacity-70"
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.gold.primary,
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                      ...premiumShadow,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Update Reward</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedUserReward && (
        <Modal
          visible={showApprovalModal}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseApprovalModal}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '85%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937' }}>
                  {approvalType === 'approve' ? 'Approve Reward' : 'Reject Reward'}
                </Text>
                <Pressable
                  onPress={handleCloseApprovalModal}
                  className="active:opacity-70"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Status Card */}
                <View
                  style={{
                    padding: 20,
                    borderRadius: 20,
                    backgroundColor: approvalType === 'approve' ? COLORS.medicalGreen.light : COLORS.rose.light,
                    borderWidth: 2,
                    borderColor: approvalType === 'approve' ? COLORS.medicalGreen.muted : COLORS.rose.muted,
                    marginBottom: 20,
                    ...premiumShadow,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: '#ffffff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...premiumShadow,
                      }}
                    >
                      <Ionicons
                        name={approvalType === 'approve' ? 'checkmark-circle' : 'close-circle'}
                        size={32}
                        color={approvalType === 'approve' ? COLORS.medicalGreen.primary : COLORS.rose.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 6 }}>
                        {approvalType === 'approve' ? 'Approving Reward' : 'Rejecting Reward'}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 4 }}>
                        {selectedUserReward.user?.name}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 10, fontWeight: '600' }}>
                        {selectedUserReward.reward?.title}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: '#ffffff',
                          alignSelf: 'flex-start',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          ...premiumShadow,
                        }}
                      >
                        <Ionicons name="star" size={16} color={COLORS.gold.primary} />
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '900',
                            color: COLORS.gold.primary,
                          }}
                        >
                          {selectedUserReward.pointsSpent} points
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Refund Warning (for rejection) */}
                {approvalType === 'reject' && (
                  <View
                    style={{
                      padding: 16,
                      backgroundColor: COLORS.gold.light,
                      borderWidth: 2,
                      borderColor: COLORS.gold.muted,
                      borderRadius: 16,
                      marginBottom: 20,
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="arrow-undo" size={20} color={COLORS.gold.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 4 }}>
                        Points Will Be Refunded
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>
                        {selectedUserReward.pointsSpent} points will be returned to the user's account.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Notes Input */}
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="document-text" size={16} color={COLORS.medicalBlue.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>
                      Notes {approvalType === 'reject' ? <Text style={{ color: COLORS.rose.primary }}>*</Text> : <Text style={{ color: '#9CA3AF', fontWeight: '600' }}>(Optional)</Text>}
                    </Text>
                  </View>
                  <TextInput
                    placeholder={`Enter ${approvalType === 'approve' ? 'approval' : 'rejection'} notes...`}
                    placeholderTextColor="#9CA3AF"
                    value={approvalNotes}
                    onChangeText={setApprovalNotes}
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 2,
                      borderColor: approvalType === 'reject' && !approvalNotes.trim() ? COLORS.rose.primary : '#E5E7EB',
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 14,
                      color: '#1F2937',
                      textAlignVertical: 'top',
                      minHeight: 100,
                    }}
                  />
                  {approvalType === 'reject' && !approvalNotes.trim() && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                      <Ionicons name="alert-circle" size={14} color={COLORS.rose.primary} />
                      <Text style={{ color: COLORS.rose.primary, fontSize: 12, fontWeight: '600' }}>
                        Please provide a reason for rejection
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={handleCloseApprovalModal}
                    disabled={processing}
                    className="active:opacity-70"
                    style={{
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                    <Text style={{ color: '#374151', fontWeight: '800', fontSize: 15 }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmApproval}
                    disabled={processing || (approvalType === 'reject' && !approvalNotes.trim())}
                    className="active:opacity-70"
                    style={{
                      flex: 1,
                      backgroundColor: approvalType === 'approve' ? COLORS.medicalGreen.primary : COLORS.rose.primary,
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: processing || (approvalType === 'reject' && !approvalNotes.trim()) ? 0.5 : 1,
                      ...premiumShadow,
                    }}
                  >
                    <Ionicons name={approvalType === 'approve' ? 'checkmark-circle' : 'close-circle'} size={20} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>
                      {processing ? 'Processing...' : `Confirm ${approvalType === 'approve' ? 'Approval' : 'Rejection'}`}
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
          backgroundColor: COLORS.gold.primary,
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

export default ManageRewardsScreen;