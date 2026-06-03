import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobStatusBadge, TaskStatusBadge } from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useAppSelector } from '../../store/hooks';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { AdminStackParamList } from '../../types';

type Route = RouteProp<AdminStackParamList, 'AdminJobDetail'>;
type Nav = NativeStackNavigationProp<AdminStackParamList>;

const { width } = Dimensions.get('window');
export default function AdminJobDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { jobId } = route.params;

  const job = useAppSelector(s => s.jobs.items.find(j => j.id === jobId));
  console.log('JOBSSSSS',job)
  const users = useAppSelector(s => s.users.items);
  const tasks = useAppSelector(s => s.tasks.items.filter(t => t.job_id === jobId));
  const media = useAppSelector(s => s.tasks.media);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  const [imagePreview, setImagePreview] = useState<{ uri: string; name: string } | null>(null);

  if (!job) { return null; }

  const getUser = (id: string) => users.find(u => u.id === id);
  const getType = (id: string) => installerTypes.find(t => t.id === id);
  const sortedTasks = [...tasks].sort((a, b) => a.sequence_number - b.sequence_number);

  const openImage = (mediaItem: any) => {
    setImagePreview({
      uri: mediaItem.file_url || mediaItem.file_path || mediaItem.uri,
      name: mediaItem.file_name || 'Photo',
    });
  };

  const openPDF = async (mediaItem: any) => {
    const uri = mediaItem.file_url || mediaItem.file_path || mediaItem.uri;
    try {
      const supported = await Linking.canOpenURL(uri);
      if (supported) {
        await Linking.openURL(uri);
      } else {
        Alert.alert('Error', 'Cannot open this file');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open PDF');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Job Detail"
        subtitle={job.title}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Metadata */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardLabel}>Status</Text>
            <JobStatusBadge status={job.status} />
          </View>
          <Divider vertical={SPACING.sm} />
          <InfoRow label="Job ID" value={job.id} />
          <InfoRow label="Title" value={job.title} />
          <InfoRow label="Address" value={job.address} />
          <InfoRow label="Created" value={job.created_at} />
          {job.completed_at && <InfoRow label="Completed" value={job.completed_at} />}
        </Card>

        {/* Stakeholders */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Stakeholders</Text>
          <InfoRow label="Manager" value={getUser(job.manager_id)?.name ?? 'N/A'} />
          <InfoRow label="QA Engineer" value={getUser(job.qa_id)?.name ?? 'N/A'} />
          {job.qa_comments ? (
            <>
              <Divider vertical={SPACING.sm} />
              <Text style={styles.qaFeedbackLabel}>QA Feedback</Text>
              <Text style={styles.qaFeedback}>{job.qa_comments}</Text>
            </>
          ) : null}
        </Card>

        {/* Task Pipeline */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Task Pipeline ({sortedTasks.length} tasks)</Text>
          {sortedTasks.map((task, idx) => {
            const installer = getUser(task.installer_id);
            const type = getType(task.installer_type_id);
            const taskMedia = media.filter(m => m.task_id === task.id);
            return (
              <View key={task.id}>
                {idx > 0 && <Divider vertical={SPACING.sm} />}
                <View style={styles.taskHeader}>
                  <View style={styles.seqBadge}>
                    <Text style={styles.seqText}>{task.sequence_number}</Text>
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskInstallerName}>{installer?.name ?? 'Unassigned'}</Text>
                    <Text style={styles.taskType}>{type?.name ?? 'N/A'}</Text>
                  </View>
                  <TaskStatusBadge status={task.status} />
                </View>
                <Text style={styles.taskDesc}>{task.description}</Text>
                {task.manager_comments ? (
                  <Text style={styles.managerComment}>Manager note: {task.manager_comments}</Text>
                ) : null}
                {task.approved_at && (
                  <Text style={styles.approvedAt}>Approved: {task.approved_at}</Text>
                )}
                {taskMedia.length > 0 && (
                  <View style={styles.mediaList}>
                    {taskMedia.map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.mediaBadge,
                          m.file_type === 'certificate' ? styles.mediaCert : styles.mediaImg,
                        ]}
                        onPress={() => (m.file_type === 'image' ? openImage(m) : openPDF(m))}
                        activeOpacity={0.7}>
                        <Text style={styles.mediaIcon}>
                          {m.file_type === 'certificate' ? '📄' : '🖼️'}
                        </Text>
                        <Text style={styles.mediaName} numberOfLines={1}>
                          {m.file_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {sortedTasks.length === 0 && (
            <Text style={styles.empty}>No tasks created yet.</Text>
          )}
        </Card>

        {/* QA Sign-off */}
        {(job.status === 'approved' || job.status === 'rejected') && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>QA Sign-off</Text>
            <InfoRow label="QA Engineer" value={getUser(job.qa_id)?.name ?? 'N/A'} />
            <InfoRow label="Outcome" value={job.status === 'approved' ? '✅ Approved' : '❌ Rejected'} />
            {job.qa_comments && (
              <InfoRow label="Comments" value={job.qa_comments} />
            )}
            {job.completed_at && <InfoRow label="Date" value={job.completed_at} />}
          </Card>
        )}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!imagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImagePreview(null)}>
        <SafeAreaView style={styles.modalBackground}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{imagePreview?.name}</Text>
            <TouchableOpacity onPress={() => setImagePreview(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {imagePreview && (
            <Image
              source={{uri: imagePreview.uri}}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md },
  card: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: '600', flex: 2, textAlign: 'right' },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  seqBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  seqText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  taskInfo: { flex: 1 },
  taskInstallerName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  taskType: { fontSize: 12, color: COLORS.textSecondary },
  taskDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4, lineHeight: 18 },
  managerComment: {
    fontSize: 12,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginTop: 2,
  },
  approvedAt: { fontSize: 12, color: COLORS.success, marginTop: 2 },
  mediaList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  mediaImg: { backgroundColor: COLORS.primaryLight },
  mediaCert: { backgroundColor: '#FEF3C7' },
  mediaIcon: { fontSize: 12 },
  mediaName: { fontSize: 11, fontWeight: '600', maxWidth: 120 },
  empty: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.md },
  qaFeedbackLabel: { fontSize: 13, fontWeight: '700', color: COLORS.danger, marginBottom: 4 },
  qaFeedback: { fontSize: 13, color: COLORS.text, fontStyle: 'italic' },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  modalTitle: {color: 'white', fontSize: 16, fontWeight: '600'},
  closeButton: {color: '#fff', fontSize: 28, fontWeight: 'bold'},
  fullImage: {
    width: width,
    height: '80%',
  },
});
