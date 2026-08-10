import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { ms_conversion } from "@/utils/msConversion";

export const refreshAccessToken = createAsyncThunk(
    'auth/refreshAccessToken',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_AUTH_API_URL}/refresh-access-token`, {}, {
                withCredentials: true,
                timeout: ms_conversion('7s'),
            });

            const { token, url_prefix } = res.data || {};
            return { token: token || null, url_prefix: url_prefix || null };
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to refresh access token';
            if (err.response?.data?.auth === false || err.response?.status === 401) {
                window.location.href = '/login';
            }
            return rejectWithValue(message);
        }
    }
);

export const ensureValidAccessToken = createAsyncThunk(
    'auth/ensureValidAccessToken',
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const auth = state.auth || {};
            const now = Date.now();

            if (auth.token && auth.expiresAt && auth.expiresAt > now) {
                return auth.token;
            }

            const payload = await dispatch(refreshAccessToken()).unwrap();
            return payload?.token || null;
        } catch (err) {
            return rejectWithValue(err || 'Failed to ensure access token');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_AUTH_API_URL}/logout`, {}, {
                withCredentials: true,
            });

            if (res.data?.status === 'success') {
                dispatch({ type: 'user/logoutUser' });
                dispatch({ type: 'auth/clearAuth' });
                return res.data;
            }

            return rejectWithValue(res.data?.message || 'Logout failed');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to logout';
            return rejectWithValue(message);
        }
    }
);

const initialState = {
    token: null,
    url_prefix: null,
    expiresAt: null,
    status: 'idle',
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuth(state) {
            state.token = null;
            state.url_prefix = null;
            state.expiresAt = null;
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(refreshAccessToken.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(refreshAccessToken.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.token = action.payload.token || null;
                state.url_prefix = action.payload.url_prefix || null;
                state.error = null;
                const EXPIRE_MS = 1 * 25 * 1000;
                state.expiresAt = state.token ? Date.now() + EXPIRE_MS : null;
            })
            .addCase(refreshAccessToken.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error?.message;
                state.token = null;
                state.expiresAt = null;
            });
        builder
            .addCase(logout.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(logout.fulfilled, (state) => {
                state.status = 'idle';
                state.token = null;
                state.url_prefix = null;
                state.expiresAt = null;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error?.message;
            });
    },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
