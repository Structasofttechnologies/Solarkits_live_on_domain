import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { setAlert } from "./alert.slice";
import { refreshAccessToken, logout as authLogout } from "./auth.slice";
import { fetchUserModules } from "./modules.slice";

export const getUserData = createAsyncThunk(
  "user/getUserData",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      try {
        await dispatch(refreshAccessToken()).unwrap();
      } catch (identErr) {
        console.warn('refreshAccessToken failed', identErr);
      }
      const token = getState().auth?.token;

      if (!token) {
        dispatch(setAlert({ type: "error", message: "No token found" }));
        return rejectWithValue("No token found");
      }

      const res = await axios.get(`${import.meta.env.VITE_WAREHOUSE_API_URL || import.meta.env.VITE_API_URL}/user-data`, {
        headers: { Authorization: token },
        timeout: 7000,
      });

      dispatch(setAlert({ type: "success", message: "User data loaded successfully" }));
      dispatch(fetchUserModules());
      return res.data.data;
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.message === "Network Error") {
        console.warn("⚠️ Server not reachable or request timed out.");
        dispatch(setAlert({ type: "error", message: "Server unreachable. Check API URL or Network." }));
        return rejectWithValue("SERVER_DOWN");
      }

      const status = error.response?.status;
      const resp = error.response?.data;
      const msg = resp?.message || "Failed to fetch user data";

      // If backend explicitly says auth:false or returns 401, treat as unauthenticated
      if (status === 401 || resp?.auth === false || /Unauthorized/i.test(msg)) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, { withCredentials: true, timeout: 4000 });
        } catch (logoutErr) {
          console.warn('logout cleanup failed', logoutErr?.message || logoutErr);
        }

        dispatch(authLogout());
        const publicPaths = ["/login", "/verify", "/forgot-password", "/set-passcode"];
        const targetLogin = '/login';
        if (window.location.pathname !== targetLogin && !publicPaths.includes(window.location.pathname)) {
          window.location.href = targetLogin;
        }
        return rejectWithValue('Unauthorized');
      }

      dispatch(setAlert({ type: "error", message: msg }));
      return rejectWithValue(msg);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    loading: false,
    auth: false,
  },
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.auth = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.auth = true;
        state.loading = false;
      })
      .addCase(getUserData.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === "No token found" || action.payload === "Unauthorized") {
          state.user = null;
          state.auth = false;
        }
      });
  },
});

export const { logoutUser } = userSlice.actions;
export default userSlice.reducer;
