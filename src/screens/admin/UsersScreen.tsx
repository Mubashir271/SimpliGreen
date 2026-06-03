import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useState} from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RoleBadge} from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {deleteUserAsync, updateUserAsync, fetchUsers} from '../../store/slices/usersSlice';
import {fetchInstallerTypes} from '../../store/slices/installerTypesSlice';
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useFocusEffect(useCallback(() => {
    dispatch(fetchUsers());
    dispatch(fetchInstallerTypes());
  }, [dispatch]));

  const filtered = roleFilter === 'all'
    ? users.filter(u => u.role !== 'admin')
    : users.filter(u => u.role === roleFilter);

  const getTypeName = (id?: string) =>
    id ? installerTypes.find(t => t.id === id)?.name ?? '' : '';

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSuspend = (userId: string, name: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'Suspend' : 'Activate';
    Alert.alert(`${action} User`, `Are you sure you want to ${action.toLowerCase()} ${name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: action,
        style: 'destructive',
        onPress: () =>
          dispatch(updateUserAsync({id: userId, data: {isActive: currentStatus === 'suspended'}})),
      },
    ]);
  };

  const handleDelete = (userId: string, name: string) => {
    Alert.alert('Delete User', `Permanently delete ${name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteUserAsync(userId))},
    ]);
  };

  const renderUserCard = (item: typeof users[0]) => (
    <View key={item.id} style={[styles.card, item.status === 'suspended' && styles.suspended]}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>{ROLE_ICONS[item.role]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.installer_type_id && roleFilter !== 'installer' && (
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
  );

  const renderInstallerGroups = () => {
    const uncategorised = filtered.filter(u => !u.installer_type_id);
    return (
      <ScrollView contentContainerStyle={styles.list}>
        {installerTypes.map(type => {
          const members = filtered.filter(u => u.installer_type_id === type.id);
          const isExpanded = expanded.has(type.id);
          return (
            <View key={type.id} style={styles.groupCard}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => toggleExpanded(type.id)}
                activeOpacity={0.7}>
                <View style={styles.groupIconBox}>
                  <Text style={styles.groupIcon}>🔧</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{type.name}</Text>
                  <Text style={styles.groupCount}>
                    {members.length} installer{members.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {type.requires_certificate && (
                  <Text style={styles.certBadge}>📄 Cert</Text>
                )}
                <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.groupMembers}>
                  {members.length === 0 ? (
                    <Text style={styles.emptyMembers}>No installers in this category.</Text>
                  ) : (
                    members.map(member => renderUserCard(member))
                  )}
                  <TouchableOpacity
                    style={styles.addInstallerBtn}
                    onPress={() => navigation.navigate('AdminCreateUser', {installerTypeId: type.id})}>
                    <Text style={styles.addInstallerText}>+ Add Installer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {uncategorised.length > 0 && (
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleExpanded('__none__')}
              activeOpacity={0.7}>
              <View style={[styles.groupIconBox, {backgroundColor: COLORS.border}]}>
                <Text style={styles.groupIcon}>❓</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>Uncategorised</Text>
                <Text style={styles.groupCount}>{uncategorised.length} installer{uncategorised.length !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.chevron}>{expanded.has('__none__') ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded.has('__none__') && (
              <View style={styles.groupMembers}>
                {uncategorised.map(member => renderUserCard(member))}
              </View>
            )}
          </View>
        )}

        {installerTypes.length === 0 && filtered.length === 0 && (
          <EmptyState title="No installers found" icon="🔨" />
        )}
      </ScrollView>
    );
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

      {roleFilter === 'installer' ? (
        renderInstallerGroups()
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No users found" icon="👥" />}
          renderItem={({item}) => renderUserCard(item)}
        />
      )}
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

  // Flat user card (All / Managers / QA)
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

  // Grouped installer view
  groupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  groupIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  groupIcon: {fontSize: 20},
  groupInfo: {flex: 1},
  groupName: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  groupCount: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  certBadge: {fontSize: 11, color: COLORS.warning, fontWeight: '600', marginRight: SPACING.sm},
  chevron: {fontSize: 10, color: COLORS.textMuted},
  groupMembers: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  emptyMembers: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  addInstallerBtn: {
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  addInstallerText: {fontSize: 13, color: COLORS.primary, fontWeight: '700'},
});
