export function getAuthToken() {
  try {
    return localStorage.getItem("token") || null;
  } catch (e) {
    return null;
  }
}

export function authHeaderObj() {
  const t = getAuthToken();
  return t ? { Authorization: t } : {};
}
