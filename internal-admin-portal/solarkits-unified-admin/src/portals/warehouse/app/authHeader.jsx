import store from "./store";

export function getAuthToken() {
  try {
    return store.getState().auth?.token || null;
  } catch (e) {
    return null;
  }
}

export function authHeaderObj() {
  const t = getAuthToken();
  return t ? { Authorization: t } : {};
}
