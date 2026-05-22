import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useState} from 'react';
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
import {useAppSelector} from '../../store/hooks';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';
import {AdminStackParamList, JobStatus} from '../../types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const FILTERS: Array<{key: JobStatus | 'all'; label: string}> = [
  {key: 'all', label: 'All'},
  {key: 'in_progress', label: 'In Progress'},
  {key: 'submitted_to_qa', label: 'Pending QA'},
  {key: 'approved', label: 'Approved'},
];

export default function AdminJobsScreen() {
  const navigation = useNavigation<Nav>();
  const jobs = useAppSelector(s => s.jobs.items);
  const users = useAppSelector(s => s.users.items);
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const getUser = (id: string) => users.find(u => u.id === id);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>All Jobs</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('AdminCreateJob')}>
          <Text style={styles.createBtnText}>+ New Job</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={j => j.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No jobs found" icon="🏗️" />}
        renderItem={({item}) => {
          const manager = getUser(item.manager_id);
          const qa = getUser(item.qa_id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AdminJobDetail', {jobId: item.id})}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <JobStatusBadge status={item.status} />
                </View>
                <Text style={styles.address}>📍 {item.address}</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>Manager: {manager?.name ?? 'N/A'}</Text>
                <Text style={styles.meta}>QA: {qa?.name ?? 'N/A'}</Text>
                <Text style={styles.meta}>Created: {item.created_at}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {fontSize: 20, fontWeight: '800', color: COLORS.text},
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  createBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  filters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  filterActive: {backgroundColor: COLORS.primary},
  filterText: {fontSize: 12, fontWeight: '600', color: COLORS.textSecondary},
  filterTextActive: {color: '#fff'},
  list: {padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl},
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  cardTop: {marginBottom: SPACING.sm},
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  address: {fontSize: 12, color: COLORS.textSecondary},
  cardBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  meta: {fontSize: 12, color: COLORS.textSecondary},
});
