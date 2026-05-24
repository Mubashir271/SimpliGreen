import React, {useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import {authApi} from '../../api';
import {RootStackParamList} from '../../types';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      // Backend always returns success-like message even for unknown emails
      setSent(true);
    } finally {
      setLoading(false);
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
          <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            <View style={styles.wordmark}>
              <Text style={styles.wordSimpli}>SIMPLI</Text>
              <Text style={styles.wordGreen}>GREEN</Text>
            </View>
            <Text style={styles.tagline}>ENERGY SOLUTIONS</Text>
            <Text style={styles.subtitle}>Reset your password</Text>
          </View>

          <View style={styles.formCard}>
            {sent ? (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>Check your inbox</Text>
                <Text style={styles.successBody}>
                  If that email exists in our system, a reset link has been sent.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.instructions}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
                <FormInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  label="Send Reset Link"
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
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
  logoImage: {width: 72, height: 72, marginBottom: SPACING.sm,borderRadius:10},
  wordmark: {flexDirection: 'row', marginBottom: 2},
  wordSimpli: {fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5},
  wordGreen: {fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5},
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
  instructions: {fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.xs},
  submitBtn: {marginTop: SPACING.xs},
  successBox: {
    backgroundColor: COLORS.primaryLight ?? '#E8F5E9',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  successTitle: {fontSize: 16, fontWeight: '700', color: COLORS.primary},
  successBody: {fontSize: 14, color: COLORS.textMuted},
  backLink: {alignItems: 'center', paddingVertical: SPACING.sm},
  backLinkText: {fontSize: 14, color: COLORS.primary, fontWeight: '600'},
});
