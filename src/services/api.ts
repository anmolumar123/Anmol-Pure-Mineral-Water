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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  checkHealth: () => fetch(`${API_BASE}/health`).then((r) => handleResponse<{ status: string }>(r)),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`, { headers: getAuthHeaders() }).then((r) => handleResponse<DashboardStats>(r)),

  // Customers
  getCustomers: (params?: { type?: string; area?: string; active?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.append('type', params.type);
    if (params?.area) q.append('area', params.area);
    if (params?.active !== undefined) q.append('active', String(params.active));
    if (params?.search) q.append('search', params.search);
    return fetch(`${API_BASE}/customers?${q.toString()}`, { headers: getAuthHeaders() }).then((r) => handleResponse<Customer[]>(r));
  },
  getCustomerById: (id: string) =>
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
  createCustomer: (customerData: Partial<Customer>) =>
    fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(customerData),
    }).then((r) => handleResponse<Customer>(r)),
  updateCustomer: (id: string, customerData: Partial<Customer>) =>
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(customerData),
    }).then((r) => handleResponse<Customer>(r)),
  deleteCustomer: (id: string) =>
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; deletedCustomer: Customer }>(r)),
  bulkUpdateCustomerRates: (payload: {
    customerIds?: string[];
    area?: string;
    customerType?: string;
    newRate?: number;
    adjustAmount?: number;
  }) =>
    fetch(`${API_BASE}/customers/bulk-price-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<{ success: boolean; count: number; updatedCustomers: Customer[] }>(r)),
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
    fetch(`${API_BASE}/customers/${customerId}/bottle-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ customer: Customer; bottleTx: CustomerBottleTransaction }>(r)),

  // Refilling / Production
  getRefillBatches: () => fetch(`${API_BASE}/refilling`, { headers: getAuthHeaders() }).then((r) => handleResponse<RefillBatch[]>(r)),
  createRefillBatch: (batchData: Partial<RefillBatch>) =>
    fetch(`${API_BASE}/refilling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(batchData),
    }).then((r) => handleResponse<RefillBatch>(r)),
  cancelRefillBatch: (id: string) =>
    fetch(`${API_BASE}/refilling/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<RefillBatch>(r)),

  // Inventory
  getInventory: () => fetch(`${API_BASE}/inventory`, { headers: getAuthHeaders() }).then((r) => handleResponse<InventoryItem[]>(r)),
  getInventoryTransactions: () => fetch(`${API_BASE}/inventory/transactions`, { headers: getAuthHeaders() }).then((r) => handleResponse<InventoryTransaction[]>(r)),
  adjustInventory: (data: { itemId: string; adjustmentQty: number; reason: string }) =>
    fetch(`${API_BASE}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ item: InventoryItem; tx: InventoryTransaction }>(r)),

  // Sales
  getSales: () => fetch(`${API_BASE}/sales`, { headers: getAuthHeaders() }).then((r) => handleResponse<Sale[]>(r)),
  createSale: (saleData: Partial<Sale> & { customerId: string; quantity: number; rate: number }) =>
    fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(saleData),
    }).then((r) => handleResponse<Sale>(r)),

  // Payments
  getPayments: () => fetch(`${API_BASE}/payments`, { headers: getAuthHeaders() }).then((r) => handleResponse<Payment[]>(r)),
  recordPayment: (paymentData: Partial<Payment> & { customerId: string; amount: number }) =>
    fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(paymentData),
    }).then((r) => handleResponse<Payment>(r)),
  deletePayment: (id: string) =>
    fetch(`${API_BASE}/payments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; deletedPayment: Payment; customer?: Customer }>(r)),
  clearAllPayments: (options?: { recalculateFromSales?: boolean }) =>
    fetch(`${API_BASE}/payments/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(options || {}),
    }).then((r) => handleResponse<{ success: boolean; message: string; count: number }>(r)),

  // Deliveries
  getDeliveries: () => fetch(`${API_BASE}/deliveries`, { headers: getAuthHeaders() }).then((r) => handleResponse<DeliveryRecord[]>(r)),
  createDelivery: (deliveryData: Partial<DeliveryRecord>) =>
    fetch(`${API_BASE}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(deliveryData),
    }).then((r) => handleResponse<DeliveryRecord>(r)),
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
    fetch(`${API_BASE}/deliveries/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<DeliveryRecord>(r)),

  // Suppliers & Purchases
  getSuppliers: () => fetch(`${API_BASE}/suppliers`, { headers: getAuthHeaders() }).then((r) => handleResponse<Supplier[]>(r)),
  getSupplierById: (id: string) =>
    fetch(`${API_BASE}/suppliers/${id}`, { headers: getAuthHeaders() }).then((r) =>
      handleResponse<{ supplier: Supplier; transactions: SupplierTransaction[]; purchases: Purchase[] }>(r)
    ),
  createSupplier: (data: Partial<Supplier>) =>
    fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Supplier>(r)),
  updateSupplier: (id: string, data: Partial<Supplier>) =>
    fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Supplier>(r)),
  deleteSupplier: (id: string) =>
    fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; deletedSupplier: Supplier }>(r)),
  getPurchases: () => fetch(`${API_BASE}/purchases`, { headers: getAuthHeaders() }).then((r) => handleResponse<Purchase[]>(r)),
  createPurchase: (data: Partial<Purchase>) =>
    fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Purchase>(r)),
  paySupplier: (supplierId: string, data: { amount: number; paymentMethod?: string; referenceNumber?: string; notes?: string }) =>
    fetch(`${API_BASE}/suppliers/${supplierId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ supplier: Supplier; tx: SupplierTransaction }>(r)),

  // Expenses
  getExpenses: () => fetch(`${API_BASE}/expenses`, { headers: getAuthHeaders() }).then((r) => handleResponse<Expense[]>(r)),
  createExpense: (data: Partial<Expense>) =>
    fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Expense>(r)),

  // Messaging
  getMessageTemplates: () => fetch(`${API_BASE}/messaging/templates`, { headers: getAuthHeaders() }).then((r) => handleResponse<MessageTemplate[]>(r)),
  getMessages: () => fetch(`${API_BASE}/messaging/history`, { headers: getAuthHeaders() }).then((r) => handleResponse<SentMessage[]>(r)).catch(() => []),
  sendMessage: (data: { customerId: string; templateCode?: string; customText?: string; channel?: 'whatsapp' | 'sms' }) =>
    fetch(`${API_BASE}/messaging/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ sent: SentMessage; customer: Customer; cleanPhone: string }>(r)),

  // Reports
  getAnalyticsReport: (params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    return fetch(`${API_BASE}/reports/analytics?${q.toString()}`, { headers: getAuthHeaders() }).then((r) => handleResponse<any>(r));
  },

  // Global Search
  searchGlobal: (query: string) =>
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

  // Settings & Backup
  getSettings: () => fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() }).then((r) => handleResponse<BusinessSettings>(r)),
  updateSettings: (settings: Partial<BusinessSettings>) =>
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(settings),
    }).then((r) => handleResponse<BusinessSettings>(r)),
  exportBackupUrl: `${API_BASE}/settings/backup/export`,
  getBackup: () => fetch(`${API_BASE}/settings/backup/export`, { headers: getAuthHeaders() }).then((r) => r.json()),
  importBackup: (backupData: any) =>
    fetch(`${API_BASE}/settings/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(backupData),
    }).then((r) => handleResponse<{ message: string; count: number }>(r)),
  restoreBackup: (backupData: any) =>
    fetch(`${API_BASE}/settings/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(backupData),
    }).then((r) => handleResponse<{ message: string; count: number }>(r)),
  resetDemoData: () =>
    fetch(`${API_BASE}/settings/reset-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ message: string; db: any }>(r)),
  clearAllData: () =>
    fetch(`${API_BASE}/settings/clear-all-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ message: string; db: any }>(r)),

  // Audit Logs & Users
  getAuditLogs: (params?: { userId?: string; action?: string; module?: string; startDate?: string; endDate?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.append('userId', params.userId);
    if (params?.action) q.append('action', params.action);
    if (params?.module) q.append('module', params.module);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.search) q.append('search', params.search);
    return fetch(`${API_BASE}/audit-logs?${q.toString()}`, { headers: getAuthHeaders() }).then((r) => handleResponse<AuditLog[]>(r));
  },
  getUsers: () => fetch(`${API_BASE}/staff`, { headers: getAuthHeaders() }).then((r) => handleResponse<User[]>(r)),
  createUser: (user: Partial<User>) =>
    fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(user),
    }).then((r) => handleResponse<User>(r)),

  // Staff & Admin Auth
  authLogin: (identifier: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    }).then((r) => handleResponse<AuthSession>(r)),
  authLogout: () =>
    fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  authGetMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ user: User; permissions: PermissionKey[]; isOwner: boolean; isAdmin: boolean }>(r)),
  authChangePassword: (currentPassword: string, newPassword: string) =>
    fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  getPermissions: () =>
    fetch(`${API_BASE}/permissions`).then((r) =>
      handleResponse<{ all: PermissionKey[]; modules: any[]; roleDefaults: Record<string, PermissionKey[]> }>(r)
    ),

  // Staff Management
  getStaff: () => fetch(`${API_BASE}/staff`, { headers: getAuthHeaders() }).then((r) => handleResponse<User[]>(r)),
  createStaff: (data: Partial<User> & { initialPassword?: string }) =>
    fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<User>(r)),
  updateStaff: (id: string, data: Partial<User>) =>
    fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<User>(r)),
  updateStaffStatus: (id: string, status: 'active' | 'inactive' | 'suspended') =>
    fetch(`${API_BASE}/staff/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    }).then((r) => handleResponse<User>(r)),
  updateStaffPermissions: (id: string, permissions: PermissionKey[]) =>
    fetch(`${API_BASE}/staff/${id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ permissions }),
    }).then((r) => handleResponse<User>(r)),
  resetStaffPassword: (id: string, newPassword?: string) =>
    fetch(`${API_BASE}/staff/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ newPassword }),
    }).then((r) => handleResponse<{ success: boolean; message: string; temporaryPassword?: string }>(r)),
  deleteStaff: (id: string) =>
    fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  getStaffActivity: (id: string) =>
    fetch(`${API_BASE}/staff/${id}/activity`, { headers: getAuthHeaders() }).then((r) => handleResponse<AuditLog[]>(r)),

  // Owner Security
  getOwnerSecurity: () =>
    fetch(`${API_BASE}/owner/security`, { headers: getAuthHeaders() }).then((r) => handleResponse<OwnerSecurityProfile>(r)),
  ownerChangePassword: (currentPassword: string, newPassword: string) =>
    fetch(`${API_BASE}/owner/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  ownerChangeEmail: (currentPassword: string, newEmail: string) =>
    fetch(`${API_BASE}/owner/change-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ currentPassword, newEmail }),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  ownerTransferOwnership: (currentPassword: string, targetAdminId: string, confirmationText: string) =>
    fetch(`${API_BASE}/owner/transfer-ownership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ currentPassword, targetAdminId, confirmationText }),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),

  // Staff Reports
  getStaffPerformanceReport: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);
    return fetch(`${API_BASE}/reports/staff-performance?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
      handleResponse<StaffPerformanceSummary[]>(r)
    );
  },
  getDeliveryPerformanceReport: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);
    return fetch(`${API_BASE}/reports/delivery-performance?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
      handleResponse<DeliveryStaffSummary[]>(r)
    );
  },
  getAccountsPerformanceReport: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);
    return fetch(`${API_BASE}/reports/accounts-performance?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
      handleResponse<AccountsStaffSummary[]>(r)
    );
  },

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
    fetch(`${API_BASE}/customer/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<CustomerAuthSession>(r)),
  customerLogin: (identifier: string, password: string) =>
    fetch(`${API_BASE}/customer/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    }).then((r) => handleResponse<CustomerAuthSession>(r)),
  customerLogout: () =>
    fetch(`${API_BASE}/customer/auth/logout`, {
      method: 'POST',
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  customerGetMe: () =>
    fetch(`${API_BASE}/customer/auth/me`, {
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<{ account: CustomerAccount; customer: Customer; addresses: CustomerAddress[] }>(r)),
  customerUpdateProfile: (data: { fullName?: string; email?: string; whatsapp?: string }) =>
    fetch(`${API_BASE}/customer/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<{ account: CustomerAccount; customer: Customer }>(r)),
  customerGetAddresses: () =>
    fetch(`${API_BASE}/customer/addresses`, {
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<CustomerAddress[]>(r)),
  customerAddAddress: (data: Partial<CustomerAddress>) =>
    fetch(`${API_BASE}/customer/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<CustomerAddress>(r)),
  customerUpdateAddress: (id: string, data: Partial<CustomerAddress>) =>
    fetch(`${API_BASE}/customer/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<CustomerAddress>(r)),
  customerDeleteAddress: (id: string) =>
    fetch(`${API_BASE}/customer/addresses/${id}`, {
      method: 'DELETE',
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  customerSetDefaultAddress: (id: string) =>
    fetch(`${API_BASE}/customer/addresses/${id}/default`, {
      method: 'PUT',
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<{ success: boolean; address: CustomerAddress }>(r)),
  customerGetProducts: () =>
    fetch(`${API_BASE}/customer/products`).then((r) => handleResponse<any[]>(r)),
  customerGetOrders: () =>
    fetch(`${API_BASE}/customer/orders`, {
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<OnlineOrder[]>(r)),
  customerGetOrderById: (id: string) =>
    fetch(`${API_BASE}/customer/orders/${id}`, {
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<OnlineOrder>(r)),
  customerCreateOrder: (data: {
    addressId?: string;
    quantity: number;
    preferredDate?: string;
    preferredTimeSlot?: string;
    customerNotes?: string;
    paymentMethod?: string;
  }) =>
    fetch(`${API_BASE}/customer/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCustomerAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<OnlineOrder>(r)),
  customerCancelOrder: (id: string) =>
    fetch(`${API_BASE}/customer/orders/${id}/cancel`, {
      method: 'PUT',
      headers: getCustomerAuthHeaders(),
    }).then((r) => handleResponse<OnlineOrder>(r)),

  // Admin Online Orders
  getOnlineOrders: (params?: { status?: string; source?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.source) q.append('source', params.source);
    if (params?.search) q.append('search', params.search);
    return fetch(`${API_BASE}/online-orders?${q.toString()}`, { headers: getAuthHeaders() }).then((r) =>
      handleResponse<OnlineOrder[]>(r)
    );
  },
  getOnlineOrderById: (id: string) =>
    fetch(`${API_BASE}/online-orders/${id}`, { headers: getAuthHeaders() }).then((r) =>
      handleResponse<OnlineOrder>(r)
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
    fetch(`${API_BASE}/online-orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<OnlineOrder>(r)),
};
