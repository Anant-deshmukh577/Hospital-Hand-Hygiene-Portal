import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { observationService } from '../../services/observationService';
import Loader from '../../components/common/Loader';
import { ADHERENCE_OPTIONS } from '../../utils/constants';

// ─── Design system (exact match: ObservationEntryScreen / RewardsScreen) ──────
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
const formatWhoMoment = (moment) => {
  if (!moment) return 'N/A';
  if (moment.startsWith('moment_')) return `Moment ${moment.split('_')[1]}`;
  return moment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getAdherenceBadge = (adherence) => {
  if (adherence === 'adherence' || adherence === 'hand_rub' || adherence === 'hand_wash')
    return { color: COLORS.emerald, label: 'Adherence', icon: 'checkmark-circle' };
  if (adherence === 'gloves_only')
    return { color: COLORS.gold, label: 'Gloves Only', icon: 'hand-right' };
  return { color: COLORS.rose, label: 'Missed', icon: 'close-circle' };
};

// ─── InfoTile: mini colored tile used inside each observation card ─────────────
const InfoTile = ({ icon, label, value, color }) => (
  <View style={{ flex: 1, backgroundColor: color.light, borderRadius: 20, padding: 14 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Ionicons name={icon} size={12} color={color.primary} style={{ marginRight: 4 }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: color.primary, letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1F2937' }}>{value}</Text>
  </View>
);

// ─── StatCard: fully colored background like RewardsScreen ───────────────────
const StatCard = ({ icon, value, label, color }) => (
  <View style={{ flex: 1, backgroundColor: color.light, borderRadius: 30, padding: 20, ...premiumShadow }}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      shadowColor: color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    }}>
      <Ionicons name={icon} size={22} color="#ffffff" />
    </View>
    <Text style={{ fontSize: 28, fontWeight: '900', color: color.primary, letterSpacing: -1 }}>{value}</Text>
    <Text style={{ fontSize: 12, color: color.primary, marginTop: 4, fontWeight: '600', opacity: 0.7 }}>{label}</Text>
  </View>
);

// ─── FilterChip ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress, color }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
      backgroundColor: active ? color.primary : '#ffffff',
      borderWidth: 1.5, borderColor: active ? color.primary : '#E5E7EB',
      ...softShadow,
    }}
  >
    <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#ffffff' : '#6B7280' }}>
      {label}
    </Text>
  </Pressable>
);

