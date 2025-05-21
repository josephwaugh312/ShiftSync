import { configureStore } from '@reduxjs/toolkit';
import shiftsReducer from './shiftsSlice';
import uiReducer from './uiSlice';
import employeeReducer from './employeeSlice';

export const store = configureStore({
  reducer: {
    shifts: shiftsReducer,
    ui: uiReducer,
    employees: employeeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 