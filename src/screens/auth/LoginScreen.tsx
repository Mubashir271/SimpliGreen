import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {loginAsync, clearError} from '../../store/slices/authSlice';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const {loading, error} = useAppSelector(s => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    const result = await dispatch(loginAsync({email: email.trim(), password}));
    if (loginAsync.rejected.match(result)) {
      Alert.alert('Login failed', result.error.message ?? 'Invalid credentials.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {/* Brand header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoBolt}>⚡</Text>
            </View>
            <View style={styles.wordmark}>
              <Text style={styles.wordSimpli}>SIMPLI</Text>
              <Text style={styles.wordGreen}>GREEN</Text>
            </View>
            <Text style={styles.tagline}>ENERGY SOLUTIONS</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Login form */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <FormInput
              label="Email"
              value={email}
              onChangeText={t => {
                setEmail(t);
                if (error) {
                  dispatch(clearError());
                }
              }}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.signInBtn}
            />

            {/* <Text style={styles.hint}>
              Default password for seeded users: password123
            </Text> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.brand},
  kav: {flex: 1},
  scroll: {flexGrow: 1},
  header: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.brand,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoBolt: {fontSize: 26},
  wordmark: {flexDirection: 'row', marginBottom: 2},
  wordSimpli: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wordGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  subtitle: {fontSize: 13, color: 'rgba(255,255,255,0.65)'},
  formCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOW.medium,
  },
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  errorText: {color: COLORS.danger, fontSize: 13, fontWeight: '600'},
  signInBtn: {marginTop: SPACING.xs},
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
