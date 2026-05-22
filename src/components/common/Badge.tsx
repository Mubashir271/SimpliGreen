import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS, RADIUS} from '../../theme';
import {JobStatus, TaskStatus} from '../../types';

const JOB_STATUS_CONFIG: Record<
  JobStatus,
  {label: string; bg: string; color: string}
> = {
  pending: {label: 'Pending', bg: COLORS.border, color: COLORS.textSecondary},
  in_progress: {label: 'In Progress', bg: '#DBEAFE', color: COLORS.primary},
  submitted_to_qa: {label: 'Submitted to QA', bg: '#FEF9C3', color: '#A16207'},
  approved: {label: 'Approved', bg: COLORS.successLight, color: COLORS.success},
  rejected: {label: 'Rejected', bg: COLORS.dangerLight, color: COLORS.danger},
};

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  {label: string; bg: string; color: string}
> = {
  pending: {label: 'Pending', bg: COLORS.border, color: COLORS.textSecondary},
  active: {label: 'Active', bg: '#DBEAFE', color: COLORS.primary},
  submitted: {label: 'Submitted', bg: '#FEF9C3', color: '#A16207'},
  approved: {label: 'Approved', bg: COLORS.successLight, color: COLORS.success},
  rejected: {label: 'Rejected', bg: COLORS.dangerLight, color: COLORS.danger},
};

interface JobBadgeProps {
  status: JobStatus;
}

interface TaskBadgeProps {
  status: TaskStatus;
}

export function JobStatusBadge({status}: JobBadgeProps) {
  const cfg = JOB_STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, {backgroundColor: cfg.bg}]}>
      <Text style={[styles.label, {color: cfg.color}]}>{cfg.label}</Text>
    </View>
  );
}

export function TaskStatusBadge({status}: TaskBadgeProps) {
  const cfg = TASK_STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, {backgroundColor: cfg.bg}]}>
      <Text style={[styles.label, {color: cfg.color}]}>{cfg.label}</Text>
    </View>
  );
}

interface RoleBadgeProps {
  role: string;
}

const ROLE_COLORS: Record<string, {bg: string; color: string}> = {
  admin: {bg: '#EDE9FE', color: '#7C3AED'},
  manager: {bg: '#DBEAFE', color: '#1D4ED8'},
  installer: {bg: '#DCFCE7', color: '#15803D'},
  qa: {bg: '#FEF9C3', color: '#A16207'},
};

export function RoleBadge({role}: RoleBadgeProps) {
  const cfg = ROLE_COLORS[role] ?? {bg: COLORS.border, color: COLORS.textSecondary};
  return (
    <View style={[styles.badge, {backgroundColor: cfg.bg}]}>
      <Text style={[styles.label, {color: cfg.color}]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
