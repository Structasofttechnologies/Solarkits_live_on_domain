import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  alerts: [],
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action) => {
      const { message, type = 'info' } = action.payload;
      state.alerts.push({
        id: Date.now().toString(),
        message,
        type,
      });
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
    },
  },
});

export const { addAlert, removeAlert } = alertSlice.actions;
export default alertSlice.reducer;
