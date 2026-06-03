import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {installerApi, managerApi} from '../../api';
import {Task, TaskMedia, TaskStatus} from '../../types';

interface TasksState {
  items: Task[];
  media: TaskMedia[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  items: [],
  media: [],
  loading: false,
  error: null,
};

export const fetchInstallerTasks = createAsyncThunk(
  'tasks/fetchInstaller',
  async () => installerApi.getTasks(),
);

export const createTaskAsync = createAsyncThunk(
  'tasks/create',
  async ({
    jobId,
    data,
  }: {
    jobId: string;
    data: {description: string; installerId: string; sequenceNumber: number};
  }) => managerApi.createTask(jobId, data),
);

export const approveTaskAsync = createAsyncThunk(
  'tasks/approve',
  async ({taskId, comments}: {taskId: string; comments?: string}) => {
    await managerApi.approveTask(taskId, comments);
    return taskId;
  },
);

export const rejectTaskAsync = createAsyncThunk(
  'tasks/reject',
  async ({
    taskId,
    comments,
    newInstallerId,
  }: {
    taskId: string;
    comments: string;
    newInstallerId?: string;
  }) => {
    await managerApi.rejectTask(taskId, comments, newInstallerId);
    return {taskId, comments, newInstallerId};
  },
);

export const submitTaskAsync = createAsyncThunk(
  'tasks/submit',
  async (taskId: string) => {
    await installerApi.submitTask(taskId);
    return taskId;
  },
);

export const reorderTasksAsync = createAsyncThunk(
  'tasks/reorder',
  async ({jobId, order}: {jobId: string; order: {id: string; sequenceNumber: number}[]}) => {
    await managerApi.reorderTasks(jobId, order);
    return {jobId, order};
  },
);

export const deleteMediaAsync = createAsyncThunk(
  'tasks/deleteMedia',
  async ({taskId, mediaId}: {taskId: string; mediaId: string}) => {
    await installerApi.deleteMedia(taskId, mediaId);
    return mediaId;
  },
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask(state, action: PayloadAction<Task>) {
      state.items.push(action.payload);
    },
    updateTask(state, action: PayloadAction<Task>) {
      const idx = state.items.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter(t => t.id !== action.payload);
      state.media = state.media.filter(m => m.task_id !== action.payload);
    },
    submitTask(state, action: PayloadAction<string>) {
      const task = state.items.find(t => t.id === action.payload);
      if (task) {
        task.status = 'submitted';
        task.submitted_at = new Date().toISOString().split('T')[0];
      }
    },
    approveTask(state, action: PayloadAction<string>) {
      const task = state.items.find(t => t.id === action.payload);
      if (task) {
        task.status = 'approved';
        task.approved_at = new Date().toISOString().split('T')[0];
        const nextTask = state.items.find(
          t =>
            t.job_id === task.job_id &&
            t.sequence_number === task.sequence_number + 1,
        );
        if (nextTask && nextTask.status === 'pending') {
          nextTask.status = 'active';
        }
      }
    },
    rejectTask(
      state,
      action: PayloadAction<{taskId: string; comments: string; newInstallerId?: string}>,
    ) {
      const task = state.items.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = 'active';
        task.manager_comments = action.payload.comments;
        if (action.payload.newInstallerId) {
          task.installer_id = action.payload.newInstallerId;
        }
      }
    },
    reassignTask(
      state,
      action: PayloadAction<{taskId: string; installerId: string}>,
    ) {
      const task = state.items.find(t => t.id === action.payload.taskId);
      if (task) {
        task.installer_id = action.payload.installerId;
        task.status = 'active';
      }
    },
    addMedia(state, action: PayloadAction<TaskMedia>) {
      state.media.push(action.payload);
    },
    removeMedia(state, action: PayloadAction<string>) {
      state.media = state.media.filter(m => m.id !== action.payload);
    },
    setTaskStatus(
      state,
      action: PayloadAction<{taskId: string; status: TaskStatus}>,
    ) {
      const task = state.items.find(t => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.status;
      }
    },
    reorderJobTasks(
      state,
      action: PayloadAction<{jobId: string; order: {id: string; sequenceNumber: number}[]}>,
    ) {
      const {jobId, order} = action.payload;
      order.forEach(({id, sequenceNumber}) => {
        const task = state.items.find(t => t.id === id && t.job_id === jobId);
        if (task) { task.sequence_number = sequenceNumber; }
      });
    },
    // Replace all tasks + media for a specific job (used by detail screens)
    setJobTasks(
      state,
      action: PayloadAction<{jobId: string; tasks: Task[]; media: TaskMedia[]}>,
    ) {
      const {jobId, tasks, media} = action.payload;
      state.items = state.items.filter(t => t.job_id !== jobId);
      state.items.push(...tasks);
      const taskIds = new Set(tasks.map(t => t.id));
      state.media = state.media.filter(m => !taskIds.has(m.task_id));
      state.media.push(...media);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchInstallerTasks.pending, state => {
        state.loading = true;
      })
      .addCase(fetchInstallerTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInstallerTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(approveTaskAsync.fulfilled, (state, action) => {
        const task = state.items.find(t => t.id === action.payload);
        if (task) {
          task.status = 'approved';
          task.approved_at = new Date().toISOString();
          const next = state.items.find(
            t => t.job_id === task.job_id && t.sequence_number === task.sequence_number + 1,
          );
          if (next && next.status === 'pending') {
            next.status = 'active';
          }
        }
      })
      .addCase(rejectTaskAsync.fulfilled, (state, action) => {
        const task = state.items.find(t => t.id === action.payload.taskId);
        if (task) {
          task.status = 'rejected';
          task.manager_comments = action.payload.comments;
          if (action.payload.newInstallerId) {
            task.installer_id = action.payload.newInstallerId;
          }
        }
      })
      .addCase(submitTaskAsync.fulfilled, (state, action) => {
        const task = state.items.find(t => t.id === action.payload);
        if (task) {
          task.status = 'submitted';
          task.submitted_at = new Date().toISOString();
        }
      })
      .addCase(deleteMediaAsync.fulfilled, (state, action) => {
        state.media = state.media.filter(m => m.id !== action.payload);
      });
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  submitTask,
  approveTask,
  rejectTask,
  reassignTask,
  addMedia,
  removeMedia,
  setTaskStatus,
  reorderJobTasks,
  setJobTasks,
} = tasksSlice.actions;
export default tasksSlice.reducer;
