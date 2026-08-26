import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";
import { setAlert } from "./alert.slice";
import { refreshAccessToken } from "./auth.slice";
import { resolveApiUrl } from "@/utils/resolveApiUrl";

const extractUniqueIdsFromModules = (modules = []) => {
  let uniqueIds = [];

  modules.filter((module) => module.can_view == true).forEach((module) => {
    if (module.unique_id) uniqueIds.push(module.unique_id);
    if (module.children?.length) {
      uniqueIds = uniqueIds.concat(extractUniqueIdsFromModules(module.children));
    }
  });

  return uniqueIds;
};

export const fetchUserModules = createAsyncThunk(
  "modules/fetchUserModules",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      try {
        await dispatch(refreshAccessToken()).unwrap();
      } catch (identErr) {
        return rejectWithValue("Unauthorized");
      }

      const rawToken = getState().auth?.token;
      let token = rawToken;
      if (!token) {
        try {
          const raw = localStorage.getItem('login');
          token = raw ? (JSON.parse(raw)?.token || raw) : null;
        } catch (e) {}
      }

      if (!token) {
        dispatch(setAlert({ type: "error", message: "No token found" }));
        return rejectWithValue("No token found");
      }

      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const res = await axios.get(`${resolveApiUrl(import.meta.env.VITE_API_URL, 'http://localhost:5000/admin-api')}/user-modules`, {
        headers: { Authorization: authHeader },
        timeout: 7000,
      });

      const modules = res.data?.data || [];
      const uniqueIds = extractUniqueIdsFromModules(modules);

      return { modules, uniqueIds };
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.message === "Network Error") {
        dispatch(setAlert({ type: "error", message: "Server unreachable. Check API URL or Network." }));
        return rejectWithValue("SERVER_DOWN");
      }

      const status = error.response?.status;
      const resp = error.response?.data;
      const msg = resp?.message || "Failed to fetch modules";

      if (status === 401 || resp?.auth === false || /Unauthorized/i.test(msg)) {
        // let other slices handle logout/redirect
        // return rejectWithValue("Unauthorized");
      }

      dispatch(setAlert({ type: "error", message: msg }));
      return rejectWithValue(msg);
    }
  }
);

const modulesSlice = createSlice({
  name: "modules",
  initialState: {
    modules: [],
    uniqueIds: [],
    status: 'idle',
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserModules.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserModules.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'success';
        state.modules = action.payload.modules || [];
        state.uniqueIds = action.payload.uniqueIds || [];
      })
      .addCase(fetchUserModules.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload || action.error?.message;
      });
  },
});

const EMPTY_ARRAY = [];

const selectModulesState = (state) => state.modules_slice?.modules;
const selectUserState = (state) => state.user_slice?.user;
const selectSelectedScopeState = (state) => state.user_slice?.selectedScope;
const selectPathname = (_, pathname) => pathname;

export const selectAllowedUniqueIds = createSelector(
  [selectModulesState, selectUserState, selectSelectedScopeState, selectPathname],
  (rawModules = EMPTY_ARRAY, user, selectedScope, pathname) => {
    if (!user || !user.allowed_panels || !pathname) return EMPTY_ARRAY;

    const activeLevel = (selectedScope?.level || user.level || '').toLowerCase();

    const activePanel = user.allowed_panels.find(p => pathname.startsWith(p.url_prefix));
    if (!activePanel) return EMPTY_ARRAY;

    const activeProduct = activePanel.saas_products?.find(prod =>
      pathname.startsWith(`${activePanel.url_prefix}/${prod.slug}`)
    );

    if (activeProduct) {
      const activeProdId = (activeProduct.id || activeProduct._id)?.toString();
      const ids = rawModules
        .filter(m => m.dashboard_context === "product" && (
          String(m.saas_product_id?._id || m.saas_product_id) === String(activeProdId)
        ) && (m.level_name?.toLowerCase() === activeLevel || activeLevel === 'global'))
        .map(m => m.unique_id);
      if (!ids.includes("00000000")) ids.push("00000000");
      return ids;
    } else {
      const ids = rawModules
        .filter(m => (!m.dashboard_context || m.dashboard_context === "default") && (
          m.level_name?.toLowerCase() === activeLevel || activeLevel === 'global'
        ))
        .map(m => m.unique_id);
      if (!ids.includes("00000000")) ids.push("00000000");
      return ids;
    }
  }
);

export default modulesSlice.reducer;
