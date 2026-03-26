import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { observationService } from '../../services/observationService';
import { sessionService } from '../../services/sessionService';
import { userService } from '../../services/userService';
import {
  WHO_MOMENTS,
  ADHERENCE_OPTIONS,
  ACTION_OPTIONS,
  DEPARTMENTS,
  DESIGNATIONS,
  RISK_FACTORS,
  WARDS,
} from '../../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Color palette (matches RewardsScreen) ───────────────────────────────────
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

// ─── Hygiene step images ──────────────────────────────────────────────────────
// Place your actual images at: assets/hygiene/step_1.png … step_6.png
// Using placeholder require() calls — swap paths when assets are ready
const STEP_IMAGES = {
  rub_palm_to_palm:            require('../../../assets/hygiene/step_1.png'),
  rub_right_dorsum_left_palm:  require('../../../assets/hygiene/step_2.png'),
  rub_palm_to_palm_interlaced: require('../../../assets/hygiene/step_3.png'),
  rub_backs_fingers:           require('../../../assets/hygiene/step_4.png'),
  rub_thumb_rotation:          require('../../../assets/hygiene/step_5.png'),
  rub_fingers_rotation:        require('../../../assets/hygiene/step_6.png'),
};

const HYGIENE_STEPS = [
  { key: 'rub_palm_to_palm',            label: 'Palm to Palm',         step: 1 },
  { key: 'rub_right_dorsum_left_palm',  label: 'Dorsum & Interlaced',  step: 2 },
  { key: 'rub_palm_to_palm_interlaced', label: 'Fingers Interlaced',   step: 3 },
  { key: 'rub_backs_fingers',           label: 'Backs of Fingers',     step: 4 },
  { key: 'rub_thumb_rotation',          label: 'Thumb Rotation',       step: 5 },
  { key: 'rub_fingers_rotation',        label: 'Finger Rotation',      step: 6 },
];

// ─── Reusable UI components ───────────────────────────────────────────────────
const SectionCard = ({ children, style }) => (
  <View style={[{
    backgroundColor: '#ffffff', borderRadius: 30,
    padding: 20, marginBottom: 16, ...premiumShadow,
  }, style]}>
    {children}
  </View>
);

const SectionHeader = ({ icon, color, title, subtitle }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
    <View style={{
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: color.light, alignItems: 'center', justifyContent: 'center', marginRight: 12,
      shadowColor: color.primary, shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
    }}>
      <Ionicons name={icon} size={22} color={color.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
  </View>
);

const FieldLabel = ({ text, required }) => (
  <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>
    {text}{required && <Text style={{ color: COLORS.rose.primary }}> *</Text>}
  </Text>
);

const StyledInput = ({ icon, ...props }) => (
  <View style={{
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  }}>
    {icon && <Ionicons name={icon} size={18} color="#9CA3AF" style={{ marginRight: 10 }} />}
    <TextInput
      placeholderTextColor="#9CA3AF"
      style={{ flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' }}
      {...props}
    />
  </View>
);

const Chip = ({ label, selected, onPress, color = COLORS.indigo, disabled, subLabel }) => (
  <Pressable onPress={onPress} disabled={disabled} style={{
    paddingHorizontal: 16, paddingVertical: subLabel ? 10 : 10, borderRadius: 20,
    backgroundColor: selected ? color.primary : '#F3F4F6',
    borderWidth: 1.5, borderColor: selected ? color.primary : '#E5E7EB',
    opacity: disabled ? 0.55 : 1, alignItems: 'center',
  }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? '#ffffff' : '#4B5563' }}>{label}</Text>
    {subLabel && <Text style={{ fontSize: 10, color: selected ? 'rgba(255,255,255,0.8)' : '#9CA3AF', marginTop: 2 }}>{subLabel}</Text>}
  </Pressable>
);

const InfoBadge = ({ label, value, color }) => (
  <View style={{ minWidth: '45%' }}>
    <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 }}>{label}</Text>
    <Text style={{ fontSize: 13, fontWeight: '700', color: color || '#1F2937' }}>{value}</Text>
  </View>
);

// ─── Single hygiene step image card ──────────────────────────────────────────
const HygieneStepCard = ({ step, checked, onPress }) => {
  const cardSize = Math.floor((SCREEN_WIDTH - 40 - 32 - 20) / 3); // 3 cols, card padding + gaps
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardSize, borderRadius: 20, overflow: 'hidden',
        backgroundColor: checked ? COLORS.emerald.light : '#F9FAFB',
        borderWidth: 2, borderColor: checked ? COLORS.emerald.primary : '#E5E7EB',
        ...softShadow,
      }}
    >
      {/* Image */}
      <View style={{ width: '100%', height: cardSize, backgroundColor: checked ? COLORS.emerald.muted : '#EEF2FF', position: 'relative' }}>
        <Image
          source={STEP_IMAGES[step.key]}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
        {/* Step number */}
        <View style={{
          position: 'absolute', top: 6, left: 6,
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: checked ? COLORS.emerald.primary : COLORS.indigo.primary,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{step.step}</Text>
        </View>
        {/* Green tick overlay */}
        {checked && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5,150,105,0.18)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: COLORS.emerald.primary,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: COLORS.emerald.primary,
              shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
            }}>
              <Ionicons name="checkmark" size={22} color="#ffffff" />
            </View>
          </View>
        )}
      </View>
      {/* Label */}
      <View style={{ paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{
          fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14,
          color: checked ? COLORS.emerald.primary : '#374151',
        }}>
          {step.label}
        </Text>
      </View>
    </Pressable>
  );
};

