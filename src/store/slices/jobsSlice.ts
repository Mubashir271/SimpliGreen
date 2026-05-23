import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {adminApi, managerApi, qaApi} from '../../api';
import {Job, JobStatus} from '../../types';

interface JobsState {
  items: Job[];
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAdminJobs = createAsyncThunk('jobs/fetchAdmin', async () =>
  adminApi.getJobs(),
);

export const fetchManagerJobs = createAsyncThunk('jobs/fetchManager', async () =>
  managerApi.getJobs(),
);

export const fetchQAJobs = createAsyncThunk('jobs/fetchQA', async () =>
  qaApi.getJobs(),
);

export const createJobAsync = createAsyncThunk(
  'jobs/create',
  async (data: {title: string; address: string; managerId: string; qaId: string}) =>
    adminApi.createJob(data),
);

export const submitJobToQAAsync = createAsyncThunk(
  'jobs/submitToQA',
  async (jobId: string) => {
    await managerApi.submitJobToQA(jobId);
    return jobId;
  },
);

export const approveJobAsync = createAsyncThunk(
  'jobs/approveJob',
  async ({jobId, comments}: {jobId: string; comments?: string}) => {
    await qaApi.approveJob(jobId, comments);
    return jobId;
  },
);

export const rejectJobAsync = createAsyncThunk(
  'jobs/rejectJob',
  async ({jobId, comments}: {jobId: string; comments: string}) => {
    await qaApi.rejectJob(jobId, comments);
    return {jobId, comments};
  },
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    addJob(state, action: PayloadAction<Job>) {
      state.items.push(action.payload);
    },
    upsertJob(state, action: PayloadAction<Job>) {
      const idx = state.items.findIndex(j => j.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
    setJobStatus(
      state,
      action: PayloadAction<{jobId: string; status: JobStatus; qa_comments?: string}>,
    ) {
      const job = state.items.find(j => j.id === action.payload.jobId);
      if (job) {
        job.status = action.payload.status;
        if (action.payload.qa_comments !== undefined) {
          job.qa_comments = action.payload.qa_comments;
        }
        if (action.payload.status === 'approved') {
          job.completed_at = new Date().toISOString().split('T')[0];
        }
      }
    },
    submitToQA(state, action: PayloadAction<string>) {
      const job = state.items.find(j => j.id === action.payload);
      if (job) {
        job.status = 'submitted_to_qa';
      }
    },
  },
  extraReducers: builder => {
    const fetchFulfilled = (state: JobsState, action: {payload: Job[]}) => {
      state.loading = false;
      // Merge — keep jobs from other roles that may already be in state
      action.payload.forEach(incoming => {
        const idx = state.items.findIndex(j => j.id === incoming.id);
        if (idx !== -1) {
          state.items[idx] = incoming;
        } else {
          state.items.push(incoming);
        }
      });
    };

    builder
      .addCase(fetchAdminJobs.pending, state => {
        state.loading = true;
      })
      .addCase(fetchAdminJobs.fulfilled, fetchFulfilled)
      .addCase(fetchAdminJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(fetchManagerJobs.pending, state => {
        state.loading = true;
      })
      .addCase(fetchManagerJobs.fulfilled, fetchFulfilled)
      .addCase(fetchManagerJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(fetchQAJobs.pending, state => {
        state.loading = true;
      })
      .addCase(fetchQAJobs.fulfilled, fetchFulfilled)
      .addCase(fetchQAJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(createJobAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(submitJobToQAAsync.fulfilled, (state, action) => {
        const job = state.items.find(j => j.id === action.payload);
        if (job) {
          job.status = 'submitted_to_qa';
        }
      })
      .addCase(approveJobAsync.fulfilled, (state, action) => {
        const job = state.items.find(j => j.id === action.payload);
        if (job) {
          job.status = 'approved';
          job.completed_at = new Date().toISOString();
        }
      })
      .addCase(rejectJobAsync.fulfilled, (state, action) => {
        const job = state.items.find(j => j.id === action.payload.jobId);
        if (job) {
          job.status = 'rejected';
          job.qa_comments = action.payload.comments;
        }
      });
  },
});

export const {addJob, upsertJob, setJobStatus, submitToQA} = jobsSlice.actions;
export default jobsSlice.reducer;
