import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { leaderboardService } from '../../services/leaderboardService';
import { userService } from '../../services/userService';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import { WeeklyPerformanceChart } from '../../components/charts/Charts';
import Loader from '../../components/common/Loader';

const { width } = Dimensions.get('window');

const getComplianceColor = (rate) => {
  if (rate >= 90) return { primary: '#059669', light: '#ECFDF5', muted: '#A7F3D0', gradient: ['#059669', '#047857'] };
  if (rate >= 75) return { primary: '#F59E0B', light: '#FEF3C7', muted: '#FDE68A', gradient: ['#F59E0B', '#D97706'] };
  return { primary: '#6366F1', light: '#EEF2FF', muted: '#C7D2FE', gradient: ['#6366F1', '#4F46E5'] };
};

const DashboardScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalObservations: 0,
    complianceRate: 0,
    totalPoints: 0,
    rank: 0,
  });

  const userId = user?.id || user?._id;
  const firstName = user?.name?.split(' ')[0] || 'User';

  useEffect(() => {
    console.log('[Dashboard] User avatar updated:', user?.avatar);
  }, [user?.avatar]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const userObservations = user?.totalObservations || 0;
      const userCompliance = user?.complianceRate || 0;
      const userPoints = user?.totalPoints || 0;

      let apiStats = null;
      try {
        const userStatsResponse = await userService.getUserStats(userId);
        apiStats = userStatsResponse.stats || userStatsResponse;
      } catch (error) {
        console.log('Could not fetch user stats from API, using context data');
      }

      let userRank = 0;
      try {
        const rankResponse = await leaderboardService.getUserRank(userId);
        userRank = rankResponse.rank || 0;
      } catch (error) {
        console.log('Could not fetch user rank');
      }

      setStats({
        totalObservations: apiStats?.totalObservations || userObservations,
        complianceRate: apiStats?.complianceRate || userCompliance,
        totalPoints: apiStats?.totalPoints || userPoints,
        rank: userRank,
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      setStats({
        totalObservations: user?.totalObservations || 0,
        complianceRate: user?.complianceRate || 0,
        totalPoints: user?.totalPoints || 0,
        rank: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, user]);

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId, fetchDashboardData]);

  useEffect(() => {
    if (user) {
      console.log('[Dashboard] User data changed, updating stats');
      console.log('[Dashboard] New user.totalPoints:', user.totalPoints);
      setStats(prev => ({
        ...prev,
        totalPoints: user.totalPoints || prev.totalPoints,
        totalObservations: user.totalObservations || prev.totalObservations,
        complianceRate: user.complianceRate || prev.complianceRate,
      }));
    }
  }, [user?.totalPoints, user?.totalObservations, user?.complianceRate]);

  const onRefresh = async () => {
    if (userId && !refreshing) {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
      await fetchDashboardData(true);
    }
  };

  const canRecordObservations = user?.role === 'auditor' || user?.role === 'admin';

  const quickActions = [
    ...(canRecordObservations ? [{
      title: 'New Observation',
      description: 'Record hand hygiene',
      icon: 'add-circle',
      onPress: () => navigation.navigate('ObservationEntry'),
    }] : []),
    {
      title: 'History',
      description: 'View observations',
      icon: 'list',
      onPress: () => navigation.navigate('ObservationHistory'),
    },
    {
      title: 'Leaderboard',
      description: 'Check rankings',
      icon: 'trophy',
      onPress: () => navigation.navigate('Leaderboard'),
    },
    {
      title: 'Rewards',
      description: 'View points',
      icon: 'gift',
      onPress: () => navigation.navigate('Rewards'),
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Loader text="Loading Dashboard..." />
      </View>
    );
  }

  const complianceRate  = Math.round(stats.complianceRate);
  const complianceColor = getComplianceColor(complianceRate);

  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long'
  });

  // Circular progress values
  const RING_SIZE    = 120;
  const STROKE       = 11;
  const R            = (RING_SIZE - STROKE) / 2;
  const CIRCUM       = 2 * Math.PI * R;
  const progressOffset = CIRCUM - (Math.min(complianceRate, 100) / 100) * CIRCUM;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
      >
        {/* Header — ORIGINAL UNCHANGED */}
        <View className="px-5 pt-12 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {user?.avatar ? (
                <Image
                  key={user.avatar}
                  source={{ uri: user.avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={24} color="#6B7280" />
              )}
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
                Hello, {firstName}!
              </Text>
              <Text className="text-sm font-bold text-blue-600 mt-0.5">
                Staff
              </Text>
            </View>
          </View>

          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
          </View>
        </View>

        {/* Main Content */}
        <View className="px-5">

          {/* ── ENHANCED: Compliance Progress Card ── */}
          <LinearGradient
            colors={complianceColor.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 32, padding: 24, marginBottom: 16,
              shadowColor: complianceColor.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
              overflow: 'hidden',
            }}
          >
            {/* Decorative blobs */}
            <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* SVG ring */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 20 }}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={R}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={STROKE} fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={R}
                    stroke="#ffffff"
                    strokeWidth={STROKE} fill="none"
                    strokeDasharray={CIRCUM}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  />
                </Svg>
                {/* Center label */}
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#ffffff', letterSpacing: -1 }}>
                    {complianceRate}%
                  </Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>rate</Text>
                </View>
              </View>

              {/* Right text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>
                  COMPLIANCE RATE
                </Text>
                <Text style={{ fontSize: 19, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5, marginBottom: 12 }}>
                  {complianceRate >= 90 ? 'Excellent! 🎉' : complianceRate >= 75 ? 'Good Progress' : 'Keep Improving'}
                </Text>

                {/* Points pill */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
                  backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14,
                  paddingHorizontal: 12, paddingVertical: 7, marginBottom: 12,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
                }}>
                  <Ionicons name="star" size={13} color="#ffffff" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>{stats.totalPoints}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginLeft: 4, fontWeight: '600' }}>pts</Text>
                </View>

                {/* Target bar */}
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 5 }}>
                  Target: 90%
                </Text>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min((complianceRate / 90) * 100, 100)}%`,
                    backgroundColor: '#ffffff',
                  }} />
                </View>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{currentDate}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Cards Row — ENHANCED */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Total Observations */}
            <View style={{
              flex: 1, backgroundColor: '#E0F2FE', borderRadius: 28, padding: 20,
              shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
              }}>
                <Ionicons name="clipboard" size={21} color="#ffffff" />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#0EA5E9', letterSpacing: -1 }}>
                {stats.totalObservations}
              </Text>
              <Text style={{ fontSize: 11, color: '#0EA5E9', marginTop: 3, fontWeight: '700', opacity: 0.7 }}>
                Observations
              </Text>
            </View>

            {/* Your Rank */}
            <View style={{
              flex: 1, backgroundColor: '#FEF3C7', borderRadius: 28, padding: 20,
              shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
              }}>
                <Ionicons name="trophy" size={21} color="#ffffff" />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#F59E0B', letterSpacing: -1 }}>
                {stats.rank > 0 ? `#${stats.rank}` : '—'}
              </Text>
              <Text style={{ fontSize: 11, color: '#F59E0B', marginTop: 3, fontWeight: '700', opacity: 0.7 }}>
                Your Rank
              </Text>
            </View>
          </View>

          {/* ── ENHANCED: Performance Summary Card ── */}
          <View style={{
            backgroundColor: '#ffffff', borderRadius: 28, padding: 20, marginBottom: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5,
          }}>
            {/* Card header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Ionicons name="stats-chart" size={22} color="#14B8A6" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>Performance Summary</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>This week</Text>
              </View>
            </View>

            {/* 4 metric bubbles */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { label: 'Observations', value: stats.totalObservations, bg: '#E0F2FE', color: '#0EA5E9' },
                { label: 'Compliance',   value: `${complianceRate}%`,   bg: complianceColor.light, color: complianceColor.primary },
                { label: 'Points',       value: stats.totalPoints,       bg: '#FEF3C7', color: '#F59E0B' },
                { label: 'Rank',         value: stats.rank > 0 ? `#${stats.rank}` : '—', bg: '#EDE9FE', color: '#8B5CF6' },
              ].map((m, i) => (
                <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 54, height: 54, borderRadius: 27,
                    backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                    shadowColor: m.color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: m.color, letterSpacing: -0.5 }}>{m.value}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', textAlign: 'center' }}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Weekly Compliance Chart — ORIGINAL UNCHANGED */}
          <View
            className="mt-4"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 30,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#E0F2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="trending-up" size={20} color="#0EA5E9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937' }}>
                  Weekly Compliance
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Day-wise performance
                </Text>
              </View>
            </View>

            <WeeklyPerformanceChart width={width - 80} />
          </View>

          {/* Quick Actions Grid - 2x2 — ORIGINAL UNCHANGED */}
          <View className="mt-4 gap-3">
            <View className="flex-row gap-3">
              <QuickActionCard
                title="View History"
                subtitle="Past observations"
                icon="time"
                iconColor="#0EA5E9"
                bgColor="bg-medical-cyan"
                onPress={() => navigation.navigate('ObservationHistory')}
              />
              <QuickActionCard
                title="Leaderboard"
                subtitle="Check rankings"
                icon="trophy"
                iconColor="#8B5CF6"
                bgColor="bg-medical-purple"
                onPress={() => navigation.navigate('Leaderboard')}
              />
            </View>

            <View className="flex-row gap-3">
              <QuickActionCard
                title="Reports"
                subtitle="View analytics"
                icon="bar-chart"
                iconColor="#10B981"
                bgColor="bg-medical-green"
                onPress={() => navigation.navigate('Reports')}
              />
              <QuickActionCard
                title="Rewards"
                subtitle="Redeem points"
                icon="gift"
                iconColor="#14B8A6"
                bgColor="bg-medical-teal"
                onPress={() => navigation.navigate('Rewards')}
              />
            </View>
          </View>

          {/* New Observation Button — ORIGINAL UNCHANGED */}
          {canRecordObservations && (
            <View className="mt-6 mb-4">
              <View
                className="p-5 flex-row items-center justify-between"
                style={{
                  backgroundColor: '#6366F1',
                  borderRadius: 30,
                  shadowColor: '#6366F1',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 10,
                }}
                onTouchEnd={() => navigation.navigate('ObservationEntry')}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    <Ionicons name="add-circle" size={28} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
                      New Observation
                    </Text>
                    <Text className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Record hand hygiene compliance
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
              </View>
            </View>
          )}

          {/* Motivational Message — ORIGINAL UNCHANGED */}
          <View
            className="mt-4 bg-gray-50 p-5 flex-row gap-3"
            style={{
              borderRadius: 30,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
              <Ionicons
                name={
                  stats.complianceRate >= 90 ? 'checkmark-circle' :
                  stats.complianceRate >= 75 ? 'trending-up' : 'bulb'
                }
                size={24}
                color={
                  stats.complianceRate >= 90 ? '#10B981' :
                  stats.complianceRate >= 75 ? '#6366F1' : '#F59E0B'
                }
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 4 }}>
                {stats.complianceRate >= 90
                  ? 'Excellent work! You\'re a hand hygiene champion!'
                  : stats.complianceRate >= 75
                    ? 'Great progress! Keep up the good work!'
                    : 'Room for improvement. Every wash counts!'}
              </Text>
              <Text className="text-xs text-gray-500">
                {stats.complianceRate >= 90
                  ? 'Your compliance rate is above the target. Keep maintaining this standard!'
                  : `You're ${90 - stats.complianceRate}% away from the 90% target. You can do it!`}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;