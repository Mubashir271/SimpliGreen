import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {adminApi} from '../../api';
import {InstallerType} from '../../types';

interface InstallerTypesState {
  items: InstallerType[];
  loading: boolean;
  error: string | null;
}

const initialState: InstallerTypesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchInstallerTypes = createAsyncThunk(
  'installerTypes/fetch',
  async () => adminApi.getInstallerTypes(),
);

export const createInstallerTypeAsync = createAsyncThunk(
  'installerTypes/create',
  async ({name, requiresCertificate}: {name: string; requiresCertificate: boolean}) =>
    adminApi.createInstallerType(name, requiresCertificate),
);

export const toggleCertificateAsync = createAsyncThunk(
  'installerTypes/toggleCertificate',
  async ({id, current}: {id: string; current: boolean}) =>
    adminApi.updateInstallerType(id, {requiresCertificate: !current}),
);

export const deleteInstallerTypeAsync = createAsyncThunk(
  'installerTypes/delete',
  async (id: string) => {
    await adminApi.deleteInstallerType(id);
    return id;
  },
);

const installerTypesSlice = createSlice({
  name: 'installerTypes',
  initialState,
  reducers: {
    addInstallerType(state, action: PayloadAction<InstallerType>) {
      state.items.push(action.payload);
    },
    toggleCertificate(state, action: PayloadAction<string>) {
      const type = state.items.find(t => t.id === action.payload);
      if (type) {
        type.requires_certificate = !type.requires_certificate;
      }
    },
    deleteInstallerType(state, action: PayloadAction<string>) {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchInstallerTypes.pending, state => {
        state.loading = true;
      })
      .addCase(fetchInstallerTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInstallerTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(createInstallerTypeAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(toggleCertificateAsync.pending, (state, action) => {
        const {id, current} = action.meta.arg;
        const type = state.items.find(t => t.id === id);
        if (type) { type.requires_certificate = !current; }
      })
      .addCase(toggleCertificateAsync.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) { state.items[idx] = action.payload; }
      })
      .addCase(toggleCertificateAsync.rejected, (state, action) => {
        const {id, current} = action.meta.arg;
        const type = state.items.find(t => t.id === id);
        if (type) { type.requires_certificate = current; }
      })
      .addCase(deleteInstallerTypeAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      });
  },
});

export const {addInstallerType, toggleCertificate, deleteInstallerType} =
  installerTypesSlice.actions;
export default installerTypesSlice.reducer;
