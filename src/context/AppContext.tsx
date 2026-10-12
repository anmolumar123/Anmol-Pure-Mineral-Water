import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BusinessSettings,
  User,
  UserRole,
  Customer,
  Sale,
  Payment,
  DeliveryRecord,
  Supplier,
  CustomerAuthSession,
  PermissionKey,
  AuthSession,
} from '../types';
import { api } from '../services/api';
import { hasPermission, ROLE_DEFAULT_PERMISSIONS, ALL_PERMISSIONS } from '../utils/permissions';

export type ActiveView =
  | 'dashboard'
  | 'online_orders'
  | 'customers'
  | 'bottle_ledger'
  | 'sales'
  | 'deliveries'
  | 'refilling'
  | 'inventory'
  | 'payments'
  | 'suppliers'
  | 'purchases'
  | 'expenses'
  | 'reports'
  | 'messages'
  | 'users'
  | 'settings'
  | 'customer_portal';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export const DEMO_STAFF_CREDENTIALS: Record<UserRole, { email: string; pass: string; name: string }> = {
  owner: { email: 'owner@anmolpurewater.com', pass: 'Owner@Anmol2026!', name: 'Ahmed Khan (Owner)' },
  admin: { email: 'admin@anmolpurewater.com', pass: 'Admin@Anmol2026!', name: 'Sajid Ali (Admin/Accounts)' },
  staff: { email: 'staff@anmolpurewater.com', pass: 'Staff@Anmol2026!', name: 'Bilal Siddiqui (Plant Staff)' },
  delivery: { email: 'driver@anmolpurewater.com', pass: 'Driver@Anmol2026!', name: 'Rashid Mehmood (Delivery Driver)' },
  customer: { email: '', pass: '', name: 'Online Customer' },
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'USR-1',
    authUserId: '00000000-0000-0000-0000-000000000001',
    employeeId: 'EMP-001',
    name: 'Ahmed Khan (Owner)',
    email: 'owner@anmolpurewater.com',
    role: 'owner',
    phone: '+92 300 1112233',
    department: 'Executive Management',
    status: 'active',
    active: true,
    permissions: [...ALL_PERMISSIONS],
    createdAt: '2025-01-01',
  },
  {
    id: 'USR-2',
    authUserId: '00000000-0000-0000-0000-000000000002',
    employeeId: 'EMP-002',
    name: 'Sajid Ali (Admin/Accounts)',
    email: 'admin@anmolpurewater.com',
    role: 'admin',
    phone: '+92 301 2223344',
    department: 'Finance & Accounts',
    status: 'active',
    active: true,
    permissions: [...ROLE_DEFAULT_PERMISSIONS.admin],
    createdAt: '2025-03-01',
  },
  {
    id: 'USR-3',
    authUserId: '00000000-0000-0000-0000-000000000003',
    employeeId: 'EMP-003',
    name: 'Bilal Siddiqui (Plant Staff)',
    email: 'staff@anmolpurewater.com',
    role: 'staff',
    phone: '+92 301 5556677',
    department: 'Plant Operations & Inventory',
    status: 'active',
    active: true,
    permissions: [...ROLE_DEFAULT_PERMISSIONS.staff],
    createdAt: '2025-05-15',
  },
  {
    id: 'USR-4',
    authUserId: '00000000-0000-0000-0000-000000000004',
    employeeId: 'EMP-004',
    name: 'Rashid Mehmood (Delivery Driver)',
    email: 'driver@anmolpurewater.com',
    role: 'delivery',
    phone: '+92 302 3334455',
    department: 'Delivery & Logistics',
    assignedArea: 'Sector F-10 & Blue Area',
    status: 'active',
    active: true,
    permissions: [...ROLE_DEFAULT_PERMISSIONS.delivery],
    createdAt: '2025-06-01',
  },
];

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Anmol Pure Mineral Water',
  tagline: 'Premium 19-Liter Mountain Mineral Water & Daily Refill Distribution',
  phone: '+92 300 1234567',
  whatsapp: '+92 300 1234567',
  email: 'info@anmolpurewater.com',
  address: 'Plot 42-B, Industrial Estate, Sector I-9',
  city: 'Islamabad',
  currency: 'Rs.',
  defaultBottleSize: '19-Liter',
  defaultBottlePrice: 150,
  defaultSecurityDeposit: 500,
  invoicePrefix: 'INV-',
  receiptPrefix: 'REC-',
  refillPrefix: 'REF-',
  deliveryPrefix: 'DEL-',
  lowStockBottlesThreshold: 50,
  lowStockCapsThreshold: 200,
  lowStockLabelsThreshold: 200,
  termsAndConditions: 'Bottles remain property of Anmol Pure Mineral Water. Please return empty bottles in clean condition.',
  whatsappApiConfigured: true,
  autoWhatsAppOnPayment: true,
  whatsappPaymentReceiptTemplate: 'Dear {customer_name}, we have received your payment of {currency} {amount} via {method} (Receipt #{receipt_number}). Updated account balance: {currency} {balance}. Thank you for choosing {business_name}!',
  allowNegativeStock: false,
};

