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
import {createJobAsync} from '../../store/slices/jobsSlice';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {AdminStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export default function AdminCreateJobScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const users = useAppSelector(s => s.users.items);
  const currentUser = useAppSelector(s => s.auth.currentUser);

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [managerId, setManagerId] = useState('');
  const [qaId, setQaId] = useState('');

  const managers = users.filter(u => u.role === 'manager' && u.status === 'active');
  const qaUsers = users.filter(u => u.role === 'qa' && u.status === 'active');

  const handleCreate = async () => {
    if (!title.trim() || !address.trim() || !managerId || !qaId) {
      Alert.alert('Missing fields', 'Please fill in all fields and select a Manager and QA.');
      return;
    }
    const result = await dispatch(
      createJobAsync({title: title.trim(), address: address.trim(), managerId, qaId}),
    );
    if (createJobAsync.fulfilled.match(result)) {
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error.message ?? 'Failed to create job.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="New Job" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <FormInput label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Riverside Office Renovation" />
        <FormInput label="Address" value={address} onChangeText={setAddress} placeholder="e.g. 14 Riverside Drive, London" />

        <Text style={styles.label}>Assign Manager</Text>
        <View style={styles.selectorList}>
          {managers.map(u => (
            <TouchableOpacity
              key={u.id}
              style={[styles.selectorItem, managerId === u.id && styles.selectorSelected]}
              onPress={() => setManagerId(u.id)}>
              <Text style={[styles.selectorText, managerId === u.id && styles.selectorTextSelected]}>
                {u.name}
              </Text>
              {managerId === u.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Assign QA Engineer</Text>
        <View style={styles.selectorList}>
          {qaUsers.map(u => (
            <TouchableOpacity
              key={u.id}
              style={[styles.selectorItem, qaId === u.id && styles.selectorSelected]}
              onPress={() => setQaId(u.id)}>
              <Text style={[styles.selectorText, qaId === u.id && styles.selectorTextSelected]}>
                {u.name}
              </Text>
              {qaId === u.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Create Job" onPress={handleCreate} style={styles.btn} />
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
  check: {color: COLORS.primary, fontWeight: '700', fontSize: 16},
  btn: {marginTop: SPACING.md},
});
