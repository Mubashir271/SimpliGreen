import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RoleBadge} from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {deleteUser, toggleSuspend} from '../../store/slices/usersSlice';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';
import {AdminStackParamList, UserRole} from '../../types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const ROLE_FILTERS: Array<{key: UserRole | 'all'; label: string}> = [
  {key: 'all', label: 'All'},
  {key: 'manager', label: 'Managers'},
  {key: 'installer', label: 'Installers'},
  {key: 'qa', label: 'QA'},
];

const ROLE_ICONS: Record<string, string> = {
  admin: '👑', manager: '📋', installer: '🔨', qa: '🔍',
};

export default function AdminUsersScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const users = useAppSelector(s => s.users.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filtered = roleFilter === 'all'
    ? users.filter(u => u.role !== 'admin')
    : users.filter(u => u.role === roleFilter);

  const getTypeName = (id?: string) =>
    id ? installerTypes.find(t => t.id === id)?.name ?? '' : '';

  const handleSuspend = (userId: string, name: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'Suspend' : 'Activate';
    Alert.alert(`${action} User`, `Are you sure you want to ${action.toLowerCase()} ${name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: action, style: 'destructive', onPress: () => dispatch(toggleSuspend(userId))},
    ]);
  };

  const handleDelete = (userId: string, name: string) => {
    Alert.alert('Delete User', `Permanently delete ${name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteUser(userId))},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('AdminCreateUser', {})}>
          <Text style={styles.createBtnText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {ROLE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, roleFilter === f.key && styles.filterActive]}
            onPress={() => setRoleFilter(f.key)}>
            <Text style={[styles.filterText, roleFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No users found" icon="👥" />}
        renderItem={({item}) => (
          <View style={[styles.card, item.status === 'suspended' && styles.suspended]}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarIcon}>{ROLE_ICONS[item.role]}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.installer_type_id && (
                  <Text style={styles.type}>{getTypeName(item.installer_type_id)}</Text>
                )}
              </View>
            </View>
            <View style={styles.cardRight}>
              <RoleBadge role={item.role} />
              {item.status === 'suspended' && (
                <Text style={styles.suspendedLabel}>Suspended</Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, {backgroundColor: item.status === 'active' ? '#FEF9C3' : COLORS.successLight}]}
                onPress={() => handleSuspend(item.id, item.name, item.status)}>
                <Text style={{fontSize: 11, fontWeight: '700', color: item.status === 'active' ? '#92400E' : COLORS.success}}>
                  {item.status === 'active' ? 'Suspend' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, {backgroundColor: COLORS.dangerLight}]}
                onPress={() => handleDelete(item.id, item.name)}>
                <Text style={{fontSize: 11, fontWeight: '700', color: COLORS.danger}}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {fontSize: 20, fontWeight: '800', color: COLORS.text},
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  createBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  filters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  filterActive: {backgroundColor: COLORS.primary},
  filterText: {fontSize: 12, fontWeight: '600', color: COLORS.textSecondary},
  filterTextActive: {color: '#fff'},
  list: {padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl},
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  suspended: {opacity: 0.7},
  cardLeft: {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm},
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarIcon: {fontSize: 20},
  info: {flex: 1},
  name: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  email: {fontSize: 12, color: COLORS.textSecondary, marginTop: 1},
  type: {fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2},
  cardRight: {position: 'absolute', top: SPACING.md, right: SPACING.md},
  suspendedLabel: {fontSize: 11, color: COLORS.danger, fontWeight: '600', marginTop: 4, textAlign: 'right'},
  actions: {flexDirection: 'row', gap: SPACING.sm},
  actionBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
});
