import {
  Job,
  JobStatus,
  MediaType,
  Task,
  TaskMedia,
  TaskStatus,
  InstallerType,
  User,
  UserRole,
} from '../types';
import {api} from './client';

// ── Backend response types ────────────────────────────────────────────────────

interface ApiInstallerType {
  id: string;
  name: string;
  requiresCertificate: boolean;
  createdAt: string;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  installerTypeId?: string | null;
  installerType?: ApiInstallerType | null;
  createdAt: string;
  avatar?: string | null;
}

interface ApiMedia {
  id: string;
  taskId: string;
  filePath: string;
  fileType: string;
  uploadedAt: string;
}

interface ApiTask {
  id: string;
  jobId: string;
  sequenceNumber: number;
  installerId: string;
  description: string;
  status: string;
  managerComments?: string | null;
  createdAt: string;
  updatedAt: string;
  installer?: {id: string; name: string; installerType?: ApiInstallerType | null} | null;
  media?: ApiMedia[];
  job?: {id: string; title: string; status: string};
}

interface ApiJob {
  id: string;
  title: string;
  address?: string | null;
  description?: string | null;
  adminId: string;
  managerId: string;
  qaId: string;
  status: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  manager?: {id: string; name: string};
  qa?: {id: string; name: string};
  admin?: {id: string; name: string};
  qaReviews?: Array<{decision: string; comments?: string | null; createdAt: string}>;
  tasks?: ApiTask[];
}

// ── Transforms: backend → frontend types ─────────────────────────────────────

export function transformUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    installer_type_id: u.installerTypeId ?? undefined,
    status: u.isActive ? 'active' : 'suspended',
    created_at: u.createdAt,
    avatar: u.avatar ?? undefined,
  };
}

export function transformInstallerType(t: ApiInstallerType): InstallerType {
  return {
    id: t.id,
    name: t.name,
    requires_certificate: t.requiresCertificate,
  };
}

export function transformJob(j: ApiJob): Job {
  const latestReject = j.qaReviews?.find(r => r.decision === 'rejected');
  return {
    id: j.id,
    title: j.title,
    address: j.address ?? '',
    admin_id: j.adminId,
    manager_id: j.managerId,
    qa_id: j.qaId,
    status: j.status as JobStatus,
    created_at: j.createdAt,
    completed_at: j.completedAt ?? undefined,
    qa_comments: latestReject?.comments ?? undefined,
  };
}

// Backend: locked→pending(hidden), pending→active(unlocked), rest map 1-to-1
const TASK_STATUS: Record<string, TaskStatus> = {
  locked: 'pending',
  pending: 'active',
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
};

export function transformTask(t: ApiTask): Task {
  return {
    id: t.id,
    job_id: t.jobId,
    sequence_number: t.sequenceNumber,
    installer_id: t.installerId,
    installer_type_id: t.installer?.installerType?.id ?? '',
    description: t.description,
    status: TASK_STATUS[t.status] ?? ('pending' as TaskStatus),
    manager_comments: t.managerComments ?? undefined,
    submitted_at:
      t.status === 'submitted' || t.status === 'approved' ? t.updatedAt : undefined,
    approved_at: t.status === 'approved' ? t.updatedAt : undefined,
  };
}

export function transformMedia(m: ApiMedia): TaskMedia {
  return {
    id: m.id,
    task_id: m.taskId,
    file_path: m.filePath,
    file_name: m.filePath.split('/').pop() ?? m.filePath,
    file_type: m.fileType as MediaType,
    uploaded_at: m.uploadedAt,
  };
}

// ── Helper: extract tasks + media from a job response ────────────────────────

export interface JobDetail {
  job: Job;
  tasks: Task[];
  media: TaskMedia[];
}

