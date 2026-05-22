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
import {JobStatusBadge} from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import AppHeader from '../../components/common/AppHeader';
import {useAppSelector} from '../../store/hooks';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';
import {QAStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<QAStackParamList>;

export default function QADashboardScreen() {
  const navigation = useNavigation<Nav>();
  const currentUser = useAppSelector(s => s.auth.currentUser);
  const allJobs = useAppSelector(s => s.jobs.items);
  const allTasks = useAppSelector(s => s.tasks.items);
  const users = useAppSelector(s => s.users.items);

  const myJobs = allJobs.filter(j => j.qa_id === currentUser?.id);

  const monitoring = myJobs.filter(j => j.status === 'in_progress');
  const pendingReview = myJobs.filter(j => j.status === 'submitted_to_qa');
  const completed = myJobs.filter(j => j.status === 'approved' || j.status === 'rejected');

  const getManager = (id: string) => users.find(u => u.id === id);
  const getProgress = (jobId: string) => {
    const tasks = allTasks.filter(t => t.job_id === jobId);
    if (tasks.length === 0) {return '—';}
    const done = tasks.filter(t => t.status === 'approved').length;
    return `${done}/${tasks.length} tasks`;
  };

  const renderJob = (item: (typeof myJobs)[0], mode: 'monitor' | 'review' | 'done') => {
    const manager = getManager(item.manager_id);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, mode === 'review' && styles.cardHighlight]}
        onPress={() =>
          navigation.navigate(
            mode === 'review' ? 'QAFinalReview' : 'QAJobMonitor',
            {jobId: item.id},
          )
        }>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <JobStatusBadge status={item.status} />
        </View>
        <Text style={styles.address}>📍 {item.address}</Text>
        <Text style={styles.meta}>Manager: {manager?.name ?? 'N/A'}</Text>
        <Text style={styles.meta}>Progress: {getProgress(item.id)}</Text>
        {mode === 'review' && (
          <View style={styles.reviewBanner}>
            <Text style={styles.reviewBannerText}>Awaiting your review →</Text>
          </View>
        )}
        {mode === 'monitor' && (
          <Text style={styles.monitorHint}>Tap to monitor progress</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="QA Review" />

      {myJobs.length === 0 ? (
        <EmptyState title="No jobs assigned" message="Jobs assigned to you for QA will appear here." icon="🔍" />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          ListHeaderComponent={
            <>
              {pendingReview.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Pending Your Review ({pendingReview.length})</Text>
                  {pendingReview.map(j => renderJob(j, 'review'))}
                </>
              )}
              {monitoring.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Monitoring In Progress ({monitoring.length})</Text>
                  {monitoring.map(j => renderJob(j, 'monitor'))}
                </>
              )}
              {completed.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Completed ({completed.length})</Text>
                  {completed.map(j => renderJob(j, 'done'))}
                </>
              )}
            </>
          }
          contentContainerStyle={styles.list}
          renderItem={() => null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  list: {padding: SPACING.md, paddingBottom: SPACING.xl},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOW.small,
  },
  cardHighlight: {borderColor: COLORS.warning, borderLeftWidth: 4},
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm},
  address: {fontSize: 12, color: COLORS.textSecondary, marginBottom: 2},
  meta: {fontSize: 12, color: COLORS.textSecondary, marginTop: 1},
  reviewBanner: {
    backgroundColor: '#FEF9C3',
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginTop: SPACING.sm,
  },
  reviewBannerText: {fontSize: 12, color: '#92400E', fontWeight: '700', textAlign: 'center'},
  monitorHint: {fontSize: 12, color: COLORS.primary, marginTop: SPACING.sm, fontWeight: '600'},
});
