import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
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

const RewardsScreen = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimLoading, setClaimLoading] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [badges, setBadges] = useState([]);

  const userId = user?.id;
  const userPoints = user?.totalPoints || 0;

  // Fetch rewards data
  const fetchRewardsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!userId) return;

      // Fetch available rewards
      const rewardsResponse = await rewardService.getAvailableRewards();
      const availableRewards = (rewardsResponse.rewards || []).map(r => ({
        id: r._id,
        title: r.title,
        description: r.description,
        icon: r.icon || '🎁',
        pointsRequired: r.pointsRequired,
        claimed: false,
      }));

      // Fetch user's claimed rewards
      try {
        const userRewardsResponse = await rewardService.getUserRewards(userId);
        const claimedIds = (userRewardsResponse.rewards || []).map(ur => ur.reward?._id || ur.reward);
        
        // Mark claimed rewards
        availableRewards.forEach(r => {
          if (claimedIds.includes(r.id)) {
            r.claimed = true;
          }
        });
      } catch {
        // If error, just use available rewards
      }

      setRewards(availableRewards);

      // Fetch points history
      try {
        const historyResponse = await rewardService.getPointsHistory(userId);
        setPointsHistory((historyResponse.history || []).map(h => ({
          description: h.description,
          points: h.points,
          createdAt: h.createdAt,
          source: h.source,
        })));
      } catch {
        setPointsHistory([]);
      }

      // Fetch user badges
      try {
        const badgesResponse = await rewardService.getUserBadges(userId);
        setBadges((badgesResponse.badges || []).map(b => ({
          id: b.badge?._id || b.badge,
          name: b.badge?.name,
          emoji: b.badge?.emoji || '🏆',
          earnedAt: b.earnedAt,
        })));
      } catch {
        setBadges([]);
      }

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRewardsData();
    } else {
      setLoading(false);
    }
  }, [fetchRewardsData, userId]);

  const handleRefresh = () => {
    if (!refreshing) {
      fetchRewardsData(true);
    }
  };

  const handleClaimReward = async (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    Alert.alert(
      'Claim Reward',
      `Claim "${reward.title}" for ${reward.pointsRequired} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            console.log('[Rewards] Starting reward claim process for reward:', rewardId);
            console.log('[Rewards] Current user points BEFORE claim:', user?.totalPoints);
            
            setClaimLoading(rewardId);
            try {
              // Step 1: Claim the reward (backend deducts points here)
              console.log('[Rewards] Calling backend to claim reward...');
              const response = await rewardService.claimReward(rewardId);
              console.log('[Rewards] Backend response:', response);
              
              Alert.alert('Success', 'Reward claimed successfully! Pending admin approval.');
              
              // Step 2: Update local rewards state
              setRewards(prev => prev.map(r => 
                r.id === rewardId ? { ...r, claimed: true } : r
              ));
              
              // Step 3: Wait a moment for backend to complete
              console.log('[Rewards] Waiting 500ms for backend to complete...');
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Step 4: Refresh user data from backend to get accurate points
              console.log('[Rewards] Refreshing user data from backend...');
              try {
                const updatedUser = await refreshUser();
                console.log('[Rewards] User data refreshed successfully');
                console.log('[Rewards] New user points AFTER refresh:', updatedUser?.totalPoints);
                
                if (updatedUser && updatedUser.totalPoints === user?.totalPoints) {
                  console.warn('[Rewards] WARNING: Points did not change after refresh!');
                  console.warn('[Rewards] Expected points to be deducted but they are the same');
                }
              } catch (error) {
                console.error('[Rewards] Failed to refresh user data:', error);
                // Fallback: manually update points
                if (updateUser && user) {
                  console.log('[Rewards] Using fallback: manually deducting points');
                  const newPoints = user.totalPoints - reward.pointsRequired;
                  console.log('[Rewards] Manually setting points to:', newPoints);
                  updateUser({ ...user, totalPoints: newPoints });
                }
              }
              
              // Step 5: Refresh all rewards data
              console.log('[Rewards] Refreshing rewards data...');
              await fetchRewardsData(true);
              console.log('[Rewards] Reward claim process complete');
            } catch (error) {
              console.error('[Rewards] Error during reward claim:', error);
              Alert.alert('Error', error.message || 'Failed to claim reward');
            } finally {
              setClaimLoading(null);
            }
          },
        },
      ]
    );
  };

  // Get badge tier config
  const getBadgeTier = (points) => {
    if (!points || typeof points !== 'number') {
      return { tier: 'Common', ...COLORS.medicalCyan, icon: 'gift' };
    }
    if (points >= 500) return { tier: 'Legendary', ...COLORS.medicalPurple, icon: 'trophy' };
    if (points >= 200) return { tier: 'Epic', ...COLORS.gold, icon: 'star' };
    if (points >= 100) return { tier: 'Rare', ...COLORS.medicalBlue, icon: 'ribbon' };
    return { tier: 'Common', ...COLORS.medicalCyan, icon: 'gift' };
  };

  // Render reward card
  const renderRewardCard = ({ item }) => {
    if (!item || !item.pointsRequired) {
      return null;
    }
    
    const canClaim = userPoints >= item.pointsRequired && !item.claimed;
    const pointsNeeded = item.pointsRequired - userPoints;
    const progressPercentage = Math.min((userPoints / item.pointsRequired) * 100, 100);
    const tierConfig = getBadgeTier(item.pointsRequired);
    
    if (!tierConfig || !tierConfig.light || !tierConfig.primary) {
      return null;
    }

    return (
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 30,
          padding: 20,
          marginBottom: 16,
          opacity: item.claimed ? 0.7 : 1,
          ...premiumShadow,
        }}
      >
        {/* Tier Badge & Status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: tierConfig.light,
            }}
          >
            <Ionicons name={tierConfig.icon} size={12} color={tierConfig.primary} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: tierConfig.primary, letterSpacing: 0.5 }}>
              {tierConfig.tier.toUpperCase()}
            </Text>
          </View>
          {item.claimed && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: COLORS.medicalGreen.light,
              }}
            >
              <Ionicons name="checkmark-circle" size={12} color={COLORS.medicalGreen.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.medicalGreen.primary, letterSpacing: 0.5 }}>
                CLAIMED
              </Text>
            </View>
          )}
        </View>

        {/* Icon */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: tierConfig.light,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: tierConfig.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 44 }}>{item.icon}</Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
          {item.description}
        </Text>

        {/* Points Required */}
        <View
          style={{
            backgroundColor: tierConfig.light,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Points Required</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={16} color={tierConfig.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 22, fontWeight: '900', color: tierConfig.primary, letterSpacing: -1 }}>
                {item.pointsRequired.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {!item.claimed && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>
                  Your Points: {userPoints.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 11, color: tierConfig.primary, fontWeight: '700' }}>
                  {Math.round(progressPercentage)}%
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: tierConfig.primary,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Action Button */}
        {item.claimed ? (
          <View
            style={{
              backgroundColor: COLORS.medicalGreen.light,
              borderRadius: 20,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.medicalGreen.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.medicalGreen.primary }}>
                Claimed
              </Text>
            </View>
          </View>
        ) : canClaim ? (
          <Pressable
            onPress={() => handleClaimReward(item.id)}
            disabled={claimLoading === item.id}
            style={({ pressed }) => ({
              backgroundColor: COLORS.medicalGreen.primary,
              borderRadius: 20,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              shadowColor: COLORS.medicalGreen.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="gift" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
                {claimLoading === item.id ? 'Claiming...' : 'Claim Reward'}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View>
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 20,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="lock-closed" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#9CA3AF' }}>
                  Locked
                </Text>
              </View>
            </View>
            <Text style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
              Need {pointsNeeded.toLocaleString()} more points
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render points history item
  const renderHistoryItem = ({ item }) => {
    const isPositive = item.points > 0;
    const color = isPositive ? COLORS.medicalGreen : COLORS.rose;
    
    return (
      <View
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          ...premiumShadow,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6 }}>
              {item.description}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={11} color='#9CA3AF' style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                {new Date(item.createdAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: color.light,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '900', color: color.primary, letterSpacing: -0.5 }}>
              {isPositive ? '+' : ''}{item.points}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  // Calculate stats
  const totalEarned = pointsHistory.filter(h => h.points > 0).reduce((sum, h) => sum + h.points, 0);
  const totalSpent = pointsHistory.filter(h => h.points < 0).reduce((sum, h) => sum + Math.abs(h.points), 0);
  const claimedCount = rewards.filter(r => r.claimed).length;
  const availableCount = rewards.filter(r => !r.claimed && userPoints >= r.pointsRequired).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.medicalPurple.primary}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
                Rewards
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
                Redeem points and earn badges
              </Text>
            </View>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: COLORS.medicalPurple.light,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: COLORS.medicalPurple.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="gift" size={28} color={COLORS.medicalPurple.primary} />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {/* Total Points */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.medicalPurple.light,
                borderRadius: 30,
                padding: 20,
                ...premiumShadow,
              }}
            >
              <Ionicons name="star" size={24} color={COLORS.medicalPurple.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalPurple.primary, letterSpacing: -1 }}>
                {userPoints.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Total Points
              </Text>
            </View>

            {/* Claimed Rewards */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.medicalGreen.light,
                borderRadius: 30,
                padding: 20,
                ...premiumShadow,
              }}
            >
              <Ionicons name="gift" size={24} color={COLORS.medicalGreen.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalGreen.primary, letterSpacing: -1 }}>
                {claimedCount}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Claimed
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Badges Earned */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.gold.light,
                borderRadius: 30,
                padding: 20,
                ...premiumShadow,
              }}
            >
              <Ionicons name="trophy" size={24} color={COLORS.gold.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.gold.primary, letterSpacing: -1 }}>
                {badges.length}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Badges
              </Text>
            </View>

            {/* Available Rewards */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.medicalCyan.light,
                borderRadius: 30,
                padding: 20,
                ...premiumShadow,
              }}
            >
              <Ionicons name="sparkles" size={24} color={COLORS.medicalCyan.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalCyan.primary, letterSpacing: -1 }}>
                {availableCount}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Available
              </Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        {badges.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 16 }}>
              🏆 Achievement Badges
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  style={{
                    width: '30%',
                    backgroundColor: '#ffffff',
                    borderRadius: 24,
                    padding: 16,
                    alignItems: 'center',
                    ...premiumShadow,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: COLORS.gold.light,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{badge.emoji}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#1F2937', fontWeight: '700', textAlign: 'center' }}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Available Rewards */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 20 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: COLORS.medicalPurple.light,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Ionicons name="gift-outline" size={18} color={COLORS.medicalPurple.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937' }}>
              Available Rewards
            </Text>
          </View>
          {rewards.length > 0 ? (
            <FlatList
              data={rewards}
              renderItem={renderRewardCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 30,
                  padding: 48,
                  alignItems: 'center',
                  ...premiumShadow,
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: COLORS.medicalPurple.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  <Ionicons name="gift-outline" size={36} color={COLORS.medicalPurple.primary} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#1F2937', marginBottom: 8 }}>
                  No Rewards Available
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
                  Check back soon! New rewards are added regularly.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Points History */}
        {pointsHistory.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 20 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.medicalBlue.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.medicalBlue.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937' }}>
                Points History
              </Text>
            </View>

            {/* Summary Stats */}
            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 24,
                  padding: 16,
                  marginBottom: 16,
                  ...premiumShadow,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: COLORS.medicalGreen.light,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="arrow-up" size={16} color={COLORS.medicalGreen.primary} />
                    </View>
                    <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, fontWeight: '600' }}>
                      Earned
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.medicalGreen.primary, letterSpacing: -0.5 }}>
                      +{totalEarned.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: COLORS.rose.light,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="arrow-down" size={16} color={COLORS.rose.primary} />
                    </View>
                    <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, fontWeight: '600' }}>
                      Spent
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.rose.primary, letterSpacing: -0.5 }}>
                      -{totalSpent.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: COLORS.gold.light,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="calculator" size={16} color={COLORS.gold.primary} />
                    </View>
                    <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, fontWeight: '600' }}>
                      Net
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.gold.primary, letterSpacing: -0.5 }}>
                      {(totalEarned - totalSpent).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* History List */}
            <FlatList
              data={pointsHistory.slice(0, 10)}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
          </View>
        )}

        {/* Motivational Footer */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: COLORS.medicalTeal.light,
              borderRadius: 30,
              padding: 20,
              ...premiumShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.medicalTeal.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  shadowColor: COLORS.medicalTeal.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.medicalTeal.primary, marginBottom: 6 }}>
                  Keep Up The Great Work!
                </Text>
                <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                  Continue maintaining excellent hand hygiene to earn more points and unlock rewards.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default RewardsScreen;
