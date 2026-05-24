import React, {useState, useEffect} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {RoleBadge} from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {logoutAsync, updateProfileAsync} from '../../store/slices/authSlice';
import {getAvatarUrl} from '../../api/client';
import {COLORS, RADIUS, SPACING} from '../../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS: Record<string, string> = {
  admin: '#3A3A3A',
  manager: '#4CAF50',
  installer: '#388E3C',
  qa: '#F57C00',
};

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.currentUser);
  const jobs = useAppSelector(s => s.jobs.items);
  const tasks = useAppSelector(s => s.tasks.items);
  const users = useAppSelector(s => s.users.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<{uri: string; mimeType: string; fileName: string} | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!user) {return null;}

  const avatarColor = AVATAR_COLORS[user.role] ?? COLORS.primary;
  const installerType = installerTypes.find(t => t.id === user.installer_type_id);
  const savedAvatarUrl = getAvatarUrl(user.avatar);
  const avatarUrl = pendingAvatar?.uri ?? savedAvatarUrl;
  const showInitials = !avatarUrl || imgError;

  // Reset error when avatar URL changes (after save or new pick)
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const startEdit = () => {
    setEditName(user.name);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setPendingAvatar(null);
    setEditName('');
  };

  const handleAsset = (asset: {uri?: string; type?: string; fileName?: string}) => {
    setImgError(false);
    setPendingAvatar({
      uri: asset.uri!,
      mimeType: asset.type ?? 'image/jpeg',
      fileName: asset.fileName ?? 'avatar.jpg',
    });
    if (!editing) startEdit();
  };

  const openLibrary = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, response => {
      if (response.assets?.[0]) handleAsset(response.assets[0]);
    });
  };

  const openCamera = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'SimpliGreen needs camera access to take a profile photo.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission denied', 'Camera access is required to take a photo.');
        return;
      }
    }
    launchCamera({mediaType: 'photo', quality: 0.8, saveToPhotos: false}, response => {
      if (response.assets?.[0]) handleAsset(response.assets[0]);
    });
  };

  const pickImage = () => {
    Alert.alert('Change Photo', 'Choose a source', [
      {text: 'Camera', onPress: openCamera},
      {text: 'Photo Library', onPress: openLibrary},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const saveProfile = async () => {
    const name = editName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        updateProfileAsync({
          name,
          avatarUri: pendingAvatar?.uri,
          mimeType: pendingAvatar?.mimeType,
          fileName: pendingAvatar?.fileName,
        }),
      ).unwrap();
      setEditing(false);
      setPendingAvatar(null);
    } catch (e: any) {
      Alert.alert('Save failed', e.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logoutAsync())},
    ]);
  };

  const getStats = () => {
    switch (user.role) {
      case 'admin':
        return [
          {icon: 'briefcase-outline', label: 'Total Jobs', value: jobs.length},
          {icon: 'checkmark-circle-outline', label: 'Approved', value: jobs.filter(j => j.status === 'approved').length},
          {icon: 'people-outline', label: 'Team Members', value: users.filter(u => u.role !== 'admin').length},
        ];
      case 'manager':
        const myJobs = jobs.filter(j => j.manager_id === user.id);
        return [
          {icon: 'briefcase-outline', label: 'My Jobs', value: myJobs.length},
          {icon: 'checkmark-circle-outline', label: 'Approved', value: myJobs.filter(j => j.status === 'approved').length},
          {icon: 'time-outline', label: 'In Progress', value: myJobs.filter(j => j.status === 'in_progress').length},
        ];
      case 'installer':
        const myTasks = tasks.filter(t => t.installer_id === user.id);
        return [
          {icon: 'clipboard-outline', label: 'My Tasks', value: myTasks.length},
          {icon: 'checkmark-circle-outline', label: 'Approved', value: myTasks.filter(t => t.status === 'approved').length},
          {icon: 'time-outline', label: 'Pending', value: myTasks.filter(t => t.status === 'active' || t.status === 'submitted').length},
        ];
      case 'qa':
        const qaJobs = jobs.filter(j => j.qa_id === user.id);
        return [
          {icon: 'search-outline', label: 'Monitoring', value: qaJobs.filter(j => j.status === 'in_progress').length},
          {icon: 'alert-circle-outline', label: 'Awaiting Review', value: qaJobs.filter(j => j.status === 'submitted_to_qa').length},
          {icon: 'checkmark-circle-outline', label: 'Approved', value: qaJobs.filter(j => j.status === 'approved').length},
        ];
      default:
        return [];
    }
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name section */}
        <View style={styles.heroSection}>
          {/* Avatar with camera overlay */}
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.avatarWrapper}>
            {!showInitials ? (
              <FastImage
                source={{uri: avatarUrl!, priority: FastImage.priority.normal, cache: FastImage.cacheControl.web}}
                style={styles.avatarImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[styles.avatarCircle, {backgroundColor: avatarColor}]}>
                <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Icon name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name — editable or static */}
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
            />
          ) : (
            <Text style={styles.heroName}>{user.name}</Text>
          )}

          <View style={styles.heroBadgeRow}>
            <RoleBadge role={user.role} />
          </View>
          {installerType && (
            <Text style={styles.installerType}>{installerType.name}</Text>
          )}

          {/* Edit / Save / Cancel buttons */}
          {editing ? (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
              <Icon name="pencil-outline" size={14} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <Divider vertical={SPACING.sm} />
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Status"
            value={user.status === 'active' ? 'Active' : 'Suspended'}
            valueColor={user.status === 'active' ? COLORS.success : COLORS.danger}
          />
          <InfoRow icon="calendar-outline" label="Member since" value={user.created_at} />
        </Card>

        {/* Stats */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>My Stats</Text>
          <Divider vertical={SPACING.sm} />
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={i} style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Icon name={s.icon} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* App info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>App</Text>
          <Divider vertical={SPACING.sm} />
          <InfoRow icon="information-circle-outline" label="Version" value="1.0.0" />
          <InfoRow icon="construct-outline" label="Environment" value="Development" />
        </Card>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({icon, label, value, valueColor}: {icon: string; label: string; value: string; valueColor?: string}) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={16} color={COLORS.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? {color: valueColor} : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xl},
  heroSection: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  avatarWrapper: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
    marginBottom: SPACING.sm,
    minWidth: 180,
    textAlign: 'center',
  },
  heroBadgeRow: {marginBottom: SPACING.xs},
  installerType: {fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs},
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  editBtnText: {fontSize: 13, fontWeight: '600', color: COLORS.primary},
  editActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelBtnText: {fontSize: 13, fontWeight: '600', color: COLORS.textSecondary},
  saveBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    minWidth: 72,
    alignItems: 'center',
  },
  saveBtnText: {fontSize: 13, fontWeight: '700', color: '#fff'},
  card: {marginHorizontal: SPACING.md, marginBottom: SPACING.md},
  sectionTitle: {fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {marginRight: SPACING.sm},
  infoLabel: {flex: 1, fontSize: 14, color: COLORS.text},
  infoValue: {fontSize: 14, fontWeight: '600', color: COLORS.textSecondary},
  statsRow: {flexDirection: 'row', justifyContent: 'space-around', paddingVertical: SPACING.sm},
  statItem: {alignItems: 'center', flex: 1},
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {fontSize: 22, fontWeight: '800', color: COLORS.text},
  statLabel: {fontSize: 11, color: COLORS.textSecondary, textAlign: 'center'},
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  signOutText: {fontSize: 15, fontWeight: '700', color: COLORS.danger},
});
