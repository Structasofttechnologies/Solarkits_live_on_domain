import store from "./store";

export function getAuthToken() {
  try {
    // 1. Redux Store
    const fromStore = store.getState()?.auth?.token;
    if (fromStore) {
      return fromStore.startsWith('Bearer ') ? fromStore : `Bearer ${fromStore}`;
    }

    // 2. localStorage 'login' JSON
    const rawLogin = localStorage.getItem('login');
    if (rawLogin) {
      try {
        const parsed = JSON.parse(rawLogin);
        if (parsed?.token) {
          return parsed.token.startsWith('Bearer ') ? parsed.token : `Bearer ${parsed.token}`;
        }
      } catch (e) {}
    }

    // 3. Fallback raw tokens
    const rawToken = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
    if (rawToken) {
      return rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export function authHeaderObj() {
  const t = getAuthToken();
  return t ? { Authorization: t } : {};
}
