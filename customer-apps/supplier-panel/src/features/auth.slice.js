import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { warehouse_api } from './supplier.api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

// ── Async thunks ─────────────────────────────────────────────────────────────

export const refresh_token = createAsyncThunk(
    'auth/refresh_token',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(
                `${BASE_URL}/auth/refresh-access-token`,
                {},
                { withCredentials: true }
            );
            return data.token;
        } catch (err) {
            return rejectWithValue({
                message: err.response?.data?.message || 'Session expired',
                status: err.response?.status || null
            });
        }
    }
);

export const fetch_me = createAsyncThunk(
    'auth/fetch_me',
    async (_, { getState, rejectWithValue }) => {
        try {
            const token = getState().auth_slice?.token;
            const { data } = await axios.get(`${BASE_URL}/auth/me`, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return data.supplier;
        } catch (err) {
            return rejectWithValue({
                message: err.response?.data?.message || 'Failed to fetch user',
                status: err.response?.status || null
            });
        }
    }
);

export const check_warehouse_coverage = createAsyncThunk(
    'auth/check_warehouse_coverage',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await warehouse_api.check_coverage();
            return data.data;
        } catch (err) {
            return rejectWithValue({
                message: err.response?.data?.message || 'Failed to check warehouse coverage',
                status: err.response?.status || null
            });
        }
    }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const storedSupplier = (() => {
    try {
        const val = localStorage.getItem('supplier_user');
        return val ? JSON.parse(val) : null;
    } catch (e) {
        return null;
    }
})();

const storedWarehouse = (() => {
    try {
        const val = localStorage.getItem('active_warehouse');
        return val ? JSON.parse(val) : null;
    } catch (e) {
        return null;
    }
})();

const initialState = {
    token: localStorage.getItem('supplier_token') || null,
    supplier: storedSupplier,
    isAuthenticated: !!storedSupplier,
    warehouseCoverage: null,
    activeWarehouse: storedWarehouse,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.token = action.payload.token;
            state.supplier = action.payload.supplier;
            state.error = null;
            if (action.payload.token) {
                localStorage.setItem('supplier_token', action.payload.token);
            }
            if (action.payload.supplier) {
                localStorage.setItem('supplier_user', JSON.stringify(action.payload.supplier));
            }
        },
        set_token: (state, action) => {
            state.token = action.payload;
            localStorage.setItem('supplier_token', action.payload);
        },
        logout_user: (state) => {
            state.token = null;
            state.supplier = null;
            state.isAuthenticated = false;
            state.warehouseCoverage = null;
            state.activeWarehouse = null;
            state.error = null;
            localStorage.removeItem('supplier_token');
            localStorage.removeItem('supplier_user');
            localStorage.removeItem('active_warehouse');
        },
        loginStart: (state) => { state.loading = true; state.error = null; },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        set_supplier: (state, action) => {
            state.supplier = action.payload;
            if (action.payload) {
                localStorage.setItem('supplier_user', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('supplier_user');
            }
        },
        selectWarehouse: (state, action) => {
            state.activeWarehouse = action.payload;
            if (action.payload) {
                localStorage.setItem('active_warehouse', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('active_warehouse');
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(refresh_token.fulfilled, (state, action) => {
                state.token = action.payload;
                localStorage.setItem('supplier_token', action.payload);
            })
            .addCase(refresh_token.rejected, (state, action) => {
                const status = action.payload?.status;
                if (status === 401 || status === 403) {
                    state.token = null;
                    state.supplier = null;
                    state.isAuthenticated = false;
                    state.warehouseCoverage = null;
                    state.activeWarehouse = null;
                    localStorage.removeItem('supplier_token');
                    localStorage.removeItem('supplier_user');
                    localStorage.removeItem('active_warehouse');
                }
            })
            .addCase(fetch_me.pending, (state) => { state.loading = true; })
            .addCase(fetch_me.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.supplier = action.payload;
                if (action.payload) {
                    localStorage.setItem('supplier_user', JSON.stringify(action.payload));
                }
            })
            .addCase(fetch_me.rejected, (state, action) => {
                state.loading = false;
            })
            .addCase(check_warehouse_coverage.fulfilled, (state, action) => {
                state.warehouseCoverage = action.payload;
            });
    },
});

export const { loginSuccess, set_token, logout_user, loginStart, loginFailure, set_supplier, selectWarehouse } = authSlice.actions;
export default authSlice.reducer;
