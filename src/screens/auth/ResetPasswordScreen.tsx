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
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import {authApi} from '../../api';
import {RootStackParamList} from '../../types';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type Route = RouteProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const token = route.params?.token ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in both password fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    try {
      setLoading(true);
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Invalid or expired reset token.');
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
            <Text style={styles.subtitle}>Set a new password</Text>
          </View>

          <View style={styles.formCard}>
            {done ? (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>Password updated!</Text>
                <Text style={styles.successBody}>
                  Your password has been reset successfully. You can now sign in.
                </Text>
              </View>
            ) : (
              <>
                <FormInput
                  label="New Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />
                <FormInput
                  label="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  secureTextEntry
                />
                <Button
                  label="Reset Password"
                  onPress={handleReset}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.navigate('Login')}>
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
