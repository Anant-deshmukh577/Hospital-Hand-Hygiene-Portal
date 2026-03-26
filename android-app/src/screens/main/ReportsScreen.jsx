import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { reportService } from '../../services/reportService';
import { wardService } from '../../services/wardService';
import { observationService } from '../../services/observationService';
import { WHOMomentsBarChart, DepartmentPieChart, ComplianceProgressChart } from '../../components/charts/Charts';
import { exportToPDF, exportToCSV, exportToExcel, prepareWHOMomentsData } from '../../utils/exportUtils';
import Loader from '../../components/common/Loader';

// ─── Design system ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getComplianceColor = (rate) => {
  if (rate >= 90) return COLORS.emerald;
  if (rate >= 75) return COLORS.gold;
  return COLORS.rose;
};

const formatWHOMoment = (moment) => {
  const labels = {
    before_patient:    'Before Patient',
    before_aseptic:    'Before Aseptic',
    after_body_fluid:  'After Body Fluid',
    after_patient:     'After Patient',
    after_surroundings:'After Surroundings',
  };
  return labels[moment] || moment;
};

// ─── Reusable: Stat Card (fully colored, matches rest of app) ─────────────────
const StatCard = ({ icon, value, label, color, style }) => (
  <View style={[{ backgroundColor: color.light, borderRadius: 28, padding: 20, ...premiumShadow }, style]}>
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      shadowColor: color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    }}>
      <Ionicons name={icon} size={21} color="#ffffff" />
    </View>
    <Text style={{ fontSize: 28, fontWeight: '900', color: color.primary, letterSpacing: -1 }}>{value}</Text>
    <Text style={{ fontSize: 11, color: color.primary, marginTop: 3, fontWeight: '700', opacity: 0.7 }}>{label}</Text>
  </View>
);

// ─── Reusable: Filter Chip ─────────────────────────────────────────────────────
const FilterChip = ({ label, selected, onPress, color, icon }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
      backgroundColor: selected ? color.primary : '#ffffff',
      borderWidth: 1.5, borderColor: selected ? color.primary : '#E5E7EB',
      flexDirection: 'row', alignItems: 'center', gap: 6,
      ...softShadow,
    }}
  >
    {icon && (
      <Ionicons name={icon} size={13} color={selected ? '#ffffff' : color.primary} />
    )}
    <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? '#ffffff' : '#6B7280' }}>
      {label}
    </Text>
  </Pressable>
);

// ─── Reusable: Section Header ─────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
    <View style={{
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: color.light, alignItems: 'center', justifyContent: 'center', marginRight: 12,
    }}>
      <Ionicons name={icon} size={22} color={color.primary} />
    </View>
    <View>
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{subtitle}</Text>}
    </View>
  </View>
);

