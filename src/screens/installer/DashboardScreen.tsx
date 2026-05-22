import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TaskStatusBadge} from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import AppHeader from '../../components/common/AppHeader';
import {useAppSelector} from '../../store/hooks';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';
import {InstallerStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<InstallerStackParamList>;

const STATUS_ICONS: Record<string, string> = {
  active: '🔵',
  submitted: '🟡',
  approved: '✅',
  rejected: '🔴',
  pending: '⚪',
};

export default function InstallerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const currentUser = useAppSelector(s => s.auth.currentUser);
  const allTasks = useAppSelector(s => s.tasks.items);
  const jobs = useAppSelector(s => s.jobs.items);
  const installerTypes = useAppSelector(s => s.installerTypes.items);

  // Only show tasks assigned to this installer that are not pending (visible to them)
  const myTasks = allTasks.filter(
    t => t.installer_id === currentUser?.id && t.status !== 'pending',
  );

  const getJob = (jobId: string) => jobs.find(j => j.id === jobId);
  const getType = (id: string) => installerTypes.find(t => t.id === id);

  const actionRequired = myTasks.filter(t => t.status === 'active' || t.status === 'rejected');
  const otherTasks = myTasks.filter(t => t.status !== 'active' && t.status !== 'rejected');

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="My Tasks" />

      {myTasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          message="Tasks assigned to you will appear here when they are unlocked in the pipeline."
          icon="📋"
        />
      ) : (
        <FlatList
          data={[...actionRequired, ...otherTasks]}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          renderItem={({item}) => {
            const job = getJob(item.job_id);
            const type = getType(item.installer_type_id);
            const needsAction = item.status === 'active' || item.status === 'rejected';

            return (
              <TouchableOpacity
                style={[styles.card, needsAction && styles.cardActive]}
                onPress={() => navigation.navigate('InstallerTaskDetail', {taskId: item.id})}>
                <View style={styles.cardTop}>
                  <View style={styles.seqBadge}>
                    <Text style={styles.seqText}>#{item.sequence_number}</Text>
                  </View>
                  <View style={styles.taskMeta}>
                    <Text style={styles.jobTitle} numberOfLines={1}>
                      {job?.title ?? 'Unknown Job'}
                    </Text>
                    <Text style={styles.typeLabel}>{type?.name ?? ''}</Text>
                  </View>
                  <TaskStatusBadge status={item.status} />
                </View>

                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

                {item.status === 'rejected' && item.manager_comments ? (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Manager Feedback:</Text>
                    <Text style={styles.feedbackText}>{item.manager_comments}</Text>
                  </View>
                ) : null}

                {needsAction && (
                  <View style={styles.actionHint}>
                    <Text style={styles.actionHintText}>
                      {item.status === 'active' ? 'Tap to submit your work →' : 'Rejected — tap to resubmit →'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl},
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  cardActive: {borderColor: COLORS.primary, borderLeftWidth: 4},
  cardTop: {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm},
  seqBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  seqText: {fontSize: 12, fontWeight: '800', color: COLORS.primary},
  taskMeta: {flex: 1},
  jobTitle: {fontSize: 13, fontWeight: '700', color: COLORS.text},
  typeLabel: {fontSize: 11, color: COLORS.textSecondary},
  desc: {fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.xs},
  feedbackBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  feedbackLabel: {fontSize: 11, fontWeight: '700', color: COLORS.danger, marginBottom: 2},
  feedbackText: {fontSize: 12, color: COLORS.text},
  actionHint: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginTop: SPACING.sm,
  },
  actionHintText: {fontSize: 12, color: COLORS.primary, fontWeight: '600', textAlign: 'center'},
});
