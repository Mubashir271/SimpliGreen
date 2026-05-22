import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {JobStatusBadge, TaskStatusBadge} from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import ScreenHeader from '../../components/common/ScreenHeader';
import {useAppSelector} from '../../store/hooks';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {QAStackParamList} from '../../types';

type Route = RouteProp<QAStackParamList, 'QAJobMonitor'>;
type Nav = NativeStackNavigationProp<QAStackParamList>;

export default function QAJobMonitorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {jobId} = route.params;

  const job = useAppSelector(s => s.jobs.items.find(j => j.id === jobId));
  const tasks = useAppSelector(s =>
    s.tasks.items.filter(t => t.job_id === jobId).sort((a, b) => a.sequence_number - b.sequence_number),
  );
  const media = useAppSelector(s => s.tasks.media);
  const users = useAppSelector(s => s.users.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  if (!job) {return null;}

  const getUser = (id: string) => users.find(u => u.id === id);
  const getType = (id: string) => installerTypes.find(t => t.id === id);

  const approved = tasks.filter(t => t.status === 'approved').length;
  const progressPct = tasks.length > 0 ? (approved / tasks.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Live Monitor"
        subtitle={job.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Overview */}
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Job Overview</Text>
            <JobStatusBadge status={job.status} />
          </View>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.meta}>Manager: {getUser(job.manager_id)?.name ?? 'N/A'}</Text>
          <Text style={styles.meta}>Address: {job.address}</Text>
          <Text style={styles.meta}>Created: {job.created_at}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${progressPct}%`}]} />
            </View>
            <Text style={styles.progressText}>
              {approved}/{tasks.length} tasks approved ({Math.round(progressPct)}%)
            </Text>
          </View>
        </Card>

        {/* Live task feed */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Task Pipeline (Live)</Text>
          <Text style={styles.liveHint}>🔴 LIVE — Updates as manager reviews tasks</Text>
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
                <View style={styles.taskHeader}>
                  <View style={[
                    styles.seqCircle,
                    task.status === 'approved' && styles.seqCircleApproved,
                    task.status === 'active' || task.status === 'submitted' ? styles.seqCircleActive : null,
                  ]}>
                    <Text style={styles.seqText}>
                      {task.status === 'approved' ? '✓' : task.sequence_number}
                    </Text>
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskInstaller}>{installer?.name ?? 'N/A'}</Text>
                    <Text style={styles.taskType}>{type?.name ?? ''}</Text>
                  </View>
                  <TaskStatusBadge status={task.status} />
                </View>

                <Text style={styles.taskDesc}>{task.description}</Text>

                {task.status === 'pending' && (
                  <Text style={styles.lockedNote}>🔒 Locked until previous task is approved</Text>
                )}

                {taskMedia.length > 0 && (
                  <View style={styles.mediaRow}>
                    {imgs.length > 0 && (
                      <View style={styles.mediaPill}>
                        <Text style={styles.mediaPillText}>🖼️ {imgs.length} photo{imgs.length !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {certs.length > 0 && (
                      <View style={[styles.mediaPill, styles.mediaPillCert]}>
                        <Text style={styles.mediaPillText}>📄 {certs.length} cert{certs.length !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>
                )}

                {task.approved_at && (
                  <Text style={styles.approvedAt}>✅ Approved {task.approved_at}</Text>
                )}
              </View>
            );
          })}

          {tasks.length === 0 && (
            <Text style={styles.noTasks}>No tasks defined yet.</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md},
  card: {},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  liveHint: {fontSize: 11, color: COLORS.danger, fontWeight: '600', marginTop: 4},
  meta: {fontSize: 13, color: COLORS.textSecondary, marginTop: 2},
  progressSection: {marginTop: SPACING.md},
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {height: '100%', backgroundColor: COLORS.success, borderRadius: RADIUS.full},
  progressText: {fontSize: 12, color: COLORS.textSecondary, fontWeight: '600'},
  taskHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs},
  seqCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  seqCircleApproved: {backgroundColor: COLORS.successLight},
  seqCircleActive: {backgroundColor: '#DBEAFE'},
  seqText: {fontSize: 12, fontWeight: '800', color: COLORS.primary},
  taskInfo: {flex: 1},
  taskInstaller: {fontSize: 13, fontWeight: '700', color: COLORS.text},
  taskType: {fontSize: 11, color: COLORS.textSecondary},
  taskDesc: {fontSize: 12, color: COLORS.textSecondary, marginLeft: 36, lineHeight: 17, marginBottom: 4},
  lockedNote: {fontSize: 11, color: COLORS.textMuted, marginLeft: 36, fontStyle: 'italic'},
  mediaRow: {flexDirection: 'row', gap: SPACING.xs, marginLeft: 36, marginTop: 4},
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  mediaPillCert: {backgroundColor: '#FEF3C7'},
  mediaPillText: {fontSize: 11, fontWeight: '600', color: COLORS.text},
  approvedAt: {fontSize: 11, color: COLORS.success, marginLeft: 36, fontWeight: '600', marginTop: 2},
  noTasks: {fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.md},
});
