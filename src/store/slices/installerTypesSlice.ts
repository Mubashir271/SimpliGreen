import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {InstallerType} from '../../types';
import {MOCK_INSTALLER_TYPES} from '../../data/mockData';

interface InstallerTypesState {
  items: InstallerType[];
}

const initialState: InstallerTypesState = {
  items: MOCK_INSTALLER_TYPES,
};

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
});

export const {addInstallerType, toggleCertificate, deleteInstallerType} =
  installerTypesSlice.actions;
export default installerTypesSlice.reducer;
