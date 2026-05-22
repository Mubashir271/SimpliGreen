import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
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
import {addTask} from '../../store/slices/tasksSlice';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {ManagerStackParamList} from '../../types';

type Route = RouteProp<ManagerStackParamList, 'ManagerCreateTask'>;
type Nav = NativeStackNavigationProp<ManagerStackParamList>;

export default function ManagerCreateTaskScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const {jobId} = route.params;

  const users = useAppSelector(s => s.users.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);
  const existingTasks = useAppSelector(s => s.tasks.items.filter(t => t.job_id === jobId));

  const [description, setDescription] = useState('');
  const [installerTypeId, setInstallerTypeId] = useState('');
  const [installerId, setInstallerId] = useState('');

  const installers = users.filter(
    u => u.role === 'installer' && u.status === 'active' && u.installer_type_id === installerTypeId,
  );

  const nextSeq = Math.max(0, ...existingTasks.map(t => t.sequence_number)) + 1;
  const isFirstTask = nextSeq === 1;

  const handleCreate = () => {
    if (!description.trim() || !installerTypeId || !installerId) {
      Alert.alert('Missing fields', 'Fill in all fields before creating the task.');
      return;
    }
    dispatch(
      addTask({
        id: `t${Date.now()}`,
        job_id: jobId,
        sequence_number: nextSeq,
        installer_id: installerId,
        installer_type_id: installerTypeId,
        description: description.trim(),
        status: isFirstTask ? 'active' : 'pending',
        manager_comments: '',
      }),
    );
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={`Add Task #${nextSeq}`}
        subtitle="Define work scope & assign installer"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.seqInfo}>
          <Text style={styles.seqInfoText}>
            This will be task #{nextSeq} in the sequential pipeline.
            {!isFirstTask ? ` It will unlock after task #${nextSeq - 1} is approved.` : ' It will be immediately active.'}
          </Text>
        </View>

        <FormInput
          label="Task Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the specific scope of work..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Text style={styles.label}>Installer Category</Text>
        <View style={styles.selectorList}>
          {installerTypes.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.selectorItem, installerTypeId === t.id && styles.selectorSelected]}
              onPress={() => {setInstallerTypeId(t.id); setInstallerId('');}}>
              <View>
                <Text style={[styles.selectorText, installerTypeId === t.id && styles.selectorTextSelected]}>
                  {t.name}
                </Text>
                {t.requires_certificate && (
                  <Text style={styles.certHint}>📄 Certificate required</Text>
                )}
              </View>
              {installerTypeId === t.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {installerTypeId !== '' && (
          <>
            <Text style={styles.label}>Assign Installer</Text>
            {installers.length === 0 ? (
              <View style={styles.noInstallers}>
                <Text style={styles.noInstallersText}>
                  No active installers in this category.
                </Text>
              </View>
            ) : (
              <View style={styles.selectorList}>
                {installers.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.selectorItem, installerId === u.id && styles.selectorSelected]}
                    onPress={() => setInstallerId(u.id)}>
                    <Text style={[styles.selectorText, installerId === u.id && styles.selectorTextSelected]}>
                      {u.name}
                    </Text>
                    {installerId === u.id && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <Button label="Create Task" onPress={handleCreate} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl},
  seqInfo: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  seqInfoText: {fontSize: 13, color: COLORS.primary, lineHeight: 18},
  textArea: {height: 100, textAlignVertical: 'top'},
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
  certHint: {fontSize: 11, color: COLORS.warning, marginTop: 2},
  check: {color: COLORS.primary, fontWeight: '700', fontSize: 16},
  noInstallers: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerLight,
    marginBottom: SPACING.md,
  },
  noInstallersText: {fontSize: 13, color: COLORS.danger, textAlign: 'center'},
  btn: {marginTop: SPACING.sm},
});
