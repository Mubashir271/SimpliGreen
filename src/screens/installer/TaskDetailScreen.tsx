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
import {TaskStatusBadge} from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import ScreenHeader from '../../components/common/ScreenHeader';
import {useAppSelector} from '../../store/hooks';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {InstallerStackParamList} from '../../types';

type Route = RouteProp<InstallerStackParamList, 'InstallerTaskDetail'>;
type Nav = NativeStackNavigationProp<InstallerStackParamList>;

export default function InstallerTaskDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {taskId} = route.params;

  const task = useAppSelector(s => s.tasks.items.find(t => t.id === taskId));
  const media = useAppSelector(s => s.tasks.media.filter(m => m.task_id === taskId));
  const jobs = useAppSelector(s => s.jobs.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  if (!task) {return null;}

  const job = jobs.find(j => j.id === task.job_id);
  const type = installerTypes.find(t => t.id === task.installer_type_id);
  const requiresCert = type?.requires_certificate ?? false;
  const images = media.filter(m => m.file_type === 'image');
  const certs = media.filter(m => m.file_type === 'certificate');
  const canSubmit = task.status === 'active';
  const wasRejected = task.status === 'rejected';

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={`Task #${task.sequence_number}`}
        subtitle={job?.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Rejection feedback */}
        {wasRejected && task.manager_comments ? (
          <View style={styles.rejectionBanner}>
            <Text style={styles.rejectionTitle}>⚠️ Task Rejected</Text>
            <Text style={styles.rejectionText}>{task.manager_comments}</Text>
            <Text style={styles.rejectionHint}>Please review the feedback and resubmit.</Text>
          </View>
        ) : null}

        {/* Task info */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Task Details</Text>
            <TaskStatusBadge status={task.status} />
          </View>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.descLabel}>Scope of Work</Text>
          <Text style={styles.desc}>{task.description}</Text>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.meta}>Category: {type?.name ?? 'N/A'}</Text>
          <Text style={styles.meta}>Job: {job?.title ?? 'N/A'}</Text>
          {task.submitted_at && <Text style={styles.meta}>Submitted: {task.submitted_at}</Text>}
          {task.approved_at && <Text style={styles.metaGreen}>Approved: {task.approved_at}</Text>}
        </Card>

        {/* Requirements */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Submission Requirements</Text>
          <Divider vertical={SPACING.sm} />
          <View style={styles.reqRow}>
            <Text style={styles.reqIcon}>🖼️</Text>
            <Text style={styles.reqText}>Photo evidence (required)</Text>
            {images.length > 0 && <Text style={styles.reqCheck}>✓ {images.length} uploaded</Text>}
          </View>
          <View style={styles.reqRow}>
            <Text style={styles.reqIcon}>📄</Text>
            <Text style={styles.reqText}>
              Certificate {requiresCert ? '(required)' : '(not required for this category)'}
            </Text>
            {certs.length > 0 && <Text style={styles.reqCheck}>✓ {certs.length} uploaded</Text>}
          </View>
        </Card>

        {/* Previously uploaded media */}
        {media.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Uploaded Files</Text>
            <Divider vertical={SPACING.sm} />
            {media.map(m => (
              <View key={m.id} style={styles.fileRow}>
                <Text style={styles.fileIcon}>{m.file_type === 'certificate' ? '📄' : '🖼️'}</Text>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{m.file_name}</Text>
                  <Text style={styles.fileDate}>{m.uploaded_at}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Action */}
        {(canSubmit || wasRejected) && (
          <Button
            label={wasRejected ? 'Resubmit Work' : 'Submit Work'}
            variant={wasRejected ? 'danger' : 'primary'}
            onPress={() => navigation.navigate('InstallerTaskSubmission', {taskId})}
            style={styles.btn}
          />
        )}

        {task.status === 'submitted' && (
          <View style={styles.submittedBanner}>
            <Text style={styles.submittedText}>⏳ Work submitted — awaiting manager review</Text>
          </View>
        )}

        {task.status === 'approved' && (
          <View style={styles.approvedBanner}>
            <Text style={styles.approvedText}>✅ Task approved by manager</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md},
  card: {},
  rejectionBanner: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  rejectionTitle: {fontSize: 14, fontWeight: '800', color: COLORS.danger, marginBottom: 4},
  rejectionText: {fontSize: 13, color: COLORS.text, fontStyle: 'italic', marginBottom: 4},
  rejectionHint: {fontSize: 12, color: COLORS.textSecondary},
  statusRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  descLabel: {fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4},
  desc: {fontSize: 14, color: COLORS.text, lineHeight: 20},
  meta: {fontSize: 13, color: COLORS.textSecondary, marginTop: 2},
  metaGreen: {fontSize: 13, color: COLORS.success, fontWeight: '600', marginTop: 2},
  reqRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs},
  reqIcon: {fontSize: 18, marginRight: SPACING.sm},
  reqText: {flex: 1, fontSize: 13, color: COLORS.text},
  reqCheck: {fontSize: 12, color: COLORS.success, fontWeight: '700'},
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fileIcon: {fontSize: 18, marginRight: SPACING.sm},
  fileInfo: {flex: 1},
  fileName: {fontSize: 13, fontWeight: '600', color: COLORS.text},
  fileDate: {fontSize: 11, color: COLORS.textSecondary},
  btn: {},
  submittedBanner: {
    backgroundColor: '#FEF9C3',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  submittedText: {fontSize: 14, color: '#92400E', fontWeight: '600'},
  approvedBanner: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  approvedText: {fontSize: 14, color: COLORS.success, fontWeight: '600'},
});
