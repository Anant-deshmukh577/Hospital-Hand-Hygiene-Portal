import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width } = Dimensions.get('window');
const MIN_SPLASH_DURATION_MS = 4500;
const SAFETY_HIDE_MS = 12000;

const AppSplashScreen = ({ onReady }) => {
  const [isReady, setIsReady] = useState(false);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  // Entrance animations
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.75)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(18)).current;
  const subOpacity   = useRef(new Animated.Value(0)).current;
  const barOpacity   = useRef(new Animated.Value(0)).current;

  // Progress bar fill
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Promise.resolve()
      .then(() => SplashScreen.hideAsync())
      .catch(() => {});

    startTimeRef.current = Date.now();
    finishedRef.current = false;

    const finish = async () => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      setIsReady(true);
      if (onReady) onReady();
    };

    // Staggered entrance
    const entranceAnim = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0,  duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(subOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(barOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]);
    entranceAnim.start();

    const barAnim = Animated.timing(barWidth, {
      toValue: width - 80,
      duration: 2800,
      delay: 600,
      useNativeDriver: false,
    });
    barAnim.start(({ finished }) => {
      if (finished) finish();
    });

    const safety = setTimeout(() => {
      if (!finishedRef.current) finish();
    }, SAFETY_HIDE_MS);

    return () => {
      entranceAnim.stop();
      barAnim.stop();
      clearTimeout(safety);
    };
  }, [onReady]);

  return (
    <View style={styles.container}>

      {/* Subtle top accent */}
      <View style={styles.topAccent} />

      {/* Center content */}
      <View style={styles.center}>

        {/* Icon — rounded square, image fills fully */}
        <Animated.View style={[styles.iconSquare, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require('../../../assets/APK_ICON/mipmap-xxhdpi/ic_launcher.png')}
            style={styles.icon}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.Text style={[styles.appTitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          AIIMS
        </Animated.Text>
        <Animated.Text style={[styles.appSubtitle, { opacity: subOpacity }]}>
          Hand Hygiene Portal
        </Animated.Text>
      </View>

      {/* Bottom: progress bar */}
      <Animated.View style={[styles.barSection, { opacity: barOpacity }]}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.version}>v1.0.0 · AIIMS Nagpur</Text>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
    backgroundColor: '#059669',
  },

  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  iconSquare: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },

  icon: {
    width: 120,
    height: 120,
  },

  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1.5,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
    marginBottom: 18,
  },

  taglinePill: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },

  taglineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 1.2,
  },

  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
    marginBottom: 4,
  },

  appSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },

  barSection: {
    position: 'absolute',
    bottom: 52,
    left: 40,
    right: 40,
    alignItems: 'center',
  },

  loadingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  barTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },

  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#059669',
  },

  version: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default AppSplashScreen;