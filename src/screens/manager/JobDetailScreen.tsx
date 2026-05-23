import {useFocusEffect, RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {JobStatusBadge, TaskStatusBadge} from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import ScreenHeader from '../../components/common/ScreenHeader';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {submitJobToQAAsync, upsertJob} from '../../store/slices/jobsSlice';
import {setJobTasks} from '../../store/slices/tasksSlice';
import {managerApi} from '../../api';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';
import {ManagerStackParamList} from '../../types';

type Route = RouteProp<ManagerStackParamList, 'ManagerJobDetail'>;
type Nav = NativeStackNavigationProp<ManagerStackParamList>;

export default function ManagerJobDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const {jobId} = route.params;

  const job = useAppSelector(s => s.jobs.items.find(j => j.id === jobId));
  const users = useAppSelector(s => s.users.items);
  const tasks = useAppSelector(s =>
    s.tasks.items.filter(t => t.job_id === jobId).sort((a, b) => a.sequence_number - b.sequence_number),
  );
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  useFocusEffect(useCallback(() => {
    managerApi.getJob(jobId).then(result => {
      dispatch(upsertJob(result.job));
      dispatch(setJobTasks({jobId, tasks: result.tasks, media: result.media}));
    }).catch(() => {});
  }, [jobId, dispatch]));

  if (!job) {return null;}

  const getUser = (id: string) => users.find(u => u.id === id);
  const getType = (id: string) => installerTypes.find(t => t.id === id);

  const allApproved = tasks.length > 0 && tasks.every(t => t.status === 'approved');
  const canSubmitToQA = job.status === 'in_progress' && allApproved;
  const canAddTasks = job.status === 'in_progress';

  const handleSubmitToQA = () => {
    Alert.alert(
      'Submit to QA',
      'All tasks are approved. Submit this job to the QA team for final review?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit',
          onPress: async () => {
            const result = await dispatch(submitJobToQAAsync(jobId));
            if (submitJobToQAAsync.fulfilled.match(result)) {
              navigation.goBack();
            } else {
              Alert.alert('Error', result.error.message ?? 'Failed to submit job.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Job Detail"
        subtitle={job.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Job info */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Job Info</Text>
            <JobStatusBadge status={job.status} />
          </View>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.address}>📍 {job.address}</Text>
          <Text style={styles.meta}>QA Engineer: {getUser(job.qa_id)?.name ?? 'N/A'}</Text>
          {job.qa_comments ? (
            <View style={styles.qaBanner}>
              <Text style={styles.qaLabel}>QA Feedback (Action Required)</Text>
              <Text style={styles.qaText}>{job.qa_comments}</Text>
            </View>
          ) : null}
        </Card>

        {/* Task pipeline */}
        <Card style={styles.card}>
          <View style={styles.taskPipelineHeader}>
            <Text style={styles.sectionTitle}>Task Pipeline</Text>
            {canAddTasks && (
              <TouchableOpacity
                style={styles.addTaskBtn}
                onPress={() => navigation.navigate('ManagerCreateTask', {jobId})}>
                <Text style={styles.addTaskBtnText}>+ Add Task</Text>
              </TouchableOpacity>
            )}
          </View>

          {tasks.length === 0 ? (
            <Text style={styles.emptyTasks}>
              No tasks yet. Add tasks to define the work pipeline.
            </Text>
          ) : (
            tasks.map((task, idx) => {
              const installer = getUser(task.installer_id);
              const type = getType(task.installer_type_id);
              const isReviewable = task.status === 'submitted';
              const isRejected = task.status === 'rejected' || task.status === 'active';

              return (
                <View key={task.id}>
                  {idx > 0 && (
                    <View style={styles.connector}>
                      <View style={styles.connectorLine} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.taskCard,
                      isReviewable && styles.taskCardReviewable,
                      task.status === 'approved' && styles.taskCardApproved,
                      task.status === 'rejected' && styles.taskCardRejected,
                    ]}
                    onPress={() =>
                      isReviewable
                        ? navigation.navigate('ManagerTaskReview', {taskId: task.id, jobId})
                        : null
                    }
                    activeOpacity={isReviewable ? 0.75 : 1}>
                    <View style={styles.taskRow}>
                      <View style={[styles.seqBadge, task.status === 'approved' && styles.seqBadgeApproved]}>
                        <Text style={[styles.seqText, task.status === 'approved' && {color: COLORS.success}]}>
                          {task.status === 'approved' ? '✓' : task.sequence_number}
                        </Text>
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskInstallerName}>
                          {installer?.name ?? 'Unassigned'}
                        </Text>
                        <Text style={styles.taskType}>{type?.name ?? ''}</Text>
                      </View>
                      <TaskStatusBadge status={task.status} />
                    </View>
                    <Text style={styles.taskDesc}>{task.description}</Text>
                    {task.manager_comments ? (
                      <Text style={styles.taskComment}>Note: {task.manager_comments}</Text>
                    ) : null}
                    {isReviewable && (
                      <View style={styles.reviewBanner}>
                        <Text style={styles.reviewBannerText}>Tap to Review →</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </Card>

        {/* Submit to QA */}
        {canSubmitToQA && (
          <TouchableOpacity style={styles.submitQABtn} onPress={handleSubmitToQA}>
            <Text style={styles.submitQAText}>Submit to QA →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md},
  card: {},
  statusRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  jobTitle: {fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4},
  address: {fontSize: 13, color: COLORS.textSecondary, marginBottom: 4},
  meta: {fontSize: 13, color: COLORS.textSecondary},
  qaBanner: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  qaLabel: {fontSize: 12, fontWeight: '700', color: COLORS.danger, marginBottom: 4},
  qaText: {fontSize: 13, color: COLORS.text, fontStyle: 'italic'},
  taskPipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addTaskBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  addTaskBtnText: {fontSize: 12, color: COLORS.primary, fontWeight: '700'},
  emptyTasks: {fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.md},
  connector: {alignItems: 'flex-start', paddingLeft: 14, marginVertical: 2},
  connectorLine: {width: 2, height: 12, backgroundColor: COLORS.border},
  taskCard: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  taskCardReviewable: {borderColor: COLORS.warning, backgroundColor: '#FFFBEB'},
  taskCardApproved: {borderColor: COLORS.success, backgroundColor: COLORS.successLight},
  taskCardRejected: {borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight},
  taskRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  seqBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  seqBadgeApproved: {backgroundColor: COLORS.successLight},
  seqText: {fontSize: 12, fontWeight: '800', color: COLORS.primary},
  taskInfo: {flex: 1},
  taskInstallerName: {fontSize: 13, fontWeight: '700', color: COLORS.text},
  taskType: {fontSize: 11, color: COLORS.textSecondary},
  taskDesc: {fontSize: 12, color: COLORS.textSecondary, marginLeft: 34, lineHeight: 17},
  taskComment: {fontSize: 11, color: COLORS.warning, marginLeft: 34, marginTop: 2, fontStyle: 'italic'},
  reviewBanner: {
    backgroundColor: '#FEF9C3',
    borderRadius: RADIUS.sm,
    padding: 4,
    marginTop: SPACING.xs,
  },
  reviewBannerText: {fontSize: 12, color: '#92400E', fontWeight: '700', textAlign: 'center'},
  submitQABtn: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOW.medium,
  },
  submitQAText: {color: '#fff', fontSize: 16, fontWeight: '800'},
});
