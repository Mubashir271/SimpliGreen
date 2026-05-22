import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Task, TaskMedia, TaskStatus} from '../../types';
import {MOCK_TASK_MEDIA, MOCK_TASKS} from '../../data/mockData';

interface TasksState {
  items: Task[];
  media: TaskMedia[];
}

const initialState: TasksState = {
  items: MOCK_TASKS,
  media: MOCK_TASK_MEDIA,
};

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
        // Unlock next sequential task
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
      action: PayloadAction<{
        taskId: string;
        comments: string;
        newInstallerId?: string;
      }>,
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
} = tasksSlice.actions;
export default tasksSlice.reducer;
