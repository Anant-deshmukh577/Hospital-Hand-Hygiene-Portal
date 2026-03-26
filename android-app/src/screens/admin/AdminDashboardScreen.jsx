import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { reportService } from '../../services/reportService';
import { userService } from '../../services/userService';
import { wardService } from '../../services/wardService';
import { observationService } from '../../services/observationService';
import { WeeklyPerformanceChart, WHOMomentsBarChart, DepartmentPieChart } from '../../components/charts/Charts';
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

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalObservations: 0,
    averageCompliance: 0,
    activeWards: 0,
  });
  const [whoMomentsData, setWhoMomentsData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await reportService.getDashboardStats();
      const dashboardStats = statsResponse.stats || {};

      // Fetch users count
      let totalUsers = 0;
      try {
        const usersResponse = await userService.getAllUsers({ limit: 1 });
        totalUsers = usersResponse.total || 0;
      } catch {
        totalUsers = 0;
      }

      // Fetch wards count
      let activeWards = 0;
      try {
        const wardsResponse = await wardService.getWards();
        activeWards = (wardsResponse.wards || []).length;
      } catch {
        activeWards = 0;
      }

      setStats({
        totalUsers,
        totalObservations: dashboardStats.totalObservations || 0,
        averageCompliance: Math.round(dashboardStats.complianceRate || 0),
        activeWards,
      });

      // Fetch WHO Moments data for chart
      try {
        const complianceResponse = await reportService.getComplianceReport({});
        const whoMoments = complianceResponse.report?.whoMoments || [];
        const formattedMoments = whoMoments.map(m => ({
          name: m.moment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          adherence: m.adherence || 0,
          partial: m.partial || 0,
          missed: m.missed || 0,
        }));
        setWhoMomentsData(formattedMoments);
      } catch (error) {
        console.error('Error fetching WHO moments data:', error);
      }

      // Fetch department distribution data
      try {
        const obsResponse = await observationService.getObservations({ limit: 1000 });
        const observations = obsResponse.observations || [];
        
        const deptCounts = {};
        observations.forEach(obs => {
          const dept = obs.department;
          if (dept) {
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
          }
        });
        
        const deptData = Object.entries(deptCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        
        setDepartmentData(deptData);
      } catch (error) {
        console.error('Error fetching department data:', error);
      }

      // Fetch recent activities from all users (admin view)
      try {
        const usersResponse = await userService.getAllUsers({ limit: 10 });
        const allUsers = usersResponse.users || [];
        
        const allActivities = [];
        for (const user of allUsers) {
          try {
            const activityResponse = await userService.getUserActivity(user._id || user.id);
            const userActivities = (activityResponse.activities || []).map(activity => ({
              ...activity,
              userName: user.name,
            }));
            allActivities.push(...userActivities);
          } catch (error) {
            continue;
          }
        }
        
        allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentActivities(allActivities.slice(0, 10));
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Quick Actions with premium styling
  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove users',
      icon: 'people',
      screen: 'ManageUsers',
      color: COLORS.medicalBlue,
    },
    {
      title: 'Manage Wards',
      description: 'Configure hospital wards',
      icon: 'business',
      screen: 'ManageWards',
      color: COLORS.medicalTeal,
    },
    {
      title: 'Manage Rewards',
      description: 'Set up rewards',
      icon: 'gift',
      screen: 'ManageRewards',
      color: COLORS.gold,
    },
    {
      title: 'View Reports',
      description: 'Analytics and insights',
      icon: 'bar-chart',
      screen: 'Reports',
      color: COLORS.rose,
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="Loading Dashboard..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.medicalPurple.primary} />
      }
    >
      {/* Header - Matching Dashboard/Leaderboard Style */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
              Admin Portal
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
              System Control Center
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
            <Ionicons name="shield-checkmark" size={28} color={COLORS.medicalPurple.primary} />
          </View>
        </View>
      </View>

      {/* Stats Grid - Colorful Premium Cards */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {/* Total Users Card */}
          <View
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: COLORS.medicalBlue.light,
              borderRadius: 30,
              padding: 20,
              ...premiumShadow,
            }}
          >
            <Ionicons name="people" size={32} color={COLORS.medicalBlue.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalBlue.primary, letterSpacing: -1 }}>
              {stats.totalUsers}
            </Text>
            <Text style={{ fontSize: 12, color: '#075985', marginTop: 4, fontWeight: '700' }}>
              Total Users
            </Text>
          </View>

          {/* Total Observations Card */}
          <View
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: COLORS.medicalTeal.light,
              borderRadius: 30,
              padding: 20,
              ...premiumShadow,
            }}
          >
            <Ionicons name="clipboard" size={32} color={COLORS.medicalTeal.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalTeal.primary, letterSpacing: -1 }}>
              {stats.totalObservations}
            </Text>
            <Text style={{ fontSize: 12, color: '#115E59', marginTop: 4, fontWeight: '700' }}>
              Observations
            </Text>
          </View>

          {/* Average Compliance Card */}
          <View
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: stats.averageCompliance >= 90 ? COLORS.medicalGreen.light : COLORS.gold.light,
              borderRadius: 30,
              padding: 20,
              ...premiumShadow,
            }}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={32} 
              color={stats.averageCompliance >= 90 ? COLORS.medicalGreen.primary : COLORS.gold.primary}
              style={{ marginBottom: 12 }}
            />
            <Text 
              style={{ 
                fontSize: 28, 
                fontWeight: '900', 
                color: stats.averageCompliance >= 90 ? COLORS.medicalGreen.primary : COLORS.gold.primary, 
                letterSpacing: -1 
              }}
            >
              {stats.averageCompliance}%
            </Text>
            <Text style={{ fontSize: 12, color: stats.averageCompliance >= 90 ? '#065F46' : '#92400E', marginTop: 4, fontWeight: '700' }}>
              Avg Compliance
            </Text>
          </View>

          {/* Active Wards Card */}
          <View
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: COLORS.medicalPurple.light,
              borderRadius: 30,
              padding: 20,
              ...premiumShadow,
            }}
          >
            <Ionicons name="business" size={32} color={COLORS.medicalPurple.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.medicalPurple.primary, letterSpacing: -1 }}>
              {stats.activeWards}
            </Text>
            <Text style={{ fontSize: 12, color: '#5B21B6', marginTop: 4, fontWeight: '700' }}>
              Active Wards
            </Text>
          </View>
        </View>
      </View>

      {/* System Status - Premium Design */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 12, letterSpacing: -0.5 }}>
          System Status
        </Text>
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            ...premiumShadow,
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'API Server', status: 'online', icon: 'server-outline', color: COLORS.medicalGreen },
            { label: 'Database', status: 'online', icon: 'server-outline', color: COLORS.medicalBlue },
            { label: 'Authentication', status: 'online', icon: 'lock-closed-outline', color: COLORS.medicalPurple },
            { label: 'File Storage', status: 'online', icon: 'cloud-outline', color: COLORS.medicalCyan },
          ].map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < 3 ? 1 : 0,
                borderBottomColor: '#f1f5f9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: item.color.muted,
                    borderWidth: 1,
                    borderColor: item.color.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={item.icon} size={16} color={item.color.primary} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
                  {item.label}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: item.status === 'online' ? COLORS.medicalGreen.muted : COLORS.rose.muted,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: item.status === 'online' ? COLORS.medicalGreen.light : COLORS.rose.light,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: item.status === 'online' ? COLORS.medicalGreen.primary : COLORS.rose.primary,
                    letterSpacing: 0.5,
                  }}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}

          {/* All Systems Operational Banner */}
          <View
            style={{
              backgroundColor: COLORS.medicalGreen.light,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  shadowColor: COLORS.medicalGreen.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color={COLORS.medicalGreen.primary} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.medicalGreen.primary, flex: 1 }}>
                All systems operational
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions - Premium Cards */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 12, letterSpacing: -0.5 }}>
          Quick Actions
        </Text>
        <View style={{ gap: 12 }}>
          {quickActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={() => navigation.navigate(action.screen)}
              className="active:scale-98"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: '#f1f5f9',
                ...premiumShadow,
                overflow: 'hidden',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                {/* Icon with solid background */}
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: action.color.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                    shadowColor: action.color.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Ionicons name={action.icon} size={24} color="white" />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2, letterSpacing: -0.2 }}>
                    {action.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    {action.description}
                  </Text>
                </View>

                {/* Arrow */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: action.color.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-forward" size={16} color={action.color.primary} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Recent Activity - Premium Design */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>
            Recent Activity
          </Text>
          <Pressable 
            onPress={() => navigation.navigate('Profile')}
            className="active:opacity-60"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.medicalPurple.primary, marginRight: 4 }}>
                View All
              </Text>
              <Ionicons name="chevron-forward" size={12} color={COLORS.medicalPurple.primary} />
            </View>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            ...premiumShadow,
            overflow: 'hidden',
          }}
        >
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 4).map((activity, index) => {
              const getActivityIcon = () => {
                if (activity.type === 'earned' || activity.source === 'observation') return 'checkmark-circle';
                if (activity.type === 'spent' || activity.source === 'reward') return 'gift';
                if (activity.source === 'badge') return 'star';
                return 'clipboard';
              };
              
              const getActivityColor = () => {
                if (activity.type === 'earned' || activity.source === 'observation') return COLORS.medicalGreen;
                if (activity.type === 'spent' || activity.source === 'reward') return COLORS.gold;
                if (activity.source === 'badge') return COLORS.medicalPurple;
                return COLORS.medicalBlue;
              };
              
              const color = getActivityColor();
              
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: index < recentActivities.slice(0, 4).length - 1 ? 1 : 0,
                    borderBottomColor: '#f1f5f9',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: color.muted,
                      borderWidth: 1,
                      borderColor: color.light,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={getActivityIcon()} size={18} color={color.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 2 }} numberOfLines={1}>
                      {activity.description}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                      {activity.points > 0 ? `+${activity.points}` : activity.points} points
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#cbd5e1', fontWeight: '500' }}>
                    {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={{ paddingVertical: 32, paddingHorizontal: 16, alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="clipboard-outline" size={24} color="#94a3b8" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>
                No recent activity
              </Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                Activity will appear here as users interact with the system
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Analytics Charts Section */}
      <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.medicalTeal.light,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              shadowColor: COLORS.medicalTeal.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="stats-chart" size={20} color={COLORS.medicalTeal.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>
            Analytics Overview
          </Text>
        </View>

        {/* WHO 5 Moments Chart */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            ...premiumShadow,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: COLORS.medicalBlue.muted,
                borderWidth: 1,
                borderColor: COLORS.medicalBlue.light,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="hand-left" size={20} color={COLORS.medicalBlue.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: -0.3 }}>
                WHO 5 Moments
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                Compliance by moment type
              </Text>
            </View>
          </View>
          
          <WHOMomentsBarChart data={whoMomentsData} />
        </View>

        {/* Department Distribution Chart */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            ...premiumShadow,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: COLORS.medicalPurple.muted,
                borderWidth: 1,
                borderColor: COLORS.medicalPurple.light,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="pie-chart" size={20} color={COLORS.medicalPurple.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: -0.3 }}>
                Department Distribution
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                Observations by department
              </Text>
            </View>
          </View>
          
          <DepartmentPieChart data={departmentData} />
        </View>
      </View>

      {/* System Alerts - Premium Design */}
      <View style={{ paddingHorizontal: 20, marginTop: 24, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>
            System Alerts
          </Text>
          <View
            style={{
              backgroundColor: COLORS.medicalGreen.muted,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: COLORS.medicalGreen.light,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.medicalGreen.primary, letterSpacing: 0.5 }}>
              ALL CLEAR
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            ...premiumShadow,
            padding: 24,
          }}
        >
          {/* Success Icon */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: COLORS.medicalGreen.light,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: COLORS.medicalGreen.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Ionicons name="checkmark-circle" size={36} color={COLORS.medicalGreen.primary} />
            </View>
          </View>

          {/* Message */}
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 8 }}>
            No Active Alerts
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 }}>
            All systems are running smoothly. No issues detected.
          </Text>

          {/* Pro Tip */}
          <View
            style={{
              marginTop: 20,
              backgroundColor: COLORS.medicalBlue.muted,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.medicalBlue.light,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="bulb" size={16} color={COLORS.medicalBlue.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.medicalBlue.primary, marginBottom: 4 }}>
                  Pro Tip
                </Text>
                <Text style={{ fontSize: 11, color: '#475569', lineHeight: 16 }}>
                  Set up email notifications to receive alerts instantly.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default AdminDashboardScreen;
