import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppSelector} from '../../store/hooks';
import {COLORS, SPACING, RADIUS, SHADOW} from '../../theme';
import {JobStatusBadge} from '../../components/common/Badge';
import AppHeader from '../../components/common/AppHeader';

export default function AdminDashboardScreen() {
  const jobs = useAppSelector(s => s.jobs.items);
  const users = useAppSelector(s => s.users.items);

  const stats = {
    total: jobs.length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    pendingQA: jobs.filter(j => j.status === 'submitted_to_qa').length,
    approved: jobs.filter(j => j.status === 'approved').length,
  };

  const recentJobs = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Dashboard" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Jobs" value={stats.total} color={COLORS.primary} icon="🏗️" />
          <StatCard label="In Progress" value={stats.inProgress} color={COLORS.primary} icon="⚙️" />
          <StatCard label="Pending QA" value={stats.pendingQA} color={COLORS.warning} icon="🔍" />
          <StatCard label="Approved" value={stats.approved} color={COLORS.success} icon="✅" />
        </View>

        <View style={styles.userStats}>
          <Text style={styles.sectionTitle}>Team Summary</Text>
          <View style={styles.teamRow}>
            {['manager', 'installer', 'qa'].map(role => (
              <View key={role} style={styles.teamCard}>
                <Text style={styles.teamCount}>
                  {users.filter(u => u.role === role && u.status === 'active').length}
                </Text>
                <Text style={styles.teamLabel}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}s
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        {recentJobs.map(job => (
          <View key={job.id} style={styles.jobRow}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobDate}>{job.created_at}</Text>
            </View>
            <JobStatusBadge status={job.status} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({label, value, color, icon}: {label: string; value: number; color: string; icon: string}) {
  return (
    <View style={[styles.statCard, {borderLeftColor: color}]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  scroll: {padding: SPACING.md, paddingBottom: SPACING.xl},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    ...SHADOW.small,
  },
  statIcon: {fontSize: 24, marginBottom: SPACING.xs},
  statValue: {fontSize: 28, fontWeight: '800'},
  statLabel: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  userStats: {marginBottom: SPACING.md},
  teamRow: {flexDirection: 'row', gap: SPACING.sm},
  teamCard: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  teamCount: {fontSize: 24, fontWeight: '800', color: COLORS.primary},
  teamLabel: {fontSize: 12, color: COLORS.primary, fontWeight: '600'},
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  jobInfo: {flex: 1, marginRight: SPACING.sm},
  jobTitle: {fontSize: 14, fontWeight: '600', color: COLORS.text},
  jobDate: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
});
