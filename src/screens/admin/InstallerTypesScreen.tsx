import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useRef, useState, memo} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {fetchUsers} from '../../store/slices/usersSlice';
import {
  createInstallerTypeAsync,
  deleteInstallerTypeAsync,
  fetchInstallerTypes,
  toggleCertificateAsync,
} from '../../store/slices/installerTypesSlice';
import {AdminStackParamList, InstallerType, User} from '../../types';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

// ── Per-card component — memo'd so only the affected card re-renders ──────────

interface TypeCardProps {
  item: InstallerType;
  members: User[];
  isExpanded: boolean;
  onDelete: (id: string, name: string) => void;
  onToggleExpand: (id: string) => void;
  onAddInstaller: (typeId: string) => void;
}

const TypeCard = memo(({
  item, members, isExpanded,
  onDelete, onToggleExpand, onAddInstaller,
}: TypeCardProps) => {
  const dispatch = useAppDispatch();
  const [cert, setCert] = useState(item.requires_certificate);
  const inFlight = useRef(false);

  // Only sync when a different item is slotted into this row (e.g. after delete)
  const slottedId = useRef(item.id);
  useEffect(() => {
    if (slottedId.current !== item.id) {
      slottedId.current = item.id;
      setCert(item.requires_certificate);
    }
  }, [item.id, item.requires_certificate]);

  const handleToggle = useCallback(async () => {
    if (inFlight.current) {return;}
    inFlight.current = true;
    const prev = cert;
    setCert(!prev);
    try {
      await dispatch(toggleCertificateAsync({id: item.id, current: prev})).unwrap();
    } catch {
      setCert(prev); // revert on API failure
    } finally {
      inFlight.current = false;
    }
  }, [cert, item.id, dispatch]);

  return (
    <View style={styles.card}>
      <View style={styles.catRow}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔧</Text>
        </View>
        <View style={styles.catInfo}>
          <Text style={styles.catName}>{item.name}</Text>
          <Text style={[
            styles.certStatus,
            {color: cert ? COLORS.warning : COLORS.textMuted},
          ]}>
            {cert ? '📄 Certificate required' : 'No certificate'}
          </Text>
        </View>
        <Switch
          value={cert}
          onValueChange={handleToggle}
          trackColor={{false: COLORS.border, true: '#FCD34D'}}
          thumbColor={cert ? COLORS.warning : '#f4f3f4'}
          style={styles.switch}
        />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item.id, item.name)}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.expandRow}
        onPress={() => onToggleExpand(item.id)}
        activeOpacity={0.7}>
        <Text style={styles.expandLabel}>
          {members.length} installer{members.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.memberSection}>
          {members.length === 0 ? (
            <Text style={styles.emptyMembers}>No installers in this category yet.</Text>
          ) : (
            members.map(member => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>🔨</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  member.status === 'active' ? styles.statusActive : styles.statusSuspended,
                ]}>
                  <Text style={[
                    styles.statusText,
                    {color: member.status === 'active' ? COLORS.success : COLORS.danger},
                  ]}>
                    {member.status === 'active' ? 'Active' : 'Suspended'}
                  </Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.addInstallerBtn}
            onPress={() => onAddInstaller(item.id)}>
            <Text style={styles.addInstallerText}>+ Add Installer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminInstallerTypesScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const types = useAppSelector(s => s.installerTypes.items);
  const allUsers = useAppSelector(s => s.users.items);
  const installers = allUsers.filter(u => u.role === 'installer');

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  useFocusEffect(useCallback(() => {
    dispatch(fetchInstallerTypes());
    dispatch(fetchUsers());
  }, [dispatch]));

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteInstallerTypeAsync(id))},
    ]);
  }, [dispatch]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleAddInstaller = useCallback((typeId: string) => {
    navigation.navigate('AdminCreateUser', {installerTypeId: typeId});
  }, [navigation]);

  const handleAdd = async () => {
    if (!newName.trim()) {return;}
    await dispatch(createInstallerTypeAsync({name: newName.trim(), requiresCertificate: false}));
    setNewName('');
    setModalVisible(false);
  };

  const renderItem = useCallback(({item}: {item: InstallerType}) => (
    <TypeCard
      item={item}
      members={installers.filter(u => u.installer_type_id === item.id)}
      isExpanded={expanded.has(item.id)}
      onDelete={handleDelete}
      onToggleExpand={handleToggleExpand}
      onAddInstaller={handleAddInstaller}
    />
  ), [installers, expanded, handleDelete, handleToggleExpand, handleAddInstaller]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>Installer types & their team members</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={types}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        extraData={expanded}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Category</Text>
            <FormInput
              label="Category Name"
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Plumbers"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => {setModalVisible(false); setNewName('');}}
                style={styles.modalBtn}
              />
              <Button label="Add" onPress={handleAdd} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
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
  subtitle: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  list: {padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl},
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  icon: {fontSize: 20},
  catInfo: {flex: 1},
  catName: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  certStatus: {fontSize: 12, marginTop: 2},
  switch: {marginRight: SPACING.xs},
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {color: COLORS.danger, fontWeight: '700', fontSize: 13},
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  expandLabel: {fontSize: 12, color: COLORS.textSecondary, fontWeight: '600'},
  chevron: {fontSize: 10, color: COLORS.textMuted},
  memberSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
  emptyMembers: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  memberAvatarText: {fontSize: 14},
  memberInfo: {flex: 1},
  memberName: {fontSize: 13, fontWeight: '600', color: COLORS.text},
  memberEmail: {fontSize: 11, color: COLORS.textSecondary, marginTop: 1},
  statusBadge: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusActive: {backgroundColor: COLORS.successLight},
  statusSuspended: {backgroundColor: COLORS.dangerLight},
  statusText: {fontSize: 11, fontWeight: '700'},
  addInstallerBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addInstallerText: {fontSize: 13, color: COLORS.primary, fontWeight: '700'},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md},
  modalActions: {flexDirection: 'row', gap: SPACING.sm},
  modalBtn: {flex: 1},
});