interface AppContextType {
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  authSession: AuthSession | null;
  isOwner: boolean;
  isAdmin: boolean;
  hasUserPermission: (permission: PermissionKey) => boolean;
  switchRole: (role: UserRole) => Promise<void>;
  loginStaff: (identifier: string, pass: string) => Promise<void>;
  logoutStaff: () => Promise<void>;
  settings: BusinessSettings;
  setSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>;
  updateSettingsState: (settings: BusinessSettings) => void;
  refreshTrigger: number;
  refreshAll: () => void;
  toasts: ToastNotification[];
  addToast: (type: ToastNotification['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string) => string;

  // Customer Portal state
  portalMode: 'admin' | 'customer';
  setPortalMode: (mode: 'admin' | 'customer') => void;
  customerSession: CustomerAuthSession | null;
  setCustomerSession: (session: CustomerAuthSession | null) => void;
  customerLogout: () => void;
  pendingOnlineOrdersCount: number;

  // Modal triggers
  openSearchModal: boolean;
  setOpenSearchModal: (open: boolean) => void;
  activeCustomerProfileId: string | null;
  setActiveCustomerProfileId: (id: string | null) => void;
  activeInvoiceData: Sale | null;
  setActiveInvoiceData: (sale: Sale | null) => void;
  activeReceiptData: Payment | null;
  setActiveReceiptData: (payment: Payment | null) => void;
  activeMessageCustomer: Customer | null;
  setActiveMessageCustomer: (customer: Customer | null) => void;

  // Quick Action Modal Triggers
  quickModal: 'customer' | 'sale' | 'cash_sale' | 'payment' | 'delivery' | 'refill' | 'expense' | 'purchase' | null;
  setQuickModal: (modal: 'customer' | 'sale' | 'cash_sale' | 'payment' | 'delivery' | 'refill' | 'expense' | 'purchase' | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [openSearchModal, setOpenSearchModal] = useState<boolean>(false);
  const [activeCustomerProfileId, setActiveCustomerProfileId] = useState<string | null>(null);
  const [activeInvoiceData, setActiveInvoiceData] = useState<Sale | null>(null);
  const [activeReceiptData, setActiveReceiptData] = useState<Payment | null>(null);
  const [activeMessageCustomer, setActiveMessageCustomer] = useState<Customer | null>(null);
  const [quickModal, setQuickModal] = useState<'customer' | 'sale' | 'cash_sale' | 'payment' | 'delivery' | 'refill' | 'expense' | 'purchase' | null>(null);

  const [portalMode, setPortalMode] = useState<'admin' | 'customer'>('admin');
  const [customerSession, setCustomerSession] = useState<CustomerAuthSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('water_customer_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });
  const [pendingOnlineOrdersCount, setPendingOnlineOrdersCount] = useState<number>(0);

  useEffect(() => {
    const existingToken = typeof window !== 'undefined' ? localStorage.getItem('water_staff_token') : null;
    if (existingToken) {
      api.authGetMe()
        .then((res) => {
          setCurrentUser(res.user);
          setAuthSession({
            token: existingToken,
            user: res.user,
            permissions: res.permissions,
            isOwner: res.isOwner,
            isAdmin: res.isAdmin,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        })
        .catch(() => {
          loginStaff('owner@anmolpurewater.com', 'Owner@Anmol2026!').catch(() => {});
        });
    } else {
      loginStaff('owner@anmolpurewater.com', 'Owner@Anmol2026!').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (customerSession) {
        localStorage.setItem('water_customer_token', customerSession.token);
        localStorage.setItem('water_customer_session', JSON.stringify(customerSession));
      } else {
        localStorage.removeItem('water_customer_token');
        localStorage.removeItem('water_customer_session');
      }
    }
  }, [customerSession]);

  const customerLogout = () => {
    api.customerLogout().catch(() => {});
    setCustomerSession(null);
    addToast('info', 'Logged Out', 'You have been signed out of your customer account.');
  };

  const refreshAll = () => setRefreshTrigger((prev) => prev + 1);

  const loginStaff = async (identifier: string, pass: string) => {
    try {
      const session = await api.authLogin(identifier, pass);
      if (typeof window !== 'undefined') {
        localStorage.setItem('water_staff_token', session.token);
        localStorage.setItem('water_app_user_role', session.user.role);
        localStorage.setItem('water_app_user_name', session.user.name);
      }
      setAuthSession(session);
      setCurrentUser(session.user);
    } catch (e) {
      console.warn('Login fallback:', e);
    }
  };

  const logoutStaff = async () => {
    try {
      await api.authLogout();
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('water_staff_token');
    }
    setAuthSession(null);
    const defaultUser = DEFAULT_USERS[2];
    setCurrentUser(defaultUser);
    addToast('info', 'Signed Out', 'You have been logged out of the management system.');
  };

  const switchRole = async (role: UserRole) => {
    const creds = DEMO_STAFF_CREDENTIALS[role];
    if (creds && creds.email) {
      try {
        await loginStaff(creds.email, creds.pass);
        addToast('success', `Authenticated as ${role.toUpperCase()}`, `Active session: ${creds.name}`);
        if (role === 'delivery' && currentView !== 'deliveries') {
          setCurrentView('deliveries');
        }
      } catch (err: any) {
        const match = DEFAULT_USERS.find((u) => u.role === role) || DEFAULT_USERS[0];
        setCurrentUser(match);
      }
    }
  };

  const hasUserPermission = (permission: PermissionKey): boolean => {
    return hasPermission(currentUser, permission);
  };

  useEffect(() => {
    api.getSettings()
      .then((s) => setSettings(s))
      .catch((err) => console.log('Loaded local fallback settings:', err));
    api.getDashboardStats()
      .then((st) => {
        if (st.pendingOnlineOrdersCount !== undefined) {
          setPendingOnlineOrdersCount(st.pendingOnlineOrdersCount);
        }
      })
      .catch(() => {});
  }, [refreshTrigger]);

  const addToast = (type: ToastNotification['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const formatCurrency = (amount: number = 0): string => {
    const sym = settings.currency || 'Rs.';
    return `${sym} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isOwner = currentUser.role === 'owner';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner';

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        setCurrentUser,
        authSession,
        isOwner,
        isAdmin,
        hasUserPermission,
        switchRole,
        loginStaff,
        logoutStaff,
        settings,
        setSettings,
        updateSettingsState: (s: BusinessSettings) => setSettings(s),
        refreshTrigger,
        refreshAll,
        toasts,
        addToast,
        removeToast,
        formatCurrency,
        formatDate,
        portalMode,
        setPortalMode,
        customerSession,
        setCustomerSession,
        customerLogout,
        pendingOnlineOrdersCount,
        openSearchModal,
        setOpenSearchModal,
        activeCustomerProfileId,
        setActiveCustomerProfileId,
        activeInvoiceData,
        setActiveInvoiceData,
        activeReceiptData,
        setActiveReceiptData,
        activeMessageCustomer,
        setActiveMessageCustomer,
        quickModal,
        setQuickModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
