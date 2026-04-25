import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/index';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  KAKAO_REST_API_KEY,
} from '@/constants/index';

WebBrowser.maybeCompleteAuthSession();

// ─── Design tokens ─────────────────────────────────────────────────────────
const INK = '#13162A';
const PRIMARY_LIGHT = '#8FB6E0';
const SECONDARY = '#F4A261';
const WHITE = '#FFFFFF';

// ─── Wordmark ───────────────────────────────────────────────────────────────
const Wordmark = () => (
  <View style={styles.wordmarkRow}>
    <Text style={styles.wordmarkPage}>Page</Text>
    <Text style={styles.wordmarkMate}>Mate</Text>
    <View style={styles.wordmarkDot} />
  </View>
);

// ─── Google G logo ───────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <Path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <Path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-5.1c-2 1.4-4.4 2.1-6.9 2.1-5.3 0-9.7-3.4-11.3-8L6.2 33c3.3 6.5 10 11 17.8 11z" />
    <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4-3.9 5.4l6 5.1c-.4.4 6.6-4.8 6.6-14.5 0-1.3-.1-2.4-.4-3.5z" />
  </Svg>
);

// ─── Kakao chat-bubble logo ──────────────────────────────────────────────────
const KakaoLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6-.2.7-.7 2.5-.8 2.9-.1.5.2.5.4.4.2-.1 2.5-1.7 3.5-2.4.7.1 1.5.2 2.2.2 5.5 0 10-3.5 10-7.7C22 6.5 17.5 3 12 3z"
      fill={INK}
    />
  </Svg>
);

// ─── Social login button ─────────────────────────────────────────────────────
interface SocialButtonProps {
  bg: string;
  color: string;
  logo: React.ReactNode;
  label: string;
  onPress?: () => void;
  loading?: boolean;
}

const SocialButton = ({ bg, color, logo, label, onPress, loading }: SocialButtonProps) => {
  const [pressed, setPressed] = React.useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={loading}
      style={[
        styles.socialBtn,
        { backgroundColor: bg },
        pressed && styles.socialBtnPressed,
        loading && { opacity: 0.7 },
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : logo}
      <Text style={[styles.socialBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = React.useState<'google' | 'kakao' | null>(null);

  useEffect(() => {
    console.log('[Kakao OAuth] redirectUri:', kakaoRedirectUri);
  }, []);

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    responseType: 'code' as any,
    usePKCE: false,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const code = googleResponse.params.code;
      const redirectUri = googleRequest?.redirectUri ?? '';
      handleOAuthCallback('google', code, redirectUri);
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setLoading(null);
    }
  }, [googleResponse]);

  // ── Kakao OAuth ──────────────────────────────────────────────────────────
  const kakaoRedirectUri = makeRedirectUri({ scheme: 'pagemate', path: 'oauth' });

  const [, kakaoResponse, kakaoPromptAsync] = useAuthRequest(
    {
      clientId: KAKAO_REST_API_KEY,
      redirectUri: kakaoRedirectUri,
      responseType: ResponseType.Code,
      usePKCE: false,
    },
    {
      authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    },
  );

  useEffect(() => {
    if (!kakaoResponse) return;
    console.log('[Kakao OAuth] response:', JSON.stringify(kakaoResponse));
    if (kakaoResponse.type === 'success') {
      const code = kakaoResponse.params.code;
      console.log('[Kakao OAuth] code:', code, 'redirectUri:', kakaoRedirectUri);
      handleOAuthCallback('kakao', code, kakaoRedirectUri);
    } else {
      setLoading(null);
    }
  }, [kakaoResponse]);

  // ── Common callback handler ──────────────────────────────────────────────
  const handleOAuthCallback = async (
    provider: 'google' | 'kakao',
    code: string,
    redirectUri: string,
  ) => {
    try {
      const res =
        provider === 'google'
          ? await authApi.loginWithGoogle(code, redirectUri)
          : await authApi.loginWithKakao(code, redirectUri);

      console.log('[OAuth] res.data:', JSON.stringify(res.data));
      const { accessToken, refreshToken, user } = res.data.data;
      console.log('[OAuth] 로그인 성공:', user.nickname, 'isNewUser:', user.isNewUser);
      await setAuth(accessToken, refreshToken, user);

      if (user.isNewUser) {
        router.replace('/(auth)/signup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      console.error('[OAuth] 로그인 실패:', e?.response?.status, JSON.stringify(e?.response?.data), e?.message);
      const msg = e?.response?.data?.error?.message ?? e?.message ?? '알 수 없는 오류';
      Alert.alert('로그인 실패', msg);
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    await googlePromptAsync();
  };

  const handleKakao = async () => {
    setLoading('kakao');
    await kakaoPromptAsync();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={INK} />

      {/* Hero */}
      <View style={styles.hero}>
        <Wordmark />
        <View style={styles.greetingBlock}>
          <Text style={styles.headline}>{'오늘 어떤 책을\n만나볼까요'}</Text>
          <Text style={styles.subHeadline}>PageMate에 오신 것을 환영해요</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.btnGroup}>
        <SocialButton
          bg={WHITE}
          color={INK}
          logo={<GoogleLogo />}
          label="Google로 계속하기"
          onPress={handleGoogle}
          loading={loading === 'google'}
        />
        <SocialButton
          bg="#FEE500"
          color={INK}
          logo={<KakaoLogo />}
          label="카카오로 계속하기"
          onPress={handleKakao}
          loading={loading === 'kakao'}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {'로그인 시 '}
          <Text style={styles.footerLink} onPress={() => router.push('/legal/terms')}>이용약관</Text>
          {' 및 '}
          <Text style={styles.footerLink} onPress={() => router.push('/legal/privacy')}>개인정보처리방침</Text>
          {'에\n동의합니다'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: INK,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 32,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  wordmarkPage: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    fontSize: 42,
    letterSpacing: -1.4,
    lineHeight: 46,
    color: WHITE,
  },
  wordmarkMate: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    fontSize: 42,
    letterSpacing: -1.4,
    lineHeight: 46,
    color: PRIMARY_LIGHT,
  },
  wordmarkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SECONDARY,
    marginLeft: 3,
    marginBottom: 8,
  },
  greetingBlock: {
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: -0.7,
    lineHeight: 34,
    color: WHITE,
    textAlign: 'center',
  },
  subHeadline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontSize: 13,
    color: `rgba(250,250,248,0.55)`,
    textAlign: 'center',
  },
  btnGroup: {
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  socialBtn: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnPressed: {
    transform: [{ scale: 0.99 }],
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: `rgba(250,250,248,0.45)`,
    lineHeight: 18,
    textAlign: 'center',
  },
  footerLink: {
    color: PRIMARY_LIGHT,
    fontWeight: '600',
  },
});