function extractJobDetail(j: ApiJob): JobDetail {
  const tasks = j.tasks?.map(transformTask) ?? [];
  const media = j.tasks?.flatMap(t => t.media?.map(transformMedia) ?? []) ?? [];
  return {job: transformJob(j), tasks, media};
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const data = await api.post<{token: string; user: ApiUser}>('/auth/login', {
      email,
      password,
    });
    return {token: data.token, user: transformUser(data.user)};
  },
  getMe: async () => transformUser(await api.get<ApiUser>('/auth/me')),
  updateProfile: async (name?: string, avatarUri?: string, mimeType?: string, fileName?: string) => {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (avatarUri && mimeType && fileName) {
      formData.append('avatar', {uri: avatarUri, type: mimeType, name: fileName} as any);
    }
    return transformUser(await api.upload<ApiUser>('/auth/profile', formData));  // POST multipart
  },
  forgotPassword: async (email: string): Promise<{message: string}> =>
    api.post<{message: string}>('/auth/forgot-password', {email}),
  resetPassword: async (token: string, password: string): Promise<{message: string}> =>
    api.post<{message: string}>('/auth/reset-password', {token, password}),
};

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  // Users
  getUsers: async () =>
    (await api.get<ApiUser[]>('/admin/users')).map(transformUser),

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    installerTypeId?: string;
  }) => transformUser(await api.post<ApiUser>('/admin/users', data)),

  updateUser: async (
    id: string,
    data: {name?: string; email?: string; isActive?: boolean; installerTypeId?: string | null},
  ) => transformUser(await api.put<ApiUser>(`/admin/users/${id}`, data)),

  deleteUser: async (id: string) => api.delete<void>(`/admin/users/${id}`),

  // Installer Types
  getInstallerTypes: async () =>
    (await api.get<ApiInstallerType[]>('/admin/installer-types')).map(
      transformInstallerType,
    ),

  createInstallerType: async (name: string, requiresCertificate: boolean) =>
    transformInstallerType(
      await api.post<ApiInstallerType>('/admin/installer-types', {
        name,
        requiresCertificate,
      }),
    ),

  updateInstallerType: async (
    id: string,
    data: {name?: string; requiresCertificate?: boolean},
  ) =>
    transformInstallerType(
      await api.put<ApiInstallerType>(`/admin/installer-types/${id}`, data),
    ),

  deleteInstallerType: async (id: string) =>
    api.delete<void>(`/admin/installer-types/${id}`),

  // Jobs
  getJobs: async () =>
    (await api.get<ApiJob[]>('/admin/jobs')).map(transformJob),

  createJob: async (data: {
    title: string;
    address: string;
    managerId: string;
    qaId: string;
  }) => transformJob(await api.post<ApiJob>('/admin/jobs', data)),

  getJob: async (id: string): Promise<JobDetail> =>
    extractJobDetail(await api.get<ApiJob>(`/admin/jobs/${id}`)),
};

// ── Manager API ───────────────────────────────────────────────────────────────

export const managerApi = {
  getJobs: async () =>
    (await api.get<ApiJob[]>('/manager/jobs')).map(transformJob),

  getJob: async (id: string): Promise<JobDetail> =>
    extractJobDetail(await api.get<ApiJob>(`/manager/jobs/${id}`)),

  createTask: async (
    jobId: string,
    data: {description: string; installerId: string; sequenceNumber: number},
  ) => transformTask(await api.post<ApiTask>(`/manager/jobs/${jobId}/tasks`, data)),

  approveTask: async (taskId: string, comments?: string) =>
    api.post<{message: string; nextTaskUnlocked: boolean}>(
      `/manager/tasks/${taskId}/approve`,
      {comments},
    ),

  rejectTask: async (taskId: string, comments: string, newInstallerId?: string) =>
    api.post<{message: string}>(`/manager/tasks/${taskId}/reject`, {
      comments,
      newInstallerId,
    }),

  submitJobToQA: async (jobId: string) =>
    api.post<{message: string}>(`/manager/jobs/${jobId}/submit-to-qa`),
};

// ── Installer API ─────────────────────────────────────────────────────────────

export const installerApi = {
  getTasks: async () =>
    (await api.get<ApiTask[]>('/installer/tasks')).map(transformTask),

  getTask: async (taskId: string) => {
    const t = await api.get<ApiTask>(`/installer/tasks/${taskId}`);
    return {task: transformTask(t), media: t.media?.map(transformMedia) ?? []};
  },

  uploadMedia: async (
    taskId: string,
    fileType: 'image' | 'certificate',
    fileUri: string,
    mimeType: string,
    fileName: string,
  ) => {
    const formData = new FormData();
    formData.append('file', {uri: fileUri, type: mimeType, name: fileName} as any);
    formData.append('fileType', fileType);
    return transformMedia(
      await api.upload<ApiMedia>(`/installer/tasks/${taskId}/media`, formData),
    );
  },

  deleteMedia: async (taskId: string, mediaId: string) =>
    api.delete<void>(`/installer/tasks/${taskId}/media/${mediaId}`),

  submitTask: async (taskId: string) =>
    api.post<{message: string}>(`/installer/tasks/${taskId}/submit`),
};

// ── QA API ────────────────────────────────────────────────────────────────────

export const qaApi = {
  getJobs: async () => (await api.get<ApiJob[]>('/qa/jobs')).map(transformJob),

  getJob: async (jobId: string): Promise<JobDetail> =>
    extractJobDetail(await api.get<ApiJob>(`/qa/jobs/${jobId}`)),

  approveJob: async (jobId: string, comments?: string) =>
    api.post<{message: string}>(`/qa/jobs/${jobId}/approve`, {comments}),

  rejectJob: async (jobId: string, comments: string) =>
    api.post<{message: string}>(`/qa/jobs/${jobId}/reject`, {comments}),
};
