import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { storage } from '../src/lib/storage';
import { router } from 'expo-router';

const INK     = '#1A1D24';
const BG      = '#F7F8FA';
const PRIMARY = '#4A6CF7';
const ORANGE  = '#F4A261';
const WHITE   = '#FFFFFF';
const FONT    = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const LOGO_PX      = 36;
const SPLASH_SCALE = 1.78;
const AGE_W        = 72;
const ATE_W        = 68;
const EXPAND_H     = LOGO_PX * 1.5;

const FADE_IN   = 400;
const HOLD_PM   = 500;
const EXPAND    = 800;
const HOLD_FULL = 600;
const FADE_OUT  = 400;

const EASE_IN_OUT = Easing.inOut(Easing.ease);
const EASE_OUT    = Easing.out(Easing.ease);

export default function SplashScreen() {
  const bgAnim    = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(SPLASH_SCALE)).current;
  const ageWidth    = useRef(new Animated.Value(0)).current;
  const ateWidth    = useRef(new Animated.Value(0)).current;
  const ageOpacity  = useRef(new Animated.Value(0)).current;
  const ateOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let anim: Animated.CompositeAnimation | null = null;

    const tokenPromise = storage.getAccessToken();

    anim = Animated.sequence([
      // ① "Pm." fade in
      Animated.timing(logoOpacity, {
        toValue: 1, duration: FADE_IN,
        easing: EASE_OUT, useNativeDriver: true,
      }),
      // ② Hold
      Animated.delay(HOLD_PM),
      // ③ Expand → "PageMate."
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1, duration: EXPAND,
          easing: EASE_IN_OUT, useNativeDriver: true,
        }),
        Animated.timing(ageWidth, {
          toValue: AGE_W, duration: EXPAND,
          easing: EASE_IN_OUT, useNativeDriver: false,
        }),
        Animated.timing(ateWidth, {
          toValue: ATE_W, duration: EXPAND,
          easing: EASE_IN_OUT, useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(ageOpacity, {
            toValue: 1, duration: EXPAND - 120,
            easing: EASE_OUT, useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(ateOpacity, {
            toValue: 1, duration: EXPAND - 120,
            easing: EASE_OUT, useNativeDriver: true,
          }),
        ]),
      ]),
      // ④ Hold "PageMate."
      Animated.delay(HOLD_FULL),
      // ⑤ Fade out logo + bg transition
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1, duration: FADE_OUT,
          easing: EASE_IN_OUT, useNativeDriver: false,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0, duration: FADE_OUT,
          easing: EASE_OUT, useNativeDriver: true,
        }),
      ]),
    ]);

    anim.start(async ({ finished }) => {
      if (!finished || !mounted) return;
      const token = await tokenPromise;
      router.replace(token ? '/(tabs)' : '/(auth)/login');
    });

    return () => {
      mounted = false;
      anim?.stop();
    };
  }, []);

  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [INK, BG] });

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={INK} />

      <Animated.View
        style={[
          styles.logoLayer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={[styles.logoText, { color: WHITE }]}>P</Text>
          <Animated.View style={[styles.expand, { width: ageWidth }]}>
            <Animated.Text style={[styles.logoText, { color: WHITE, opacity: ageOpacity }]}>
              age
            </Animated.Text>
          </Animated.View>
          <Text style={[styles.logoText, { color: PRIMARY }]}>M</Text>
          <Animated.View style={[styles.expand, { width: ateWidth }]}>
            <Animated.Text style={[styles.logoText, { color: PRIMARY, opacity: ateOpacity }]}>
              ate
            </Animated.Text>
          </Animated.View>
          <Text style={[styles.logoText, { color: ORANGE }]}>.</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  logoLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    // baseline 정렬은 Yoga 가 자식 baseline 을 재귀 탐색하는데,
    // 초기 width 0 + overflow hidden 인 Animated.View 가 섞이면
    // 레이아웃 계산 중 죽는 경우가 있어 flex-end 로 맞춘다.
    // 글자들의 fontSize·lineHeight 가 같아 시각적 결과는 동일하다.
    alignItems: 'flex-end',
  },
  logoText: {
    fontFamily: FONT,
    fontWeight: '700',
    fontSize: LOGO_PX,
    letterSpacing: -1,
    lineHeight: LOGO_PX * 1.35,
  },
  expand: {
    overflow: 'hidden',
    height: EXPAND_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
