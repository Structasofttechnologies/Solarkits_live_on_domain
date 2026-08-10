import axios from 'axios';
import { store } from '../app/store';
import { logout_user, set_token } from './auth.slice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // sends supplier_refresh_token cookie
    timeout: 15000,
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
    const token = store.getState().auth_slice?.token;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let is_refreshing = false;
let refresh_queue = [];

const process_queue = (error, token = null) => {
    refresh_queue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(token)));
    refresh_queue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        const is_token_expired =
            error.response?.status === 401 &&
            error.response?.data?.error === 'token_expired' &&
            !original._retry;

        if (is_token_expired) {
            if (is_refreshing) {
                return new Promise((resolve, reject) => {
                    refresh_queue.push({ resolve, reject });
                }).then((token) => {
                    original.headers['Authorization'] = `Bearer ${token}`;
                    return api(original);
                });
            }

            original._retry = true;
            is_refreshing = true;

            try {
                const { data } = await axios.post(
                    `${BASE_URL}/auth/refresh-access-token`,
                    {},
                    { withCredentials: true }
                );
                const new_token = data.token;
                store.dispatch(set_token(new_token));
                process_queue(null, new_token);
                original.headers['Authorization'] = `Bearer ${new_token}`;
                return api(original);
            } catch (refresh_err) {
                process_queue(refresh_err, null);
                store.dispatch(logout_user());
                window.location.href = '/login';
                return Promise.reject(refresh_err);
            } finally {
                is_refreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ── Auth API ─────────────────────────────────────────────────────────────────

export const auth_api = {
    get_countries: ()                           => api.get('/auth/countries'),
    get_states: (country_id = '')               => api.get(`/auth/states?country_id=${country_id}`),
    get_districts: (state_ids = '')             => api.get(`/auth/districts?state_ids=${state_ids}`),
    register: (data)                            => api.post('/auth/register', data),
    request_verify_otp: (email, gst_number = '') => api.post('/auth/request-verify-account-otp', { email, gst_number }),
    request_forgot_password_otp: (payload)      => api.post('/auth/request-forgot-password-otp', payload),
    verify_otp: (token, otp)                    => api.post('/auth/verify-otp', { token, otp }),
    set_passcode: (passcode_token, passcode, confirm_passcode) =>
                                                   api.post('/auth/set-passcode', { passcode_token, passcode, confirm_passcode }),
    login: (data)                               => api.post('/auth/login', data),
    get_my_accounts: ()                         => api.get('/auth/my-accounts'),
    select_account: (supplier_id)               => api.post('/auth/select-account', { supplier_id }),
    refresh_access_token: ()                    => api.post('/auth/refresh-access-token'),
    logout: ()                                  => api.post('/auth/logout'),
    me: ()                                      => api.get('/auth/me'),
    gst_generate_otp: (gstin)                   => api.post('/auth/gst/generate-otp', { gstin }),
    gst_submit_otp: (request_id, otp, gstin)   => api.post('/auth/gst/submit-otp', { request_id, otp, gstin }),
    send_register_email_otp: (email)            => api.post('/auth/send-register-email-otp', { email }),
    verify_register_email_otp: (email, otp, token) => api.post('/auth/verify-register-email-otp', { email, otp, token }),
    send_register_phone_otp: (phone, phone_code) => api.post('/auth/send-register-phone-otp', { phone, phone_code }),
    verify_register_phone_otp: (phone, phone_code, otp, token) => api.post('/auth/verify-register-phone-otp', { phone, phone_code, otp, token }),
};

// ── Admin API (called from admin panel frontend) ──────────────────────────────

export const admin_api = {
    list_suppliers: (params = {})   => api.get('/admin/suppliers', { params }),
    get_supplier:   (id)            => api.get(`/admin/suppliers/${id}`),
    approve:        (id)            => api.patch(`/admin/suppliers/${id}/approve`),
    reject:         (id, reason)    => api.patch(`/admin/suppliers/${id}/reject`, { reason }),
    approve_state_request: (id, requestId) => api.patch(`/admin/suppliers/${id}/state-requests/${requestId}/approve`),
    reject_state_request: (id, requestId, reason) => api.patch(`/admin/suppliers/${id}/state-requests/${requestId}/reject`, { reason }),
};

// ── Supplier API ─────────────────────────────────────────────────────────────

export const supplier_api = {
    create_state_request: (data) => api.post('/supplier/state-requests', data),
    get_state_requests: ()       => api.get('/supplier/state-requests'),
    add_gst: (data)              => api.post('/supplier/add-gst', data),
    update_office_location: (officeId, data) => api.patch(`/supplier/office-locations/${officeId}`, data),
    update_profile: (data)         => api.patch('/supplier/profile', data),
    get_orders: ()                 => api.get('/supplier/orders'),
    accept_and_invoice: (id, formData) => api.post(`/supplier/orders/${id}/accept-invoice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// ── Warehouse API ─────────────────────────────────────────────────────────────

export const warehouse_api = {
    check_coverage: () => api.get('/supplier/warehouses/check-coverage'),
    create: (data)     => api.post('/supplier/warehouses', data),
    list: ()           => api.get('/supplier/warehouses'),
    update: (id, data) => api.patch(`/supplier/warehouses/${id}`, data),
};

export const catalog_api = {
    get_templates: (type = '') => api.get(`/supplier/catalog/templates?type=${type}`),
    get_brands: (template_ids = '') => api.get(`/supplier/catalog/brands?template_ids=${template_ids}`),
    get_supply_config: (wh_id) => api.get(`/supplier/warehouses/${wh_id}/supply-config`),
    update_supply_config: (wh_id, data) => api.post(`/supplier/warehouses/${wh_id}/supply-config`, data),
    get_skus: (wh_id, params = {}) => api.get(`/supplier/warehouses/${wh_id}/skus`, { params }),
    update_prices: (wh_id, prices) => api.post(`/supplier/warehouses/${wh_id}/prices`, { prices }),
};

export default api;