// ─── 6-Step Hygiene grid (shared between active timer & result) ───────────────
const HygieneStepsGrid = ({ hygieneSteps, onToggle, stepsChecked }) => (
  <View style={{
    backgroundColor: '#ffffff', borderRadius: 24, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.indigo.muted, marginTop: 16, width: '100%',
  }}>
    {/* Header */}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: COLORS.indigo.light, alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Ionicons name="hand-left-outline" size={16} color={COLORS.indigo.primary} />
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '900', color: '#1F2937' }}>6-Step Technique</Text>
          <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Tap each step to mark complete</Text>
        </View>
      </View>
      <View style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        backgroundColor: stepsChecked === 6 ? COLORS.emerald.primary : COLORS.indigo.primary,
      }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff' }}>
          {stepsChecked}<Text style={{ fontSize: 10, fontWeight: '600' }}>/6</Text>
        </Text>
      </View>
    </View>

    {/* 3-column grid */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
      {HYGIENE_STEPS.map((step) => (
        <HygieneStepCard
          key={step.key}
          step={step}
          checked={hygieneSteps[step.key]}
          onPress={() => onToggle(step.key)}
        />
      ))}
    </View>

    {/* Progress bar */}
    <View style={{ marginTop: 14 }}>
      <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{
          height: '100%', borderRadius: 3,
          width: `${(stepsChecked / 6) * 100}%`,
          backgroundColor: stepsChecked === 6 ? COLORS.emerald.primary : COLORS.indigo.primary,
        }} />
      </View>
      {stepsChecked === 6 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.emerald.primary} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.emerald.primary }}>All 6 steps completed!</Text>
        </View>
      )}
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
const ObservationEntryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const scrollRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerMethod, setTimerMethod] = useState('');
  const [completedTime, setCompletedTime] = useState(null);

  const [sessionForm, setSessionForm] = useState({
    auditorName: '',
    ward: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  const [obsForm, setObsForm] = useState({
    identifyStaff: false,
    observedStaff: '',
    department: '',
    designation: '',
    whoMoment: '',
    adherence: '',
    action: '',
    glove: 'off',
    remarks: '',
    riskFactors: { jewellery: false, watch: false, ring: false, long_nails: false },
    hygieneSteps: {
      rub_palm_to_palm: false,
      rub_right_dorsum_left_palm: false,
      rub_palm_to_palm_interlaced: false,
      rub_backs_fingers: false,
      rub_thumb_rotation: false,
      rub_fingers_rotation: false,
    },
  });

  const selectedStaff = staffUsers.find(u => u._id === obsForm.observedStaff);
  const stepsChecked = Object.values(obsForm.hygieneSteps).filter(Boolean).length;

  const toggleStep = (key) => setObsForm(prev => ({
    ...prev,
    hygieneSteps: { ...prev.hygieneSteps, [key]: !prev.hygieneSteps[key] },
  }));

  // ── Fetch staff ──
  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const response = await userService.getStaffUsers();
        setStaffUsers(response.users || []);
      } catch (e) { console.error(e); }
      finally { setLoadingStaff(false); }
    };
    fetchStaff();
  }, []);

  // ── Timer tick ──
  useEffect(() => {
    let iv;
    if (timerActive) iv = setInterval(() => setTimerSeconds(p => p + 1), 1000);
    return () => { if (iv) clearInterval(iv); };
  }, [timerActive]);

  // ── Scroll to top on session change ──
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: true });
  }, [sessionActive]);

  // ── Timer helpers ──
  const startTimer = (method) => {
    setTimerMethod(method); setTimerActive(true);
    setTimerSeconds(0); setCompletedTime(null);
  };
  const stopTimer = () => {
    setTimerActive(false);
    setCompletedTime(timerSeconds);
    const a = calculateAdherence(timerMethod, timerSeconds);
    setObsForm(p => ({ ...p, adherence: a.value, action: a.action }));
  };
  const resetTimer = () => {
    setTimerActive(false); setTimerSeconds(0);
    setTimerMethod(''); setCompletedTime(null);
  };

  const calculateAdherence = (method, seconds) => {
    if (!method) return { value: '', action: '' };
    const ranges = { alcohol_rub: { min: 20, max: 30 }, soap_water: { min: 40, max: 60 } };
    const r = ranges[method];
    if (seconds >= r.min && seconds <= r.max)
      return { value: 'adherence', action: method === 'alcohol_rub' ? 'rub' : 'wash', status: 'Full Compliance' };
    if (seconds >= r.min - 5 && seconds <= r.max + 10)
      return { value: 'partial', action: method === 'alcohol_rub' ? 'rub' : 'wash', status: 'Partial Compliance' };
    return { value: 'missed', action: method === 'alcohol_rub' ? 'rub' : 'wash', status: 'Missed' };
  };

  const getComplianceStatus = () => (!completedTime || !timerMethod) ? null : calculateAdherence(timerMethod, completedTime);

  const complianceColor = (s) => {
    if (s === 'Full Compliance') return COLORS.emerald;
    if (s === 'Partial Compliance') return COLORS.gold;
    return COLORS.rose;
  };
  const complianceIcon = (s) => {
    if (s === 'Full Compliance') return 'checkmark-circle';
    if (s === 'Partial Compliance') return 'alert-circle';
    return 'close-circle';
  };

  const calcPoints = () => {
    const action = timerMethod === 'alcohol_rub' ? 'rub' : 'wash';
    let timeP = 0;
    if (action === 'rub' && completedTime > 20) timeP = 1;
    else if (action === 'wash' && completedTime > 40) timeP = 1;
    const riskD = ['jewellery', 'watch', 'ring', 'long_nails'].filter(k => obsForm.riskFactors[k]).length;
    return Math.max(0, stepsChecked + timeP - riskD);
  };

  // ── Timer display values ──
  const timerMax = timerMethod === 'alcohol_rub' ? 30 : 60;
  const timerMin = timerMethod === 'alcohol_rub' ? 20 : 40;
  const timerProgress = Math.min((timerSeconds / timerMax) * 100, 100);
  const timerInRange = timerSeconds >= timerMin;

  const handleStaffSelect = (staffId) => {
    const sel = staffUsers.find(u => u._id === staffId);
    setObsForm(p => ({
      ...p, observedStaff: staffId,
      department: sel?.department || p.department,
      designation: sel?.designation || p.designation,
    }));
  };

  const handleStartSession = async () => {
    if (!sessionForm.auditorName.trim()) { Alert.alert('Error', 'Please enter auditor name'); return; }
    if (!sessionForm.ward.trim()) { Alert.alert('Error', 'Please select ward'); return; }
    setLoading(true);
    try {
      const response = await sessionService.createSession({
        auditorName: sessionForm.auditorName,
        ward: sessionForm.ward,
        date: sessionForm.date,
        startTime: sessionForm.time,
      });
      setSessionData(response.session);
      setSessionActive(true);
      setObservations([]);
      Alert.alert('Success', 'Observation session started');
    } catch (e) { Alert.alert('Error', e.message || 'Failed to start session'); }
    finally { setLoading(false); }
  };

  const resetObsForm = () => {
    setObsForm({
      identifyStaff: false, observedStaff: '', department: '', designation: '',
      whoMoment: '', adherence: '', action: '', glove: 'off', remarks: '',
      riskFactors: { jewellery: false, watch: false, ring: false, long_nails: false },
      hygieneSteps: {
        rub_palm_to_palm: false, rub_right_dorsum_left_palm: false,
        rub_palm_to_palm_interlaced: false, rub_backs_fingers: false,
        rub_thumb_rotation: false, rub_fingers_rotation: false,
      },
    });
    setStaffSearchQuery('');
    resetTimer();
  };

  const handleAddObservation = async () => {
    if (obsForm.identifyStaff && !obsForm.observedStaff) { Alert.alert('Error', 'Please select a staff member'); return; }
    if (!obsForm.department) { Alert.alert('Error', 'Please select department'); return; }
    if (!obsForm.designation) { Alert.alert('Error', 'Please select designation'); return; }
    if (!obsForm.whoMoment) { Alert.alert('Error', 'Please select WHO 5 Moment'); return; }
    if (!obsForm.adherence) { Alert.alert('Error', 'Please select hand hygiene status'); return; }
    if (!obsForm.action) { Alert.alert('Error', 'Please select action'); return; }
    setLoading(true);
    try {
      const observationData = {
        session: sessionData._id, department: obsForm.department, designation: obsForm.designation,
        ward: sessionData.ward, whoMoment: obsForm.whoMoment, adherence: obsForm.adherence,
        action: obsForm.action, glove: obsForm.glove, riskFactors: obsForm.riskFactors,
        remarks: obsForm.remarks, hygieneSteps: obsForm.hygieneSteps, duration: completedTime || 0,
      };
      if (obsForm.identifyStaff && obsForm.observedStaff) observationData.observedStaff = obsForm.observedStaff;
      const response = await observationService.createObservation(observationData);
      setObservations(p => [...p, response.observation]);
      resetObsForm();
      Alert.alert('✓ Added', 'Observation added to session');
    } catch (e) { Alert.alert('Error', e.message || 'Failed to add observation'); }
    finally { setLoading(false); }
  };

  const handleEndSession = async () => {
    if (observations.length === 0) { Alert.alert('Error', 'Please add at least one observation'); return; }
    setLoading(true);
    try {
      await sessionService.endSession(sessionData._id);
      Alert.alert('Success', 'Session completed successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      setSessionActive(false); setSessionData(null); setObservations([]);
      setSessionForm({ auditorName: '', ward: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5) });
    } catch (e) { Alert.alert('Error', e.message || 'Failed to end session'); }
    finally { setLoading(false); }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ─────────────────── HEADER (matches RewardsScreen) ─────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -1 }}>
                New{'\n'}Observation
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6, letterSpacing: 0.2 }}>
                Record hand hygiene compliance
              </Text>
            </View>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: COLORS.medicalCyan.light, alignItems: 'center', justifyContent: 'center',
              shadowColor: COLORS.medicalCyan.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
            }}>
              <Ionicons name="eye-outline" size={28} color={COLORS.medicalCyan.primary} />
            </View>
          </View>
        </View>

        {/* ─────────────────── SESSION BANNER ─────────────────── */}
        {sessionActive && sessionData && (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 2, borderColor: COLORS.emerald.muted, ...softShadow }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.medicalGreen.primary, marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.medicalGreen.primary, flex: 1 }}>Session Active</Text>
                <View style={{ backgroundColor: COLORS.medicalGreen.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{observations.length} obs</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <InfoBadge label="Auditor" value={sessionData.auditorName || 'N/A'} />
                <InfoBadge label="Ward" value={sessionData.ward} color={COLORS.medicalGreen.primary} />
                <InfoBadge label="Date" value={sessionData.date ? new Date(sessionData.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'} />
              </View>
            </View>
          </View>
        )}

        {/* ─────────────────── START SESSION FORM ─────────────────── */}
        {!sessionActive && (
          <View style={{ paddingHorizontal: 20 }}>
            <SectionCard>
              <SectionHeader icon="clipboard-outline" color={COLORS.indigo} title="Audit Session" subtitle="Configure your observation session" />
              <FieldLabel text="Auditor Name" required />
              <StyledInput icon="person-outline" value={sessionForm.auditorName}
                onChangeText={(t) => setSessionForm(p => ({ ...p, auditorName: t }))} placeholder="Enter your name" />
              <FieldLabel text="Ward" required />
              <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, paddingLeft: 12, marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 12 }}>
                    {WARDS.map(ward => (
                      <Chip key={ward} label={ward} selected={sessionForm.ward === ward}
                        onPress={() => setSessionForm(p => ({ ...p, ward }))} color={COLORS.indigo} />
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <FieldLabel text="Date" required />
                  <StyledInput icon="calendar-outline" value={sessionForm.date}
                    onChangeText={(t) => setSessionForm(p => ({ ...p, date: t }))} placeholder="YYYY-MM-DD" />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel text="Time" required />
                  <StyledInput icon="time-outline" value={sessionForm.time}
                    onChangeText={(t) => setSessionForm(p => ({ ...p, time: t }))} placeholder="HH:MM" />
                </View>
              </View>
              {sessionForm.auditorName && sessionForm.ward && (
                <View style={{ backgroundColor: COLORS.indigo.light, borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.indigo.muted }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.indigo.primary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.indigo.primary }}>Session Preview</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    <InfoBadge label="Auditor" value={sessionForm.auditorName} color={COLORS.indigo.primary} />
                    <InfoBadge label="Ward" value={sessionForm.ward} color={COLORS.indigo.primary} />
                  </View>
                </View>
              )}
              <Pressable
                onPress={handleStartSession}
                disabled={loading || !sessionForm.auditorName || !sessionForm.ward}
                style={{
                  backgroundColor: COLORS.indigo.primary,
                  borderRadius: 20,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: (loading || !sessionForm.auditorName || !sessionForm.ward) ? 0.5 : 1,
                  shadowColor: COLORS.indigo.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {loading ? (
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>Starting...</Text>
                ) : (
                  <>
                    <Ionicons name="play-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>Start Session</Text>
                  </>
                )}
              </Pressable>
            </SectionCard>

            {/* How it works */}
            <SectionCard style={{ backgroundColor: COLORS.medicalPurple.light }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.medicalPurple.muted, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name="information-circle" size={20} color={COLORS.medicalPurple.primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.medicalPurple.primary }}>How It Works</Text>
              </View>
              {['Start a session by entering the ward/location', 'Record multiple observations per session', 'Fill in all required fields for each observation', 'End session to submit all observations'].map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.medicalPurple.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 }}>{s}</Text>
                </View>
              ))}
            </SectionCard>
          </View>
        )}

        {/* ─────────────────── OBSERVATION FORM ─────────────────── */}
        {sessionActive && (
          <View style={{ paddingHorizontal: 20 }}>

            {/* ── Card 1: Staff & Location ── */}
            <SectionCard>
              <SectionHeader icon="people-outline" color={COLORS.medicalCyan} title="Staff & Location" subtitle="Who and where" />

              {/* Identify Staff toggle */}
              <Pressable
                onPress={() => { setObsForm(p => ({ ...p, identifyStaff: !p.identifyStaff })); setStaffSearchQuery(''); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: obsForm.identifyStaff ? COLORS.medicalCyan.light : '#F9FAFB',
                  borderRadius: 18, padding: 16, marginBottom: 20,
                  borderWidth: 1.5, borderColor: obsForm.identifyStaff ? COLORS.medicalCyan.primary : '#E5E7EB',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: obsForm.identifyStaff ? COLORS.medicalCyan.primary : '#E5E7EB',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Ionicons name="person-outline" size={18} color={obsForm.identifyStaff ? '#ffffff' : '#9CA3AF'} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>Identify Staff</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Record specific staff details</Text>
                  </View>
                </View>
                <Switch value={obsForm.identifyStaff}
                  onValueChange={(v) => { setObsForm(p => ({ ...p, identifyStaff: v })); if (!v) setStaffSearchQuery(''); }}
                  trackColor={{ false: '#E5E7EB', true: COLORS.medicalCyan.muted }}
                  thumbColor={obsForm.identifyStaff ? COLORS.medicalCyan.primary : '#9CA3AF'} />
              </Pressable>

              {/* Staff search */}
              {obsForm.identifyStaff && (
                <View style={{ marginBottom: 20 }}>
                  <FieldLabel text="Select Staff Member" required />
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 }}>
                    <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput value={staffSearchQuery} onChangeText={setStaffSearchQuery} placeholder="Search by name..."
                      placeholderTextColor="#9CA3AF" style={{ flex: 1, fontSize: 14, color: '#1F2937' }} />
                    {staffSearchQuery.length > 0 && (
                      <Pressable onPress={() => setStaffSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </View>
                  {loadingStaff ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: COLORS.medicalCyan.primary, fontWeight: '600' }}>Loading staff...</Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {staffUsers.filter(s => s.name.toLowerCase().includes(staffSearchQuery.toLowerCase())).map(staff => (
                          <Chip key={staff._id} label={staff.name} subLabel={staff.department}
                            selected={obsForm.observedStaff === staff._id}
                            onPress={() => handleStaffSelect(staff._id)} color={COLORS.medicalCyan} />
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Department */}
              <View style={{ marginBottom: 20 }}>
                <FieldLabel text="Department" required />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {DEPARTMENTS.map(dept => (
                      <Chip key={dept} label={dept} selected={obsForm.department === dept}
                        onPress={() => setObsForm(p => ({ ...p, department: dept }))}
                        disabled={obsForm.identifyStaff && Boolean(obsForm.department)} color={COLORS.indigo} />
                    ))}
                  </View>
                </ScrollView>
                {obsForm.observedStaff && obsForm.department && <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>Auto-filled from staff</Text>}
                {obsForm.observedStaff && selectedStaff && !selectedStaff.department && <Text style={{ fontSize: 10, color: COLORS.gold.primary, marginTop: 6 }}>No department on record — choose manually.</Text>}
              </View>

              {/* Designation */}
              <View>
                <FieldLabel text="Designation" required />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {DESIGNATIONS.map(desig => (
                      <Chip key={desig} label={desig} selected={obsForm.designation === desig}
                        onPress={() => setObsForm(p => ({ ...p, designation: desig }))}
                        disabled={obsForm.identifyStaff && Boolean(obsForm.designation)} color={COLORS.medicalPurple} />
                    ))}
                  </View>
                </ScrollView>
                {obsForm.observedStaff && obsForm.designation && <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6 }}>Auto-filled from staff</Text>}
              </View>
            </SectionCard>

            {/* ── Card 2: Clinical Details ── */}
            <SectionCard>
              <SectionHeader icon="medical-outline" color={COLORS.gold} title="Clinical Details" subtitle="Glove status and WHO moment" />

              {/* Glove Status */}
              <View style={{ marginBottom: 20 }}>
                <FieldLabel text="Glove Status" />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[
                    { value: 'on', label: 'Gloves On', icon: 'hand-left', color: COLORS.gold },
                    { value: 'off', label: 'Gloves Off', icon: 'hand-left-outline', color: { primary: '#6B7280', light: '#F3F4F6', muted: '#E5E7EB' } },
                  ].map(opt => (
                    <Pressable key={opt.value} onPress={() => setObsForm(p => ({ ...p, glove: opt.value }))} style={{
                      flex: 1, paddingVertical: 16, borderRadius: 20,
                      backgroundColor: obsForm.glove === opt.value ? opt.color.primary : '#F9FAFB',
                      borderWidth: 1.5, borderColor: obsForm.glove === opt.value ? opt.color.primary : '#E5E7EB',
                      alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
                    }}>
                      <Ionicons name={opt.icon} size={18} color={obsForm.glove === opt.value ? '#ffffff' : '#9CA3AF'} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: obsForm.glove === opt.value ? '#ffffff' : '#6B7280' }}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* WHO Moments */}
              <View>
                <FieldLabel text="WHO 5 Moment" required />
                <View style={{ gap: 10 }}>
                  {WHO_MOMENTS.map((moment) => {
                    const icons = { moment_1: 'person-outline', moment_2: 'medical-outline', moment_3: 'water-outline', moment_4: 'person-outline', moment_5: 'bed-outline' };
                    const sel = obsForm.whoMoment === moment.value;
                    return (
                      <Pressable key={moment.value}
                        onPress={() => { setObsForm(p => ({ ...p, whoMoment: moment.value })); resetTimer(); }}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20,
                          backgroundColor: sel ? COLORS.medicalCyan.light : '#F9FAFB',
                          borderWidth: 1.5, borderColor: sel ? COLORS.medicalCyan.primary : '#E5E7EB',
                        }}>
                        <View style={{
                          width: 42, height: 42, borderRadius: 21,
                          backgroundColor: sel ? COLORS.medicalCyan.primary : '#E5E7EB',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          <Ionicons name={icons[moment.value] || 'hand-right-outline'} size={20} color={sel ? '#ffffff' : '#9CA3AF'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: sel ? COLORS.medicalCyan.primary : '#9CA3AF', marginBottom: 2 }}>MOMENT {moment.id}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: sel ? COLORS.medicalCyan.primary : '#374151' }}>{moment.label}</Text>
                        </View>
                        {sel && (
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.medicalCyan.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="checkmark" size={16} color="#ffffff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SectionCard>

            {/* ── Card 3: Hand Hygiene Timer ── */}
            {obsForm.whoMoment && (
              <SectionCard>
                <SectionHeader icon="timer-outline" color={COLORS.indigo} title="Hand Hygiene Timer" subtitle="Measure & verify compliance" />

                {/* Method selection */}
                {!timerActive && !completedTime && (
                  <View style={{ gap: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 2 }}>Choose method to start:</Text>
                    {[
                      { method: 'alcohol_rub', emoji: '🧴', label: 'Alcohol Hand Rub', sublabel: 'Target: 20–30 seconds', color: COLORS.emerald },
                      { method: 'soap_water', emoji: '🧼', label: 'Soap & Water', sublabel: 'Target: 40–60 seconds', color: COLORS.medicalCyan },
                    ].map(opt => (
                      <Pressable key={opt.method} onPress={() => startTimer(opt.method)}
                        style={{ borderRadius: 22, ...premiumShadow }}>
                        <LinearGradient colors={[opt.color.light, '#ffffff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderWidth: 1.5, borderColor: opt.color.muted, borderRadius: 22 }}>
                          <View style={{
                            width: 56, height: 56, borderRadius: 28,
                            backgroundColor: opt.color.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16,
                            shadowColor: opt.color.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                          }}>
                            <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '900', color: '#1F2937', letterSpacing: -0.3 }}>{opt.label}</Text>
                            <Text style={{ fontSize: 12, color: opt.color.primary, fontWeight: '600', marginTop: 3 }}>{opt.sublabel}</Text>
                          </View>
                          <View style={{
                            width: 44, height: 44, borderRadius: 22,
                            backgroundColor: opt.color.primary, alignItems: 'center', justifyContent: 'center',
                            shadowColor: opt.color.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                          }}>
                            <Ionicons name="play" size={20} color="#ffffff" />
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* ACTIVE TIMER */}
                {timerActive && (
                  <View style={{ alignItems: 'center' }}>
                    {/* Method badge */}
                    <View style={{
                      backgroundColor: timerInRange ? COLORS.emerald.light : COLORS.gold.light,
                      borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8,
                      borderWidth: 1, borderColor: timerInRange ? COLORS.emerald.muted : COLORS.gold.muted, marginBottom: 22,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: timerInRange ? COLORS.emerald.primary : COLORS.gold.primary }}>
                        {timerMethod === 'alcohol_rub' ? '🧴 Alcohol Hand Rub' : '🧼 Soap & Water'}
                      </Text>
                    </View>

                    {/* Big circle */}
                    <View style={{
                      width: 168, height: 168, borderRadius: 84,
                      backgroundColor: timerInRange ? COLORS.emerald.light : COLORS.gold.light,
                      borderWidth: 9, borderColor: timerInRange ? COLORS.emerald.primary : COLORS.gold.primary,
                      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                      shadowColor: timerInRange ? COLORS.emerald.primary : COLORS.gold.primary,
                      shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10,
                    }}>
                      <Text style={{ fontSize: 58, fontWeight: '900', color: '#1F2937', letterSpacing: -4 }}>{timerSeconds}</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: -4 }}>seconds</Text>
                      {timerInRange && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons name="checkmark-circle" size={12} color={COLORS.emerald.primary} style={{ marginRight: 3 }} />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.emerald.primary }}>In range!</Text>
                        </View>
                      )}
                    </View>

                    {/* Min / Target / Max row */}
                    <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
                      {[
                        { label: 'Min', value: `${timerMin}s`, color: COLORS.emerald.primary },
                        { label: 'Target', value: timerMethod === 'alcohol_rub' ? '25s' : '50s', color: '#9CA3AF' },
                        { label: 'Max', value: `${timerMax}s`, color: COLORS.rose.primary },
                      ].map(s => (
                        <View key={s.label} style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{s.label}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#1F2937' }}>{s.value}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Progress bar */}
                    <View style={{ width: '100%', height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 22 }}>
                      <View style={{
                        height: '100%', borderRadius: 6, width: `${timerProgress}%`,
                        backgroundColor: timerInRange ? COLORS.emerald.primary : COLORS.gold.primary,
                      }} />
                    </View>

                    {/* Stop button */}
                    <Pressable
                      onPress={stopTimer}
                      style={{
                        backgroundColor: COLORS.rose.primary,
                        borderRadius: 22,
                        paddingHorizontal: 40,
                        paddingVertical: 15,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: COLORS.rose.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 5,
                        marginBottom: 4,
                      }}
                    >
                      <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <View style={{ width: 9, height: 9, backgroundColor: COLORS.rose.primary, borderRadius: 2 }} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>Stop Timer</Text>
                    </Pressable>

                    {/* 6-step grid */}
                    <HygieneStepsGrid hygieneSteps={obsForm.hygieneSteps} onToggle={toggleStep} stepsChecked={stepsChecked} />
                  </View>
                )}

                {/* TIMER RESULT */}
                {!timerActive && completedTime && (() => {
                  const status = getComplianceStatus();
                  const c = complianceColor(status?.status);
                  return (
                    <View>
                      {/* Result banner */}
                      <View style={{ backgroundColor: c.light, borderRadius: 24, padding: 20, borderWidth: 2, borderColor: c.muted, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                          <View style={{
                            width: 54, height: 54, borderRadius: 27, backgroundColor: c.primary,
                            alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            shadowColor: c.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
                          }}>
                            <Ionicons name={complianceIcon(status?.status)} size={30} color="#ffffff" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 19, fontWeight: '900', color: c.primary, letterSpacing: -0.5 }}>{status?.status}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                              {timerMethod === 'alcohol_rub' ? '🧴 Alcohol Hand Rub' : '🧼 Soap & Water'} · {completedTime}s recorded
                            </Text>
                          </View>
                        </View>
                        {/* 3-stat row */}
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          {[
                            { label: 'Time', value: `${completedTime}s`, icon: 'timer-outline', color: COLORS.indigo },
                            { label: 'Steps', value: `${stepsChecked}/6`, icon: 'list', color: COLORS.medicalPurple },
                            { label: 'Points', value: `${calcPoints()}/7`, icon: 'star', color: COLORS.gold },
                          ].map(stat => (
                            <View key={stat.label} style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 18, padding: 12, alignItems: 'center', ...softShadow }}>
                              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: stat.color.light, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                <Ionicons name={stat.icon} size={15} color={stat.color.primary} />
                              </View>
                              <Text style={{ fontSize: 16, fontWeight: '900', color: '#1F2937' }}>{stat.value}</Text>
                              <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{stat.label}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Steps grid still editable */}
                      <HygieneStepsGrid hygieneSteps={obsForm.hygieneSteps} onToggle={toggleStep} stepsChecked={stepsChecked} />

                      <Pressable onPress={resetTimer} style={{
                        marginTop: 12, paddingVertical: 13, backgroundColor: '#F3F4F6',
                        borderRadius: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB',
                        flexDirection: 'row', justifyContent: 'center',
                      }}>
                        <Ionicons name="refresh" size={15} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280' }}>Reset & Re-time</Text>
                      </Pressable>
                    </View>
                  );
                })()}
              </SectionCard>
            )}

            {/* ── Card 4: Compliance & Action ── */}
            <SectionCard>
              <SectionHeader icon="shield-checkmark-outline" color={COLORS.emerald} title="Compliance & Action" subtitle="Adherence result and action taken" />

              <View style={{ marginBottom: 20 }}>
                <FieldLabel text="Hand Hygiene Status" required />
                {completedTime ? (
                  (() => {
                    const status = getComplianceStatus();
                    const c = complianceColor(status?.status);
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.light, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: c.muted }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Ionicons name={complianceIcon(status?.status)} size={24} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: c.primary }}>{status?.status}</Text>
                          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                            {ADHERENCE_OPTIONS.find(o => o.value === obsForm.adherence)?.label || ''} · Auto-set by timer
                          </Text>
                        </View>
                      </View>
                    );
                  })()
                ) : (
                  <View style={{ gap: 10 }}>
                    {ADHERENCE_OPTIONS.map((option) => {
                      const c = option.points === 2 ? COLORS.emerald : option.points === 1 ? COLORS.gold : COLORS.rose;
                      const sel = obsForm.adherence === option.value;
                      return (
                        <Pressable key={option.value} onPress={() => setObsForm(p => ({ ...p, adherence: option.value }))}
                          style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, backgroundColor: sel ? c.light : '#F9FAFB', borderWidth: 1.5, borderColor: sel ? c.primary : '#E5E7EB' }}>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: sel ? c.primary : '#E5E7EB', marginRight: 12 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: sel ? '#ffffff' : '#6B7280' }}>{option.points} pts</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: sel ? c.primary : '#374151' }}>{option.label}</Text>
                          {sel && <Ionicons name="checkmark-circle" size={20} color={c.primary} />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View>
                <FieldLabel text="Action" required />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ACTION_OPTIONS.map(action => (
                    <Chip key={action.value} label={action.label} selected={obsForm.action === action.value}
                      onPress={() => setObsForm(p => ({ ...p, action: action.value }))} color={COLORS.emerald} />
                  ))}
                </View>
              </View>
            </SectionCard>

            {/* ── Card 5: Risk Factors ── */}
            <SectionCard>
              <SectionHeader icon="warning-outline" color={COLORS.rose} title="Risk Factors" subtitle="Each factor deducts 1 point" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {RISK_FACTORS.map(factor => {
                  const active = obsForm.riskFactors[factor.id];
                  return (
                    <Pressable key={factor.id}
                      onPress={() => setObsForm(p => ({ ...p, riskFactors: { ...p.riskFactors, [factor.id]: !active } }))}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 11, borderRadius: 20,
                        backgroundColor: active ? COLORS.rose.primary : '#F9FAFB',
                        borderWidth: 1.5, borderColor: active ? COLORS.rose.primary : '#E5E7EB',
                        flexDirection: 'row', alignItems: 'center',
                      }}>
                      <Ionicons name={active ? 'close-circle' : 'add-circle-outline'} size={15}
                        color={active ? '#ffffff' : '#9CA3AF'} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#ffffff' : '#6B7280' }}>{factor.label}</Text>
                      <View style={{ marginLeft: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#E5E7EB' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#ffffff' : '#9CA3AF' }}>−1</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </SectionCard>

            {/* ── Card 6: Remarks + Submit ── */}
            <SectionCard>
              <SectionHeader icon="create-outline" color={COLORS.medicalTeal} title="Remarks" subtitle="Optional additional notes" />
              <TextInput
                value={obsForm.remarks}
                onChangeText={(text) => setObsForm(p => ({ ...p, remarks: text }))}
                placeholder="Add any additional observations or notes here..."
                multiline numberOfLines={4} placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
                  paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1F2937',
                  textAlignVertical: 'top', minHeight: 96, lineHeight: 22, marginBottom: 20,
                }}
              />
              <Pressable
                onPress={handleAddObservation}
                disabled={loading}
                style={{
                  backgroundColor: COLORS.medicalGreen.primary,
                  borderRadius: 22,
                  paddingVertical: 18,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: loading ? 0.55 : 1,
                  shadowColor: COLORS.medicalGreen.primary,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {loading ? (
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>Adding...</Text>
                ) : (
                  <>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Ionicons name="add" size={20} color="#ffffff" />
                    </View>
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>Add Observation</Text>
                  </>
                )}
              </Pressable>
            </SectionCard>
          </View>
        )}

        {/* ─────────────────── OBSERVATIONS LIST ─────────────────── */}
        {sessionActive && observations.length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <SectionCard>
              <SectionHeader icon="list" color={COLORS.indigo} title={`Observations (${observations.length})`} subtitle="Recorded in this session" />
              {observations.map((obs, index) => (
                <View key={obs._id || `${obs.whoMoment}-${index}`} style={{
                  backgroundColor: '#F9FAFB', borderRadius: 20, padding: 14,
                  marginBottom: index < observations.length - 1 ? 10 : 0, borderWidth: 1, borderColor: '#E5E7EB',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.medicalCyan.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>{index + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937', flex: 1 }}>{obs.department} — {obs.designation}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { val: WHO_MOMENTS.find(m => m.value === obs.whoMoment)?.short, color: COLORS.medicalCyan },
                      { val: obs.action, color: COLORS.emerald },
                      ...(obs.glove === 'on' ? [{ val: 'Gloves On', color: COLORS.gold }] : []),
                    ].filter(t => t.val).map((tag, ti) => (
                      <View key={ti} style={{ backgroundColor: tag.color.light, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                        <Text style={{ fontSize: 11, color: tag.color.primary, fontWeight: '700' }}>{tag.val}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </SectionCard>
          </View>
        )}

        {/* ─────────────────── END SESSION ─────────────────── */}
        {sessionActive && observations.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <Pressable
              onPress={handleEndSession}
              disabled={loading}
              style={{
                backgroundColor: COLORS.rose.primary,
                borderRadius: 22,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: loading ? 0.55 : 1,
                shadowColor: COLORS.rose.primary,
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 6,
                marginBottom: 16,
              }}
            >
              {loading ? (
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>Ending Session...</Text>
              ) : (
                <>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <View style={{ width: 11, height: 11, backgroundColor: '#ffffff', borderRadius: 2 }} />
                  </View>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>End Session & Submit</Text>
                </>
              )}
            </Pressable>

            <View style={{ backgroundColor: COLORS.medicalTeal.light, borderRadius: 30, padding: 20, ...premiumShadow }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.medicalTeal.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name="sparkles" size={24} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.medicalTeal.primary, marginBottom: 4 }}>Great session!</Text>
                  <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                    {observations.length} observation{observations.length !== 1 ? 's' : ''} recorded. Submit when ready.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ObservationEntryScreen;