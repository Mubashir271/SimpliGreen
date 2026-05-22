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
import Card from '../../components/common/Card';
import Divider from '../../components/common/Divider';
import ScreenHeader from '../../components/common/ScreenHeader';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {addMedia, removeMedia, submitTask} from '../../store/slices/tasksSlice';
import {COLORS, RADIUS, SPACING} from '../../theme';
import {InstallerStackParamList, TaskMedia} from '../../types';

type Route = RouteProp<InstallerStackParamList, 'InstallerTaskSubmission'>;
type Nav = NativeStackNavigationProp<InstallerStackParamList>;

export default function InstallerTaskSubmissionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const {taskId} = route.params;

  const task = useAppSelector(s => s.tasks.items.find(t => t.id === taskId));
  const savedMedia = useAppSelector(s => s.tasks.media.filter(m => m.task_id === taskId));
  const installerTypes = useAppSelector(s => s.installerTypes.items);
  const [submitting, setSubmitting] = useState(false);

  if (!task) {return null;}

  const type = installerTypes.find(t => t.id === task.installer_type_id);
  const requiresCert = type?.requires_certificate ?? false;

  const images = savedMedia.filter(m => m.file_type === 'image');
  const certs = savedMedia.filter(m => m.file_type === 'certificate');

  const handleAddPhoto = () => {
    // Simulate photo upload
    const mockMedia: TaskMedia = {
      id: `m${Date.now()}`,
      task_id: taskId,
      file_path: `mock://images/photo_${Date.now()}.jpg`,
      file_name: `photo_${images.length + 1}.jpg`,
      file_type: 'image',
      uploaded_at: new Date().toISOString().split('T')[0],
    };
    dispatch(addMedia(mockMedia));
  };

  const handleAddCertificate = () => {
    const mockMedia: TaskMedia = {
      id: `m${Date.now()}`,
      task_id: taskId,
      file_path: `mock://certs/certificate_${Date.now()}.pdf`,
      file_name: `certificate_${certs.length + 1}.pdf`,
      file_type: 'certificate',
      uploaded_at: new Date().toISOString().split('T')[0],
    };
    dispatch(addMedia(mockMedia));
  };

  const handleRemove = (mediaId: string) => {
    dispatch(removeMedia(mediaId));
  };

  const handleSubmit = () => {
    if (images.length === 0) {
      Alert.alert('Photo required', 'Please upload at least one photo as evidence.');
      return;
    }
    if (requiresCert && certs.length === 0) {
      Alert.alert(
        'Certificate required',
        `Your category (${type?.name}) requires a certificate. Please upload it before submitting.`,
      );
      return;
    }
    Alert.alert('Submit Work', 'Submit your work for manager review?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Submit',
        onPress: () => {
          setSubmitting(true);
          dispatch(submitTask(taskId));
          navigation.navigate('InstallerTabs');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Submit Work"
        subtitle={`Task #${task.sequence_number}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Scope reminder */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Task Scope</Text>
          <Divider vertical={SPACING.sm} />
          <Text style={styles.desc}>{task.description}</Text>
        </Card>

        {/* Photo upload */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.required}>* Required</Text>
          </View>
          <Divider vertical={SPACING.sm} />

          {images.map(m => (
            <View key={m.id} style={styles.fileRow}>
              <Text style={styles.fileIcon}>🖼️</Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{m.file_name}</Text>
                <Text style={styles.fileDate}>{m.uploaded_at}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(m.id)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.uploadBtn} onPress={handleAddPhoto}>
            <Text style={styles.uploadBtnIcon}>📷</Text>
            <Text style={styles.uploadBtnText}>Add Photo</Text>
          </TouchableOpacity>

          <Text style={styles.uploadNote}>
            In production, this opens your camera/gallery. ({images.length} photo{images.length !== 1 ? 's' : ''} added)
          </Text>
        </Card>

        {/* Certificate upload */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certificates</Text>
            {requiresCert ? (
              <Text style={styles.required}>* Required for {type?.name}</Text>
            ) : (
              <Text style={styles.optional}>Optional</Text>
            )}
          </View>
          <Divider vertical={SPACING.sm} />

          {certs.map(m => (
            <View key={m.id} style={styles.fileRow}>
              <Text style={styles.fileIcon}>📄</Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{m.file_name}</Text>
                <Text style={styles.fileDate}>{m.uploaded_at}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(m.id)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.uploadBtn} onPress={handleAddCertificate}>
            <Text style={styles.uploadBtnIcon}>📎</Text>
            <Text style={styles.uploadBtnText}>Add Certificate</Text>
          </TouchableOpacity>

          {requiresCert && (
            <View style={styles.certWarning}>
              <Text style={styles.certWarningText}>
                ⚠️ Your installer category requires a valid certificate for submission
              </Text>
            </View>
          )}
        </Card>

        <Button
          label="Submit to Manager"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md},
  card: {},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text},
  required: {fontSize: 12, color: COLORS.danger, fontWeight: '600'},
  optional: {fontSize: 12, color: COLORS.textMuted},
  desc: {fontSize: 14, color: COLORS.text, lineHeight: 20},
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  fileIcon: {fontSize: 20, marginRight: SPACING.sm},
  fileInfo: {flex: 1},
  fileName: {fontSize: 13, fontWeight: '600', color: COLORS.text},
  fileDate: {fontSize: 11, color: COLORS.textSecondary},
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {color: COLORS.danger, fontWeight: '700', fontSize: 13},
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  uploadBtnIcon: {fontSize: 22},
  uploadBtnText: {fontSize: 14, color: COLORS.primary, fontWeight: '700'},
  uploadNote: {fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs},
  certWarning: {
    backgroundColor: '#FEF9C3',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  certWarningText: {fontSize: 12, color: '#92400E'},
  submitBtn: {marginTop: SPACING.xs},
});
