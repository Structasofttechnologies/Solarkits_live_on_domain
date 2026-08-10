import { configureStore } from '@reduxjs/toolkit';
import alertReducer from '../features/alert.slice';
import authReducer from '../features/auth.slice';
import userReducer from '../features/user.slice';

export const store = configureStore({
    reducer: {
        alert_slice: alertReducer,
        auth_slice:  authReducer,
        user_slice:  userReducer,
    },
});
