import {
  Customer,
  CustomerTransaction,
  CustomerBottleTransaction,
  InventoryItem,
  InventoryTransaction,
  RefillBatch,
  Sale,
  Payment,
  Supplier,
  SupplierTransaction,
  Purchase,
  Expense,
  DeliveryRecord,
  MessageTemplate,
  SentMessage,
  BusinessSettings,
  AuditLog,
  DashboardStats,
  User,
  CustomerAccount,
  CustomerAddress,
  OnlineOrder,
  CustomerAuthSession,
  AuthSession,
  OwnerSecurityProfile,
  StaffPerformanceSummary,
  DeliveryStaffSummary,
  AccountsStaffSummary,
  PermissionKey,
} from '../types';
import { mockBackend } from './mockBackend';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('water_staff_token') || '' : '';
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getCustomerAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('water_customer_token') || '' : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const isStaticOrGitHub =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('github.io') ||
   window.location.hostname.includes('pages.dev') ||
   window.location.hostname.includes('vercel.app') ||
   window.location.hostname.includes('netlify.app') ||
   window.location.protocol === 'file:' ||
   sessionStorage.getItem('water_backend_mode') === 'offline');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType && !contentType.includes('application/json')) {
    throw new Error('Non-JSON response from server (static host fallback)');
  }
  return res.json();
}

/**
 * Executes a network fetch call with seamless fallback to the in-browser mock backend.
 * This guarantees the application NEVER shows a white screen on GitHub Pages or static hosts
 * where the backend server process is not running.
 */
async function callWithFallback<T>(fetchFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  if (isStaticOrGitHub) {
    return fallbackFn();
  }
  try {
    return await fetchFn();
  } catch (err) {
    // If backend is unavailable (network error, 404 on static host, GitHub Pages, etc.)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('water_backend_mode', 'offline');
      } catch {}
    }
    return await fallbackFn();
  }
}

