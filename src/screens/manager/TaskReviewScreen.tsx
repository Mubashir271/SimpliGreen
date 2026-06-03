import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import {approveTaskAsync, rejectTaskAsync} from '../../store/slices/tasksSlice';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {ManagerStackParamList, TaskMedia} from '../../types';

type Route = RouteProp<ManagerStackParamList, 'ManagerTaskReview'>;
type Nav = NativeStackNavigationProp<ManagerStackParamList>;

export default function ManagerTaskReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const {taskId, jobId} = route.params;

  const task = useAppSelector(s => s.tasks.items.find(t => t.id === taskId));
  const media = useAppSelector(s => s.tasks.media.filter(m => m.task_id === taskId));
  const users = useAppSelector(s => s.users.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  const [rejectMode, setRejectMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [newInstallerId, setNewInstallerId] = useState('');
  const [previewMedia, setPreviewMedia] = useState<TaskMedia | null>(null);

  const isPdf = (m: TaskMedia) => m.file_name.toLowerCase().endsWith('.pdf');

  const handlePreview = (m: TaskMedia) => {
    if (isPdf(m)) {
      Linking.openURL(m.file_path).catch(() =>
        Alert.alert('Error', 'Could not open the PDF.'),
      );
    } else {
      setPreviewMedia(m);
    }
  };

  if (!task) {return null;}

  const installer = users.find(u => u.id === task.installer_id);
  const installerType = installerTypes.find(t => t.id === task.installer_type_id);
  const sameTypeInstallers = users.filter(
    u => u.role === 'installer' && u.status === 'active' && u.installer_type_id === task.installer_type_id && u.id !== task.installer_id,
  );

  const images = media.filter(m => m.file_type === 'image');
  const certs = media.filter(m => m.file_type === 'certificate');

  const handleApprove = () => {
    Alert.alert('Approve Task', 'Approve this task and unlock the next one?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Approve',
        onPress: async () => {
          const result = await dispatch(approveTaskAsync({taskId}));
          if (approveTaskAsync.fulfilled.match(result)) {
            navigation.goBack();
          } else {
            Alert.alert('Error', result.error.message ?? 'Failed to approve task.');
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      Alert.alert('Feedback required', 'Please provide rejection feedback for the installer.');
      return;
    }
    const result = await dispatch(
      rejectTaskAsync({
        taskId,
        comments: feedback.trim(),
        newInstallerId: newInstallerId || undefined,
      }),
    );
    if (rejectTaskAsync.fulfilled.match(result)) {
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error.message ?? 'Failed to reject task.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Review Task" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Task info */}
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Task #{task.sequence_number}</Text>
            <TaskStatusBadge status={task.status} />
          </View>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.descLabel}>Scope of Work</Text>
          <Text style={styles.desc}>{task.description}</Text>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.meta}>Installer: {installer?.name ?? 'N/A'}</Text>
          <Text style={styles.meta}>Category: {installerType?.name ?? 'N/A'}</Text>
          {task.submitted_at && (
            <Text style={styles.meta}>Submitted: {task.submitted_at}</Text>
          )}
        </Card>

        {/* Media */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Submitted Evidence</Text>
          <Divider vertical={SPACING.sm} />

          <Text style={styles.mediaLabel}>Photos ({images.length})</Text>
          {images.length === 0 ? (
            <Text style={styles.noMedia}>No photos uploaded</Text>
          ) : (
            images.map(m => (
              <TouchableOpacity key={m.id} style={styles.mediaRow} onPress={() => handlePreview(m)} activeOpacity={0.7}>
                <Image source={{uri: m.file_path}} style={styles.thumb} resizeMode="cover" />
                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaName}>{m.file_name}</Text>
                  <Text style={styles.mediaDate}>{m.uploaded_at}</Text>
                  <Text style={styles.tapHint}>Tap to preview</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {installerType?.requires_certificate && (
            <>
              <Divider vertical={SPACING.sm} />
              <Text style={styles.mediaLabel}>Certificates ({certs.length})</Text>
              {certs.length === 0 ? (
                <View style={styles.missingCert}>
                  <Text style={styles.missingCertText}>⚠️ No certificate uploaded — required for this category</Text>
                </View>
              ) : (
                certs.map(m => (
                  <TouchableOpacity key={m.id} style={styles.mediaRow} onPress={() => handlePreview(m)} activeOpacity={0.7}>
                    {isPdf(m) ? (
                      <View style={styles.pdfThumb}>
                        <Text style={styles.pdfThumbText}>PDF</Text>
                      </View>
                    ) : (
                      <Image source={{uri: m.file_path}} style={styles.thumb} resizeMode="cover" />
                    )}
                    <View style={styles.mediaInfo}>
                      <Text style={styles.mediaName}>{m.file_name}</Text>
                      <Text style={styles.mediaDate}>{m.uploaded_at}</Text>
                      <Text style={styles.tapHint}>{isPdf(m) ? 'Tap to open' : 'Tap to preview'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Full-screen image preview modal */}
          <Modal
            visible={previewMedia !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setPreviewMedia(null)}>
            <View style={styles.modalOverlay}>
              <StatusBar backgroundColor="#000" barStyle="light-content" />
              <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewMedia(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              {previewMedia && (
                <Image
                  source={{uri: previewMedia.file_path}}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Modal>
        </Card>

        {/* Actions */}
        {!rejectMode ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Decision</Text>
            <Divider vertical={SPACING.sm} />
            <View style={styles.actionRow}>
              <Button
                label="✓ Approve"
                variant="success"
                onPress={handleApprove}
                style={styles.actionBtn}
              />
              <Button
                label="✕ Reject"
                variant="danger"
                onPress={() => setRejectMode(true)}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Reject & Provide Feedback</Text>
            <Divider vertical={SPACING.sm} />
            <FormInput
              label="Rejection Feedback (required)"
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Explain what needs to be corrected..."
              multiline
              numberOfLines={4}
              style={styles.feedbackInput}
            />

            <Text style={styles.reassignLabel}>Reassign to Different Installer? (optional)</Text>
            <Text style={styles.currentInstallerNote}>
              Current: {installer?.name} — leave blank to reassign back to them.
            </Text>
            <View style={styles.selectorList}>
              {sameTypeInstallers.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.selectorItem, newInstallerId === u.id && styles.selectorSelected]}
                  onPress={() => setNewInstallerId(prev => prev === u.id ? '' : u.id)}>
                  <Text style={[styles.selectorText, newInstallerId === u.id && styles.selectorTextSelected]}>
                    {u.name}
                  </Text>
                  {newInstallerId === u.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
              {sameTypeInstallers.length === 0 && (
                <Text style={styles.noOtherInstallers}>No other installers in this category.</Text>
              )}
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
          </Card>
        )}
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
  descLabel: {fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4},
  desc: {fontSize: 14, color: COLORS.text, lineHeight: 20},
  meta: {fontSize: 13, color: COLORS.textSecondary, marginTop: 2},
  mediaLabel: {fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm},
  noMedia: {fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic'},
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.border,
  },
  pdfThumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfThumbText: {fontSize: 12, fontWeight: '800', color: '#DC2626'},
  mediaInfo: {flex: 1},
  mediaName: {fontSize: 13, fontWeight: '600', color: COLORS.text},
  mediaDate: {fontSize: 11, color: COLORS.textSecondary},
  tapHint: {fontSize: 11, color: COLORS.primary, marginTop: 2},
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {color: '#fff', fontSize: 18, fontWeight: '700'},
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.85,
  },
  missingCert: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  missingCertText: {fontSize: 12, color: COLORS.danger, fontWeight: '600'},
  actionRow: {flexDirection: 'row', gap: SPACING.sm},
  actionBtn: {flex: 1},
  feedbackInput: {height: 100, textAlignVertical: 'top'},
  reassignLabel: {fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4},
  currentInstallerNote: {fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm},
  selectorList: {gap: SPACING.xs, marginBottom: SPACING.md},
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  selectorSelected: {borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight},
  selectorText: {fontSize: 14, color: COLORS.text},
  selectorTextSelected: {color: COLORS.primary, fontWeight: '600'},
  check: {color: COLORS.primary, fontWeight: '700', fontSize: 16},
  noOtherInstallers: {fontSize: 13, color: COLORS.textMuted, textAlign: 'center', padding: SPACING.sm},
});
