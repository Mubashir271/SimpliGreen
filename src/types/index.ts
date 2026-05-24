export type UserRole = 'admin' | 'manager' | 'installer' | 'qa';
export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted_to_qa'
  | 'approved'
  | 'rejected';
export type TaskStatus =
  | 'pending'
  | 'active'
  | 'submitted'
  | 'approved'
  | 'rejected';
export type MediaType = 'image' | 'certificate';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  installer_type_id?: string;
  status: UserStatus;
  created_at: string;
  avatar?: string;
}

export interface InstallerType {
  id: string;
  name: string;
  requires_certificate: boolean;
}

export interface Job {
  id: string;
  title: string;
  address: string;
  admin_id: string;
  manager_id: string;
  qa_id: string;
  status: JobStatus;
  created_at: string;
  completed_at?: string;
  qa_comments?: string;
}

export interface Task {
  id: string;
  job_id: string;
  sequence_number: number;
  installer_id: string;
  installer_type_id: string;
  description: string;
  status: TaskStatus;
  manager_comments?: string;
  submitted_at?: string;
  approved_at?: string;
}

export interface TaskMedia {
  id: string;
  task_id: string;
  file_path: string;
  file_name: string;
  file_type: MediaType;
  uploaded_at: string;
}

// Navigation param lists
export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: {token: string};
  AdminMain: undefined;
  ManagerMain: undefined;
  InstallerMain: undefined;
  QAMain: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  AdminJobDetail: {jobId: string};
  AdminCreateJob: undefined;
  AdminCreateUser: {editUserId?: string};
};

export type ManagerStackParamList = {
  ManagerTabs: undefined;
  ManagerJobDetail: {jobId: string};
  ManagerCreateTask: {jobId: string; editTaskId?: string};
  ManagerTaskReview: {taskId: string; jobId: string};
};

export type InstallerStackParamList = {
  InstallerTabs: undefined;
  InstallerTaskDetail: {taskId: string};
  InstallerTaskSubmission: {taskId: string};
};

export type QAStackParamList = {
  QATabs: undefined;
  QAJobMonitor: {jobId: string};
  QAFinalReview: {jobId: string};
};
