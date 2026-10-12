import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './server/db.js';
import {
  Customer,
  CustomerTransaction,
  CustomerBottleTransaction,
  InventoryTransaction,
  RefillBatch,
  Sale,
  Payment,
  Supplier,
  SupplierTransaction,
  Purchase,
  Expense,
  DeliveryRecord,
  SentMessage,
  BusinessSettings,
  AuditLog,
  DashboardStats,
  User,
  CustomerAccount,
  CustomerAddress,
  OnlineOrder,
  OnlineOrderItem,
  CustomerAuthSession,
  UserRole,
  StaffStatus,
  PermissionKey,
  AuthSession,
  OwnerSecurityProfile,
  StaffPerformanceSummary,
  DeliveryStaffSummary,
  AccountsStaffSummary,
} from './src/types.js';
import {
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  PERMISSION_MODULES,
  hasPermission,
} from './src/utils/permissions.js';
import {
  validatePakistaniPhone,
  constructCompleteDeliveryAddress,
  CUSTOM_AREA_OPTION,
} from './src/utils/karachiAreas.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- CRYPTO PASSWORD HELPERS ---
  function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  function verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
    } catch {
      return false;
    }
  }

  // --- STAFF & ADMIN SESSIONS ---
  interface StaffSession {
    token: string;
    userId: string;
    role: UserRole;
    name: string;
    email: string;
    createdAt: number;
    expiresAt: number;
  }

  const staffSessions = new Map<string, StaffSession>();

  function createStaffSession(user: User): string {
    const token = 'staff_' + crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    staffSessions.set(token, {
      token,
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    return token;
  }

  function getStaffSessionFromReq(req: express.Request): StaffSession | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7).trim();
    if (!token.startsWith('staff_')) return null;
    const session = staffSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      staffSessions.delete(token);
      return null;
    }
    return session;
  }

  function getAuthenticatedStaff(req: express.Request): User | null {
    const session = getStaffSessionFromReq(req);
    if (!session) return null;
    const db = dbManager.get();
    const user = db.users.find((u) => u.id === session.userId);
    if (!user || user.active === false || user.status === 'inactive' || user.status === 'suspended') {
      return null;
    }
    return user;
  }

  // --- CUSTOMER SESSIONS ---
  interface CustomerSession {
    token: string;
    accountId: string;
    customerId: string;
    role: 'customer';
    createdAt: number;
    expiresAt: number;
  }

  const customerSessions = new Map<string, CustomerSession>();

  function createCustomerSession(accountId: string, customerId: string): string {
    const token = 'cust_' + crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    customerSessions.set(token, {
      token,
      accountId,
      customerId,
      role: 'customer',
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
    return token;
  }

  function getCustomerSessionFromReq(req: express.Request): CustomerSession | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7).trim();
    if (!token.startsWith('cust_')) return null;
    const session = customerSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      customerSessions.delete(token);
      return null;
    }
    return session;
  }

  const requireCustomerAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = getCustomerSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required. Please sign in to your customer account.' });
    }
    (req as any).customerSession = session;
    next();
  };

  function sanitizeAccount(account: CustomerAccount) {
    const { passwordHash, salt, ...safe } = account;
    return safe;
  }

  function sanitizeUser(user: User): Omit<User, 'passwordHash' | 'salt'> {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  function logAudit(
    action: string,
    module: string,
    details: string,
    reqOrUserId?: express.Request | string,
    recordIdOrName?: string,
    oldValuesOrRole?: any,
    newValues?: any
  ) {
    let userId = 'USR-1';
    let userName = 'Ahmed Khan (Owner)';
    let userRole: UserRole = 'owner';
    let ipAddress = '127.0.0.1';
    let userAgent = 'System Process';
    let recordId: string | undefined;
    let oldValues: any;

    if (reqOrUserId && typeof reqOrUserId === 'object' && 'headers' in reqOrUserId) {
      const req = reqOrUserId as express.Request;
      const staffUser = getAuthenticatedStaff(req);
      const customerSession = getCustomerSessionFromReq(req);
      ipAddress = req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
      userAgent = (req.headers['user-agent'] as string) || 'Browser Client';
      recordId = recordIdOrName;
      oldValues = oldValuesOrRole;

      if (staffUser) {
        userId = staffUser.id;
        userName = staffUser.name;
        userRole = staffUser.role;
      } else if (customerSession) {
        userId = customerSession.accountId;
        userName = 'Online Customer';
        userRole = 'customer';
      }
    } else if (typeof reqOrUserId === 'string') {
      userId = reqOrUserId;
      if (typeof recordIdOrName === 'string') userName = recordIdOrName;
      if (typeof oldValuesOrRole === 'string') userRole = oldValuesOrRole as any;
    }

    dbManager.mutate((db) => {
      const entry: AuditLog = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString(),
        userId,
        userName,
        userRole,
        action,
        module,
        recordId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        details,
      };
      db.audit_logs.unshift(entry);
      if (db.audit_logs.length > 1000) {
        db.audit_logs = db.audit_logs.slice(0, 1000);
      }
    });
  }

  const getRequestUserRole = (req: express.Request): UserRole => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer cust_')) {
      return 'customer';
    }
    if (getCustomerSessionFromReq(req)) return 'customer';
    const staff = getAuthenticatedStaff(req);
    if (staff) {
      return staff.role;
    }
    return 'owner';
  };

  const getRequestUserName = (req: express.Request): string => {
    const staff = getAuthenticatedStaff(req);
    if (staff) return staff.name;
    const cust = getCustomerSessionFromReq(req);
    if (cust) return 'Online Customer';
    return 'Ahmed Khan (Owner)';
  };

  app.use('/api', (req, res, next) => {
    if (
      req.path === '/health' ||
      req.path.startsWith('/customer/') ||
      req.path === '/auth/login' ||
      req.path === '/auth/logout' ||
      req.path === '/auth/me' ||
      req.path === '/permissions'
    ) {
      return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer cust_')) {
      return res.status(403).json({
        error: 'Access Denied: Customer accounts are strictly prohibited from accessing internal business management endpoints.',
      });
    }
    next();
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    try {
      const db = dbManager.get();
      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonthPrefix = todayStr.substring(0, 7);

      const totalCustomers = db.customers.length;
      const activeCustomers = db.customers.filter((c) => c.active).length;

      const emptyBottlesItem = db.inventory.find((i) => i.category === 'empty_bottles');
      const filledBottlesItem = db.inventory.find((i) => i.category === 'filled_bottles');
      const totalEmptyBottles = emptyBottlesItem ? emptyBottlesItem.currentStock : 0;
      const totalFilledBottles = filledBottlesItem ? filledBottlesItem.currentStock : 0;

      const bottlesWithCustomers = db.customers.reduce((acc, c) => acc + (c.bottlesWithCustomer || 0), 0);

      const todaySalesRecords = db.sales.filter((s) => s.date === todayStr && s.status !== 'cancelled');
      const todaySales = todaySalesRecords.reduce((acc, s) => acc + s.total, 0);
      const todaySalesCount = todaySalesRecords.length;
      const todayBottlesSold = todaySalesRecords.reduce((acc, s) => acc + (s.quantity || 0), 0);

      const thisMonthSalesRecords = db.sales.filter((s) => s.date.startsWith(currentMonthPrefix) && s.status !== 'cancelled');
      const thisMonthSalesAmount = thisMonthSalesRecords.reduce((acc, s) => acc + s.total, 0);

      const thisMonthExpenseRecords = db.expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
      const thisMonthExpenses = thisMonthExpenseRecords.reduce((acc, e) => acc + e.amount, 0);

      const netMonthlyProfit = Math.max(0, thisMonthSalesAmount - thisMonthExpenses);

      const todayPaymentRecords = db.payments.filter((p) => p.date === todayStr);
      const todayCollection = todayPaymentRecords.reduce((acc, p) => acc + p.amount, 0);

      const totalOutstandingReceivables = db.customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance || 0), 0);
      const totalPayables = db.suppliers.reduce((acc, s) => acc + Math.max(0, s.balancePayable || 0), 0);

      const todayExpenseRecords = db.expenses.filter((e) => e.date === todayStr);
      const todayExpenses = todayExpenseRecords.reduce((acc, e) => acc + e.amount, 0);

      const todayRefillRecords = db.refilling.filter((r) => r.date === todayStr && r.status === 'completed');
      const todayRefilling = todayRefillRecords.reduce((acc, r) => acc + r.filledBottlesProduced, 0);

      const damagedBottlesCount = db.refilling.reduce((acc, r) => acc + (r.damagedBottles || 0), 0);

      const lowStockItems = db.inventory.filter((item) => item.currentStock <= item.minimumStockLevel);
      const lowInventoryAlertsCount = lowStockItems.length;
      const lowInventoryAlerts = lowStockItems.map((item) => ({
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
        minThreshold: item.minimumStockLevel,
        category: item.category,
      }));

      const salesTrendLast7Days: { date: string; revenue: number; bottles: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const daySales = db.sales.filter((s) => s.date === dStr && s.status !== 'cancelled');
        const dayRev = daySales.reduce((acc, s) => acc + s.total, 0);
        const dayBottles = daySales.reduce((acc, s) => acc + (s.quantity || 0), 0);
        const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
        salesTrendLast7Days.push({
          date: label,
          revenue: dayRev,
          bottles: dayBottles,
        });
      }

      const expenseMap = new Map<string, number>();
      db.expenses.forEach((e) => {
        const current = expenseMap.get(e.category) || 0;
        expenseMap.set(e.category, current + e.amount);
      });
      const expenseCategories = Array.from(expenseMap.entries()).map(([category, amount]) => ({
        category,
        amount,
      }));

      const recentSales = db.sales.slice(-5).reverse();
      const recentDeliveries = db.deliveries.slice(-5).reverse();
      const recentRefilling = db.refilling.slice(-5).reverse();

      const pendingOnlineOrders = (db.online_orders || []).filter((o) => o.status === 'pending');
      const pendingOnlineOrdersCount = pendingOnlineOrders.length;
      const newOnlineOrdersCount = (db.online_orders || []).filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
      const onlineCustomersCount = db.customers.filter((c) => c.customerSource === 'online').length;

      const stats: DashboardStats = {
        totalCustomers,
        activeCustomers,
        totalFilledBottles,
        filledBottlesStock: totalFilledBottles,
        totalEmptyBottles,
        emptyBottlesStock: totalEmptyBottles,
        bottlesWithCustomers,
        totalBottlesWithCustomers: bottlesWithCustomers,
        todaySales,
        todaySalesAmount: todaySales,
        todaySalesCount,
        todayBottlesSold,
        thisMonthSalesAmount,
        thisMonthExpenses,
        netMonthlyProfit,
        todayCollection,
        totalOutstandingReceivables,
        totalReceivableBalance: totalOutstandingReceivables,
        totalPayables,
        totalSupplierPayable: totalPayables,
        todayExpenses,
        todayRefilling,
        damagedBottlesCount,
        lowInventoryAlertsCount,
        lowStockItems,
        lowInventoryAlerts,
        salesTrendLast7Days,
        expenseCategories,
        recentSales,
        recentDeliveries,
        recentRefilling,
        pendingOnlineOrdersCount,
        newOnlineOrdersCount,
        onlineCustomersCount,
      };

      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Customers Endpoints
  app.get('/api/customers', (req, res) => {
    const db = dbManager.get();
    const { type, area, active, search } = req.query;
    let list = [...db.customers];
    if (type) list = list.filter((c) => c.customerType === type);
    if (area) list = list.filter((c) => c.area.toLowerCase() === (area as string).toLowerCase());
    if (active !== undefined) list = list.filter((c) => String(c.active) === active);
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.mobile.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });

  app.get('/api/customers/:id', (req, res) => {
    const db = dbManager.get();
    const customer = db.customers.find((c) => c.id === req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const transactions = db.customer_transactions.filter((t) => t.customerId === customer.id);
    const bottleLedger = db.customer_bottle_ledger.filter((b) => b.customerId === customer.id);
    const deliveries = db.deliveries.filter((d) => d.customerId === customer.id);
    const sales = db.sales.filter((s) => s.customerId === customer.id);
    const payments = db.payments.filter((p) => p.customerId === customer.id);
    const messages = db.messages.filter((m) => m.customerId === customer.id);

    res.json({
      customer,
      transactions,
      bottleLedger,
      deliveries,
      sales,
      payments,
      messages,
    });
  });

  app.post('/api/customers', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const id = data.id || `CUST-${1000 + db.customers.length + 1}`;
        const newCustomer: Customer = {
          id,
          name: data.name,
          fatherOrCompanyName: data.fatherOrCompanyName || '',
          mobile: data.mobile,
          whatsapp: data.whatsapp || data.mobile,
          address: data.address,
          area: data.area,
          city: data.city || db.settings.city,
          googleMapsUrl: data.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(data.address + ' ' + data.area + ' ' + data.city)}`,
          customerType: data.customerType || 'regular',
          bottlesWithCustomer: Number(data.bottlesWithCustomer) || 0,
          securityDeposit: Number(data.securityDeposit) || 0,
          currentBalance: Number(data.currentBalance) || 0,
          creditLimit: Number(data.creditLimit) || 5000,
          ratePerBottle: Number(data.ratePerBottle) || db.settings.defaultBottlePrice,
          notes: data.notes || '',
          registrationDate: data.registrationDate || new Date().toISOString().split('T')[0],
          active: data.active !== undefined ? data.active : true,
        };
        db.customers.unshift(newCustomer);

        if (newCustomer.securityDeposit > 0) {
          const depositTx: CustomerTransaction = {
            id: `CTX-${Date.now()}-1`,
            customerId: newCustomer.id,
            customerName: newCustomer.name,
            date: newCustomer.registrationDate,
            type: 'deposit',
            description: `Security deposit of ${newCustomer.securityDeposit} registered for ${newCustomer.bottlesWithCustomer} bottles`,
            debit: 0,
            credit: 0,
            runningBalance: newCustomer.currentBalance,
            createdBy: req.body.createdBy || 'Admin',
            createdAt: new Date().toISOString(),
          };
          db.customer_transactions.push(depositTx);
        }

        if (newCustomer.bottlesWithCustomer > 0) {
          const bottleTx: CustomerBottleTransaction = {
            id: `CBL-${Date.now()}-1`,
            customerId: newCustomer.id,
            customerName: newCustomer.name,
            date: newCustomer.registrationDate,
            type: 'delivered',
            filledDelivered: newCustomer.bottlesWithCustomer,
            emptyReturned: 0,
            netChange: newCustomer.bottlesWithCustomer,
            runningBottleBalance: newCustomer.bottlesWithCustomer,
            notes: 'Opening bottle balance upon registration',
            createdBy: req.body.createdBy || 'Admin',
            createdAt: new Date().toISOString(),
          };
          db.customer_bottle_ledger.push(bottleTx);
        }

        return newCustomer;
      });
      logAudit('CREATE_CUSTOMER', 'Customers', `Created new customer ${result.name} (${result.id})`);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/customers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = dbManager.mutate((db) => {
        const idx = db.customers.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error('Customer not found');
        const existing = db.customers[idx];
        const updatedCustomer: Customer = {
          ...existing,
          name: data.name ?? existing.name,
          fatherOrCompanyName: data.fatherOrCompanyName ?? existing.fatherOrCompanyName,
          mobile: data.mobile ?? existing.mobile,
          whatsapp: data.whatsapp ?? existing.whatsapp,
          address: data.address ?? existing.address,
          area: data.area ?? existing.area,
          city: data.city ?? existing.city,
          googleMapsUrl: data.googleMapsUrl ?? existing.googleMapsUrl,
          customerType: data.customerType ?? existing.customerType,
          creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : existing.creditLimit,
          ratePerBottle: data.ratePerBottle !== undefined ? Number(data.ratePerBottle) : existing.ratePerBottle,
          notes: data.notes ?? existing.notes,
          active: data.active ?? existing.active,
        };
        db.customers[idx] = updatedCustomer;
        return updatedCustomer;
      });
      logAudit('UPDATE_CUSTOMER', 'Customers', `Updated profile for customer ${updated.name} (${updated.id}) by ${getRequestUserName(req)}`);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/customers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deletedCustomer = dbManager.mutate((db) => {
        const idx = db.customers.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error('Customer not found');
        const [removed] = db.customers.splice(idx, 1);
        return removed;
      });
      logAudit('DELETE_CUSTOMER', 'Customers', `Deleted customer ${deletedCustomer.name} (${deletedCustomer.id}) by Admin`);
      res.json({ success: true, deletedCustomer });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/customers/bulk-price-update', (req, res) => {
    try {
      const { customerIds, area, customerType, newRate, adjustAmount } = req.body;
      const updatedList = dbManager.mutate((db) => {
        let targets = db.customers;
        if (Array.isArray(customerIds) && customerIds.length > 0) {
          targets = targets.filter((c) => customerIds.includes(c.id));
        } else {
          if (area && area !== 'all') {
            targets = targets.filter((c) => c.area.toLowerCase() === area.toLowerCase());
          }
          if (customerType && customerType !== 'all') {
            targets = targets.filter((c) => c.customerType === customerType);
          }
        }
        const modified: Customer[] = [];
        for (const cust of targets) {
          if (newRate !== undefined && newRate !== null && newRate !== '') {
            cust.ratePerBottle = Number(newRate);
          } else if (adjustAmount !== undefined && adjustAmount !== null) {
            cust.ratePerBottle = Math.max(0, (cust.ratePerBottle || db.settings.defaultBottlePrice) + Number(adjustAmount));
          }
          modified.push(cust);
        }
        return modified;
      });
      logAudit('BULK_PRICE_UPDATE', 'Customers', `Bulk updated bottle rates for ${updatedList.length} customers by Admin`);
      res.json({ success: true, count: updatedList.length, updatedCustomers: updatedList });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 3. Customer Bottle Ledger Specific Endpoint
  app.post('/api/customers/:id/bottle-transaction', (req, res) => {
    try {
      const { id } = req.params;
      const { date, type, filledDelivered = 0, emptyReturned = 0, notes, createdBy = 'Admin' } = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === id);
        if (!customer) throw new Error('Customer not found');

        const filledQty = Number(filledDelivered) || 0;
        const emptyQty = Number(emptyReturned) || 0;
        const netChange = filledQty - emptyQty;
        const newBottleCount = (customer.bottlesWithCustomer || 0) + netChange;

        if (newBottleCount < 0) {
          throw new Error(`Invalid bottle balance: Customer would have ${newBottleCount} bottles, which is negative.`);
        }

        customer.bottlesWithCustomer = newBottleCount;

        const bottleTx: CustomerBottleTransaction = {
          id: `CBL-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          date: date || new Date().toISOString().split('T')[0],
          type: type || (netChange >= 0 ? 'delivered' : 'returned'),
          referenceId: req.body.referenceId,
          filledDelivered: filledQty,
          emptyReturned: emptyQty,
          netChange,
          runningBottleBalance: newBottleCount,
          notes: notes || `Bottle balance adjustment: +${filledQty} filled, -${emptyQty} empty returned`,
          createdBy,
          createdAt: new Date().toISOString(),
        };
        db.customer_bottle_ledger.push(bottleTx);

        if (filledQty > 0) {
          const filledStock = db.inventory.find((i) => i.category === 'filled_bottles');
          if (filledStock) {
            filledStock.soldOrDelivered += filledQty;
            filledStock.currentStock -= filledQty;
            filledStock.lastUpdated = new Date().toISOString();
          }
        }
        if (emptyQty > 0) {
          const emptyStock = db.inventory.find((i) => i.category === 'empty_bottles');
          if (emptyStock) {
            emptyStock.returned += emptyQty;
            emptyStock.currentStock += emptyQty;
            emptyStock.lastUpdated = new Date().toISOString();
          }
        }

        return { customer, bottleTx };
      });
      logAudit('BOTTLE_TRANSACTION', 'Bottle Ledger', `Adjusted bottles for ${result.customer.name}: new balance ${result.customer.bottlesWithCustomer}`);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 4. Refilling / Production API
  app.get('/api/refilling', (req, res) => {
    const db = dbManager.get();
    res.json(db.refilling.slice().reverse());
  });

  app.post('/api/refilling', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const refillNumber = data.refillNumber || `${db.settings.refillPrefix || 'REF-'}${new Date().getFullYear()}-${String(db.refilling.length + 1).padStart(3, '0')}`;
        const emptyUsed = Number(data.emptyBottlesUsed) || 0;
        const filledProduced = Number(data.filledBottlesProduced) || 0;
        const damaged = Number(data.damagedBottles) || 0;
        const rejected = Number(data.rejectedBottles) || 0;

        const emptyItem = db.inventory.find((i) => i.category === 'empty_bottles');
        const filledItem = db.inventory.find((i) => i.category === 'filled_bottles');
        const capsItem = db.inventory.find((i) => i.category === 'caps');
        const sealsItem = db.inventory.find((i) => i.category === 'seals');
        const labelsItem = db.inventory.find((i) => i.category === 'labels');

        const newBatch: RefillBatch = {
          id: `REF-${Date.now()}`,
          refillNumber,
          date: data.date || new Date().toISOString().split('T')[0],
          bottleSize: data.bottleSize || db.settings.defaultBottleSize || '19-Liter',
          emptyBottlesUsed: emptyUsed,
          filledBottlesProduced: filledProduced,
          damagedBottles: damaged,
          rejectedBottles: rejected,
          operator: data.operator || 'Refill Station 1',
          notes: data.notes || '',
          status: 'completed',
          createdBy: data.createdBy || 'Admin',
          createdAt: new Date().toISOString(),
        };
        db.refilling.push(newBatch);

        if (emptyItem) {
          emptyItem.usedInProduction += emptyUsed;
          emptyItem.damaged += damaged;
          emptyItem.currentStock -= emptyUsed;
          emptyItem.lastUpdated = new Date().toISOString();
        }
        if (filledItem) {
          filledItem.currentStock += filledProduced;
          filledItem.lastUpdated = new Date().toISOString();
        }
        if (capsItem) {
          capsItem.usedInProduction += filledProduced;
          capsItem.currentStock = Math.max(0, capsItem.currentStock - filledProduced);
        }
        if (sealsItem) {
          sealsItem.usedInProduction += filledProduced;
          sealsItem.currentStock = Math.max(0, sealsItem.currentStock - filledProduced);
        }
        if (labelsItem) {
          labelsItem.usedInProduction += filledProduced;
          labelsItem.currentStock = Math.max(0, labelsItem.currentStock - filledProduced);
        }

        return newBatch;
      });
      logAudit('CREATE_REFILL', 'Refilling', `Recorded refill batch ${result.refillNumber} producing ${result.filledBottlesProduced} filled bottles.`);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. Inventory API
  app.get('/api/inventory', (req, res) => {
    const db = dbManager.get();
    res.json(db.inventory);
  });

  app.get('/api/inventory/transactions', (req, res) => {
    const db = dbManager.get();
    res.json(db.inventory_transactions.slice().reverse());
  });

  app.post('/api/inventory/adjust', (req, res) => {
    try {
      const { itemId, adjustmentQty, reason, createdBy = 'Admin' } = req.body;
      const result = dbManager.mutate((db) => {
        const item = db.inventory.find((i) => i.id === itemId);
        if (!item) throw new Error('Inventory item not found');
        const change = Number(adjustmentQty);
        item.currentStock += change;
        item.lastUpdated = new Date().toISOString();
        const tx: InventoryTransaction = {
          id: `ITX-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          date: new Date().toISOString().split('T')[0],
          type: 'adjustment',
          quantityChange: change,
          resultingStock: item.currentStock,
          notes: reason || 'Manual stock reconciliation',
          createdBy,
          createdAt: new Date().toISOString(),
        };
        db.inventory_transactions.push(tx);
        return { item, tx };
      });
      logAudit('INVENTORY_ADJUST', 'Inventory', `Adjusted ${result.item.name} by ${req.body.adjustmentQty}. New stock: ${result.item.currentStock}`);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 6. Sales API
  app.get('/api/sales', (req, res) => {
    const db = dbManager.get();
    res.json(db.sales.slice().reverse());
  });

  app.post('/api/sales', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        let customer = db.customers.find((c) => c.id === data.customerId);
        if (!customer) {
          if (data.isCashSale || data.customerId === 'CUST-CASH') {
            customer = db.customers.find((c) => c.id === 'CUST-CASH');
            if (!customer) {
              customer = {
                id: 'CUST-CASH',
                name: data.customerName || 'Walk-In / Counter Cash Customer',
                fatherOrCompanyName: 'Counter Sale',
                mobile: data.customerPhone || '',
                whatsapp: data.customerPhone || '',
                address: 'Plant Counter / Walk-in',
                area: 'Counter / Retail',
                city: db.settings.city || 'Islamabad',
                customerType: 'retail',
                bottlesWithCustomer: 0,
                securityDeposit: 0,
                currentBalance: 0,
                creditLimit: 0,
                ratePerBottle: db.settings.defaultBottlePrice || 150,
                registrationDate: new Date().toISOString().split('T')[0],
                active: true,
              };
              db.customers.unshift(customer);
            }
          } else {
            throw new Error('Customer not found');
          }
        }

        const quantity = Number(data.quantity) || 1;
        const emptyReceived = Number(data.emptyBottlesReceived) || 0;
        const rate = Number(data.rate) || customer.ratePerBottle || db.settings.defaultBottlePrice;
        const discount = Number(data.discount) || 0;
        const deliveryCharges = Number(data.deliveryCharges) || 0;
        const subtotal = quantity * rate;
        const total = subtotal - discount + deliveryCharges;
        const paidAmount = data.isCashSale ? total : (Number(data.paidAmount) || 0);
        const remaining = total - paidAmount;

        const filledItem = db.inventory.find((i) => i.category === 'filled_bottles');
        const invoiceNumber = data.invoiceNumber || `${db.settings.invoicePrefix || 'INV-'}${1000 + db.sales.length + 1}`;
        const finalCustomerName = data.customerName || customer.name;
        const finalCustomerPhone = data.customerPhone || customer.mobile || customer.whatsapp || '';

        const sale: Sale = {
          id: `SALE-${Date.now()}`,
          invoiceNumber,
          date: data.date || new Date().toISOString().split('T')[0],
          customerId: customer.id,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          customerAddress: data.customerAddress || customer.address,
          items: [
            {
              itemId: filledItem?.id || 'INV-ITEM-2',
              itemName: 'Filled 19-Liter Mineral Water Bottle',
              quantity,
              rate,
              total: subtotal,
            },
          ],
          quantity,
          emptyBottlesReceived: emptyReceived,
          rate,
          subtotal,
          discount,
          deliveryCharges,
          total,
          paidAmount,
          remainingBalance: remaining,
          paymentMethod: data.paymentMethod || 'Cash',
          deliveryPerson: data.deliveryPerson || (data.isCashSale ? 'Counter / Cash POS' : 'Standard Delivery'),
          status: 'completed',
          notes: data.notes || (data.isCashSale ? 'Instant Cash Sale at Counter' : ''),
          createdBy: data.createdBy || 'Admin',
          createdAt: new Date().toISOString(),
          isCashSale: Boolean(data.isCashSale),
          cashTendered: data.cashTendered ? Number(data.cashTendered) : undefined,
          changeReturned: data.changeReturned ? Number(data.changeReturned) : undefined,
        };
        db.sales.push(sale);

        if (customer.id !== 'CUST-CASH') {
          customer.currentBalance = (customer.currentBalance || 0) + remaining;
        }

        const debitTx: CustomerTransaction = {
          id: `CTX-${Date.now()}-sale`,
          customerId: customer.id,
          customerName: finalCustomerName,
          date: sale.date,
          type: 'sale',
          referenceId: sale.invoiceNumber,
          description: `Sale of ${quantity} 19L bottle(s) @ ${rate}`,
          debit: total,
          credit: 0,
          runningBalance: (customer.currentBalance || 0) + paidAmount,
          createdBy: sale.createdBy,
          createdAt: new Date().toISOString(),
        };
        db.customer_transactions.push(debitTx);

        if (paidAmount > 0) {
          const receiptNumber = `${db.settings.receiptPrefix || 'REC-'}${1000 + db.payments.length + 1}`;
          const payment: Payment = {
            id: `PAY-${Date.now()}`,
            receiptNumber,
            date: sale.date,
            customerId: customer.id,
            customerName: finalCustomerName,
            amount: paidAmount,
            paymentMethod: sale.paymentMethod,
            referenceNumber: sale.invoiceNumber,
            notes: data.isCashSale ? `Instant Cash Sale (${sale.invoiceNumber})` : `Instant payment against sale ${sale.invoiceNumber}`,
            receivedBy: sale.deliveryPerson || sale.createdBy,
            createdAt: new Date().toISOString(),
          };
          db.payments.push(payment);
        }

        const netBottleChange = quantity - emptyReceived;
        customer.bottlesWithCustomer = (customer.bottlesWithCustomer || 0) + netBottleChange;

        if (filledItem) {
          filledItem.soldOrDelivered += quantity;
          filledItem.currentStock -= quantity;
          filledItem.lastUpdated = new Date().toISOString();
        }
        const emptyItem = db.inventory.find((i) => i.category === 'empty_bottles');
        if (emptyItem && emptyReceived > 0) {
          emptyItem.returned += emptyReceived;
          emptyItem.currentStock += emptyReceived;
          emptyItem.lastUpdated = new Date().toISOString();
        }

        return sale;
      });
      logAudit('CREATE_SALE', 'Sales', `Created Sale ${result.invoiceNumber} for ${result.customerName} (Total: ${result.total})`);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 7. Payments API
  app.get('/api/payments', (req, res) => {
    const db = dbManager.get();
    res.json(db.payments.slice().reverse());
  });

  app.post('/api/payments', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === data.customerId);
        if (!customer) throw new Error('Customer not found');
        const amount = Number(data.amount) || 0;
        if (amount <= 0) throw new Error('Payment amount must be greater than 0');

        const receiptNumber = data.receiptNumber || `${db.settings.receiptPrefix || 'REC-'}${1000 + db.payments.length + 1}`;
        const payment: Payment = {
          id: `PAY-${Date.now()}`,
          receiptNumber,
          date: data.date || new Date().toISOString().split('T')[0],
          customerId: customer.id,
          customerName: customer.name,
          amount,
          paymentMethod: data.paymentMethod || 'Cash',
          referenceNumber: data.referenceNumber || '',
          notes: data.notes || '',
          receivedBy: data.receivedBy || 'Admin',
          createdAt: new Date().toISOString(),
        };
        db.payments.push(payment);

        customer.currentBalance = (customer.currentBalance || 0) - amount;

        const creditTx: CustomerTransaction = {
          id: `CTX-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          date: payment.date,
          type: 'payment',
          referenceId: receiptNumber,
          description: `Payment received via ${payment.paymentMethod}`,
          debit: 0,
          credit: amount,
          runningBalance: customer.currentBalance,
          createdBy: payment.receivedBy,
          createdAt: new Date().toISOString(),
        };
        db.customer_transactions.push(creditTx);

        return payment;
      });
      logAudit('RECEIVE_PAYMENT', 'Payments', `Received payment ${result.receiptNumber} of ${result.amount} from ${result.customerName}`);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/payments/:id', (req, res) => {
    try {
      const { id } = req.params;
      const result = dbManager.mutate((db) => {
        const paymentIndex = db.payments.findIndex((p) => p.id === id || p.receiptNumber === id);
        if (paymentIndex === -1) throw new Error('Payment receipt not found.');
        const payment = db.payments[paymentIndex];
        const customer = db.customers.find((c) => c.id === payment.customerId);
        if (customer) {
          customer.currentBalance = (customer.currentBalance || 0) + payment.amount;
        }
        db.payments.splice(paymentIndex, 1);
        return { deletedPayment: payment, customer };
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/payments/clear-all', (req, res) => {
    try {
      const count = dbManager.mutate((db) => {
        const totalCleared = db.payments.length;
        db.payments = [];
        return totalCleared;
      });
      res.json({ success: true, message: `Cleared all ${count} payment receipts successfully.`, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Deliveries API
  app.get('/api/deliveries', (req, res) => {
    const db = dbManager.get();
    res.json(db.deliveries.slice().reverse());
  });

  app.post('/api/deliveries', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === data.customerId);
        if (!customer) throw new Error('Customer not found');
        const deliveryNumber = data.deliveryNumber || `${db.settings.deliveryPrefix || 'DEL-'}${1000 + db.deliveries.length + 1}`;
        const filled = Number(data.filledDelivered) || 1;
        const empty = Number(data.emptyReceived) || 0;
        const rate = Number(data.rate) || customer.ratePerBottle || db.settings.defaultBottlePrice;
        const total = filled * rate;
        const paid = Number(data.paid) || 0;
        const remaining = total - paid;

        const newDelivery: DeliveryRecord = {
          id: `DEL-${Date.now()}`,
          deliveryNumber,
          date: data.date || new Date().toISOString().split('T')[0],
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.mobile,
          address: customer.address,
          area: customer.area,
          googleMapsUrl: customer.googleMapsUrl,
          filledDelivered: filled,
          emptyReceived: empty,
          rate,
          total,
          paid,
          remaining,
          paymentMethod: data.paymentMethod || 'Cash',
          deliveryPerson: data.deliveryPerson || 'Rashid Mehmood',
          status: data.status || 'pending',
          notes: data.notes || '',
          deliveredAt: data.status === 'delivered' ? new Date().toISOString() : undefined,
          createdAt: new Date().toISOString(),
        };
        db.deliveries.push(newDelivery);

        if (newDelivery.status === 'delivered') {
          const netBottleChange = filled - empty;
          customer.bottlesWithCustomer = (customer.bottlesWithCustomer || 0) + netBottleChange;
          customer.currentBalance = (customer.currentBalance || 0) + remaining;

          const filledStock = db.inventory.find((i) => i.category === 'filled_bottles');
          if (filledStock) {
            filledStock.currentStock -= filled;
            filledStock.soldOrDelivered += filled;
          }
          const emptyStock = db.inventory.find((i) => i.category === 'empty_bottles');
          if (emptyStock && empty > 0) {
            emptyStock.currentStock += empty;
            emptyStock.returned += empty;
          }
        }

        return newDelivery;
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/deliveries/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, emptyReceived, paid, paymentMethod, deliveryPerson, notes } = req.body;
      const result = dbManager.mutate((db) => {
        const delivery = db.deliveries.find((d) => d.id === id);
        if (!delivery) throw new Error('Delivery record not found');
        const prevStatus = delivery.status;
        delivery.status = status;
        if (deliveryPerson) delivery.deliveryPerson = deliveryPerson;
        if (notes) delivery.notes = notes;

        if (status === 'delivered' && prevStatus !== 'delivered') {
          delivery.deliveredAt = new Date().toISOString();
          if (emptyReceived !== undefined) delivery.emptyReceived = Number(emptyReceived);
          if (paid !== undefined) {
            delivery.paid = Number(paid);
            delivery.remaining = delivery.total - delivery.paid;
          }
          if (paymentMethod) delivery.paymentMethod = paymentMethod;

          const customer = db.customers.find((c) => c.id === delivery.customerId);
          if (customer) {
            const net = delivery.filledDelivered - delivery.emptyReceived;
            customer.bottlesWithCustomer = (customer.bottlesWithCustomer || 0) + net;
            customer.currentBalance = (customer.currentBalance || 0) + delivery.remaining;
          }

          const filledStock = db.inventory.find((i) => i.category === 'filled_bottles');
          if (filledStock) {
            filledStock.currentStock -= delivery.filledDelivered;
            filledStock.soldOrDelivered += delivery.filledDelivered;
          }
          const emptyStock = db.inventory.find((i) => i.category === 'empty_bottles');
          if (emptyStock && delivery.emptyReceived > 0) {
            emptyStock.currentStock += delivery.emptyReceived;
            emptyStock.returned += delivery.emptyReceived;
          }
        }
        return delivery;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. Suppliers & Purchases API
  app.get('/api/suppliers', (req, res) => {
    const db = dbManager.get();
    res.json(db.suppliers);
  });

  app.get('/api/suppliers/:id', (req, res) => {
    const db = dbManager.get();
    const supplier = db.suppliers.find((s) => s.id === req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    const transactions = db.supplier_transactions.filter((t) => t.supplierId === supplier.id);
    const purchases = db.purchases.filter((p) => p.supplierId === supplier.id);
    res.json({ supplier, transactions, purchases });
  });

  app.post('/api/suppliers', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const id = `SUP-${100 + db.suppliers.length + 1}`;
        const newSupplier: Supplier = {
          id,
          name: data.name,
          contactPerson: data.contactPerson || '',
          mobile: data.mobile,
          whatsapp: data.whatsapp || data.mobile,
          address: data.address,
          city: data.city || '',
          productSupplied: data.productSupplied || '',
          unitRate: data.unitRate !== undefined ? Number(data.unitRate) : undefined,
          totalPurchases: 0,
          totalPaid: 0,
          balancePayable: Number(data.balancePayable) || 0,
          notes: data.notes || '',
          createdAt: new Date().toISOString().split('T')[0],
        };
        db.suppliers.push(newSupplier);
        return newSupplier;
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/suppliers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const sup = db.suppliers.find((s) => s.id === id);
        if (!sup) throw new Error('Supplier not found');
        if (data.name !== undefined) sup.name = data.name;
        if (data.contactPerson !== undefined) sup.contactPerson = data.contactPerson;
        if (data.mobile !== undefined) sup.mobile = data.mobile;
        if (data.whatsapp !== undefined) sup.whatsapp = data.whatsapp;
        if (data.address !== undefined) sup.address = data.address;
        if (data.city !== undefined) sup.city = data.city;
        if (data.productSupplied !== undefined) sup.productSupplied = data.productSupplied;
        if (data.unitRate !== undefined) sup.unitRate = Number(data.unitRate);
        if (data.balancePayable !== undefined) sup.balancePayable = Number(data.balancePayable);
        if (data.notes !== undefined) sup.notes = data.notes;
        return sup;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/suppliers/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deletedSupplier = dbManager.mutate((db) => {
        const idx = db.suppliers.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error('Supplier not found');
        const [removed] = db.suppliers.splice(idx, 1);
        return removed;
      });
      res.json({ success: true, deletedSupplier });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/purchases', (req, res) => {
    const db = dbManager.get();
    res.json(db.purchases.slice().reverse());
  });

  app.post('/api/purchases', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const supplier = db.suppliers.find((s) => s.id === data.supplierId);
        if (!supplier) throw new Error('Supplier not found');

        const quantity = Number(data.quantity) || 1;
        const rate = Number(data.rate) || 0;
        const total = quantity * rate;
        const paidAmount = Number(data.paidAmount) || 0;
        const remaining = total - paidAmount;

        const purchase: Purchase = {
          id: `PUR-${Date.now()}`,
          invoiceNumber: data.invoiceNumber || `PUR-${1000 + db.purchases.length + 1}`,
          date: data.date || new Date().toISOString().split('T')[0],
          supplierId: supplier.id,
          supplierName: supplier.name,
          itemCategory: data.itemCategory,
          itemId: data.itemId || 'INV-ITEM-1',
          itemName: data.itemName || 'Inventory Item',
          quantity,
          rate,
          total,
          paidAmount,
          remainingBalance: remaining,
          paymentMethod: data.paymentMethod || 'Bank Transfer',
          notes: data.notes || '',
          receivedBy: data.receivedBy || 'Admin',
          createdAt: new Date().toISOString(),
        };
        db.purchases.push(purchase);

        supplier.totalPurchases += total;
        supplier.totalPaid += paidAmount;
        supplier.balancePayable += remaining;

        const invItem = db.inventory.find((i) => i.id === purchase.itemId || i.category === purchase.itemCategory);
        if (invItem) {
          invItem.purchases += quantity;
          invItem.currentStock += quantity;
          invItem.lastUpdated = new Date().toISOString();
        }

        return purchase;
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/suppliers/:id/pay', (req, res) => {
    try {
      const { id } = req.params;
      const { amount, paymentMethod = 'Bank Transfer', notes = '', referenceNumber = '' } = req.body;
      const result = dbManager.mutate((db) => {
        const supplier = db.suppliers.find((s) => s.id === id);
        if (!supplier) throw new Error('Supplier not found');
        const payAmount = Number(amount) || 0;
        supplier.totalPaid += payAmount;
        supplier.balancePayable -= payAmount;
        return supplier;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 10. Expenses API
  app.get('/api/expenses', (req, res) => {
    const db = dbManager.get();
    res.json(db.expenses.slice().reverse());
  });

  app.post('/api/expenses', (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const voucherNumber = data.voucherNumber || `EXP-${1000 + db.expenses.length + 1}`;
        const newExpense: Expense = {
          id: `EXP-${Date.now()}`,
          voucherNumber,
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'Other',
          description: data.description,
          amount: Number(data.amount) || 0,
          paymentMethod: data.paymentMethod || 'Cash',
          paidTo: data.paidTo || '',
          approvedBy: data.approvedBy || 'Admin',
          notes: data.notes || '',
          createdAt: new Date().toISOString(),
        };
        db.expenses.push(newExpense);
        return newExpense;
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 11. Customer Messaging API
  app.get('/api/messaging/templates', (req, res) => {
    const db = dbManager.get();
    res.json(db.message_templates || []);
  });

  app.get('/api/messaging/history', (req, res) => {
    const db = dbManager.get();
    res.json(db.messages || []);
  });

  app.post('/api/messaging/send', (req, res) => {
    try {
      const { customerId, templateCode, customText, channel = 'whatsapp' } = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === customerId);
        if (!customer) throw new Error('Customer not found');

        const sent: SentMessage = {
          id: `MSG-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          recipientPhone: customer.whatsapp || customer.mobile,
          templateCode: templateCode || 'custom',
          message: customText || '',
          channel,
          status: 'opened_in_whatsapp',
          sentAt: new Date().toISOString(),
        };
        db.messages.unshift(sent);
        return { sent, customer, cleanPhone: (customer.whatsapp || customer.mobile).replace(/[^0-9]/g, '') };
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 12. Reports API
  app.get('/api/reports/analytics', (req, res) => {
    try {
      const db = dbManager.get();
      res.json({
        summary: {
          totalSales: db.sales.reduce((a, s) => a + s.total, 0),
          totalExpenses: db.expenses.reduce((a, e) => a + e.amount, 0),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/staff-performance', (req, res) => {
    const db = dbManager.get();
    res.json([]);
  });

  app.get('/api/reports/delivery-performance', (req, res) => {
    const db = dbManager.get();
    res.json([]);
  });

  app.get('/api/reports/accounts-performance', (req, res) => {
    const db = dbManager.get();
    res.json([]);
  });

  // 13. Global Search API
  app.get('/api/search', (req, res) => {
    const db = dbManager.get();
    const query = (req.query.q as string || '').toLowerCase().trim();
    if (!query) return res.json({ customers: [], sales: [], payments: [], suppliers: [], deliveries: [], inventory: [] });

    const customers = db.customers.filter((c) => c.name.toLowerCase().includes(query) || c.mobile.includes(query)).slice(0, 5);
    const sales = db.sales.filter((s) => s.invoiceNumber.toLowerCase().includes(query) || s.customerName.toLowerCase().includes(query)).slice(0, 5);
    const payments = db.payments.filter((p) => p.receiptNumber.toLowerCase().includes(query) || p.customerName.toLowerCase().includes(query)).slice(0, 5);
    const suppliers = db.suppliers.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 5);
    const deliveries = db.deliveries.filter((d) => d.customerName.toLowerCase().includes(query)).slice(0, 5);
    const inventory = db.inventory.filter((i) => i.name.toLowerCase().includes(query)).slice(0, 5);

    res.json({ customers, sales, payments, suppliers, deliveries, inventory });
  });

  // 14. Settings API
  app.get('/api/settings', (req, res) => {
    const db = dbManager.get();
    res.json(db.settings);
  });

  app.put('/api/settings', (req, res) => {
    try {
      const data = req.body;
      const updated = dbManager.mutate((db) => {
        db.settings = { ...db.settings, ...data };
        return db.settings;
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/settings/backup/export', (req, res) => {
    const db = dbManager.get();
    res.json(db);
  });

  app.post('/api/settings/backup/import', (req, res) => {
    try {
      dbManager.save(req.body);
      res.json({ message: 'Backup restored successfully', count: req.body.customers?.length || 0 });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/settings/reset-demo', (req, res) => {
    const fresh = dbManager.resetDemoData();
    res.json({ message: 'Database reset to verified sample data.', db: fresh });
  });

  app.post('/api/settings/clear-all-data', (req, res) => {
    const clean = dbManager.clearAllData();
    res.json({ message: 'All dummy records cleared successfully.', db: clean });
  });

  // 15. Staff & Auth
  app.get('/api/permissions', (req, res) => {
    res.json({
      all: ALL_PERMISSIONS,
      modules: PERMISSION_MODULES,
      roleDefaults: ROLE_DEFAULT_PERMISSIONS,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;
      const db = dbManager.get();
      const user = db.users.find(
        (u) => u.email.toLowerCase() === identifier?.toLowerCase() || u.phone === identifier
      ) || db.users[0];

      const token = createStaffSession(user);
      res.json({
        token,
        user: sanitizeUser(user),
        permissions: user.permissions || [...ALL_PERMISSIONS],
        isOwner: user.role === 'owner',
        isAdmin: user.role === 'admin' || user.role === 'owner',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.get('/api/auth/me', (req, res) => {
    const db = dbManager.get();
    const user = getAuthenticatedStaff(req) || db.users[0];
    res.json({
      user: sanitizeUser(user),
      permissions: user.permissions || [...ALL_PERMISSIONS],
      isOwner: user.role === 'owner',
      isAdmin: user.role === 'admin' || user.role === 'owner',
    });
  });

  app.get('/api/staff', (req, res) => {
    const db = dbManager.get();
    res.json((db.users || []).map((u) => sanitizeUser(u)));
  });

  app.get('/api/audit-logs', (req, res) => {
    const db = dbManager.get();
    res.json(db.audit_logs || []);
  });

  // Customer Portal Endpoints
  app.post('/api/customer/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;
      const db = dbManager.get();
      let account = (db.customer_accounts || []).find((a) => a.mobile === identifier || a.email === identifier);
      let customer = db.customers[0];

      if (!account) {
        // Create demo session for customer if none exists
        customer = db.customers.find((c) => c.id !== 'CUST-CASH') || db.customers[0];
        const accountId = `CUST-ACC-${Date.now()}`;
        account = {
          id: accountId,
          customerId: customer.id,
          fullName: customer.name,
          email: customer.email || 'customer@example.com',
          mobile: customer.mobile || '03001234567',
          passwordHash: '',
          salt: '',
          authProvider: 'email',
          emailVerified: false,
          phoneVerified: false,
          accountStatus: 'active',
          createdAt: new Date().toISOString(),
        };
      } else {
        customer = db.customers.find((c) => c.id === account!.customerId) || db.customers[0];
      }

      const token = createCustomerSession(account.id, customer.id);
      res.json({
        token,
        account: sanitizeAccount(account),
        customer,
        defaultAddress: db.customer_addresses?.find((a) => a.customerId === customer.id),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/customer/auth/register', (req, res) => {
    try {
      const { fullName, mobile, whatsapp, address, area, city } = req.body;
      const result = dbManager.mutate((db) => {
        const custId = `CUST-${1000 + db.customers.length + 1}`;
        const newCustomer: Customer = {
          id: custId,
          name: fullName,
          mobile,
          whatsapp: whatsapp || mobile,
          address: address || 'House / Street',
          area: area || 'Clifton',
          city: city || 'Karachi',
          customerType: 'regular',
          bottlesWithCustomer: 0,
          securityDeposit: 0,
          currentBalance: 0,
          creditLimit: 0,
          ratePerBottle: db.settings.defaultBottlePrice || 150,
          registrationDate: new Date().toISOString().split('T')[0],
          active: true,
        };
        db.customers.unshift(newCustomer);

        const accountId = `CUST-ACC-${Date.now()}`;
        const account: CustomerAccount = {
          id: accountId,
          customerId: newCustomer.id,
          fullName,
          email: '',
          mobile,
          whatsapp: whatsapp || mobile,
          passwordHash: '',
          salt: '',
          authProvider: 'email',
          emailVerified: false,
          phoneVerified: false,
          accountStatus: 'active',
          createdAt: new Date().toISOString(),
        };
        db.customer_accounts.push(account);

        const newAddress: CustomerAddress = {
          id: `ADDR-${Date.now()}`,
          customerId: newCustomer.id,
          label: 'Home',
          fullAddress: address || 'House / Street',
          area: area || 'Clifton',
          city: city || 'Karachi',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.customer_addresses.push(newAddress);

        return { account, customer: newCustomer, defaultAddress: newAddress };
      });

      const token = createCustomerSession(result.account.id, result.customer.id);
      res.status(201).json({
        token,
        account: sanitizeAccount(result.account),
        customer: result.customer,
        defaultAddress: result.defaultAddress,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/customer/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.get('/api/customer/auth/me', (req, res) => {
    const session = getCustomerSessionFromReq(req);
    const db = dbManager.get();
    const account = session
      ? db.customer_accounts.find((a) => a.id === session.accountId)
      : db.customer_accounts[0];
    const customer = account
      ? db.customers.find((c) => c.id === account.customerId)
      : db.customers[0];
    res.json({
      account: account ? sanitizeAccount(account) : null,
      customer: customer || null,
      addresses: db.customer_addresses || [],
    });
  });

  app.get('/api/customer/addresses', (req, res) => {
    const db = dbManager.get();
    res.json(db.customer_addresses || []);
  });

  app.get('/api/customer/orders', (req, res) => {
    const db = dbManager.get();
    res.json(db.online_orders || []);
  });

  app.post('/api/customer/orders', (req, res) => {
    try {
      const { quantity = 2, preferredDate, preferredTimeSlot, customerNotes } = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers[0];
        const unitPrice = customer?.ratePerBottle || db.settings.defaultBottlePrice || 150;
        const totalAmount = quantity * unitPrice;
        const orderNum = `ORD-${1000 + db.online_orders.length + 1}`;

        const newOrder: OnlineOrder = {
          id: orderNum,
          orderNumber: orderNum,
          customerId: customer?.id || 'CUST-1001',
          customerName: customer?.name || 'Customer',
          customerPhone: customer?.mobile || '03001234567',
          orderSource: 'website',
          addressId: 'ADDR-1',
          deliveryAddress: customer?.address || 'Street 1',
          deliveryArea: customer?.area || 'Clifton',
          deliveryCity: customer?.city || 'Karachi',
          preferredDate: preferredDate || new Date().toISOString().split('T')[0],
          preferredTimeSlot: preferredTimeSlot || 'Morning',
          items: [
            {
              productId: 'prod_19L',
              productName: '19-Liter Mineral Water Bottle Refill',
              quantity,
              unitPrice,
              totalPrice: totalAmount,
            },
          ],
          totalBottles: quantity,
          totalAmount,
          status: 'pending',
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'cash_on_delivery',
          customerNotes: customerNotes || '',
          createdAt: new Date().toISOString(),
        };
        db.online_orders.unshift(newOrder);
        return newOrder;
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/online-orders', (req, res) => {
    const db = dbManager.get();
    res.json(db.online_orders || []);
  });

  app.put('/api/online-orders/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = dbManager.mutate((db) => {
        const order = (db.online_orders || []).find((o) => o.id === id);
        if (order) order.status = status;
        return order;
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Water Business Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
