/**
 * In-browser mock database engine.
 * When the app is served as a static client (e.g. GitHub Pages or static host)
 * where the Node/Express backend /api is not running, this mock layer seamlessly
 * satisfies all requests using localStorage and seeded business data so the application
 * remains 100% interactive and NEVER shows a white screen.
 */

import { FALLBACK_DB } from '../data/fallbackDb';
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
import { ALL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '../utils/permissions';

const STORAGE_KEY = 'water_client_storage_db_v1';

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getLocalDb(): any {
  if (typeof window === 'undefined') {
    return clone(FALLBACK_DB);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const initial = clone(FALLBACK_DB);
  saveLocalDb(initial);
  return initial;
}

function saveLocalDb(data: any) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}

export const mockBackend = {
  checkHealth: async () => ({ status: 'ok', mode: 'offline-client' }),

  getDashboardStats: async (): Promise<DashboardStats> => {
    const db = getLocalDb();
    const inventory: InventoryItem[] = db.inventory || [];
    const filledItem = inventory.find((i) => i.id === 'INV-ITEM-2');
    const emptyItem = inventory.find((i) => i.id === 'INV-ITEM-1');
    const customers: Customer[] = db.customers || [];
    const sales: Sale[] = db.sales || [];
    const payments: Payment[] = db.payments || [];
    const onlineOrders: OnlineOrder[] = db.online_orders || [];

    const totalBottlesWithCust = customers.reduce((sum, c) => sum + (c.bottlesWithCustomer || 0), 0);
    const totalReceivables = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => (s.date || '').startsWith(todayStr));
    const todaySalesAmount = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const todayCollection = payments
      .filter((p) => (p.date || '').startsWith(todayStr))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.active).length,
      totalFilledBottles: filledItem?.currentStock ?? 320,
      filledBottlesStock: filledItem?.currentStock ?? 320,
      totalEmptyBottles: emptyItem?.currentStock ?? 145,
      emptyBottlesStock: emptyItem?.currentStock ?? 145,
      bottlesWithCustomers: totalBottlesWithCust || 850,
      totalBottlesWithCustomers: totalBottlesWithCust || 850,
      todaySales: todaySales.length || 18,
      todaySalesAmount: todaySalesAmount || 14200,
      todaySalesCount: todaySales.length || 18,
      todayBottlesSold: 85,
      thisMonthSalesAmount: 185000,
      thisMonthExpenses: 42000,
      netMonthlyProfit: 143000,
      todayCollection: todayCollection || 12500,
      totalOutstandingReceivables: totalReceivables || 48500,
      totalReceivableBalance: totalReceivables || 48500,
      totalPayables: 12000,
      totalSupplierPayable: 12000,
      todayExpenses: 1500,
      todayRefilling: 120,
      damagedBottlesCount: 2,
      lowInventoryAlertsCount: 0,
      lowStockItems: [],
      lowInventoryAlerts: [],
      salesTrendLast7Days: [],
      expenseCategories: [],
      recentSales: (db.sales || []).slice(0, 5),
      recentDeliveries: (db.deliveries || []).slice(0, 5),
      recentRefilling: (db.refilling || []).slice(0, 5),
      pendingOnlineOrdersCount: onlineOrders.filter((o) => o.status === 'pending').length,
    };
  },

  getCustomers: async (params?: { type?: string; area?: string; active?: boolean; search?: string }): Promise<Customer[]> => {
    const db = getLocalDb();
    let list: Customer[] = db.customers || [];
    if (params?.type && params.type !== 'all') {
      list = list.filter((c) => c.customerType === params.type);
    }
    if (params?.area && params.area !== 'all') {
      list = list.filter((c) => c.area === params.area);
    }
    if (params?.active !== undefined) {
      list = list.filter((c) => c.active === params.active);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q));
    }
    return clone(list);
  },

  getCustomerById: async (id: string) => {
    const db = getLocalDb();
    const customer = (db.customers || []).find((c: any) => c.id === id);
    if (!customer) throw new Error('Customer not found');
    return {
      customer: clone(customer),
      transactions: (db.customer_transactions || []).filter((t: any) => t.customerId === id),
      bottleLedger: (db.customer_bottle_ledger || []).filter((b: any) => b.customerId === id),
      deliveries: (db.deliveries || []).filter((d: any) => d.customerId === id),
      sales: (db.sales || []).filter((s: any) => s.customerId === id),
      payments: (db.payments || []).filter((p: any) => p.customerId === id),
      messages: (db.messages || []).filter((m: any) => m.customerId === id),
    };
  },

  createCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const db = getLocalDb();
    const newCust: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: customerData.name || 'New Customer',
      customerType: customerData.customerType || 'regular',
      mobile: customerData.mobile || '',
      whatsapp: customerData.whatsapp || '',
      address: customerData.address || '',
      area: customerData.area || 'Clifton',
      city: customerData.city || 'Karachi',
      bottlesWithCustomer: customerData.bottlesWithCustomer || 0,
      securityDeposit: customerData.securityDeposit || 0,
      currentBalance: customerData.currentBalance || 0,
      creditLimit: customerData.creditLimit || 5000,
      ratePerBottle: customerData.ratePerBottle || 150,
      registrationDate: customerData.registrationDate || new Date().toISOString().split('T')[0],
      active: true,
      ...customerData,
    };
    db.customers = db.customers || [];
    db.customers.unshift(newCust);
    saveLocalDb(db);
    return clone(newCust);
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    const db = getLocalDb();
    const idx = (db.customers || []).findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    db.customers[idx] = { ...db.customers[idx], ...customerData };
    saveLocalDb(db);
    return clone(db.customers[idx]);
  },

  deleteCustomer: async (id: string) => {
    const db = getLocalDb();
    const idx = (db.customers || []).findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    const deletedCustomer = db.customers.splice(idx, 1)[0];
    saveLocalDb(db);
    return { success: true, deletedCustomer };
  },

  bulkUpdateCustomerRates: async (payload: any) => {
    const db = getLocalDb();
    const updatedCustomers: Customer[] = [];
    (db.customers || []).forEach((c: Customer) => {
      let match = true;
      if (payload.area && c.area !== payload.area) match = false;
      if (payload.customerType && c.customerType !== payload.customerType) match = false;
      if (match) {
        if (payload.newRate !== undefined) c.ratePerBottle = payload.newRate;
        if (payload.adjustAmount !== undefined) c.ratePerBottle = (c.ratePerBottle || 150) + payload.adjustAmount;
        updatedCustomers.push(c);
      }
    });
    saveLocalDb(db);
    return { success: true, count: updatedCustomers.length, updatedCustomers };
  },

  recordCustomerBottleTx: async (customerId: string, data: any) => {
    const db = getLocalDb();
    const cust = (db.customers || []).find((c: any) => c.id === customerId);
    if (!cust) throw new Error('Customer not found');
    const net = (data.filledDelivered || 0) - (data.emptyReturned || 0);
    cust.bottlesWithCustomer = Math.max(0, (cust.bottlesWithCustomer || 0) + net);
    const bottleTx: CustomerBottleTransaction = {
      id: `BTX-${Date.now()}`,
      customerId,
      customerName: cust.name,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'delivered',
      filledDelivered: data.filledDelivered || 0,
      emptyReturned: data.emptyReturned || 0,
      netChange: net,
      runningBottleBalance: cust.bottlesWithCustomer,
      notes: data.notes || '',
      referenceId: data.referenceId,
      createdBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
    };
    db.customer_bottle_ledger = db.customer_bottle_ledger || [];
    db.customer_bottle_ledger.unshift(bottleTx);
    saveLocalDb(db);
    return { customer: clone(cust), bottleTx };
  },

  getRefillBatches: async (): Promise<RefillBatch[]> => {
    const db = getLocalDb();
    return clone(db.refilling || []);
  },

  createRefillBatch: async (batchData: Partial<RefillBatch>): Promise<RefillBatch> => {
    const db = getLocalDb();
    const produced = batchData.filledBottlesProduced || 100;
    const newBatch: RefillBatch = {
      id: `REF-${Date.now().toString().slice(-4)}`,
      refillNumber: `BAT-${Date.now().toString().slice(-6)}`,
      date: batchData.date || new Date().toISOString().split('T')[0],
      bottleSize: batchData.bottleSize || '19-Liter',
      emptyBottlesUsed: batchData.emptyBottlesUsed || produced,
      filledBottlesProduced: produced,
      damagedBottles: batchData.damagedBottles || 0,
      rejectedBottles: batchData.rejectedBottles || 0,
      operator: batchData.operator || 'Ahmed Khan',
      notes: batchData.notes || '',
      status: 'completed',
      createdBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
      ...batchData,
    };
    db.refilling = db.refilling || [];
    db.refilling.unshift(newBatch);

    // Update inventory
    const filledItem = (db.inventory || []).find((i: any) => i.id === 'INV-ITEM-2');
    const emptyItem = (db.inventory || []).find((i: any) => i.id === 'INV-ITEM-1');
    if (filledItem) filledItem.currentStock = (filledItem.currentStock || 0) + newBatch.filledBottlesProduced;
    if (emptyItem) emptyItem.currentStock = Math.max(0, (emptyItem.currentStock || 0) - newBatch.emptyBottlesUsed);

    saveLocalDb(db);
    return clone(newBatch);
  },

  cancelRefillBatch: async (id: string): Promise<RefillBatch> => {
    const db = getLocalDb();
    const batch = (db.refilling || []).find((r: any) => r.id === id);
    if (!batch) throw new Error('Batch not found');
    batch.status = 'cancelled';
    saveLocalDb(db);
    return clone(batch);
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    const db = getLocalDb();
    return clone(db.inventory || []);
  },

  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    const db = getLocalDb();
    return clone(db.inventory_transactions || []);
  },

  adjustInventory: async (data: { itemId: string; adjustmentQty: number; reason: string }) => {
    const db = getLocalDb();
    const item = (db.inventory || []).find((i: any) => i.id === data.itemId);
    if (!item) throw new Error('Inventory item not found');
    const before = item.currentStock || 0;
    item.currentStock = Math.max(0, before + data.adjustmentQty);
    const tx: InventoryTransaction = {
      id: `ITX-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      date: new Date().toISOString().split('T')[0],
      type: 'adjustment',
      quantityChange: data.adjustmentQty,
      resultingStock: item.currentStock,
      reason: data.reason,
      createdBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
    };
    db.inventory_transactions = db.inventory_transactions || [];
    db.inventory_transactions.unshift(tx);
    saveLocalDb(db);
    return { item: clone(item), tx };
  },

  getSales: async (): Promise<Sale[]> => {
    const db = getLocalDb();
    return clone(db.sales || []);
  },

  createSale: async (saleData: any): Promise<Sale> => {
    const db = getLocalDb();
    const customer = (db.customers || []).find((c: any) => c.id === saleData.customerId);
    const qty = saleData.quantity || 1;
    const rate = saleData.rate || 150;
    const total = qty * rate;
    const paid = saleData.paidAmount || (saleData.paymentStatus === 'paid' ? total : 0);
    const remaining = total - paid;

    const newSale: Sale = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerId: saleData.customerId,
      customerName: customer?.name || 'Customer',
      date: saleData.date || new Date().toISOString().split('T')[0],
      items: [
        {
          itemId: `ITEM-1`,
          itemName: '19L Mineral Water Refill',
          quantity: qty,
          rate: rate,
          total: total,
        },
      ],
      quantity: qty,
      emptyBottlesReceived: saleData.emptyBottlesReceived || 0,
      rate: rate,
      subtotal: total,
      discount: 0,
      deliveryCharges: 0,
      total: total,
      paidAmount: paid,
      remainingBalance: remaining,
      paymentMethod: saleData.paymentMethod || 'Cash',
      paymentStatus: remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      deliveryPerson: saleData.deliveryPerson || 'Rashid Mehmood',
      status: 'completed',
      createdBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
    };

    db.sales = db.sales || [];
    db.sales.unshift(newSale);

    if (customer) {
      customer.currentBalance = (customer.currentBalance || 0) + remaining;
      customer.bottlesWithCustomer = Math.max(
        0,
        (customer.bottlesWithCustomer || 0) + qty - (newSale.emptyBottlesReceived || 0)
      );
    }

    saveLocalDb(db);
    return clone(newSale);
  },

  getPayments: async (): Promise<Payment[]> => {
    const db = getLocalDb();
    return clone(db.payments || []);
  },

  recordPayment: async (paymentData: any): Promise<Payment> => {
    const db = getLocalDb();
    const customer = (db.customers || []).find((c: any) => c.id === paymentData.customerId);
    const newPayment: Payment = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      customerId: paymentData.customerId,
      customerName: customer?.name || 'Customer',
      date: paymentData.date || new Date().toISOString().split('T')[0],
      amount: Number(paymentData.amount) || 0,
      paymentMethod: paymentData.paymentMethod || 'Cash',
      referenceNumber: paymentData.referenceNumber || '',
      notes: paymentData.notes || '',
      receivedBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
    };

    db.payments = db.payments || [];
    db.payments.unshift(newPayment);

    if (customer) {
      customer.currentBalance = Math.max(0, (customer.currentBalance || 0) - newPayment.amount);
    }

    saveLocalDb(db);
    return clone(newPayment);
  },

  deletePayment: async (id: string) => {
    const db = getLocalDb();
    const idx = (db.payments || []).findIndex((p: any) => p.id === id);
    if (idx === -1) throw new Error('Payment not found');
    const deletedPayment = db.payments.splice(idx, 1)[0];
    const customer = (db.customers || []).find((c: any) => c.id === deletedPayment.customerId);
    if (customer) {
      customer.currentBalance = (customer.currentBalance || 0) + (deletedPayment.amount || 0);
    }
    saveLocalDb(db);
    return { success: true, deletedPayment, customer };
  },

  clearAllPayments: async () => {
    const db = getLocalDb();
    const count = (db.payments || []).length;
    db.payments = [];
    saveLocalDb(db);
    return { success: true, message: 'All payments cleared in local state', count };
  },

  getDeliveries: async (): Promise<DeliveryRecord[]> => {
    const db = getLocalDb();
    return clone(db.deliveries || []);
  },

  createDelivery: async (deliveryData: any): Promise<DeliveryRecord> => {
    const db = getLocalDb();
    const customer = (db.customers || []).find((c: any) => c.id === deliveryData.customerId);
    const filled = deliveryData.filledDelivered || deliveryData.bottlesToDeliver || 2;
    const rate = deliveryData.rate || 150;
    const total = filled * rate;
    const paid = deliveryData.paid || 0;
    const newDel: DeliveryRecord = {
      id: `DEL-${Date.now().toString().slice(-4)}`,
      deliveryNumber: `DEL-${Date.now().toString().slice(-6)}`,
      customerId: deliveryData.customerId,
      customerName: customer?.name || 'Customer',
      phone: customer?.mobile || '',
      address: customer?.address || '',
      area: customer?.area || 'Clifton',
      date: deliveryData.date || new Date().toISOString().split('T')[0],
      deliveryPerson: deliveryData.deliveryPerson || 'Rashid Mehmood',
      filledDelivered: filled,
      emptyReceived: deliveryData.emptyReceived || 0,
      rate: rate,
      total: total,
      paid: paid,
      remaining: total - paid,
      paymentMethod: deliveryData.paymentMethod || 'Cash',
      status: deliveryData.status || 'pending',
      notes: deliveryData.notes || '',
      createdAt: new Date().toISOString(),
    };
    db.deliveries = db.deliveries || [];
    db.deliveries.unshift(newDel);
    saveLocalDb(db);
    return clone(newDel);
  },

  updateDeliveryStatus: async (id: string, data: any): Promise<DeliveryRecord> => {
    const db = getLocalDb();
    const del = (db.deliveries || []).find((d: any) => d.id === id);
    if (!del) throw new Error('Delivery not found');
    Object.assign(del, data);
    saveLocalDb(db);
    return clone(del);
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    const db = getLocalDb();
    return clone(db.suppliers || []);
  },

  getSupplierById: async (id: string) => {
    const db = getLocalDb();
    const supplier = (db.suppliers || []).find((s: any) => s.id === id);
    if (!supplier) throw new Error('Supplier not found');
    return {
      supplier: clone(supplier),
      transactions: (db.supplier_transactions || []).filter((t: any) => t.supplierId === id),
      purchases: (db.purchases || []).filter((p: any) => p.supplierId === id),
    };
  },

  createSupplier: async (data: any): Promise<Supplier> => {
    const db = getLocalDb();
    const newSup: Supplier = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New Supplier',
      contactPerson: data.contactPerson || '',
      mobile: data.mobile || data.phone || '',
      address: data.address || '',
      productSupplied: data.productSupplied || 'Raw Materials',
      totalPurchases: 0,
      totalPaid: 0,
      balancePayable: 0,
      createdAt: new Date().toISOString(),
      ...data,
    };
    db.suppliers = db.suppliers || [];
    db.suppliers.unshift(newSup);
    saveLocalDb(db);
    return clone(newSup);
  },

  updateSupplier: async (id: string, data: any): Promise<Supplier> => {
    const db = getLocalDb();
    const sup = (db.suppliers || []).find((s: any) => s.id === id);
    if (!sup) throw new Error('Supplier not found');
    Object.assign(sup, data);
    saveLocalDb(db);
    return clone(sup);
  },

  deleteSupplier: async (id: string) => {
    const db = getLocalDb();
    const idx = (db.suppliers || []).findIndex((s: any) => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    const deletedSupplier = db.suppliers.splice(idx, 1)[0];
    saveLocalDb(db);
    return { success: true, deletedSupplier };
  },

  getPurchases: async (): Promise<Purchase[]> => {
    const db = getLocalDb();
    return clone(db.purchases || []);
  },

  createPurchase: async (data: any): Promise<Purchase> => {
    const db = getLocalDb();
    const total = Number(data.total) || Number(data.totalAmount) || 0;
    const paid = Number(data.paidAmount) || 0;
    const newPur: Purchase = {
      id: `PUR-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `PUR-${Date.now().toString().slice(-6)}`,
      supplierId: data.supplierId,
      supplierName: data.supplierName || 'Vendor',
      date: data.date || new Date().toISOString().split('T')[0],
      itemCategory: data.itemCategory || 'empty_bottles',
      itemId: data.itemId || 'INV-ITEM-1',
      itemName: data.itemName || 'Raw Materials',
      quantity: data.quantity || 10,
      rate: data.rate || 100,
      total: total,
      paidAmount: paid,
      remainingBalance: total - paid,
      paymentMethod: data.paymentMethod || 'Cash',
      receivedBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
    };
    db.purchases = db.purchases || [];
    db.purchases.unshift(newPur);
    saveLocalDb(db);
    return clone(newPur);
  },

  paySupplier: async (supplierId: string, data: any) => {
    const db = getLocalDb();
    const sup = (db.suppliers || []).find((s: any) => s.id === supplierId);
    if (!sup) throw new Error('Supplier not found');
    sup.balancePayable = Math.max(0, (sup.balancePayable || 0) - (data.amount || 0));
    const tx: SupplierTransaction = {
      id: `STX-${Date.now()}`,
      supplierId,
      supplierName: sup.name,
      date: new Date().toISOString().split('T')[0],
      type: 'payment',
      description: data.notes || 'Supplier Payment',
      debit: data.amount || 0,
      credit: 0,
      runningBalance: sup.balancePayable,
      createdBy: 'Ahmed Khan',
      createdAt: new Date().toISOString(),
    };
    db.supplier_transactions = db.supplier_transactions || [];
    db.supplier_transactions.unshift(tx);
    saveLocalDb(db);
    return { supplier: clone(sup), tx };
  },

  getExpenses: async (): Promise<Expense[]> => {
    const db = getLocalDb();
    return clone(db.expenses || []);
  },

  createExpense: async (data: any): Promise<Expense> => {
    const db = getLocalDb();
    const newExp: Expense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      voucherNumber: `EXP-${Date.now().toString().slice(-6)}`,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'Other',
      description: data.description || data.title || 'Expense',
      amount: Number(data.amount) || 0,
      paymentMethod: data.paymentMethod || 'Cash',
      paidTo: data.paidTo || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    db.expenses = db.expenses || [];
    db.expenses.unshift(newExp);
    saveLocalDb(db);
    return clone(newExp);
  },

  deleteExpense: async (id: string) => {
    const db = getLocalDb();
    const idx = (db.expenses || []).findIndex((e: any) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    const deletedExpense = db.expenses.splice(idx, 1)[0];
    saveLocalDb(db);
    return { success: true, deletedExpense };
  },

  getMessageTemplates: async (): Promise<MessageTemplate[]> => {
    const db = getLocalDb();
    return clone(db.message_templates || []);
  },

  updateMessageTemplate: async (id: string, data: any): Promise<MessageTemplate> => {
    const db = getLocalDb();
    const tmpl = (db.message_templates || []).find((t: any) => t.id === id);
    if (!tmpl) throw new Error('Template not found');
    Object.assign(tmpl, data);
    saveLocalDb(db);
    return clone(tmpl);
  },

  getSentMessages: async (): Promise<SentMessage[]> => {
    const db = getLocalDb();
    return clone(db.messages || []);
  },

  sendMessage: async (data: any) => {
    const db = getLocalDb();
    const cust = (db.customers || []).find((c: any) => c.id === data.customerId);
    const newMsg: SentMessage = {
      id: `MSG-${Date.now()}`,
      customerId: data.customerId,
      customerName: cust?.name || 'Customer',
      recipientPhone: cust?.mobile || '',
      templateCode: data.templateCode || 'custom',
      message: data.customText || 'Message from Anmol Pure Water',
      channel: data.channel || 'whatsapp',
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    db.messages = db.messages || [];
    db.messages.unshift(newMsg);
    saveLocalDb(db);
    return {
      sent: clone(newMsg),
      customer: cust || clone((db.customers || [])[0]),
      cleanPhone: (cust?.mobile || '').replace(/\D/g, ''),
    };
  },

  getSettings: async (): Promise<BusinessSettings> => {
    const db = getLocalDb();
    return clone(db.settings || FALLBACK_DB.settings);
  },

  updateSettings: async (settingsData: BusinessSettings): Promise<BusinessSettings> => {
    const db = getLocalDb();
    db.settings = { ...db.settings, ...settingsData };
    saveLocalDb(db);
    return clone(db.settings);
  },

  getBackup: async () => {
    return getLocalDb();
  },

  restoreBackup: async (backupData: any) => {
    saveLocalDb(backupData);
    return { message: 'Database restored successfully', count: Object.keys(backupData).length };
  },

  clearDatabase: async () => {
    const fresh = clone(FALLBACK_DB);
    saveLocalDb(fresh);
    return { message: 'Database reset to initial template', db: fresh };
  },

  getFinancialReport: async () => {
    const db = getLocalDb();
    const sales: Sale[] = db.sales || [];
    const expenses: Expense[] = db.expenses || [];
    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      salesCount: sales.length,
      expenseCount: expenses.length,
    };
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const db = getLocalDb();
    return clone(db.audit_logs || []);
  },

  getUsers: async (): Promise<User[]> => {
    const db = getLocalDb();
    return clone(db.users || FALLBACK_DB.users);
  },

  createUser: async (user: Partial<User>): Promise<User> => {
    const db = getLocalDb();
    const newUser: User = {
      id: `USR-${Date.now()}`,
      employeeId: `EMP-${Date.now().toString().slice(-3)}`,
      name: user.name || 'Staff Member',
      email: user.email || '',
      role: user.role || 'staff',
      phone: user.phone || '',
      status: 'active',
      active: true,
      permissions: ROLE_DEFAULT_PERMISSIONS[user.role || 'staff'] || [],
      createdAt: new Date().toISOString(),
      ...user,
    };
    db.users = db.users || [];
    db.users.push(newUser);
    saveLocalDb(db);
    return clone(newUser);
  },

  authLogin: async (identifier: string, _password: string): Promise<AuthSession> => {
    const db = getLocalDb();
    const users: User[] = db.users || FALLBACK_DB.users;
    const match = users.find(
      (u) => (u.email || '').toLowerCase() === identifier.toLowerCase() || (u.employeeId || '').toLowerCase() === identifier.toLowerCase()
    ) || users[0];

    const session: AuthSession = {
      token: `mock-token-${match.id}-${Date.now()}`,
      user: match,
      permissions: match.permissions || ALL_PERMISSIONS,
      isOwner: match.role === 'owner',
      isAdmin: match.role === 'admin' || match.role === 'owner',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    return session;
  },

  authLogout: async () => ({ success: true, message: 'Logged out' }),

  authGetMe: async () => {
    const db = getLocalDb();
    const user: User = (db.users || FALLBACK_DB.users)[0];
    return {
      user,
      permissions: user.permissions || ALL_PERMISSIONS,
      isOwner: user.role === 'owner',
      isAdmin: true,
    };
  },

  authChangePassword: async () => ({ success: true, message: 'Password updated' }),

  getPermissions: async () => ({
    all: ALL_PERMISSIONS,
    modules: [],
    roleDefaults: ROLE_DEFAULT_PERMISSIONS,
  }),

  getStaff: async (): Promise<User[]> => {
    const db = getLocalDb();
    return clone(db.users || FALLBACK_DB.users);
  },

  createStaff: async (data: any): Promise<User> => {
    return mockBackend.createUser(data);
  },

  updateStaff: async (id: string, data: Partial<User>): Promise<User> => {
    const db = getLocalDb();
    const user = (db.users || []).find((u: any) => u.id === id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    saveLocalDb(db);
    return clone(user);
  },

  updateStaffStatus: async (id: string, status: any): Promise<User> => {
    const db = getLocalDb();
    const user = (db.users || []).find((u: any) => u.id === id);
    if (!user) throw new Error('User not found');
    user.status = status;
    user.active = status === 'active';
    saveLocalDb(db);
    return clone(user);
  },

  updateStaffPermissions: async (id: string, permissions: PermissionKey[]): Promise<User> => {
    const db = getLocalDb();
    const user = (db.users || []).find((u: any) => u.id === id);
    if (!user) throw new Error('User not found');
    user.permissions = permissions;
    saveLocalDb(db);
    return clone(user);
  },

  resetStaffPassword: async () => ({ success: true, message: 'Password reset' }),

  deleteStaff: async (id: string) => {
    const db = getLocalDb();
    db.users = (db.users || []).filter((u: any) => u.id !== id);
    saveLocalDb(db);
    return { success: true, message: 'Staff deleted' };
  },

  getStaffActivity: async (): Promise<AuditLog[]> => {
    return [];
  },

  getOwnerSecurity: async (): Promise<OwnerSecurityProfile> => {
    return {
      id: 'USR-1',
      name: 'Ahmed Khan',
      email: 'owner@anmolpurewater.com',
      phone: '+92 300 1112233',
      role: 'owner',
      status: 'active',
      mfaEnabled: true,
      lastPasswordChange: '2026-01-01',
      createdAt: '2025-01-01',
    };
  },

  ownerChangePassword: async () => ({ success: true, message: 'Owner password changed' }),
  ownerChangeEmail: async () => ({ success: true, message: 'Owner email updated' }),
  ownerTransferOwnership: async () => ({ success: true, message: 'Ownership transferred' }),

  getStaffPerformanceReport: async (): Promise<StaffPerformanceSummary[]> => [],
  getDeliveryPerformanceReport: async (): Promise<DeliveryStaffSummary[]> => [],
  getAccountsPerformanceReport: async (): Promise<AccountsStaffSummary[]> => [],

  // Customer Portal
  customerRegister: async (data: any): Promise<CustomerAuthSession> => {
    const db = getLocalDb();
    const accId = `ACC-${Date.now()}`;
    const custId = `CUST-${Date.now().toString().slice(-4)}`;
    const account: CustomerAccount = {
      id: accId,
      customerId: custId,
      mobile: data.mobile,
      fullName: data.fullName,
      email: data.email || '',
      whatsapp: data.whatsapp || data.mobile,
      passwordHash: '',
      salt: '',
      authProvider: 'email',
      emailVerified: true,
      phoneVerified: true,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    };
    const customer: Customer = {
      id: custId,
      name: data.fullName,
      mobile: data.mobile,
      whatsapp: data.whatsapp || data.mobile,
      address: data.houseOffice ? `${data.houseOffice}, ${data.streetRoad}, ${data.area}` : 'Karachi',
      area: data.area || 'Clifton',
      city: data.city || 'Karachi',
      customerType: 'regular',
      bottlesWithCustomer: 0,
      securityDeposit: 0,
      currentBalance: 0,
      creditLimit: 5000,
      ratePerBottle: 150,
      registrationDate: new Date().toISOString().split('T')[0],
      active: true,
    };
    db.customer_accounts = db.customer_accounts || [];
    db.customer_accounts.push(account);
    db.customers = db.customers || [];
    db.customers.push(customer);
    saveLocalDb(db);
    return {
      token: `cust-token-${account.id}`,
      account: {
        id: account.id,
        customerId: account.customerId,
        fullName: account.fullName,
        email: account.email,
        mobile: account.mobile,
        whatsapp: account.whatsapp,
        accountStatus: account.accountStatus,
      },
      customer,
    };
  },

  customerLogin: async (identifier: string, _password: string): Promise<CustomerAuthSession> => {
    const db = getLocalDb();
    const accounts: CustomerAccount[] = db.customer_accounts || [];
    let acc = accounts.find((a) => a.mobile === identifier || a.email === identifier);
    if (!acc) {
      // Create instant account for smooth demo / testing
      acc = {
        id: `ACC-DEMO`,
        customerId: `CUST-1001`,
        mobile: identifier,
        fullName: 'Online Customer',
        email: identifier.includes('@') ? identifier : 'customer@anmolpurewater.com',
        whatsapp: identifier,
        passwordHash: '',
        salt: '',
        authProvider: 'email',
        emailVerified: true,
        phoneVerified: true,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
      };
    }
    const customer: Customer = (db.customers || []).find((c: any) => c.id === acc!.customerId) || {
      id: acc!.customerId,
      name: acc!.fullName,
      mobile: acc!.mobile,
      address: 'House 14, Block 5, Clifton, Karachi',
      area: 'Clifton',
      city: 'Karachi',
      customerType: 'regular',
      bottlesWithCustomer: 2,
      securityDeposit: 1000,
      currentBalance: 0,
      creditLimit: 5000,
      ratePerBottle: 150,
      registrationDate: '2026-01-01',
      active: true,
    };
    return {
      token: `cust-token-${acc!.id}`,
      account: {
        id: acc!.id,
        customerId: acc!.customerId,
        fullName: acc!.fullName,
        email: acc!.email,
        mobile: acc!.mobile,
        whatsapp: acc!.whatsapp,
        accountStatus: acc!.accountStatus,
      },
      customer,
    };
  },

  customerLogout: async () => ({ success: true, message: 'Logged out' }),

  customerGetMe: async () => {
    const db = getLocalDb();
    const account: CustomerAccount = (db.customer_accounts || [])[0] || {
      id: 'ACC-1',
      customerId: 'CUST-1001',
      mobile: '+92 300 1234567',
      fullName: 'Online Customer',
      email: 'customer@anmolpurewater.com',
      passwordHash: '',
      salt: '',
      authProvider: 'email',
      emailVerified: true,
      phoneVerified: true,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    };
    const customer = (db.customers || []).find((c: any) => c.id === account.customerId) || (db.customers || [])[0];
    return {
      account,
      customer,
      addresses: (db.customer_addresses || []).filter((a: any) => a.customerId === customer?.id),
    };
  },

  customerUpdateProfile: async (data: any) => {
    const db = getLocalDb();
    const acc = (db.customer_accounts || [])[0] || { id: 'ACC-1', customerId: 'CUST-1001', fullName: data.fullName };
    Object.assign(acc, data);
    saveLocalDb(db);
    return { account: acc, customer: (db.customers || [])[0] };
  },

  customerGetAddresses: async (): Promise<CustomerAddress[]> => {
    const db = getLocalDb();
    return clone(db.customer_addresses || [
      {
        id: 'ADDR-1',
        customerId: 'CUST-1001',
        label: 'Home',
        fullAddress: 'House 14, Block 5, Clifton',
        area: 'Clifton',
        city: 'Karachi',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },

  customerAddAddress: async (data: any): Promise<CustomerAddress> => {
    const db = getLocalDb();
    const newAddr: CustomerAddress = {
      id: `ADDR-${Date.now()}`,
      customerId: 'CUST-1001',
      label: data.label || 'Home',
      fullAddress: data.fullAddress || '',
      area: data.area || 'Clifton',
      city: data.city || 'Karachi',
      deliveryInstructions: data.deliveryInstructions,
      isDefault: Boolean(data.isDefault),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.customer_addresses = db.customer_addresses || [];
    db.customer_addresses.push(newAddr);
    saveLocalDb(db);
    return clone(newAddr);
  },

  customerUpdateAddress: async (id: string, data: any): Promise<CustomerAddress> => {
    const db = getLocalDb();
    const addr = (db.customer_addresses || []).find((a: any) => a.id === id);
    if (!addr) throw new Error('Address not found');
    Object.assign(addr, data);
    saveLocalDb(db);
    return clone(addr);
  },

  customerDeleteAddress: async (id: string) => {
    const db = getLocalDb();
    db.customer_addresses = (db.customer_addresses || []).filter((a: any) => a.id !== id);
    saveLocalDb(db);
    return { success: true, message: 'Address removed' };
  },

  customerSetDefaultAddress: async (id: string) => {
    const db = getLocalDb();
    (db.customer_addresses || []).forEach((a: any) => {
      a.isDefault = a.id === id;
    });
    saveLocalDb(db);
    const addr = (db.customer_addresses || []).find((a: any) => a.id === id);
    return { success: true, address: addr };
  },

  customerGetProducts: async () => [
    {
      id: 'PROD-1',
      name: '19L Mountain Mineral Water Refill',
      price: 150,
      description: 'Pure, multi-stage filtered and ozonated mineral water refill for standard 19L dispensers.',
    },
  ],

  customerGetOrders: async (): Promise<OnlineOrder[]> => {
    const db = getLocalDb();
    return clone(db.online_orders || []);
  },

  customerGetOrderById: async (id: string): Promise<OnlineOrder> => {
    const db = getLocalDb();
    const order = (db.online_orders || []).find((o: any) => o.id === id);
    if (!order) throw new Error('Order not found');
    return clone(order);
  },

  customerCreateOrder: async (data: any): Promise<OnlineOrder> => {
    const db = getLocalDb();
    const qty = data.quantity || 2;
    const newOrder: OnlineOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      customerId: 'CUST-1001',
      customerName: 'Online Customer',
      customerPhone: '+92 300 1234567',
      addressId: data.addressId || 'ADDR-1',
      deliveryAddress: 'House 14, Block 5, Clifton, Karachi',
      deliveryArea: 'Clifton',
      deliveryCity: 'Karachi',
      status: 'pending',
      orderSource: 'website',
      items: [
        {
          productId: 'PROD-1',
          productName: '19L Mineral Water Refill',
          quantity: qty,
          unitPrice: 150,
          totalPrice: qty * 150,
        },
      ],
      totalBottles: qty,
      totalAmount: qty * 150,
      paymentMethod: data.paymentMethod || 'Cash on Delivery',
      paymentStatus: 'cash_on_delivery',
      preferredDate: data.preferredDate || new Date().toISOString().split('T')[0],
      preferredTimeSlot: data.preferredTimeSlot || 'Morning (9:00 AM - 1:00 PM)',
      customerNotes: data.customerNotes || '',
      createdAt: new Date().toISOString(),
    };
    db.online_orders = db.online_orders || [];
    db.online_orders.unshift(newOrder);
    saveLocalDb(db);
    return clone(newOrder);
  },

  customerCancelOrder: async (id: string): Promise<OnlineOrder> => {
    const db = getLocalDb();
    const order = (db.online_orders || []).find((o: any) => o.id === id);
    if (!order) throw new Error('Order not found');
    order.status = 'cancelled';
    saveLocalDb(db);
    return clone(order);
  },

  getOnlineOrders: async (params?: { status?: string; source?: string; search?: string }): Promise<OnlineOrder[]> => {
    const db = getLocalDb();
    let orders: OnlineOrder[] = db.online_orders || [];
    if (params?.status && params.status !== 'all') {
      orders = orders.filter((o) => o.status === params.status);
    }
    if (params?.source && params.source !== 'all') {
      orders = orders.filter((o) => o.orderSource === params.source);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.customerPhone || '').includes(q)
      );
    }
    return clone(orders);
  },

  getOnlineOrderById: async (id: string): Promise<OnlineOrder> => {
    const db = getLocalDb();
    const order = (db.online_orders || []).find((o: any) => o.id === id);
    if (!order) throw new Error('Order not found');
    return clone(order);
  },

  updateOnlineOrderStatus: async (id: string, data: any): Promise<OnlineOrder> => {
    const db = getLocalDb();
    const order = (db.online_orders || []).find((o: any) => o.id === id);
    if (!order) throw new Error('Order not found');
    Object.assign(order, data);
    saveLocalDb(db);
    return clone(order);
  },
};
