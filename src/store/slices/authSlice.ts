import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {authApi} from '../../api';
import {tokenStorage} from '../../api/client';
import {User} from '../../types';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  loading: false,
  error: null,
  initializing: true,
};

export const loginAsync = createAsyncThunk(
  'auth/loginAsync',
  async ({email, password}: {email: string; password: string}) => {
    const data = await authApi.login(email, password);
    await tokenStorage.set(data.token);
    return data.user;
  },
);

export const logoutAsync = createAsyncThunk('auth/logoutAsync', async () => {
  await tokenStorage.remove();
});

export const updateProfileAsync = createAsyncThunk(
  'auth/updateProfileAsync',
  async ({name, avatarUri, mimeType, fileName}: {name?: string; avatarUri?: string; mimeType?: string; fileName?: string}) => {
    return await authApi.updateProfile(name, avatarUri, mimeType, fileName);
  },
);

export const initAuth = createAsyncThunk('auth/initAuth', async () => {
  const token = await tokenStorage.get();
  if (!token) return null;
  try {
    return await authApi.getMe();
  } catch {
    await tokenStorage.remove();
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // kept for compatibility
    login(state, action: PayloadAction<User>) {
      state.currentUser = action.payload;
    },
    logout(state) {
      state.currentUser = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(logoutAsync.fulfilled, state => {
        state.currentUser = null;
      })
      .addCase(initAuth.pending, state => {
        state.initializing = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.initializing = false;
        state.currentUser = action.payload;
      })
      .addCase(initAuth.rejected, state => {
        state.initializing = false;
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      });
  },
});

export const {login, logout, clearError} = authSlice.actions;
export default authSlice.reducer;
