import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { leaderboardService } from '../../services/leaderboardService';
import Loader from '../../components/common/Loader';

// ─── Design system ────────────────────────────────────────────────────────────
const COLORS = {
  medicalBlue:   { primary: '#0EA5E9', light: '#E0F2FE', muted: '#BAE6FD' },
  medicalGreen:  { primary: '#10B981', light: '#D1FAE5', muted: '#A7F3D0' },
  medicalTeal:   { primary: '#14B8A6', light: '#CCFBF1', muted: '#99F6E4' },
  medicalPurple: { primary: '#8B5CF6', light: '#EDE9FE', muted: '#DDD6FE' },
  medicalCyan:   { primary: '#06B6D4', light: '#CFFAFE', muted: '#A5F3FC' },
  gold:          { primary: '#F59E0B', light: '#FEF3C7', muted: '#FDE68A' },
  silver:        { primary: '#9CA3AF', light: '#F3F4F6', muted: '#E5E7EB' },
  bronze:        { primary: '#D97706', light: '#FEF3C7', muted: '#FDE68A' },
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
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getComplianceColor = (rate) => {
  if (rate >= 90) return COLORS.emerald;
  if (rate >= 75) return COLORS.gold;
  return COLORS.rose;
};

// Podium config: order is [2nd, 1st, 3rd] for visual layout
const PODIUM = [
  {
    rankIndex: 1,   // 2nd place — left
    podiumHeight: 80,
    avatarSize: 64,
    color: COLORS.silver,
    gradientColors: ['#C0C0C0', '#9CA3AF'],
    crown: '🥈',
    zIndex: 1,
  },
  {
    rankIndex: 0,   // 1st place — center
    podiumHeight: 110,
    avatarSize: 80,
    color: COLORS.gold,
    gradientColors: ['#FCD34D', '#F59E0B'],
    crown: '👑',
    zIndex: 2,
  },
  {
    rankIndex: 2,   // 3rd place — right
    podiumHeight: 60,
    avatarSize: 58,
    color: COLORS.bronze,
    gradientColors: ['#F59E0B', '#D97706'],
    crown: '🥉',
    zIndex: 1,
  },
];

// ─── Podium Avatar ────────────────────────────────────────────────────────────
const PodiumAvatar = ({ user, config, isCurrentUser }) => {
  const { avatarSize, color, crown } = config;
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Crown / medal emoji */}
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{crown}</Text>

      {/* Avatar ring */}
      <View style={{
        width: avatarSize + 8, height: avatarSize + 8, borderRadius: (avatarSize + 8) / 2,
        backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center',
        shadowColor: color.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
        marginBottom: 8,
        borderWidth: isCurrentUser ? 3 : 0,
        borderColor: isCurrentUser ? COLORS.medicalBlue.primary : 'transparent',
      }}>
        <View style={{
          width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
          backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <Text style={{ fontSize: avatarSize * 0.3, fontWeight: '900', color: color.primary }}>{getInitials(user?.name)}</Text>
          }
        </View>
      </View>

      {/* Name */}
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#1F2937', textAlign: 'center', maxWidth: 90 }} numberOfLines={1}>
        {user?.name?.split(' ')[0] || 'N/A'}
      </Text>

      {/* Points pill */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: color.light, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
      }}>
        <Ionicons name="star" size={11} color={color.primary} style={{ marginRight: 3 }} />
        <Text style={{ fontSize: 12, fontWeight: '900', color: color.primary }}>{user?.totalPoints ?? 0}</Text>
      </View>
    </View>
  );
};

// ─── Podium Block ─────────────────────────────────────────────────────────────
const PodiumBlock = ({ config, rank }) => (
  <LinearGradient
    colors={config.gradientColors}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={{
      width: 90, height: config.podiumHeight, borderTopLeftRadius: 14, borderTopRightRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: config.color.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    }}
  >
    <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 }}>#{rank}</Text>
  </LinearGradient>
);

