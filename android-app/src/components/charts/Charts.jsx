import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, G, Path } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

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

const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

const premiumShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 12,
  elevation: 5,
};

// ─── Stat Bubble ──────────────────────────────────────────────────────────────
const StatBubble = ({ value, label, color, size = 52 }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
      shadowColor: color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
    }}>
      <Text style={{ fontSize: size * 0.28, fontWeight: '900', color: '#ffffff' }}>{value}</Text>
    </View>
    <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '700', textAlign: 'center' }}>{label}</Text>
  </View>
);

// ═════════════════════════════════════════════════════════════════════════════
// 1. WEEKLY PERFORMANCE LINE CHART
// ═════════════════════════════════════════════════════════════════════════════
export const WeeklyPerformanceChart = ({ data = [], width = screenWidth - 80 }) => {
  const defaultData = [
    { day: 'Mon', observations: 4,  compliance: 75 },
    { day: 'Tue', observations: 6,  compliance: 83 },
    { day: 'Wed', observations: 5,  compliance: 80 },
    { day: 'Thu', observations: 7,  compliance: 86 },
    { day: 'Fri', observations: 8,  compliance: 88 },
    { day: 'Sat', observations: 3,  compliance: 67 },
    { day: 'Sun', observations: 2,  compliance: 100 },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const avgCompliance = Math.round(chartData.reduce((s, d) => s + d.compliance, 0) / chartData.length);
  const totalObs      = chartData.reduce((s, d) => s + d.observations, 0);
  const bestDay       = chartData.reduce((b, d) => d.compliance > b.compliance ? d : b, chartData[0]);

  const lineData = {
    labels: chartData.map(d => d.day),
    datasets: [{
      data: chartData.map(d => d.compliance),
      color: (opacity = 1) => `rgba(14,165,233,${opacity})`,
      strokeWidth: 3,
    }],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(14,165,233,${opacity})`,
    labelColor: () => '#9CA3AF',
    propsForDots: { r: '5', strokeWidth: '3', stroke: '#ffffff' },
    propsForBackgroundLines: { strokeDasharray: '4 4', stroke: '#F3F4F6', strokeWidth: 1 },
    propsForLabels: { fontSize: 11, fontWeight: '600' },
  };

  return (
    <View>
      {/* Line chart */}
      <LineChart
        data={lineData}
        width={width}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={{ borderRadius: 16, marginBottom: 4 }}
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines
        withShadow={false}
        fromZero={false}
      />

      {/* Stats row */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: '#F8F9FA', borderRadius: 24, padding: 18, marginTop: 8,
        borderWidth: 1, borderColor: '#F3F4F6',
      }}>
        <StatBubble value={`${avgCompliance}%`} label="Avg Compliance" color={COLORS.medicalBlue} />
        <View style={{ width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
        <StatBubble value={totalObs} label="Total Obs." color={COLORS.medicalTeal} />
        <View style={{ width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
        <StatBubble value={bestDay.day} label="Best Day" color={COLORS.emerald} />
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. WHO 5 MOMENTS BAR CHART — premium stacked bars
// ═════════════════════════════════════════════════════════════════════════════
export const WHOMomentsBarChart = ({ data = [] }) => {
  const defaultData = [
    { name: 'Before Patient',     adherence: 12, partial: 3, missed: 2 },
    { name: 'Before Aseptic',     adherence: 10, partial: 4, missed: 3 },
    { name: 'After Body Fluid',   adherence: 15, partial: 2, missed: 1 },
    { name: 'After Patient',      adherence: 14, partial: 3, missed: 2 },
    { name: 'After Surroundings', adherence: 11, partial: 4, missed: 3 },
  ];

  const chartData      = data.length > 0 ? data : defaultData;
  const maxValue       = Math.max(...chartData.map(d => d.adherence + d.partial + d.missed), 1);
  const BAR_MAX_H      = 160;
  const totalAdherence = chartData.reduce((s, m) => s + m.adherence, 0);
  const totalPartial   = chartData.reduce((s, m) => s + m.partial,   0);
  const totalMissed    = chartData.reduce((s, m) => s + m.missed,    0);

  // Two-line short labels that are actually readable
  const shortLabel = (name) => ({
    'Before Patient':     ['Before', 'Patient'],
    'Before Aseptic':     ['Before', 'Aseptic'],
    'After Body Fluid':   ['After', 'Body Fluid'],
    'After Patient':      ['After', 'Patient'],
    'After Surroundings': ['After', 'Surround.'],
  }[name] || name.split(' ').slice(0, 2));

  return (
    <View>
      {/* Legend pills — top */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Adherence', color: COLORS.emerald },
          { label: 'Partial',   color: COLORS.gold },
          { label: 'Missed',    color: COLORS.rose },
        ].map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.color.primary }} />
            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, gap: 10, marginBottom: 0 }}>
        {chartData.map((m, i) => {
          const total  = m.adherence + m.partial + m.missed;
          const adhH   = (m.adherence / maxValue) * BAR_MAX_H;
          const parH   = (m.partial   / maxValue) * BAR_MAX_H;
          const misH   = (m.missed    / maxValue) * BAR_MAX_H;
          const totalH = adhH + parH + misH || 4;
          const lines  = shortLabel(m.name);

          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              {/* Total count above bar */}
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#1F2937', marginBottom: 6 }}>{total}</Text>

              {/* Stacked bar */}
              <View style={{
                width: '100%', height: totalH,
                borderRadius: 14, overflow: 'hidden',
                shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
              }}>
                {misH > 0 && (
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: misH, backgroundColor: COLORS.rose.primary }} />
                )}
                {parH > 0 && (
                  <View style={{ position: 'absolute', bottom: misH, left: 0, right: 0, height: parH, backgroundColor: COLORS.gold.primary }} />
                )}
                {adhH > 0 && (
                  <View style={{
                    position: 'absolute', bottom: misH + parH, left: 0, right: 0, height: adhH,
                    backgroundColor: COLORS.emerald.primary,
                    borderTopLeftRadius: 14, borderTopRightRadius: 14,
                  }} />
                )}
              </View>

              {/* Two-line label below bar */}
              <View style={{ marginTop: 10, alignItems: 'center', minHeight: 32 }}>
                {lines.map((line, li) => (
                  <Text key={li} style={{
                    fontSize: 10, fontWeight: li === 0 ? '800' : '600',
                    color: li === 0 ? '#374151' : '#9CA3AF',
                    textAlign: 'center', lineHeight: 15,
                  }}>
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Totals row */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: '#F8F9FA', borderRadius: 24, padding: 16, marginTop: 20,
        borderWidth: 1, borderColor: '#F3F4F6',
      }}>
        {[
          { label: 'Adherence', value: totalAdherence, color: COLORS.emerald },
          { label: 'Partial',   value: totalPartial,   color: COLORS.gold },
          { label: 'Missed',    value: totalMissed,    color: COLORS.rose },
        ].map((s, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <View style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: s.color.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
              shadowColor: s.color.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>{s.value}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700' }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 3. DEPARTMENT PIE CHART — custom SVG donut
// ═════════════════════════════════════════════════════════════════════════════
const PIE_COLORS = [
  COLORS.medicalBlue.primary,
  COLORS.medicalTeal.primary,
  COLORS.medicalPurple.primary,
  COLORS.gold.primary,
  COLORS.emerald.primary,
  COLORS.rose.primary,
];

const buildDonutSlices = (data, cx, cy, R, r) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return [];

  let startAngle = -Math.PI / 2; // start from top
  return data.map((d, i) => {
    const angle     = (d.value / total) * 2 * Math.PI;
    const endAngle  = startAngle + angle;
    const gap       = 0.03; // small gap between slices

    const x1o = cx + R * Math.cos(startAngle + gap);
    const y1o = cy + R * Math.sin(startAngle + gap);
    const x2o = cx + R * Math.cos(endAngle   - gap);
    const y2o = cy + R * Math.sin(endAngle   - gap);
    const x1i = cx + r * Math.cos(endAngle   - gap);
    const y1i = cy + r * Math.sin(endAngle   - gap);
    const x2i = cx + r * Math.cos(startAngle + gap);
    const y2i = cy + r * Math.sin(startAngle + gap);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `M ${x1o} ${y1o} A ${R} ${R} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${r} ${r} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;

    startAngle = endAngle;
    return { path, color: PIE_COLORS[i % PIE_COLORS.length], value: d.value, name: d.name };
  });
};

