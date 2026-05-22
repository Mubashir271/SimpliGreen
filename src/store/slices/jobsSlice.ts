import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Job, JobStatus} from '../../types';
import {MOCK_JOBS} from '../../data/mockData';

interface JobsState {
  items: Job[];
}

const initialState: JobsState = {
  items: MOCK_JOBS,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    addJob(state, action: PayloadAction<Job>) {
      state.items.push(action.payload);
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
});

export const {addJob, setJobStatus, submitToQA} = jobsSlice.actions;
export default jobsSlice.reducer;
