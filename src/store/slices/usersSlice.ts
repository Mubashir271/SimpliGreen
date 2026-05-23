import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {adminApi} from '../../api';
import {User} from '../../types';

interface UsersState {
  items: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () =>
  adminApi.getUsers(),
);

export const createUserAsync = createAsyncThunk(
  'users/createUser',
  async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    installerTypeId?: string;
  }) => adminApi.createUser(data),
);

export const updateUserAsync = createAsyncThunk(
  'users/updateUser',
  async ({
    id,
    data,
  }: {
    id: string;
    data: {name?: string; email?: string; isActive?: boolean; installerTypeId?: string | null};
  }) => adminApi.updateUser(id, data),
);

export const deleteUserAsync = createAsyncThunk(
  'users/deleteUser',
  async (id: string) => {
    await adminApi.deleteUser(id);
    return id;
  },
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser(state, action: PayloadAction<User>) {
      state.items.push(action.payload);
    },
    updateUser(state, action: PayloadAction<User>) {
      const idx = state.items.findIndex(u => u.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    toggleSuspend(state, action: PayloadAction<string>) {
      const user = state.items.find(u => u.id === action.payload);
      if (user) {
        user.status = user.status === 'active' ? 'suspended' : 'active';
      }
    },
    deleteUser(state, action: PayloadAction<string>) {
      state.items = state.items.filter(u => u.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsers.pending, state => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(createUserAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        const idx = state.items.findIndex(u => u.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(u => u.id !== action.payload);
      });
  },
});

export const {addUser, updateUser, toggleSuspend, deleteUser} = usersSlice.actions;
export default usersSlice.reducer;