export const DepartmentPieChart = ({ data = [] }) => {
  const defaultData = [
    { name: 'Emergency',  value: 25 },
    { name: 'ICU',        value: 20 },
    { name: 'Surgery',    value: 18 },
    { name: 'Pediatrics', value: 15 },
    { name: 'Medicine',   value: 12 },
    { name: 'Others',     value: 10 },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const total     = chartData.reduce((s, d) => s + d.value, 0);

  const SIZE = 200;
  const cx   = SIZE / 2;
  const cy   = SIZE / 2;
  const R    = 82;
  const r    = 50; // donut hole

  const slices = buildDonutSlices(chartData, cx, cy, R, r);

  return (
    <View>
      {/* SVG Donut */}
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <View style={{ position: 'relative' }}>
          <Svg width={SIZE} height={SIZE}>
            {slices.map((s, i) => (
              <Path
                key={i}
                d={s.path}
                fill={s.color}
                opacity={0.92}
              />
            ))}
          </Svg>
          {/* Center label */}
          <View style={{
            position: 'absolute',
            top: cy - 26, left: cx - 26,
            width: 52, height: 52,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>{total}</Text>
            <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '700' }}>total</Text>
          </View>
        </View>
      </View>

      {/* Legend grid */}
      <View style={{
        backgroundColor: '#F8F9FA', borderRadius: 24, padding: 14,
        borderWidth: 1, borderColor: '#F3F4F6',
      }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {chartData.map((dept, i) => {
            const pct   = total > 0 ? ((dept.value / total) * 100).toFixed(1) : 0;
            const color = PIE_COLORS[i % PIE_COLORS.length];
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#ffffff', borderRadius: 16,
                  paddingHorizontal: 12, paddingVertical: 10,
                  minWidth: '45%', flex: 1,
                  ...softShadow,
                }}
              >
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: 10,
                  shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#ffffff' }}>{dept.value}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#1F2937', marginBottom: 1 }} numberOfLines={1}>{dept.name}</Text>
                  <Text style={{ fontSize: 10, color, fontWeight: '700' }}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Total pill */}
        <View style={{ marginTop: 14, alignItems: 'center' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: COLORS.medicalBlue.primary, borderRadius: 20,
            paddingHorizontal: 20, paddingVertical: 10,
            shadowColor: COLORS.medicalBlue.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
          }}>
            <Ionicons name="layers" size={16} color="#ffffff" />
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff' }}>
              {total} Total Observations
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. COMPLIANCE PROGRESS CHART — thick premium bars with icon + pill
// ═════════════════════════════════════════════════════════════════════════════
export const ComplianceProgressChart = ({ adherenceRate = 0, partialRate = 0, missedRate = 0 }) => {
  const bars = [
    {
      label: 'Adherence',
      value: adherenceRate,
      color: COLORS.emerald,
      icon: 'checkmark-circle',
    },
    {
      label: 'Partial Adherence',
      value: partialRate,
      color: COLORS.gold,
      icon: 'remove-circle',
    },
    {
      label: 'Missed',
      value: missedRate,
      color: COLORS.rose,
      icon: 'close-circle',
    },
  ];

  return (
    <View style={{ gap: 16, marginTop: 4 }}>
      {bars.map((bar, i) => (
        <View key={i}>
          {/* Label row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: bar.color.light, alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={bar.icon} size={17} color={bar.color.primary} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937' }}>{bar.label}</Text>
            </View>
            <View style={{
              backgroundColor: bar.color.light, borderRadius: 14,
              paddingHorizontal: 12, paddingVertical: 5,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: bar.color.primary }}>{bar.value}%</Text>
            </View>
          </View>

          {/* Progress track */}
          <View style={{
            height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${Math.min(bar.value, 100)}%`,
              backgroundColor: bar.color.primary,
              borderRadius: 6,
            }} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default {
  WeeklyPerformanceChart,
  WHOMomentsBarChart,
  DepartmentPieChart,
  ComplianceProgressChart,
};