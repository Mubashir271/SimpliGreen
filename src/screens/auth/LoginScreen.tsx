import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {login} from '../../store/slices/authSlice';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';
import {RoleBadge} from '../../components/common/Badge';
import {User} from '../../types';

const ROLE_ICONS: Record<string, string> = {
  admin: '👑',
  manager: '📋',
  installer: '🔨',
  qa: '🔍',
};

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(s => s.users.items);

  const handleLogin = (user: User) => {
    dispatch(login(user));
  };

  return (
    <SafeAreaView style={styles.safe}>
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
        <Text style={styles.subtitle}>Select your account to continue</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.card, item.status === 'suspended' && styles.cardSuspended]}
            onPress={() => item.status === 'active' && handleLogin(item)}
            activeOpacity={0.75}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarIcon}>{ROLE_ICONS[item.role]}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <RoleBadge role={item.role} />
              {item.status === 'suspended' && (
                <Text style={styles.suspended}>Suspended</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Mock environment — no password required</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.brand,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.brand,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoBolt: {
    fontSize: 38,
  },
  wordmark: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  wordSimpli: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wordGreen: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  list: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.md,
    gap: SPACING.sm,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  cardSuspended: {
    opacity: 0.5,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarIcon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  email: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  suspended: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '600',
  },
  footer: {
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
