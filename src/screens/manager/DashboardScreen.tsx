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
import {ManagerStackParamList} from '../../types';

type Nav = NativeStackNavigationProp<ManagerStackParamList>;

export default function ManagerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const currentUser = useAppSelector(s => s.auth.currentUser);
  const allJobs = useAppSelector(s => s.jobs.items);
  const allTasks = useAppSelector(s => s.tasks.items);
  const users = useAppSelector(s => s.users.items);

  const myJobs = allJobs.filter(j => j.manager_id === currentUser?.id);

  const getProgress = (jobId: string) => {
    const tasks = allTasks.filter(t => t.job_id === jobId);
    if (tasks.length === 0) {return null;}
    const approved = tasks.filter(t => t.status === 'approved').length;
    return {approved, total: tasks.length};
  };

  const getQA = (qaId: string) => users.find(u => u.id === qaId);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="My Jobs" />

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statNum}>{myJobs.filter(j => j.status === 'in_progress').length}</Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statNum}>{myJobs.filter(j => j.status === 'submitted_to_qa').length}</Text>
          <Text style={styles.statLbl}>Pending QA</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statNum}>{myJobs.filter(j => j.status === 'approved').length}</Text>
          <Text style={styles.statLbl}>Approved</Text>
        </View>
      </View>

      <FlatList
        data={myJobs}
        keyExtractor={j => j.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title="No jobs assigned" message="Your assigned jobs will appear here." icon="🏗️" />
        }
        renderItem={({item}) => {
          const progress = getProgress(item.id);
          const qa = getQA(item.qa_id);
          const canSubmitToQA =
            item.status === 'in_progress' &&
            progress !== null &&
            progress.approved === progress.total &&
            progress.total > 0;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ManagerJobDetail', {jobId: item.id})}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <JobStatusBadge status={item.status} />
              </View>
              <Text style={styles.address}>📍 {item.address}</Text>
              <Text style={styles.qaMeta}>QA: {qa?.name ?? 'N/A'}</Text>

              {progress && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {width: `${(progress.approved / progress.total) * 100}%`},
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {progress.approved}/{progress.total} tasks done
                  </Text>
                </View>
              )}

              {canSubmitToQA && (
                <View style={styles.readyBanner}>
                  <Text style={styles.readyText}>✅ Ready to submit to QA</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  statNum: {fontSize: 22, fontWeight: '800', color: COLORS.primary},
  statLbl: {fontSize: 11, color: COLORS.primary, fontWeight: '600'},
  list: {padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl},
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm},
  address: {fontSize: 12, color: COLORS.textSecondary, marginBottom: 2},
  qaMeta: {fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm},
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', backgroundColor: COLORS.success, borderRadius: RADIUS.full},
  progressText: {fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', minWidth: 70},
  readyBanner: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  readyText: {fontSize: 12, color: COLORS.success, fontWeight: '700', textAlign: 'center'},
});
