import {useFocusEffect, RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TaskStatusBadge} from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import FormInput from '../../components/common/FormInput';
import ScreenHeader from '../../components/common/ScreenHeader';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {approveJobAsync, rejectJobAsync, upsertJob} from '../../store/slices/jobsSlice';
import {setJobTasks} from '../../store/slices/tasksSlice';
import {qaApi} from '../../api';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {QAStackParamList} from '../../types';

type Route = RouteProp<QAStackParamList, 'QAFinalReview'>;
type Nav = NativeStackNavigationProp<QAStackParamList>;

export default function QAFinalReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const {jobId} = route.params;

  const job = useAppSelector(s => s.jobs.items.find(j => j.id === jobId));
  const tasks = useAppSelector(s =>
    s.tasks.items.filter(t => t.job_id === jobId).sort((a, b) => a.sequence_number - b.sequence_number),
  );
  const media = useAppSelector(s => s.tasks.media);
  const users = useAppSelector(s => s.users.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  const [qaComments, setQaComments] = useState('');
  const [rejectMode, setRejectMode] = useState(false);

  useFocusEffect(useCallback(() => {
    qaApi.getJob(jobId).then(result => {
      dispatch(upsertJob(result.job));
      dispatch(setJobTasks({jobId, tasks: result.tasks, media: result.media}));
    }).catch(() => {});
  }, [jobId, dispatch]));

  if (!job) {return null;}

  const getUser = (id: string) => users.find(u => u.id === id);
  const getType = (id: string) => installerTypes.find(t => t.id === id);

  const handleApprove = () => {
    Alert.alert('Final Approval', 'Approve this job? This marks it as complete.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Approve Job',
        onPress: async () => {
          const result = await dispatch(approveJobAsync({jobId, comments: qaComments || undefined}));
          if (approveJobAsync.fulfilled.match(result)) {
            navigation.navigate('QATabs');
          } else {
            Alert.alert('Error', result.error.message ?? 'Failed to approve job.');
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    if (!qaComments.trim()) {
      Alert.alert('Comments required', 'Please provide detailed feedback before rejecting.');
      return;
    }
    Alert.alert('Reject Job', 'Return this job to the manager for remediation?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reject & Return',
        style: 'destructive',
        onPress: async () => {
          const result = await dispatch(rejectJobAsync({jobId, comments: qaComments}));
          if (rejectJobAsync.fulfilled.match(result)) {
            navigation.navigate('QATabs');
          } else {
            Alert.alert('Error', result.error.message ?? 'Failed to reject job.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Final QA Review"
        subtitle={job.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Job Summary</Text>
          <Divider vertical={SPACING.sm} />
          <InfoRow label="Title" value={job.title} />
          <InfoRow label="Address" value={job.address} />
          <InfoRow label="Manager" value={getUser(job.manager_id)?.name ?? 'N/A'} />
          <InfoRow label="Created" value={job.created_at} />
          <InfoRow label="Tasks" value={`${tasks.length} tasks — all approved`} />
        </Card>

        {/* All tasks with compiled evidence */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Compiled Task Evidence</Text>
          <Text style={styles.hint}>Review all submitted work before making your decision</Text>
          <Divider vertical={SPACING.sm} />

          {tasks.map((task, idx) => {
            const installer = getUser(task.installer_id);
            const type = getType(task.installer_type_id);
            const taskMedia = media.filter(m => m.task_id === task.id);
            const imgs = taskMedia.filter(m => m.file_type === 'image');
            const certs = taskMedia.filter(m => m.file_type === 'certificate');

            return (
              <View key={task.id}>
                {idx > 0 && <Divider vertical={SPACING.sm} />}
                <View style={styles.taskHeaderRow}>
                  <Text style={styles.taskSeq}>Task {task.sequence_number}</Text>
                  <TaskStatusBadge status={task.status} />
                </View>
                <Text style={styles.taskInstaller}>
                  {installer?.name} — {type?.name}
                </Text>
                <Text style={styles.taskDesc}>{task.description}</Text>

                {taskMedia.length > 0 ? (
                  <View style={styles.evidenceBlock}>
                    {imgs.map(m => (
                      <View key={m.id} style={styles.evidenceRow}>
                        <Text style={styles.evidenceIcon}>🖼️</Text>
                        <Text style={styles.evidenceName}>{m.file_name}</Text>
                        <Text style={styles.evidenceDate}>{m.uploaded_at}</Text>
                      </View>
                    ))}
                    {certs.map(m => (
                      <View key={m.id} style={styles.evidenceRow}>
                        <Text style={styles.evidenceIcon}>📄</Text>
                        <Text style={styles.evidenceName}>{m.file_name}</Text>
                        <Text style={styles.evidenceDate}>{m.uploaded_at}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noEvidence}>No media uploaded for this task.</Text>
                )}

                {task.approved_at && (
                  <Text style={styles.approvedNote}>Manager approved: {task.approved_at}</Text>
                )}
              </View>
            );
          })}
        </Card>

        {/* QA Decision */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Your Decision</Text>
          <Divider vertical={SPACING.sm} />

          <FormInput
            label={rejectMode ? 'Rejection Comments (required)' : 'QA Comments (optional)'}
            value={qaComments}
            onChangeText={setQaComments}
            placeholder={
              rejectMode
                ? 'Describe what needs to be corrected or redone...'
                : 'Any observations or sign-off notes...'
            }
            multiline
            numberOfLines={4}
            style={styles.commentsInput}
          />

          {!rejectMode ? (
            <View style={styles.actionRow}>
              <Button
                label="✓ Approve Job"
                variant="success"
                onPress={handleApprove}
                style={styles.actionBtn}
              />
              <Button
                label="✕ Reject Job"
                variant="danger"
                onPress={() => setRejectMode(true)}
                style={styles.actionBtn}
              />
            </View>
          ) : (
            <>
              <View style={styles.rejectWarning}>
                <Text style={styles.rejectWarningText}>
                  ⚠️ Rejection will return the job to the manager with your comments.
                </Text>
              </View>
              <View style={styles.actionRow}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => setRejectMode(false)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Send Rejection"
                  variant="danger"
                  onPress={handleReject}
                  style={styles.actionBtn}
                />
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md},
  card: {},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  hint: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {fontSize: 13, color: COLORS.textSecondary, flex: 1},
  infoValue: {fontSize: 13, color: COLORS.text, fontWeight: '600', flex: 2, textAlign: 'right'},
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  taskSeq: {fontSize: 13, fontWeight: '800', color: COLORS.text},
  taskInstaller: {fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 4},
  taskDesc: {fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.xs},
  evidenceBlock: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  evidenceRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.xs},
  evidenceIcon: {fontSize: 14},
  evidenceName: {flex: 1, fontSize: 12, color: COLORS.text, fontWeight: '600'},
  evidenceDate: {fontSize: 11, color: COLORS.textSecondary},
  noEvidence: {fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic'},
  approvedNote: {fontSize: 11, color: COLORS.success, fontWeight: '600', marginTop: 4},
  commentsInput: {height: 100, textAlignVertical: 'top'},
  actionRow: {flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs},
  actionBtn: {flex: 1},
  rejectWarning: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  rejectWarningText: {fontSize: 12, color: COLORS.danger, fontWeight: '600'},
});