// ══════════════════════════════════════════════════════════════════════════════
const ObservationHistoryScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [observations, setObservations] = useState([]);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchObservations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (!user?.id) { setObservations([]); return; }
      const canViewAll = user?.role === 'auditor' || user?.role === 'admin';
      const response = canViewAll
        ? await observationService.getObservations({ limit: 100 })
        : await observationService.getObservationsByUser(user.id, { limit: 100 });
      setObservations((response.observations || []).map(obs => ({
        id: obs._id,
        department: obs.department,
        designation: obs.designation,
        whoMoment: obs.whoMoment,
        adherence: obs.adherence,
        action: obs.action,
        glove: obs.glove,
        remarks: obs.remarks || '',
        ward: obs.ward,
        createdAt: obs.createdAt,
      })));
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load observations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredObservations = useMemo(() => observations.filter(obs => {
    const matchesSearch =
      obs.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'compliant'     && ['adherence', 'hand_rub', 'hand_wash'].includes(obs.adherence)) ||
      (filterStatus === 'non-compliant' && ['missed', 'gloves_only'].includes(obs.adherence));
    return matchesSearch && matchesStatus;
  }), [observations, searchTerm, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = filteredObservations.length;
    const adherence = filteredObservations.filter(o => ['adherence', 'hand_rub', 'hand_wash'].includes(o.adherence)).length;
    const partial   = filteredObservations.filter(o => o.adherence === 'gloves_only').length;
    const missed    = filteredObservations.filter(o => o.adherence === 'missed').length;
    const complianceRate = total > 0 ? Math.round((adherence / total) * 100) : 0;
    return { total, adherence, partial, missed, complianceRate };
  }, [filteredObservations]);

  const complianceColor =
    stats.complianceRate >= 90 ? COLORS.emerald :
    stats.complianceRate >= 75 ? COLORS.gold    :
    COLORS.rose;

  useEffect(() => {
    if (user?.id) fetchObservations();
  }, [user?.id, fetchObservations]);

  const handleRefresh      = () => { if (!refreshing) fetchObservations(true); };
  const handleClearFilters = () => { setSearchTerm(''); setFilterStatus('all'); };

  // ── Observation card ───────────────────────────────────────────────────────
  const renderObservationCard = ({ item, index }) => {
    const badge = getAdherenceBadge(item.adherence);
    return (
      <View style={{
        backgroundColor: '#ffffff', borderRadius: 30,
        padding: 22, marginBottom: 16, ...premiumShadow,
      }}>
        {/* Top: index + dept/ward + adherence badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.indigo.primary }}>#{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                {item.department || 'N/A'}
              </Text>
              {item.ward ? (
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' }}>
                  Ward · {item.ward}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
            backgroundColor: badge.color.light,
          }}>
            <Ionicons name={badge.icon} size={13} color={badge.color.primary} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: badge.color.primary, letterSpacing: 0.4 }}>
              {badge.label.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Row 1: WHO Moment + Action */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <InfoTile icon="hand-right-outline" label="WHO MOMENT" value={formatWhoMoment(item.whoMoment)} color={COLORS.medicalCyan} />
          <InfoTile icon="flash-outline"      label="ACTION"     value={(item.action || 'N/A').toUpperCase()} color={COLORS.emerald} />
        </View>

        {/* Row 2: Designation + Glove */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: item.remarks ? 10 : 0 }}>
          {item.designation
            ? <InfoTile icon="person-outline"   label="DESIGNATION" value={item.designation}                  color={COLORS.medicalPurple} />
            : null}
          <InfoTile icon="hand-left-outline" label="GLOVE" value={(item.glove || 'N/A').toUpperCase()} color={COLORS.gold} />
        </View>

        {/* Remarks */}
        {item.remarks ? (
          <View style={{
            backgroundColor: COLORS.indigo.light, borderRadius: 20,
            padding: 14, marginTop: 10,
            borderWidth: 1, borderColor: COLORS.indigo.muted,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="create-outline" size={12} color={COLORS.indigo.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.indigo.primary, letterSpacing: 0.5 }}>REMARKS</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 19, fontStyle: 'italic' }}>
              "{item.remarks}"
            </Text>
          </View>
        ) : null}

        {/* Timestamp footer */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginTop: 16, paddingTop: 14,
          borderTopWidth: 1, borderTopColor: '#F3F4F6',
        }}>
          <View style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 8,
          }}>
            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
          </View>
          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>
            {new Date(item.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  // ── FlatList header ────────────────────────────────────────────────────────
  const ListHeader = (
    <>
      {/* Header — matches RewardsScreen / ObservationEntryScreen exactly */}
      <View style={{ paddingTop: 60, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
              Observation
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
              History
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
              View past observations
            </Text>
          </View>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center',
            shadowColor: COLORS.indigo.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
          }}>
            <Ionicons name="clipboard" size={28} color={COLORS.indigo.primary} />
          </View>
        </View>
      </View>

      {/* Stats 2×2 */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard icon="list"             value={stats.total}                label="Total"       color={COLORS.indigo} />
          <StatCard icon="checkmark-circle" value={stats.adherence}            label="Adherence"   color={COLORS.medicalGreen} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard icon="hand-right"       value={stats.partial}              label="Gloves Only" color={COLORS.medicalCyan} />
          <StatCard icon="stats-chart"      value={`${stats.complianceRate}%`} label="Compliance"  color={COLORS.medicalPurple} />
        </View>
      </View>

      {/* Compliance bar */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 22, ...premiumShadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: complianceColor.light, alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={complianceColor.primary} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>
                Compliance Rate
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: complianceColor.primary, letterSpacing: -1 }}>
              {stats.complianceRate}%
            </Text>
          </View>
          <View style={{ height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
            <View style={{
              height: '100%', borderRadius: 6,
              width: `${stats.complianceRate}%`,
              backgroundColor: complianceColor.primary,
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { label: 'Adherent',    value: stats.adherence, color: COLORS.emerald },
              { label: 'Gloves Only', value: stats.partial,   color: COLORS.gold },
              { label: 'Missed',      value: stats.missed,    color: COLORS.rose },
            ].map(s => (
              <View key={s.label} style={{ alignItems: 'center' }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: s.color.light, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: s.color.primary }}>{s.value}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={{ marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#ffffff', borderRadius: 20,
          borderWidth: 1.5, borderColor: '#E5E7EB',
          paddingHorizontal: 16, paddingVertical: 13, ...softShadow,
        }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <Ionicons name="search" size={16} color={COLORS.indigo.primary} />
          </View>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search department, designation..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' }}
          />
          {searchTerm ? (
            <Pressable onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FilterChip label={`All (${observations.length})`}            active={filterStatus === 'all'}           onPress={() => setFilterStatus('all')}           color={COLORS.indigo} />
            <FilterChip label={`Compliant (${stats.adherence})`}          active={filterStatus === 'compliant'}     onPress={() => setFilterStatus('compliant')}     color={COLORS.medicalGreen} />
            <FilterChip label={`Non-Compliant (${stats.missed + stats.partial})`} active={filterStatus === 'non-compliant'} onPress={() => setFilterStatus('non-compliant')} color={COLORS.rose} />
          </View>
        </ScrollView>
      </View>

      {/* Clear filters */}
      {(searchTerm || filterStatus !== 'all') && (
        <View style={{ marginBottom: 16 }}>
          <Pressable
            onPress={handleClearFilters}
            style={{
              flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
              backgroundColor: COLORS.rose.light, borderRadius: 20,
              paddingHorizontal: 16, paddingVertical: 10,
              borderWidth: 1.5, borderColor: COLORS.rose.muted,
            }}
          >
            <Ionicons name="close-circle" size={15} color={COLORS.rose.primary} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.rose.primary }}>Clear Filters</Text>
          </Pressable>
        </View>
      )}

      {/* Results count */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>
          Showing {filteredObservations.length} of {observations.length} observations
        </Text>
      </View>
    </>
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  const ListEmpty = (
    <View>
      <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 48, alignItems: 'center', ...premiumShadow }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          shadowColor: COLORS.indigo.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
        }}>
          <Ionicons
            name={observations.length === 0 ? 'clipboard-outline' : 'search-outline'}
            size={36} color={COLORS.indigo.primary}
          />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#1F2937', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 }}>
          {observations.length === 0 ? 'No Observations Yet' : 'No Results Found'}
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21, marginBottom: 24 }}>
          {observations.length === 0
            ? 'Start recording observations to see them here'
            : 'Try adjusting your filters to see more results'}
        </Text>
        {observations.length > 0 && (
          <Pressable
            onPress={handleClearFilters}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: COLORS.indigo.primary, borderRadius: 20,
              paddingHorizontal: 24, paddingVertical: 14,
              shadowColor: COLORS.indigo.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
            }}
          >
            <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>Clear Filters</Text>
          </Pressable>
        )}
      </View>

      {observations.length === 0 && (
        <View style={{
          backgroundColor: COLORS.medicalTeal.light, borderRadius: 30,
          padding: 20, marginTop: 16, ...premiumShadow,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: COLORS.medicalTeal.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              <Ionicons name="sparkles" size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.medicalTeal.primary, marginBottom: 4 }}>
                Keep Up The Great Work!
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                Continue recording observations to track hand hygiene compliance across your facility.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <FlatList
        data={filteredObservations}
        renderItem={renderObservationCard}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.indigo.primary}
          />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
      />
    </View>
  );
};

export default ObservationHistoryScreen;