// ═════════════════════════════════════════════════════════════════════════════
const LeaderboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timePeriod, setTimePeriod]     = useState('weekly');

  const userId = user?.id || user?._id;

  const fetchLeaderboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await leaderboardService.getLeaderboard({ timePeriod, limit: 20 });
      setLeaderboardData((res.leaderboard || []).map((u, i) => ({
        id: u._id,
        name: u.name,
        department: u.department,
        designation: u.designation,
        totalPoints: u.totalPoints || 0,
        complianceRate: timePeriod !== 'all_time' ? (u.periodCompliance || 0) : (u.complianceRate || 0),
        totalObservations: timePeriod !== 'all_time' ? (u.periodObservations || 0) : (u.totalObservations || 0),
        avatar: u.avatar,
        rank: i + 1,
      })));
    } catch (_) { setLeaderboardData([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [timePeriod]);

  useEffect(() => { fetchLeaderboardData(); }, [fetchLeaderboardData]);

  useFocusEffect(useCallback(() => { fetchLeaderboardData(true); }, [fetchLeaderboardData]));

  const onRefresh = () => { if (!refreshing) fetchLeaderboardData(true); };

  const timePeriods = [
    { value: 'daily',    label: 'Today' },
    { value: 'weekly',   label: 'Week' },
    { value: 'monthly',  label: 'Month' },
    { value: 'all_time', label: 'All Time' },
  ];

  const currentUserRank = leaderboardData.find(u => u.id === userId)?.rank;
  const top3            = leaderboardData.slice(0, 3);
  const restList        = leaderboardData.slice(3);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="Loading Leaderboard..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold.primary} />}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>Leaderboard</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>Top performers in compliance</Text>
          </View>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: COLORS.gold.light, alignItems: 'center', justifyContent: 'center',
            shadowColor: COLORS.gold.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
          }}>
            <Ionicons name="trophy" size={28} color={COLORS.gold.primary} />
          </View>
        </View>
      </View>

      {/* ── TIME PERIOD FILTER ──────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {timePeriods.map(p => (
              <Pressable
                key={p.value}
                onPress={() => setTimePeriod(p.value)}
                style={{
                  paddingHorizontal: 22, paddingVertical: 11, borderRadius: 20,
                  backgroundColor: timePeriod === p.value ? COLORS.medicalBlue.primary : '#ffffff',
                  borderWidth: 1.5, borderColor: timePeriod === p.value ? COLORS.medicalBlue.primary : '#E5E7EB',
                  ...softShadow,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: timePeriod === p.value ? '#ffffff' : '#6B7280' }}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── QUICK STATS ─────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: COLORS.medicalTeal.light, borderRadius: 30, padding: 20, ...premiumShadow }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: COLORS.medicalTeal.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              shadowColor: COLORS.medicalTeal.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
            }}>
              <Ionicons name="people" size={22} color="#ffffff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalTeal.primary, letterSpacing: -1 }}>{leaderboardData.length}</Text>
            <Text style={{ fontSize: 11, color: COLORS.medicalTeal.primary, marginTop: 3, fontWeight: '700', opacity: 0.7 }}>Participants</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: COLORS.medicalPurple.light, borderRadius: 30, padding: 20, ...premiumShadow }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: COLORS.medicalPurple.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              shadowColor: COLORS.medicalPurple.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
            }}>
              <Ionicons name="ribbon" size={22} color="#ffffff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalPurple.primary, letterSpacing: -1 }}>
              {currentUserRank ? `#${currentUserRank}` : '—'}
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.medicalPurple.primary, marginTop: 3, fontWeight: '700', opacity: 0.7 }}>Your Rank</Text>
          </View>
        </View>
      </View>

      {/* ── PODIUM ──────────────────────────────────────────────────────────── */}
      {top3.length === 3 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 36, padding: 28, ...premiumShadow }}>

            {/* Section label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="trophy" size={18} color={COLORS.gold.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>Top Performers</Text>
            </View>

            {/* Avatars row: 2nd | 1st | 3rd */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 0 }}>
              {PODIUM.map((config, i) => {
                const person = top3[config.rankIndex];
                const isMe   = person?.id === userId;
                return (
                  <View key={i} style={{ alignItems: 'center', zIndex: config.zIndex }}>
                    <PodiumAvatar user={person} config={config} isCurrentUser={isMe} />
                    <PodiumBlock config={config} rank={config.rankIndex + 1} />
                  </View>
                );
              })}
            </View>

            {/* Base platform */}
            <View style={{
              height: 16, backgroundColor: '#F3F4F6',
              borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
              marginHorizontal: -4,
            }} />
          </View>
        </View>
      )}

      {/* ── YOUR POSITION BANNER ────────────────────────────────────────────── */}
      {currentUserRank && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient
            colors={[COLORS.gold.primary, COLORS.gold.primary + 'CC']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 30, padding: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 50, height: 50, borderRadius: 25,
                backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 16,
              }}>
                <Ionicons name="trophy" size={26} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 3 }}>Your Current Position</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 }}>
                  Rank #{currentUserRank} of {leaderboardData.length}
                  {currentUserRank <= 3 ? ' 🎉' : ''}
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
                paddingHorizontal: 16, paddingVertical: 10,
                borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
              }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff' }}>#{currentUserRank}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ── FULL RANKINGS LIST ───────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        {/* Section header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <Ionicons name="list" size={18} color={COLORS.indigo.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.4 }}>All Rankings</Text>
        </View>

        {leaderboardData.map((item) => {
          const isCurrentUser    = item.id === userId;
          const complianceColor  = getComplianceColor(item.complianceRate);
          const isTop3           = item.rank <= 3;
          const rankColors       = [COLORS.gold, COLORS.silver, COLORS.bronze];
          const rankColor        = isTop3 ? rankColors[item.rank - 1] : null;

          return (
            <View
              key={item.id}
              style={{
                backgroundColor: isCurrentUser ? COLORS.medicalBlue.light : '#ffffff',
                borderRadius: 24, padding: 16, marginBottom: 10,
                flexDirection: 'row', alignItems: 'center',
                borderWidth: isCurrentUser ? 2 : 0,
                borderColor: isCurrentUser ? COLORS.medicalBlue.primary : 'transparent',
                ...softShadow,
              }}
            >
              {/* Rank bubble */}
              <View style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: isTop3 ? rankColor.primary : '#F3F4F6',
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
                shadowColor: isTop3 ? rankColor.primary : '#000',
                shadowOffset: { width: 0, height: 2 }, shadowOpacity: isTop3 ? 0.3 : 0.04, shadowRadius: 4, elevation: isTop3 ? 3 : 1,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: isTop3 ? '#ffffff' : '#6B7280' }}>
                  {item.rank}
                </Text>
              </View>

              {/* Avatar */}
              <View style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: COLORS.medicalTeal.primary,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
                overflow: 'hidden',
              }}>
                {item.avatar
                  ? <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  : <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>{getInitials(item.name)}</Text>
                }
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937', flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isCurrentUser && (
                    <View style={{
                      backgroundColor: COLORS.medicalBlue.primary, borderRadius: 10,
                      paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6,
                    }}>
                      <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>YOU</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }} numberOfLines={1}>
                  {item.department}
                </Text>
                <View style={{
                  alignSelf: 'flex-start', backgroundColor: complianceColor.light,
                  borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: complianceColor.primary }}>
                    {item.complianceRate}% Compliance
                  </Text>
                </View>
              </View>

              {/* Points */}
              <View style={{
                backgroundColor: COLORS.gold.light, borderRadius: 18,
                paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', marginLeft: 10,
              }}>
                <Ionicons name="star" size={13} color={COLORS.gold.primary} style={{ marginBottom: 3 }} />
                <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.gold.primary, letterSpacing: -0.5 }}>
                  {item.totalPoints}
                </Text>
                <Text style={{ fontSize: 9, color: COLORS.gold.primary, fontWeight: '700', opacity: 0.7 }}>pts</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── MOTIVATIONAL FOOTER ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{
          backgroundColor: COLORS.medicalBlue.light, borderRadius: 30, padding: 22,
          flexDirection: 'row', alignItems: 'center', ...softShadow,
          borderWidth: 1.5, borderColor: COLORS.medicalBlue.muted,
        }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: COLORS.medicalBlue.primary,
            alignItems: 'center', justifyContent: 'center', marginRight: 16,
            shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
          }}>
            <Ionicons name="flash" size={26} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.medicalBlue.primary, marginBottom: 4, letterSpacing: -0.3 }}>
              Climb the Leaderboard!
            </Text>
            <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
              Record more observations to earn points and improve your ranking.
            </Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
};

export default LeaderboardScreen;