// ═════════════════════════════════════════════════════════════════════════════
const ReportsScreen = () => {
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [stats, setStats]                   = useState(null);
  const [complianceReport, setComplianceReport] = useState(null);
  const [departments, setDepartments]       = useState([]);
  const [wards, setWards]                   = useState([]);
  const [whoMomentsData, setWhoMomentsData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [selectedPeriod, setSelectedPeriod]         = useState('week');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedWard, setSelectedWard]             = useState('');

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { if (!loading) loadReportData(); }, [selectedPeriod, selectedDepartment, selectedWard]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [deptResponse, wardResponse] = await Promise.all([
        wardService.getDepartments(),
        wardService.getWards(),
      ]);
      if (deptResponse.success)  setDepartments(deptResponse.departments || []);
      if (wardResponse.success)  setWards(wardResponse.wards || []);
      await loadReportData();
    } catch (error) {
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const filters = getDateFilters();
      if (selectedDepartment) filters.department = selectedDepartment;
      if (selectedWard)       filters.ward = selectedWard;

      const [statsResponse, complianceResponse] = await Promise.all([
        reportService.getDashboardStats(filters),
        reportService.getComplianceReport(filters),
      ]);

      if (statsResponse.success)     setStats(statsResponse.stats);
      if (complianceResponse.success) {
        setComplianceReport(complianceResponse.report);
        const whoMoments = complianceResponse.report?.whoMoments || [];
        setWhoMomentsData(whoMoments.map(m => ({
          name: m.moment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          adherence: m.adherence || 0,
          partial:   m.partial   || 0,
          missed:    m.missed    || 0,
        })));
      }

      try {
        const obsResponse  = await observationService.getObservations({ ...filters, limit: 1000 });
        const observations = obsResponse.observations || [];
        const deptCounts   = {};
        observations.forEach(obs => {
          if (obs.department) deptCounts[obs.department] = (deptCounts[obs.department] || 0) + 1;
        });
        setDepartmentData(
          Object.entries(deptCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
        );
      } catch (_) { setDepartmentData([]); }
    } catch (_) {
      Alert.alert('Error', 'Failed to load report data');
    }
  };

  const getDateFilters = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'today': {
        const s = new Date(now); s.setHours(0, 0, 0, 0);
        const e = new Date(now); e.setHours(23, 59, 59, 999);
        return { startDate: s.toISOString(), endDate: e.toISOString() };
      }
      case 'week':
        return { startDate: new Date(now - 7 * 864e5).toISOString(), endDate: now.toISOString() };
      case 'month':
        return { startDate: new Date(now - 30 * 864e5).toISOString(), endDate: now.toISOString() };
      default: return {};
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadReportData(); setRefreshing(false); };

  const handleExport = async (format) => {
    try {
      Alert.alert('Exporting...', 'Please wait while we prepare your report');
      const filters = getDateFilters();
      if (selectedDepartment) filters.department = selectedDepartment;
      if (selectedWard)       filters.ward = selectedWard;

      if (format === 'pdf') {
        await exportToPDF({ stats: stats || {}, complianceReport: complianceReport || {}, filters: { period: selectedPeriod, department: selectedDepartment, ward: selectedWard }, timestamp: new Date() }, 'hand_hygiene_report');
      } else {
        const whoData = prepareWHOMomentsData(complianceReport?.whoMoments || []);
        if (!whoData.length) { Alert.alert('No Data', 'There is no data to export'); return; }
        if (format === 'csv') await exportToCSV(whoData, 'hand_hygiene_report');
        else await exportToExcel(whoData, 'hand_hygiene_report');
      }
    } catch (error) {
      Alert.alert('Export Failed', error.message || 'Failed to export report');
    }
  };

  const clearFilters = () => { setSelectedPeriod('week'); setSelectedDepartment(''); setSelectedWard(''); };

  const hasActiveFilters = selectedDepartment || selectedWard || selectedPeriod !== 'week';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <Loader text="Loading Reports..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.medicalBlue.primary} />}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>Reports</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>Compliance insights & trends</Text>
          </View>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: COLORS.medicalBlue.light, alignItems: 'center', justifyContent: 'center',
            shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
          }}>
            <Ionicons name="bar-chart" size={28} color={COLORS.medicalBlue.primary} />
          </View>
        </View>
      </View>

      {/* ── FILTERS CARD ────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 20, ...premiumShadow }}>

          {/* Time Period */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 }}>
            TIME PERIOD
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { value: 'today', label: 'Today',    icon: 'today' },
                { value: 'week',  label: 'This Week', icon: 'calendar' },
                { value: 'month', label: 'Month',    icon: 'calendar-outline' },
                { value: 'all',   label: 'All Time', icon: 'infinite' },
              ].map(p => (
                <FilterChip
                  key={p.value}
                  label={p.label}
                  icon={p.icon}
                  selected={selectedPeriod === p.value}
                  onPress={() => setSelectedPeriod(p.value)}
                  color={COLORS.medicalBlue}
                />
              ))}
            </View>
          </ScrollView>

          {/* Department */}
          {departments.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 }}>
                DEPARTMENT
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <FilterChip label="All" selected={!selectedDepartment} onPress={() => setSelectedDepartment('')} color={COLORS.medicalTeal} />
                  {departments.map(d => (
                    <FilterChip key={d._id} label={d.name} selected={selectedDepartment === d.name} onPress={() => setSelectedDepartment(d.name)} color={COLORS.medicalTeal} />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Ward */}
          {wards.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 }}>
                WARD
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <FilterChip label="All" selected={!selectedWard} onPress={() => setSelectedWard('')} color={COLORS.medicalPurple} />
                  {wards.map(w => (
                    <FilterChip key={w._id} label={w.name} selected={selectedWard === w.name} onPress={() => setSelectedWard(w.name)} color={COLORS.medicalPurple} />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Pressable
              onPress={clearFilters}
              style={{
                marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: COLORS.rose.light, borderRadius: 20, paddingVertical: 11,
                borderWidth: 1.5, borderColor: COLORS.rose.muted,
              }}
            >
              <Ionicons name="close-circle" size={16} color={COLORS.rose.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.rose.primary }}>Clear All Filters</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── SUMMARY STATS ───────────────────────────────────────────────────── */}
      {stats && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          {/* Section label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.medicalBlue.light, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Ionicons name="stats-chart" size={18} color={COLORS.medicalBlue.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.4 }}>Summary</Text>
          </View>

          {/* 2×3 grid */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <StatCard icon="document-text"  value={stats.totalObservations}      label="Observations"  color={COLORS.medicalBlue}   style={{ flex: 1 }} />
            <StatCard icon="checkmark-circle" value={`${stats.complianceRate ?? 0}%`} label="Compliance"   color={getComplianceColor(stats.complianceRate ?? 0)} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <StatCard icon="checkmark-done"  value={stats.breakdown?.adherence ?? 0} label="Adherence"     color={COLORS.medicalGreen}  style={{ flex: 1 }} />
            <StatCard icon="remove-circle"   value={stats.breakdown?.partial   ?? 0} label="Partial"       color={COLORS.gold}          style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard icon="close-circle"    value={stats.breakdown?.missed    ?? 0} label="Missed"        color={COLORS.rose}          style={{ flex: 1 }} />
            <StatCard icon="people"          value={stats.totalUsers           ?? 0} label="Active Users"  color={COLORS.medicalPurple} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      {/* ── COMPLIANCE BREAKDOWN CHART ───────────────────────────────────────── */}
      {stats && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 22, ...premiumShadow }}>
            <SectionHeader icon="bar-chart" title="Compliance Breakdown" subtitle="Overall adherence rates" color={COLORS.emerald} />
            <ComplianceProgressChart
              adherenceRate={stats.breakdown?.adherence && stats.totalObservations ? Math.round((stats.breakdown.adherence / stats.totalObservations) * 100) : 0}
              partialRate={stats.breakdown?.partial && stats.totalObservations ? Math.round((stats.breakdown.partial / stats.totalObservations) * 100) : 0}
              missedRate={stats.breakdown?.missed && stats.totalObservations ? Math.round((stats.breakdown.missed / stats.totalObservations) * 100) : 0}
            />
          </View>
        </View>
      )}

      {/* ── WHO 5 MOMENTS BAR CHART ─────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 22, ...premiumShadow }}>
          <SectionHeader icon="hand-left" title="WHO 5 Moments" subtitle="Compliance by moment type" color={COLORS.medicalBlue} />
          <WHOMomentsBarChart data={whoMomentsData} />
        </View>
      </View>

      {/* ── DEPARTMENT PIE CHART ────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 30, padding: 22, ...premiumShadow }}>
          <SectionHeader icon="pie-chart" title="Department Distribution" subtitle="Observations by department" color={COLORS.medicalPurple} />
          <DepartmentPieChart data={departmentData} />
        </View>
      </View>

      {/* ── WHO MOMENTS DETAILED BREAKDOWN ─────────────────────────────────── */}
      {complianceReport?.whoMoments?.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          {/* Section label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.medicalCyan.light, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Ionicons name="hand-right" size={18} color={COLORS.medicalCyan.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.4 }}>WHO 5 Moments Breakdown</Text>
          </View>

          <View style={{ backgroundColor: '#ffffff', borderRadius: 30, overflow: 'hidden', ...premiumShadow }}>
            {complianceReport.whoMoments.map((moment, index) => {
              const rate  = parseFloat(moment.complianceRate) || 0;
              const color = getComplianceColor(rate);
              const isLast = index === complianceReport.whoMoments.length - 1;
              return (
                <View
                  key={moment.moment}
                  style={{
                    padding: 20,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  {/* Title row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: color.light, alignItems: 'center', justifyContent: 'center', marginRight: 10,
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: color.primary }}>{index + 1}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937', flex: 1 }}>
                        {formatWHOMoment(moment.moment)}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: color.light, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: color.primary }}>{rate.toFixed(1)}%</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                    <View style={{ height: '100%', width: `${rate}%`, backgroundColor: color.primary, borderRadius: 4 }} />
                  </View>

                  {/* Stats row */}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      { icon: 'ellipse', label: `Total: ${moment.total}`, color: '#9CA3AF' },
                      { icon: 'checkmark-circle', label: String(moment.adherence), color: COLORS.emerald.primary },
                      { icon: 'remove-circle',    label: String(moment.partial),   color: COLORS.gold.primary },
                      { icon: 'close-circle',     label: String(moment.missed),    color: COLORS.rose.primary },
                    ].map((s, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name={s.icon} size={13} color={s.color} />
                        <Text style={{ fontSize: 11, color: s.color, fontWeight: '700' }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── EXPORT SECTION ──────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Ionicons name="download" size={18} color={COLORS.indigo.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.4 }}>Export Report</Text>
        </View>

        <View style={{ gap: 12 }}>
          {[
            { format: 'pdf',   label: 'Export as PDF',   sublabel: 'Full report with charts',  icon: 'document-text', color: COLORS.rose },
            { format: 'excel', label: 'Export as Excel', sublabel: 'Spreadsheet format (.xlsx)', icon: 'grid',          color: COLORS.emerald },
            { format: 'csv',   label: 'Export as CSV',   sublabel: 'Raw data, comma-separated', icon: 'list',          color: COLORS.medicalBlue },
          ].map(opt => (
            <Pressable
              key={opt.format}
              onPress={() => handleExport(opt.format)}
              style={{ backgroundColor: '#ffffff', borderRadius: 28, ...premiumShadow }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: opt.color.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16,
                  shadowColor: opt.color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                }}>
                  <Ionicons name={opt.icon} size={24} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937', letterSpacing: -0.2 }}>{opt.label}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{opt.sublabel}</Text>
                </View>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: opt.color.light, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="arrow-down" size={17} color={opt.color.primary} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── FOOTER INFO ─────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{
          backgroundColor: COLORS.medicalBlue.light, borderRadius: 30, padding: 22,
          flexDirection: 'row', alignItems: 'center', gap: 16,
          borderWidth: 1.5, borderColor: COLORS.medicalBlue.muted, ...softShadow,
        }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: COLORS.medicalBlue.primary, alignItems: 'center', justifyContent: 'center',
            shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
          }}>
            <Ionicons name="information-circle" size={26} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.medicalBlue.primary, marginBottom: 4, letterSpacing: -0.3 }}>
              Real-Time Data
            </Text>
            <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
              Reports are generated in real-time based on your selected filters and current data.
            </Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
};

export default ReportsScreen;