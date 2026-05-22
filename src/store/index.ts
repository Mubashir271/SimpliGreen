import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import installerTypesReducer from './slices/installerTypesSlice';
import jobsReducer from './slices/jobsSlice';
import tasksReducer from './slices/tasksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    installerTypes: installerTypesReducer,
    jobs: jobsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
