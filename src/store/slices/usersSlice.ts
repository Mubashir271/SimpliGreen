import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User} from '../../types';
import {MOCK_USERS} from '../../data/mockData';

interface UsersState {
  items: User[];
}

const initialState: UsersState = {
  items: MOCK_USERS,
};

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
});

export const {addUser, updateUser, toggleSuspend, deleteUser} =
  usersSlice.actions;
export default usersSlice.reducer;
