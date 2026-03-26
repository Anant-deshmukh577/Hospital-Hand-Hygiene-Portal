import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import LottieView from "lottie-react-native";
import { memo, useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const TOTAL_SLIDES = 6;
const ILLUSTRATION_HEIGHT = SCREEN_HEIGHT * 0.5;
const TEXT_BLOCK_HEIGHT = SCREEN_HEIGHT * 0.28;

// Progress ring constants
const RING_SIZE = 72;
const RING_STROKE = 3;
const RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SLIDES = [
  {
    key: "hero",
    type: "lottie",
    source: require("../../../assets/self-protection.json"),
    accentColor: "#1A5E7A",
    title: "Hand Hygiene\nat AIIMS",
    subtitle:
      "Monitor, comply, and protect every patient with our real-time hygiene tracking platform. Built specifically for AIIMS to reduce hospital-acquired infections and improve overall patient safety outcomes.",
  },
  {
    key: "mission",
    type: "video",
    source: require("../../../assets/mission.mp4"),
    accentColor: "#1A5E7A",
    title: "Our\nMission",
    subtitle:
      "Prevent infections before they happen, empower every staff member with actionable insights, and drive a culture of excellence in patient care — every shift, every ward, every day.",
  },
  {
    key: "features",
    type: "video",
    source: require("../../../assets/compliance.mp4"),
    accentColor: "#1A5E7A",
    title: "Built for\nCompliance",
    subtitle:
      "Real-time hand hygiene tracking, gamified leaderboards to motivate staff, instant audit reports, and a rewards system that recognises top performers — everything your team needs in one place.",
  },
  {
    key: "who",
    type: "video",
    source: require("../../../assets/WHO moment.mp4"),
    accentColor: "#1A5E7A",
    title: "WHO\n5 Moments",
    subtitle:
      "The globally proven hand hygiene framework is now fully digitized and easy to follow. Track all 5 moments of hand hygiene seamlessly across every patient interaction and clinical procedure.",
  },
  {
    key: "testimonials",
    type: "video",
    source: require("../../../assets/trusted.mp4"),
    accentColor: "#1A5E7A",
    title: "Trusted by\nExperts",
    subtitle:
      "Staff engagement has increased by over 60% across pilot hospitals within just months of adoption. Infection control leads and nursing teams alike trust this platform to raise hygiene standards.",
  },
  {
    key: "cta",
    type: "video",
    source: require("../../../assets/started.mp4"),
    accentColor: "#1A5E7A",
    title: "Ready\nto Begin?",
    subtitle:
      "Join healthcare professionals improving patient safety every single day.",
  },
];

// ── Circular progress button ──────────────────────────────────────────────────
const ProgressButton = ({ currentIndex, accent, onPress }) => {
  const progress = (currentIndex + 1) / TOTAL_SLIDES;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  return (
    <Pressable onPress={onPress} hitSlop={12}>
      <View style={styles.progressBtnWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
          <Circle
            cx={cx} cy={cy} r={RADIUS}
            stroke="#E5E7EB" strokeWidth={RING_STROKE} fill="none"
          />
          <Circle
            cx={cx} cy={cy} r={RADIUS}
            stroke={accent} strokeWidth={RING_STROKE} fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${cx}, ${cy})`}
          />
        </Svg>
        <View style={[styles.innerCircle, { backgroundColor: accent }]}>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const LandingScreen = ({ navigation }) => {
  if (!navigation) return null;

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const goToSlide = useCallback((index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const goNext    = useCallback(() => {
    if (currentIndex < TOTAL_SLIDES - 1) goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goToEnd   = useCallback(() => goToSlide(TOTAL_SLIDES - 1), [goToSlide]);

  const isLastSlide = currentIndex === TOTAL_SLIDES - 1;
  const accent      = SLIDES[currentIndex].accentColor;

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "#fff" }}>

        {/* Skip button — first slide only */}
        {index === 0 && (
          <Pressable style={styles.skipBtn} onPress={goToEnd} hitSlop={12}>
            <Text style={[styles.skipText, { color: item.accentColor }]}>Skip</Text>
          </Pressable>
        )}

        {/* Illustration */}
        <View style={styles.illustrationArea}>
          {item.type === "lottie" ? (
            <LottieView
              source={item.source}
              autoPlay
              loop
              resizeMode="contain"
              style={styles.lottie}
            />
          ) : (
            <Video
              source={item.source}
              style={styles.video}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
            />
          )}
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          {index < TOTAL_SLIDES - 1 && (
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentIndex
                      ? { width: 26, backgroundColor: item.accentColor }
                      : { width: 8, backgroundColor: "#D5D8DC" },
                  ]}
                />
              ))}
            </View>
          )}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    ),
    [currentIndex],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flex: 1 }}
      />

      {/* Fixed bottom chrome */}
      <View style={styles.bottomArea}>
        {!isLastSlide ? (
          <ProgressButton currentIndex={currentIndex} accent={accent} onPress={goNext} />
        ) : (
          <View style={styles.ctaStack}>
            <Pressable
              style={[styles.getStartedBtn, { backgroundColor: accent }]}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.linkText, { color: accent }]}>
                Already have an account? Sign In
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>STAFF PORTAL</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.staffRow}>
              <Pressable onPress={() => navigation.navigate("AdminLogin")}>
                <Text style={[styles.linkText, { color: accent }]}>Admin Login</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("AuditorLogin")}>
                <Text style={[styles.linkText, { color: accent }]}>Auditor Login</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },

  skipBtn: {
    position: "absolute", top: 16, right: 24,
    zIndex: 10, paddingVertical: 6, paddingHorizontal: 4,
  },
  skipText: { fontSize: 15, fontWeight: "600" },

  illustrationArea: {
    width: SCREEN_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    backgroundColor: "#fff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: SCREEN_WIDTH * 1.2,
    height: ILLUSTRATION_HEIGHT * 1.2,
  },
  video: {
    width: SCREEN_WIDTH,
    height: ILLUSTRATION_HEIGHT,
  },

  textBlock: {
    height: TEXT_BLOCK_HEIGHT,
    paddingHorizontal: 28,
    paddingTop: 14,
    justifyContent: "flex-start",
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0D1B2A",
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: "#95A5A6",
    lineHeight: 19,
  },

  bottomArea: {
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    gap: 14,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  dot: { height: 7, borderRadius: 4 },

  progressBtnWrapper: {
    width: RING_SIZE, height: RING_SIZE,
    justifyContent: "center", alignItems: "center",
  },
  innerCircle: {
    width: RING_SIZE - RING_STROKE * 2 - 10,
    height: RING_SIZE - RING_STROKE * 2 - 10,
    borderRadius: (RING_SIZE - RING_STROKE * 2 - 10) / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  ctaStack: {
    width: "100%", paddingHorizontal: 28,
    gap: 14, alignItems: "center",
  },
  getStartedBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 50,
    width: "100%", elevation: 4,
  },
  getStartedText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkText: { fontSize: 14, fontWeight: "500" },

  dividerRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, width: "100%",
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerLabel: {
    fontSize: 11, color: "#95A5A6",
    fontWeight: "600", letterSpacing: 1,
  },
  staffRow: { flexDirection: "row", gap: 24 },
});

export default memo(LandingScreen);