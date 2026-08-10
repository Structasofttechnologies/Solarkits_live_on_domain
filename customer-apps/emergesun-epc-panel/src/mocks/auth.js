// Mock auth accounts for login
export const authAccounts = [
  {
    email: 'superadmin@emergesun.com',
    password: 'Admin@123',
    userId: 'usr-001',
    name: 'Arjun Mehta',
    role: 'Super Admin',
    roleCode: 'SUPER_ADMIN',
    companyId: 'comp-001',
    company: 'SunTech Energy Solutions',
    country: 'India',
    avatar: 'AM',
    status: 'active',
  },
  {
    email: 'epcadmin@suntech.com',
    password: 'Admin@123',
    userId: 'usr-002',
    name: 'Priya Sharma',
    role: 'EPC Admin',
    roleCode: 'EPC_ADMIN',
    companyId: 'comp-001',
    company: 'SunTech Energy Solutions',
    country: 'India',
    avatar: 'PS',
    status: 'active',
  },
  {
    email: 'countryadmin@suntech.com',
    password: 'Admin@123',
    userId: 'usr-003',
    name: 'Ravi Kumar',
    role: 'Country Admin',
    roleCode: 'COUNTRY_ADMIN',
    companyId: 'comp-001',
    company: 'SunTech Energy Solutions',
    country: 'India',
    avatar: 'RK',
    status: 'active',
  },
  {
    email: 'sales@suntech.com',
    password: 'Admin@123',
    userId: 'usr-004',
    name: 'Sneha Patel',
    role: 'Sales',
    roleCode: 'SALES',
    companyId: 'comp-001',
    company: 'SunTech Energy Solutions',
    country: 'India',
    avatar: 'SP',
    status: 'active',
  },
  {
    email: 'support@greenvolt.com',
    password: 'Admin@123',
    userId: 'usr-021',
    name: 'Ben Harrison',
    role: 'Support',
    roleCode: 'SUPPORT',
    companyId: 'comp-002',
    company: 'GreenVolt Power',
    country: 'United States',
    avatar: 'BH',
    status: 'active',
  },
  {
    email: 'suspended@afrisolar.co.za',
    password: 'Admin@123',
    userId: 'usr-017',
    name: 'Thabo Nkosi',
    role: 'EPC Admin',
    roleCode: 'EPC_ADMIN',
    companyId: 'comp-005',
    company: 'AfriSolar EPC',
    country: 'South Africa',
    avatar: 'TN',
    status: 'suspended',
  },
];

export const SESSION_KEY = 'epc_session';
export const SESSION_DURATION_MINUTES = 60;

export const mockLogin = (email, password) => {
  const account = authAccounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!account) return { success: false, error: 'invalid_credentials' };
  if (account.status === 'suspended') return { success: false, error: 'suspended' };
  if (account.status === 'inactive') return { success: false, error: 'inactive' };

  const session = {
    ...account,
    expiresAt: Date.now() + SESSION_DURATION_MINUTES * 60 * 1000,
    loginAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
};

export const mockLogout = () => {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
};

export const getSession = () => {
  let raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    try {
      const match = document.cookie.split('; ').find((row) => row.startsWith(`${SESSION_KEY}=`));
      if (match) {
        raw = decodeURIComponent(match.split('=')[1]);
        if (raw) {
          localStorage.setItem(SESSION_KEY, raw);
        }
      }
    } catch (e) {}
  }
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const isSessionExpired = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    return session.expiresAt < Date.now();
  } catch {
    return false;
  }
};