export const api = {
  // Health
  checkHealth: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/health`).then((r) => handleResponse<{ status: string }>(r)),
      () => mockBackend.checkHealth()
    ),

  // Dashboard
  getDashboardStats: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/dashboard/stats`, { headers: getAuthHeaders() }).then((r) => handleResponse<DashboardStats>(r)),
      () => mockBackend.getDashboardStats()
    ),

  // Customers
  getCustomers: (params?: { type?: string; area?: string; active?: boolean; search?: string }) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (params?.type) q.append('type', params.type);
        if (params?.area) q.append('area', params.area);
        if (params?.active !== undefined) q.append('active', String(params.active));
        if (params?.search) q.append('search', params.search);
        return fetch(`${API_BASE}/customers?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<Customer[]>(r)
        );
      },
      () => mockBackend.getCustomers(params)
    ),

  getCustomerById: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customers/${id}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<{
            customer: Customer;
            transactions: CustomerTransaction[];
            bottleLedger: CustomerBottleTransaction[];
            deliveries: DeliveryRecord[];
            sales: Sale[];
            payments: Payment[];
            messages: SentMessage[];
          }>(r)
        ),
      () => mockBackend.getCustomerById(id)
    ),

  createCustomer: (customerData: Partial<Customer>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(customerData),
        }).then((r) => handleResponse<Customer>(r)),
      () => mockBackend.createCustomer(customerData)
    ),

  updateCustomer: (id: string, customerData: Partial<Customer>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(customerData),
        }).then((r) => handleResponse<Customer>(r)),
      () => mockBackend.updateCustomer(id, customerData)
    ),

  deleteCustomer: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customers/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; deletedCustomer: Customer }>(r)),
      () => mockBackend.deleteCustomer(id)
    ),

  bulkUpdateCustomerRates: (payload: {
    customerIds?: string[];
    area?: string;
    customerType?: string;
    newRate?: number;
    adjustAmount?: number;
  }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customers/bulk-price-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        }).then((r) => handleResponse<{ success: boolean; count: number; updatedCustomers: Customer[] }>(r)),
      () => mockBackend.bulkUpdateCustomerRates(payload)
    ),

  recordCustomerBottleTx: (
    customerId: string,
    data: {
      date?: string;
      type?: 'delivered' | 'returned' | 'damaged_reported' | 'adjustment';
      filledDelivered: number;
      emptyReturned: number;
      notes?: string;
      referenceId?: string;
    }
  ) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customers/${customerId}/bottle-transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<{ customer: Customer; bottleTx: CustomerBottleTransaction }>(r)),
      () => mockBackend.recordCustomerBottleTx(customerId, data)
    ),

  // Refilling / Production
  getRefillBatches: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/refilling`, { headers: getAuthHeaders() }).then((r) => handleResponse<RefillBatch[]>(r)),
      () => mockBackend.getRefillBatches()
    ),

  createRefillBatch: (batchData: Partial<RefillBatch>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/refilling`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(batchData),
        }).then((r) => handleResponse<RefillBatch>(r)),
      () => mockBackend.createRefillBatch(batchData)
    ),

  cancelRefillBatch: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/refilling/${id}/cancel`, {
          method: 'PUT',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<RefillBatch>(r)),
      () => mockBackend.cancelRefillBatch(id)
    ),

  // Inventory
  getInventory: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/inventory`, { headers: getAuthHeaders() }).then((r) => handleResponse<InventoryItem[]>(r)),
      () => mockBackend.getInventory()
    ),

  getInventoryTransactions: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/inventory/transactions`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<InventoryTransaction[]>(r)
        ),
      () => mockBackend.getInventoryTransactions()
    ),

  adjustInventory: (data: { itemId: string; adjustmentQty: number; reason: string }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/inventory/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<{ item: InventoryItem; tx: InventoryTransaction }>(r)),
      () => mockBackend.adjustInventory(data)
    ),

  // Sales
  getSales: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/sales`, { headers: getAuthHeaders() }).then((r) => handleResponse<Sale[]>(r)),
      () => mockBackend.getSales()
    ),

  createSale: (saleData: Partial<Sale> & { customerId: string; quantity: number; rate: number }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(saleData),
        }).then((r) => handleResponse<Sale>(r)),
      () => mockBackend.createSale(saleData)
    ),

  // Payments
  getPayments: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/payments`, { headers: getAuthHeaders() }).then((r) => handleResponse<Payment[]>(r)),
      () => mockBackend.getPayments()
    ),

  recordPayment: (paymentData: Partial<Payment> & { customerId: string; amount: number }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(paymentData),
        }).then((r) => handleResponse<Payment>(r)),
      () => mockBackend.recordPayment(paymentData)
    ),

  deletePayment: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/payments/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; deletedPayment: Payment; customer?: Customer }>(r)),
      () => mockBackend.deletePayment(id)
    ),

  clearAllPayments: (options?: { recalculateFromSales?: boolean }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/payments/clear-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(options || {}),
        }).then((r) => handleResponse<{ success: boolean; message: string; count: number }>(r)),
      () => mockBackend.clearAllPayments()
    ),

  // Deliveries
  getDeliveries: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/deliveries`, { headers: getAuthHeaders() }).then((r) => handleResponse<DeliveryRecord[]>(r)),
      () => mockBackend.getDeliveries()
    ),

  createDelivery: (deliveryData: Partial<DeliveryRecord>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/deliveries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(deliveryData),
        }).then((r) => handleResponse<DeliveryRecord>(r)),
      () => mockBackend.createDelivery(deliveryData)
    ),

  updateDeliveryStatus: (
    id: string,
    data: {
      status: 'pending' | 'out_for_delivery' | 'delivered' | 'cancelled';
      emptyReceived?: number;
      paid?: number;
      paymentMethod?: string;
      deliveryPerson?: string;
      notes?: string;
    }
  ) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/deliveries/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<DeliveryRecord>(r)),
      () => mockBackend.updateDeliveryStatus(id, data)
    ),

  // Suppliers & Purchases
  getSuppliers: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/suppliers`, { headers: getAuthHeaders() }).then((r) => handleResponse<Supplier[]>(r)),
      () => mockBackend.getSuppliers()
    ),

  getSupplierById: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/suppliers/${id}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<{ supplier: Supplier; transactions: SupplierTransaction[]; purchases: Purchase[] }>(r)
        ),
      () => mockBackend.getSupplierById(id)
    ),

  createSupplier: (data: Partial<Supplier>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/suppliers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<Supplier>(r)),
      () => mockBackend.createSupplier(data)
    ),

  updateSupplier: (id: string, data: Partial<Supplier>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/suppliers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<Supplier>(r)),
      () => mockBackend.updateSupplier(id, data)
    ),

  deleteSupplier: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/suppliers/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; deletedSupplier: Supplier }>(r)),
      () => mockBackend.deleteSupplier(id)
    ),

  getPurchases: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/purchases`, { headers: getAuthHeaders() }).then((r) => handleResponse<Purchase[]>(r)),
      () => mockBackend.getPurchases()
    ),

  createPurchase: (data: Partial<Purchase>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/purchases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<Purchase>(r)),
      () => mockBackend.createPurchase(data)
    ),

  paySupplier: (supplierId: string, data: { amount: number; paymentMethod?: string; referenceNumber?: string; notes?: string }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/suppliers/${supplierId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<{ supplier: Supplier; tx: SupplierTransaction }>(r)),
      () => mockBackend.paySupplier(supplierId, data)
    ),

  // Expenses
  getExpenses: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/expenses`, { headers: getAuthHeaders() }).then((r) => handleResponse<Expense[]>(r)),
      () => mockBackend.getExpenses()
    ),

  createExpense: (data: Partial<Expense>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<Expense>(r)),
      () => mockBackend.createExpense(data)
    ),

  deleteExpense: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/expenses/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; deletedExpense: Expense }>(r)),
      () => mockBackend.deleteExpense(id)
    ),

  // Messaging
  getMessageTemplates: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/messaging/templates`, { headers: getAuthHeaders() }).then((r) => handleResponse<MessageTemplate[]>(r)),
      () => mockBackend.getMessageTemplates()
    ),

  getMessages: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/messaging/history`, { headers: getAuthHeaders() }).then((r) => handleResponse<SentMessage[]>(r)),
      () => mockBackend.getSentMessages()
    ),

  sendMessage: (data: { customerId: string; templateCode?: string; customText?: string; channel?: 'whatsapp' | 'sms' }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/messaging/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<{ sent: SentMessage; customer: Customer; cleanPhone: string }>(r)),
      () => mockBackend.sendMessage(data)
    ),

  // Reports
  getAnalyticsReport: (params?: { startDate?: string; endDate?: string }) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (params?.startDate) q.append('startDate', params.startDate);
        if (params?.endDate) q.append('endDate', params.endDate);
        return fetch(`${API_BASE}/reports/analytics?${q.toString()}`, { headers: getAuthHeaders() }).then((r) => handleResponse<any>(r));
      },
      () => mockBackend.getFinancialReport()
    ),

  // Global Search
  searchGlobal: (query: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<{
            customers: Customer[];
            sales: Sale[];
            payments: Payment[];
            suppliers: Supplier[];
            deliveries: DeliveryRecord[];
            inventory: InventoryItem[];
          }>(r)
        ),
      async () => {
        const custs = await mockBackend.getCustomers({ search: query });
        return {
          customers: custs,
          sales: [],
          payments: [],
          suppliers: [],
          deliveries: [],
          inventory: [],
        };
      }
    ),

  // Settings & Backup
  getSettings: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() }).then((r) => handleResponse<BusinessSettings>(r)),
      () => mockBackend.getSettings()
    ),

  updateSettings: (settings: Partial<BusinessSettings>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(settings),
        }).then((r) => handleResponse<BusinessSettings>(r)),
      () => mockBackend.updateSettings(settings as BusinessSettings)
    ),

  exportBackupUrl: `${API_BASE}/settings/backup/export`,
  getBackup: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/settings/backup/export`, { headers: getAuthHeaders() }).then((r) => r.json()),
      () => mockBackend.getBackup()
    ),

  importBackup: (backupData: any) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/settings/backup/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(backupData),
        }).then((r) => handleResponse<{ message: string; count: number }>(r)),
      () => mockBackend.restoreBackup(backupData)
    ),

  restoreBackup: (backupData: any) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/settings/backup/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(backupData),
        }).then((r) => handleResponse<{ message: string; count: number }>(r)),
      () => mockBackend.restoreBackup(backupData)
    ),

  resetDemoData: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/settings/reset-demo`, {
          method: 'POST',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ message: string; db: any }>(r)),
      () => mockBackend.clearDatabase()
    ),

  clearAllData: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/settings/clear-all-data`, {
          method: 'POST',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ message: string; db: any }>(r)),
      () => mockBackend.clearDatabase()
    ),

  // Audit Logs & Users
  getAuditLogs: (params?: { userId?: string; action?: string; module?: string; startDate?: string; endDate?: string; search?: string }) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (params?.userId) q.append('userId', params.userId);
        if (params?.action) q.append('action', params.action);
        if (params?.module) q.append('module', params.module);
        if (params?.startDate) q.append('startDate', params.startDate);
        if (params?.endDate) q.append('endDate', params.endDate);
        if (params?.search) q.append('search', params.search);
        return fetch(`${API_BASE}/audit-logs?${q.toString()}`, { headers: getAuthHeaders() }).then((r) => handleResponse<AuditLog[]>(r));
      },
      () => mockBackend.getAuditLogs()
    ),

  getUsers: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/staff`, { headers: getAuthHeaders() }).then((r) => handleResponse<User[]>(r)),
      () => mockBackend.getUsers()
    ),

  createUser: (user: Partial<User>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(user),
        }).then((r) => handleResponse<User>(r)),
      () => mockBackend.createUser(user)
    ),

  // Staff & Admin Auth
  authLogin: (identifier: string, password: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        }).then((r) => handleResponse<AuthSession>(r)),
      () => mockBackend.authLogin(identifier, password)
    ),

  authLogout: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.authLogout()
    ),

  authGetMe: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/auth/me`, {
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ user: User; permissions: PermissionKey[]; isOwner: boolean; isAdmin: boolean }>(r)),
      () => mockBackend.authGetMe()
    ),

  authChangePassword: (currentPassword: string, newPassword: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ currentPassword, newPassword }),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.authChangePassword()
    ),

  getPermissions: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/permissions`).then((r) =>
          handleResponse<{ all: PermissionKey[]; modules: any[]; roleDefaults: Record<string, PermissionKey[]> }>(r)
        ),
      () => mockBackend.getPermissions()
    ),

  // Staff Management
  getStaff: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/staff`, { headers: getAuthHeaders() }).then((r) => handleResponse<User[]>(r)),
      () => mockBackend.getStaff()
    ),

  createStaff: (data: Partial<User> & { initialPassword?: string }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<User>(r)),
      () => mockBackend.createStaff(data)
    ),

  updateStaff: (id: string, data: Partial<User>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<User>(r)),
      () => mockBackend.updateStaff(id, data)
    ),

  updateStaffStatus: (id: string, status: 'active' | 'inactive' | 'suspended') =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ status }),
        }).then((r) => handleResponse<User>(r)),
      () => mockBackend.updateStaffStatus(id, status)
    ),

  updateStaffPermissions: (id: string, permissions: PermissionKey[]) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff/${id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ permissions }),
        }).then((r) => handleResponse<User>(r)),
      () => mockBackend.updateStaffPermissions(id, permissions)
    ),

  resetStaffPassword: (id: string, newPassword?: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff/${id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ newPassword }),
        }).then((r) => handleResponse<{ success: boolean; message: string; temporaryPassword?: string }>(r)),
      () => mockBackend.resetStaffPassword()
    ),

  deleteStaff: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/staff/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.deleteStaff(id)
    ),

  getStaffActivity: (id: string) =>
    callWithFallback(
      () => fetch(`${API_BASE}/staff/${id}/activity`, { headers: getAuthHeaders() }).then((r) => handleResponse<AuditLog[]>(r)),
      () => mockBackend.getStaffActivity()
    ),

  // Owner Security
  getOwnerSecurity: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/owner/security`, { headers: getAuthHeaders() }).then((r) => handleResponse<OwnerSecurityProfile>(r)),
      () => mockBackend.getOwnerSecurity()
    ),

  ownerChangePassword: (currentPassword: string, newPassword: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/owner/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ currentPassword, newPassword }),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.ownerChangePassword()
    ),

  ownerChangeEmail: (currentPassword: string, newEmail: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/owner/change-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ currentPassword, newEmail }),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.ownerChangeEmail()
    ),

  ownerTransferOwnership: (currentPassword: string, targetAdminId: string, confirmationText: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/owner/transfer-ownership`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ currentPassword, targetAdminId, confirmationText }),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.ownerTransferOwnership()
    ),

  // Staff Reports
  getStaffPerformanceReport: (startDate?: string, endDate?: string) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (startDate) q.append('startDate', startDate);
        if (endDate) q.append('endDate', endDate);
        return fetch(`${API_BASE}/reports/staff-performance?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<StaffPerformanceSummary[]>(r)
        );
      },
      () => mockBackend.getStaffPerformanceReport()
    ),

  getDeliveryPerformanceReport: (startDate?: string, endDate?: string) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (startDate) q.append('startDate', startDate);
        if (endDate) q.append('endDate', endDate);
        return fetch(`${API_BASE}/reports/delivery-performance?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<DeliveryStaffSummary[]>(r)
        );
      },
      () => mockBackend.getDeliveryPerformanceReport()
    ),

  getAccountsPerformanceReport: (startDate?: string, endDate?: string) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (startDate) q.append('startDate', startDate);
        if (endDate) q.append('endDate', endDate);
        return fetch(`${API_BASE}/reports/accounts-performance?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<AccountsStaffSummary[]>(r)
        );
      },
      () => mockBackend.getAccountsPerformanceReport()
    ),

  // Customer Portal Client
  customerRegister: (data: {
    fullName: string;
    mobile: string;
    whatsapp: string;
    password: string;
    email?: string;
    houseOffice: string;
    streetRoad: string;
    area: string;
    customArea?: string;
    gateBellFloor?: string;
    completeDeliveryAddress?: string;
    city?: string;
  }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<CustomerAuthSession>(r)),
      () => mockBackend.customerRegister(data)
    ),

  customerLogin: (identifier: string, password: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        }).then((r) => handleResponse<CustomerAuthSession>(r)),
      () => mockBackend.customerLogin(identifier, password)
    ),

  customerLogout: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/auth/logout`, {
          method: 'POST',
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.customerLogout()
    ),

  customerGetMe: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/auth/me`, {
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<{ account: CustomerAccount; customer: Customer; addresses: CustomerAddress[] }>(r)),
      () => mockBackend.customerGetMe()
    ),

  customerUpdateProfile: (data: { fullName?: string; email?: string; whatsapp?: string }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<{ account: CustomerAccount; customer: Customer }>(r)),
      () => mockBackend.customerUpdateProfile(data)
    ),

  customerGetAddresses: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/addresses`, {
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<CustomerAddress[]>(r)),
      () => mockBackend.customerGetAddresses()
    ),

  customerAddAddress: (data: Partial<CustomerAddress>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<CustomerAddress>(r)),
      () => mockBackend.customerAddAddress(data)
    ),

  customerUpdateAddress: (id: string, data: Partial<CustomerAddress>) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/addresses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<CustomerAddress>(r)),
      () => mockBackend.customerUpdateAddress(id, data)
    ),

  customerDeleteAddress: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/addresses/${id}`, {
          method: 'DELETE',
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
      () => mockBackend.customerDeleteAddress(id)
    ),

  customerSetDefaultAddress: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/addresses/${id}/default`, {
          method: 'PUT',
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<{ success: boolean; address: CustomerAddress }>(r)),
      () => mockBackend.customerSetDefaultAddress(id)
    ),

  customerGetProducts: () =>
    callWithFallback(
      () => fetch(`${API_BASE}/customer/products`).then((r) => handleResponse<any[]>(r)),
      () => mockBackend.customerGetProducts()
    ),

  customerGetOrders: () =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/orders`, {
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<OnlineOrder[]>(r)),
      () => mockBackend.customerGetOrders()
    ),

  customerGetOrderById: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/orders/${id}`, {
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<OnlineOrder>(r)),
      () => mockBackend.customerGetOrderById(id)
    ),

  customerCreateOrder: (data: {
    addressId?: string;
    quantity: number;
    preferredDate?: string;
    preferredTimeSlot?: string;
    customerNotes?: string;
    paymentMethod?: string;
  }) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<OnlineOrder>(r)),
      () => mockBackend.customerCreateOrder(data)
    ),

  customerCancelOrder: (id: string) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/customer/orders/${id}/cancel`, {
          method: 'PUT',
          headers: getCustomerAuthHeaders(),
        }).then((r) => handleResponse<OnlineOrder>(r)),
      () => mockBackend.customerCancelOrder(id)
    ),

  // Admin Online Orders
  getOnlineOrders: (params?: { status?: string; source?: string; search?: string }) =>
    callWithFallback(
      () => {
        const q = new URLSearchParams();
        if (params?.status) q.append('status', params.status);
        if (params?.source) q.append('source', params.source);
        if (params?.search) q.append('search', params.search);
        return fetch(`${API_BASE}/online-orders?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
          handleResponse<OnlineOrder[]>(r)
        );
      },
      () => mockBackend.getOnlineOrders(params)
    ),

  getOnlineOrderById: (id: string) =>
    callWithFallback(
      () => fetch(`${API_BASE}/online-orders/${id}`, { headers: getAuthHeaders() }).then((r) => handleResponse<OnlineOrder>(r)),
      () => mockBackend.getOnlineOrderById(id)
    ),

  updateOnlineOrderStatus: (
    id: string,
    data: {
      status: string;
      assignedDriverId?: string;
      assignedDriverName?: string;
      internalNotes?: string;
      deliveryNotes?: string;
    }
  ) =>
    callWithFallback(
      () =>
        fetch(`${API_BASE}/online-orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        }).then((r) => handleResponse<OnlineOrder>(r)),
      () => mockBackend.updateOnlineOrderStatus(id, data)
    ),
};
