import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User} from '../../types';

interface AuthState {
  currentUser: User | null;
}

const initialState: AuthState = {
  currentUser: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.currentUser = action.payload;
    },
    logout(state) {
      state.currentUser = null;
    },
  },
});

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;
