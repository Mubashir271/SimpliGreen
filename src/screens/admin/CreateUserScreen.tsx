import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';
import ScreenHeader from '../../components/common/ScreenHeader';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {createUserAsync} from '../../store/slices/usersSlice';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {AdminStackParamList, UserRole} from '../../types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const ROLES: Array<{key: UserRole; label: string; icon: string}> = [
  {key: 'manager', label: 'Manager', icon: '📋'},
  {key: 'installer', label: 'Installer', icon: '🔨'},
  {key: 'qa', label: 'QA Engineer', icon: '🔍'},
];

export default function AdminCreateUserScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [installerTypeId, setInstallerTypeId] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Name, email, and password are required.');
      return;
    }
    if (role === 'installer' && !installerTypeId) {
      Alert.alert('Missing fields', 'Please select an installer category.');
      return;
    }
    const result = await dispatch(
      createUserAsync({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        installerTypeId: role === 'installer' ? installerTypeId : undefined,
      }),
    );
    if (createUserAsync.fulfilled.match(result)) {
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error.message ?? 'Failed to create user.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Add User" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <FormInput label="Full Name" value={name} onChangeText={setName} placeholder="e.g. John Smith" />
        <FormInput label="Email Address" value={email} onChangeText={setEmail} placeholder="e.g. john@company.com" keyboardType="email-address" autoCapitalize="none" />
        <FormInput label="Password" value={password} onChangeText={setPassword} placeholder="Temporary password" secureTextEntry />

        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, role === r.key && styles.roleCardActive]}
              onPress={() => setRole(r.key)}>
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {role === 'installer' && (
          <>
            <Text style={styles.label}>Installer Category</Text>
            <View style={styles.selectorList}>
              {installerTypes.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.selectorItem, installerTypeId === t.id && styles.selectorSelected]}
                  onPress={() => setInstallerTypeId(t.id)}>
                  <View>
                    <Text style={[styles.selectorText, installerTypeId === t.id && styles.selectorTextSelected]}>
                      {t.name}
                    </Text>
                    {t.requires_certificate && (
                      <Text style={styles.certNote}>Requires certificate</Text>
                    )}
                  </View>
                  {installerTypeId === t.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button label="Create User" onPress={handleCreate} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  roleRow: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md},
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  roleCardActive: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  roleIcon: {fontSize: 24, marginBottom: 4},
  roleLabel: {fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center'},
  roleLabelActive: {color: COLORS.primary},
  selectorList: {gap: SPACING.xs, marginBottom: SPACING.md},
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  selectorSelected: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  selectorText: {fontSize: 15, color: COLORS.text},
  selectorTextSelected: {color: COLORS.primary, fontWeight: '600'},
  certNote: {fontSize: 11, color: COLORS.warning, marginTop: 2},
  check: {color: COLORS.primary, fontWeight: '700', fontSize: 16},
  btn: {marginTop: SPACING.md},
});
