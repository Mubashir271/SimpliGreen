import React, {useState, useEffect} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppSelector} from '../../store/hooks';
import {getAvatarUrl} from '../../api/client';
import {COLORS, SPACING} from '../../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Project Manager',
  installer: 'Installer',
  qa: 'Quality Assurance',
};

interface Props {
  title: string;
}

export default function AppHeader({title}: Props) {
  const insets = useSafeAreaInsets();
  const user = useAppSelector(s => s.auth.currentUser);

  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(user?.avatar);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  if (!user) {return null;}

  const initials = getInitials(user.name);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const showInitials = !avatarUrl || imgError;

  return (
    <View style={[styles.container, {paddingTop: insets.top + SPACING.xs}]}>
      <View style={styles.inner}>
        {/* Left: SimpliGreen two-tone logo */}
        <View style={styles.left}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            {/* Two-tone wordmark */}
            <View>
              <View style={styles.wordmark}>
                <Text style={styles.wordSimpli}>SIMPLI</Text>
                <Text style={styles.wordGreen}>GREEN</Text>
              </View>
              <Text style={styles.tagline}>ENERGY SOLUTIONS</Text>
            </View>
          </View>
          <Text style={styles.pageTitle}>{title}</Text>
        </View>

        {/* Right: user avatar */}
        <View style={styles.right}>
          <View style={styles.avatar}>
            {!showInitials ? (
              <FastImage
                source={{uri: avatarUrl!, priority: FastImage.priority.high, cache: FastImage.cacheControl.web}}
                style={styles.avatarImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <Text style={styles.initials}>{initials}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name.split(' ')[0]}
            </Text>
            <Text style={styles.userRole}>{roleLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  left: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  logoImage: {width: 36, height: 36,borderRadius: 10},
  wordmark: {
    flexDirection: 'row',
  },
  wordSimpli: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wordGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
});
