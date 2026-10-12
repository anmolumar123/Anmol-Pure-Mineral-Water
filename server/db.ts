import fs from 'fs';
import path from 'path';
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
  User,
  CustomerAccount,
  CustomerAddress,
  OnlineOrder,
  PermissionKey,
} from '../src/types.js';
import { ALL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from '../src/utils/permissions.js';

export interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  customer_transactions: CustomerTransaction[];
  customer_bottle_ledger: CustomerBottleTransaction[];
  inventory: InventoryItem[];
  inventory_transactions: InventoryTransaction[];
  refilling: RefillBatch[];
  sales: Sale[];
  payments: Payment[];
  suppliers: Supplier[];
  supplier_transactions: SupplierTransaction[];
  purchases: Purchase[];
  expenses: Expense[];
  deliveries: DeliveryRecord[];
  message_templates: MessageTemplate[];
  messages: SentMessage[];
  settings: BusinessSettings;
  audit_logs: AuditLog[];
  customer_accounts: CustomerAccount[];
  customer_addresses: CustomerAddress[];
  online_orders: OnlineOrder[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'water_business_db.json');

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

export const DEFAULT_USERS: User[] = [
  {
    id: 'USR-1',
    authUserId: '00000000-0000-0000-0000-000000000001',
    employeeId: 'EMP-001',
    name: 'Ahmed Khan (Owner)',
    email: 'owner@anmolpurewater.com',
    role: 'owner',
    status: 'active',
    active: true,
    department: 'Executive Management',
    phone: '+92 300 1112233',
    joiningDate: '2025-01-01',
    permissions: [...ALL_PERMISSIONS],
    passwordHash: 'dc4b6b27dae5ceb1ecef8ad05e1a1b6bb45cf21739af49c162881541d343f4f473db44277e31a3ca9d0695fe63f0efca539bcc5372004d7e5a397db59b43bc6e', // Owner@Anmol2026!
    salt: 'anmol_salt_2026',
    mfaEnabled: true,
    lastLogin: new Date().toISOString(),
    lastPasswordChange: '2026-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-2',
    authUserId: '00000000-0000-0000-0000-000000000002',
    employeeId: 'EMP-002',
    name: 'Sajid Ali (Admin/Accounts)',
    email: 'admin@anmolpurewater.com',
    role: 'admin',
    status: 'active',
    active: true,
    department: 'Finance & Accounts',
    phone: '+92 301 2223344',
    joiningDate: '2025-03-01',
    permissions: [...ROLE_DEFAULT_PERMISSIONS.admin],
    passwordHash: '32ec28738cbc6902345d5fc2cfa2638c16ac51399a2b14fc4c1645ae83fb16127b67eb324f2b41ca44c8202292fc3df64ce715796d6bff08cbef6c4fe6b03f20', // Admin@Anmol2026!
    salt: 'anmol_salt_2026',
    mfaEnabled: false,
    lastLogin: new Date().toISOString(),
    lastPasswordChange: '2026-02-01T00:00:00.000Z',
    createdAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'USR-3',
    authUserId: '00000000-0000-0000-0000-000000000003',
    employeeId: 'EMP-003',
    name: 'Bilal Siddiqui (Plant Staff)',
    email: 'staff@anmolpurewater.com',
    role: 'staff',
    status: 'active',
    active: true,
    department: 'Plant Operations & Inventory',
    phone: '+92 301 5556677',
    joiningDate: '2025-05-15',
    permissions: [...ROLE_DEFAULT_PERMISSIONS.staff],
    passwordHash: 'ce5852e8c8c63a132b37947e96f032ec8c94631a022fa432c792e83aaef2314076438ba45589024098d6ae4ce3ad26be47ebb0cd69d5588b56d2ca2c71734b66', // Staff@Anmol2026!
    salt: 'anmol_salt_2026',
    mfaEnabled: false,
    lastLogin: new Date().toISOString(),
    lastPasswordChange: '2026-03-01T00:00:00.000Z',
    createdAt: '2025-05-15T00:00:00.000Z',
  },
  {
    id: 'USR-4',
    authUserId: '00000000-0000-0000-0000-000000000004',
    employeeId: 'EMP-004',
    name: 'Rashid Mehmood (Delivery Driver)',
    email: 'driver@anmolpurewater.com',
    role: 'delivery',
    status: 'active',
    active: true,
    department: 'Delivery & Logistics',
    assignedArea: 'Sector F-10 & Blue Area',
    phone: '+92 302 3334455',
    joiningDate: '2025-06-01',
    permissions: [...ROLE_DEFAULT_PERMISSIONS.delivery],
    passwordHash: '61d837cc345430d4260e12956c93eaf431e2b81c7e60e092bb64f8075c7ccfccec2482872122824e1a87623eadd6d44c546b5f3cf6762cc60f2fd407b296777d', // Driver@Anmol2026!
    salt: 'anmol_salt_2026',
    mfaEnabled: false,
    lastLogin: new Date().toISOString(),
    lastPasswordChange: '2026-03-15T00:00:00.000Z',
    createdAt: '2025-06-01T00:00:00.000Z',
  },
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'TMPL-1',
    name: 'Outstanding Balance Reminder',
    title: 'Outstanding Balance Reminder',
    code: 'balance_due',
    channel: 'whatsapp',
    description: 'Remind customer of pending unpaid bill',
    content: 'Dear {customer_name}, your current outstanding water bill balance with {business_name} is {currency} {balance} for {bottle_count} bottles. Please clear the due amount at your earliest convenience. Thank you - {business_name} ({phone})',
  },
  {
    id: 'TMPL-2',
    name: 'Payment Received Receipt',
    title: 'Payment Received Receipt',
    code: 'payment_received',
    channel: 'whatsapp',
    description: 'Confirm received cash/online payment',
    content: 'Dear {customer_name}, we have received your payment of {currency} {paid}. Remaining balance: {currency} {balance}. Thank you for choosing {business_name}!',
  },
  {
    id: 'TMPL-3',
    name: 'Order Delivery Notification',
    title: 'Order Delivery Notification',
    code: 'delivery_dispatched',
    channel: 'whatsapp',
    description: 'Notify arrival of water bottle refills',
    content: 'Assalam-o-Alaikum {customer_name}, your 19L mineral water refill delivery has arrived. Driver will exchange empty bottles. Thank you, {business_name}.',
  },
  {
    id: 'TMPL-4',
    name: 'Empty Bottle Return Alert',
    title: 'Empty Bottle Return Alert',
    code: 'bottle_return_reminder',
    channel: 'whatsapp',
    description: 'Request return of empty 19L bottles',
    content: 'Dear {customer_name}, according to our records you currently have {bottle_count} empty 19L bottles. Please return empties on the next delivery visit. {business_name} - {phone}.',
  },
  {
    id: 'TMPL-5',
    name: 'Monthly Ledger Statement',
    title: 'Monthly Ledger Statement',
    code: 'monthly_statement',
    channel: 'whatsapp',
    description: 'Monthly summary of deliveries & dues',
    content: 'Dear {customer_name}, your monthly water statement is prepared. Total bottles delivered: {quantity}, Payments received: {currency} {paid}, Current balance: {currency} {balance}. Detailed statement available on request. - {business_name}',
  },
  {
    id: 'TMPL-6',
    name: 'Welcome New Customer',
    title: 'Welcome New Customer',
    code: 'welcome',
    channel: 'whatsapp',
    description: 'Account onboarding & greeting',
    content: 'Welcome {customer_name} to {business_name}! Your account #{customer_id} is active. Initial bottle security deposit recorded. For fresh 19L refills call/WhatsApp {phone}.',
  },
];

function getInitialDatabase(): DatabaseSchema {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const twoDaysAgoStr = new Date(now.getTime() - 86400000 * 2).toISOString().split('T')[0];

  const inventory: InventoryItem[] = [
    {
      id: 'INV-ITEM-1',
      name: 'Empty 19-Liter Bottles (PC Polycarbonate)',
      category: 'empty_bottles',
      unit: 'Bottles',
      openingStock: 120,
      purchases: 50,
      usedInProduction: 90,
      damaged: 2,
      soldOrDelivered: 0,
      returned: 65,
      currentStock: 143,
      minimumStockLevel: 40,
      minThreshold: 40,
      unitCost: 450,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-2',
      name: 'Filled 19-Liter Mineral Water Bottles',
      category: 'filled_bottles',
      unit: 'Bottles',
      openingStock: 80,
      purchases: 0,
      usedInProduction: 0,
      damaged: 1,
      soldOrDelivered: 110,
      returned: 0,
      currentStock: 59,
      minimumStockLevel: 30,
      minThreshold: 30,
      unitCost: 45,
      sellingPrice: 150,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-3',
      name: 'Non-Spill Smart Caps (Blue 55mm)',
      category: 'caps',
      unit: 'Pcs',
      openingStock: 1500,
      purchases: 2000,
      usedInProduction: 90,
      damaged: 10,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 3400,
      minimumStockLevel: 500,
      minThreshold: 500,
      unitCost: 4.5,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-4',
      name: 'Heat Shrink Neck Sleeves & Tamper Seals',
      category: 'seals',
      unit: 'Pcs',
      openingStock: 2000,
      purchases: 3000,
      usedInProduction: 90,
      damaged: 15,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 4895,
      minimumStockLevel: 600,
      minThreshold: 600,
      unitCost: 1.8,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-5',
      name: 'Anmol Pure Branded Waterproof Body Labels',
      category: 'labels',
      unit: 'Pcs',
      openingStock: 1200,
      purchases: 2500,
      usedInProduction: 90,
      damaged: 5,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 3605,
      minimumStockLevel: 400,
      minThreshold: 400,
      unitCost: 6.0,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-6',
      name: 'RO Membrane 4040 & Micron Filters',
      category: 'ro_consumables',
      unit: 'Sets',
      openingStock: 6,
      purchases: 4,
      usedInProduction: 1,
      damaged: 0,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 9,
      minimumStockLevel: 2,
      minThreshold: 2,
      unitCost: 8500,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-7',
      name: 'Food-Grade Sanitizing Solution (Ozone/Chlorine Wash)',
      category: 'chemicals',
      unit: 'Liters',
      openingStock: 50,
      purchases: 100,
      usedInProduction: 12,
      damaged: 0,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 138,
      minimumStockLevel: 25,
      minThreshold: 25,
      unitCost: 180,
      lastUpdated: now.toISOString(),
    },
    {
      id: 'INV-ITEM-8',
      name: 'Manual Bottle Hand Pumps & Chrome Stands',
      category: 'other',
      unit: 'Pcs',
      openingStock: 35,
      purchases: 40,
      usedInProduction: 0,
      damaged: 0,
      soldOrDelivered: 18,
      returned: 0,
      currentStock: 57,
      minimumStockLevel: 15,
      minThreshold: 15,
      unitCost: 320,
      sellingPrice: 550,
      lastUpdated: now.toISOString(),
    },
  ];

  const customers: Customer[] = [
    {
      id: 'CUST-CASH',
      name: 'Counter / Walk-in Cash Customer',
      fatherOrCompanyName: 'Counter / Plant Walk-in',
      mobile: '',
      whatsapp: '',
      address: 'Plant Counter / Walk-in',
      area: 'Counter / Retail',
      city: 'Islamabad',
      customerType: 'retail',
      bottlesWithCustomer: 0,
      securityDeposit: 0,
      currentBalance: 0,
      creditLimit: 0,
      ratePerBottle: 150,
      notes: 'Default customer for instant counter cash sales and walk-in purchases.',
      registrationDate: '2026-01-01',
      active: true,
    },
    {
      id: 'CUST-1001',
      name: 'Horizon Software Solutions',
      fatherOrCompanyName: 'Tariq Mehmood (Admin Officer)',
      mobile: '+92 300 9876541',
      whatsapp: '+92 300 9876541',
      address: 'Floor 3, Executive Tower, Blue Area',
      area: 'Blue Area',
      city: 'Islamabad',
      googleMapsUrl: 'https://maps.google.com/?q=Blue+Area+Islamabad',
      customerType: 'commercial',
      bottlesWithCustomer: 12,
      securityDeposit: 6000,
      currentBalance: 3600,
      creditLimit: 15000,
      ratePerBottle: 140,
      notes: 'Daily delivery required at 9:30 AM before staff arrives.',
      registrationDate: '2026-01-15',
      active: true,
      isDemo: true,
    },
    {
      id: 'CUST-1002',
      name: 'Al-Madina Medical Center',
      fatherOrCompanyName: 'Dr. Farooq Qureshi',
      mobile: '+92 321 5554433',
      whatsapp: '+92 321 5554433',
      address: 'Main Markaz, Sector F-10',
      area: 'Sector F-10',
      city: 'Islamabad',
      googleMapsUrl: 'https://maps.google.com/?q=F-10+Markaz+Islamabad',
      customerType: 'monthly',
      bottlesWithCustomer: 8,
      securityDeposit: 4000,
      currentBalance: 1800,
      creditLimit: 10000,
      ratePerBottle: 150,
      notes: 'Monthly billing cycle on 1st of every month.',
      registrationDate: '2026-02-01',
      active: true,
      isDemo: true,
    },
    {
      id: 'CUST-1003',
      name: 'Bilal Chaudhry (Villa 42)',
      fatherOrCompanyName: 'Muhammad Akram',
      mobile: '+92 333 4443322',
      whatsapp: '+92 333 4443322',
      address: 'House 42, Street 14, Sector G-11/2',
      area: 'Sector G-11',
      city: 'Islamabad',
      googleMapsUrl: 'https://maps.google.com/?q=G-11+Islamabad',
      customerType: 'regular',
      bottlesWithCustomer: 3,
      securityDeposit: 1500,
      currentBalance: 0,
      creditLimit: 2000,
      ratePerBottle: 150,
      notes: 'Alternate days: Monday, Wednesday, Friday.',
      registrationDate: '2026-02-10',
      active: true,
      isDemo: true,
    },
    {
      id: 'CUST-1004',
      name: 'Global Call Center & BPO',
      fatherOrCompanyName: 'Khurram Shehzad',
      mobile: '+92 345 8877665',
      whatsapp: '+92 345 8877665',
      address: 'Building 18, Commercial Avenue, Sector I-8',
      area: 'Sector I-8',
      city: 'Islamabad',
      googleMapsUrl: 'https://maps.google.com/?q=I-8+Islamabad',
      customerType: 'commercial',
      bottlesWithCustomer: 20,
      securityDeposit: 10000,
      currentBalance: 7200,
      creditLimit: 25000,
      ratePerBottle: 135,
      notes: 'Heavy consumer, takes 6 bottles every 2 days.',
      registrationDate: '2026-01-20',
      active: true,
      isDemo: true,
    },
    {
      id: 'CUST-1005',
      name: 'Zubair Butt (Apartment 5B)',
      fatherOrCompanyName: 'Bashir Butt',
      mobile: '+92 312 9988776',
      whatsapp: '+92 312 9988776',
      address: 'Apt 5B, Silver Oaks Residency, F-10/4',
      area: 'Sector F-10',
      city: 'Islamabad',
      googleMapsUrl: 'https://maps.google.com/?q=Silver+Oaks+F-10+Islamabad',
      customerType: 'regular',
      bottlesWithCustomer: 2,
      securityDeposit: 1000,
      currentBalance: 300,
      creditLimit: 1500,
      ratePerBottle: 150,
      notes: 'Leave at door if not home.',
      registrationDate: '2026-03-01',
      active: true,
      isDemo: true,
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'SUP-101',
      name: 'Apex Polymer & Bottle Co.',
      contactPerson: 'Mian Shahbaz',
      mobile: '+92 300 5556677',
      whatsapp: '+92 300 5556677',
      address: 'Plot 12, S.I.T.E Area, Gujranwala',
      city: 'Gujranwala',
      productSupplied: '19L Polycarbonate Bottles & Handles',
      totalPurchases: 65000,
      totalPaid: 45000,
      balancePayable: 20000,
      notes: 'Primary 19-liter empty bottles manufacturer.',
      createdAt: '2026-01-05',
      isDemo: true,
    },
    {
      id: 'SUP-102',
      name: 'Crystal Cap & Packaging Solutions',
      contactPerson: 'Adnan Siddiqui',
      mobile: '+92 321 8889900',
      whatsapp: '+92 321 8889900',
      address: 'Industrial Triangle, Kahuta Road, Rawalpindi',
      city: 'Rawalpindi',
      productSupplied: '55mm Non-Spill Caps, Heat Shrink Sleeves & Labels',
      totalPurchases: 28500,
      totalPaid: 20000,
      balancePayable: 8500,
      notes: 'Delivers caps and seals in cartons of 1000 pcs.',
      createdAt: '2026-01-10',
      isDemo: true,
    },
  ];

  const refillBatches: RefillBatch[] = [
    {
      id: 'REF-1001',
      refillNumber: 'REF-2026-001',
      date: twoDaysAgoStr,
      bottleSize: '19-Liter',
      emptyBottlesUsed: 40,
      filledBottlesProduced: 39,
      damagedBottles: 1,
      rejectedBottles: 0,
      operator: 'Kamran Ullah',
      notes: 'Morning shift batch 1. Standard TDS 45 ppm, pH 7.2.',
      status: 'completed',
      createdBy: 'USR-1',
      createdAt: twoDaysAgoStr + 'T09:00:00.000Z',
      isDemo: true,
    },
    {
      id: 'REF-1002',
      refillNumber: 'REF-2026-002',
      date: yesterdayStr,
      bottleSize: '19-Liter',
      emptyBottlesUsed: 50,
      filledBottlesProduced: 49,
      damagedBottles: 1,
      rejectedBottles: 0,
      operator: 'Kamran Ullah',
      notes: 'Batch 2 with freshly replaced micron filters.',
      status: 'completed',
      createdBy: 'USR-2',
      createdAt: yesterdayStr + 'T09:30:00.000Z',
      isDemo: true,
    },
  ];

  const sales: Sale[] = [
    {
      id: 'SALE-1001',
      invoiceNumber: 'INV-1001',
      date: twoDaysAgoStr,
      customerId: 'CUST-1001',
      customerName: 'Horizon Software Solutions',
      customerPhone: '+92 300 9876541',
      customerAddress: 'Floor 3, Executive Tower, Blue Area',
      items: [
        {
          itemId: 'INV-ITEM-2',
          itemName: 'Filled 19-Liter Mineral Water Bottle',
          quantity: 6,
          rate: 140,
          total: 840,
        },
      ],
      quantity: 6,
      emptyBottlesReceived: 6,
      rate: 140,
      subtotal: 840,
      discount: 0,
      deliveryCharges: 0,
      total: 840,
      paidAmount: 840,
      remainingBalance: 0,
      paymentMethod: 'Bank Transfer',
      deliveryPerson: 'Rashid Mehmood',
      status: 'completed',
      notes: 'Delivered and paid online.',
      createdBy: 'USR-1',
      createdAt: twoDaysAgoStr + 'T10:30:00.000Z',
      isDemo: true,
    },
    {
      id: 'SALE-1002',
      invoiceNumber: 'INV-1002',
      date: yesterdayStr,
      customerId: 'CUST-1004',
      customerName: 'Global Call Center & BPO',
      customerPhone: '+92 345 8877665',
      customerAddress: 'Building 18, Commercial Avenue, Sector I-8',
      items: [
        {
          itemId: 'INV-ITEM-2',
          itemName: 'Filled 19-Liter Mineral Water Bottle',
          quantity: 8,
          rate: 135,
          total: 1080,
        },
      ],
      quantity: 8,
      emptyBottlesReceived: 5,
      rate: 135,
      subtotal: 1080,
      discount: 0,
      deliveryCharges: 0,
      total: 1080,
      paidAmount: 0,
      remainingBalance: 1080,
      paymentMethod: 'Cash',
      deliveryPerson: 'Rashid Mehmood',
      status: 'completed',
      notes: 'Pending credit invoice on monthly account.',
      createdBy: 'USR-2',
      createdAt: yesterdayStr + 'T11:15:00.000Z',
      isDemo: true,
    },
  ];

  const payments: Payment[] = [
    {
      id: 'PAY-1001',
      receiptNumber: 'REC-1001',
      date: twoDaysAgoStr,
      customerId: 'CUST-1001',
      customerName: 'Horizon Software Solutions',
      amount: 840,
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'FT-99281726',
      notes: 'Online IBFT against invoice INV-1001',
      receivedBy: 'Ahmed Khan',
      createdAt: twoDaysAgoStr + 'T10:35:00.000Z',
      isDemo: true,
    },
  ];

  const deliveries: DeliveryRecord[] = [
    {
      id: 'DEL-1001',
      deliveryNumber: 'DEL-1001',
      date: todayStr,
      customerId: 'CUST-1002',
      customerName: 'Al-Madina Medical Center',
      phone: '+92 321 5554433',
      address: 'Main Markaz, Sector F-10',
      area: 'Sector F-10',
      googleMapsUrl: 'https://maps.google.com/?q=F-10+Markaz+Islamabad',
      filledDelivered: 4,
      emptyReceived: 4,
      rate: 150,
      total: 600,
      paid: 600,
      remaining: 0,
      paymentMethod: 'Cash',
      deliveryPerson: 'Rashid Mehmood',
      status: 'delivered',
      notes: 'Delivered and cash collected.',
      deliveredAt: todayStr + 'T10:00:00.000Z',
      createdAt: todayStr + 'T08:30:00.000Z',
      isDemo: true,
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'EXP-1001',
      voucherNumber: 'EXP-1001',
      date: yesterdayStr,
      category: 'Fuel',
      description: 'Suzuki Bolan delivery van CNG & Petrol top-up',
      amount: 1800,
      paymentMethod: 'Cash',
      paidTo: 'PSO Blue Area Station',
      approvedBy: 'Ahmed Khan',
      notes: 'Van mileage 48,200 km',
      createdAt: yesterdayStr + 'T08:00:00.000Z',
      isDemo: true,
    },
  ];

  const purchases: Purchase[] = [
    {
      id: 'PUR-1001',
      invoiceNumber: 'PUR-1001',
      date: '2026-02-20',
      supplierId: 'SUP-101',
      supplierName: 'Apex Polymer & Bottle Co.',
      itemCategory: 'empty_bottles',
      itemId: 'INV-ITEM-1',
      itemName: 'Empty 19-Liter Bottles (PC Polycarbonate)',
      quantity: 50,
      rate: 450,
      total: 22500,
      paidAmount: 15000,
      remainingBalance: 7500,
      paymentMethod: 'Bank Transfer',
      notes: 'First batch of 50 new blue PC bottles.',
      receivedBy: 'Ahmed Khan',
      createdAt: '2026-02-20T10:00:00.000Z',
      isDemo: true,
    },
  ];

  const customerTransactions: CustomerTransaction[] = [
    {
      id: 'CTX-1001',
      customerId: 'CUST-1001',
      customerName: 'Horizon Software Solutions',
      date: twoDaysAgoStr,
      type: 'sale',
      referenceId: 'INV-1001',
      description: 'Sale of 6 filled 19L bottles @ 140',
      debit: 840,
      credit: 0,
      runningBalance: 3600,
      createdBy: 'USR-1',
      createdAt: twoDaysAgoStr + 'T10:30:00.000Z',
    },
  ];

  const customerBottleLedger: CustomerBottleTransaction[] = [
    {
      id: 'CBL-1001',
      customerId: 'CUST-1001',
      customerName: 'Horizon Software Solutions',
      date: twoDaysAgoStr,
      type: 'delivered',
      referenceId: 'DEL-1000',
      filledDelivered: 6,
      emptyReturned: 6,
      netChange: 0,
      runningBottleBalance: 12,
      notes: 'Delivered 6, took 6 empty. Balance steady at 12.',
      createdBy: 'USR-1',
      createdAt: twoDaysAgoStr + 'T10:30:00.000Z',
    },
  ];

  const inventoryTransactions: InventoryTransaction[] = [
    {
      id: 'ITX-1001',
      itemId: 'INV-ITEM-1',
      itemName: 'Empty 19-Liter Bottles',
      date: twoDaysAgoStr,
      type: 'refill_empty_used',
      quantityChange: -40,
      resultingStock: 148,
      referenceId: 'REF-1001',
      notes: 'Used in batch REF-2026-001',
      createdBy: 'USR-1',
      createdAt: twoDaysAgoStr + 'T09:00:00.000Z',
    },
  ];

  const supplierTransactions: SupplierTransaction[] = [
    {
      id: 'STX-1001',
      supplierId: 'SUP-101',
      supplierName: 'Apex Polymer & Bottle Co.',
      date: '2026-02-20',
      type: 'purchase',
      referenceId: 'PUR-1001',
      description: 'Purchase of 50 empty PC bottles',
      debit: 0,
      credit: 22500,
      runningBalance: 27500,
      createdBy: 'USR-1',
      createdAt: '2026-02-20T10:00:00.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'LOG-1',
      timestamp: twoDaysAgoStr + 'T08:00:00.000Z',
      userId: 'USR-1',
      userName: 'Ahmed Khan',
      userRole: 'admin',
      action: 'SYSTEM_INIT',
      module: 'Core System',
      details: 'Water Business Manager database initialized with certified schemas and seed records.',
    },
  ];

  return {
    users: DEFAULT_USERS,
    customers,
    customer_transactions: customerTransactions,
    customer_bottle_ledger: customerBottleLedger,
    inventory,
    inventory_transactions: inventoryTransactions,
    refilling: refillBatches,
    sales,
    payments,
    suppliers,
    supplier_transactions: supplierTransactions,
    purchases,
    expenses,
    deliveries,
    message_templates: DEFAULT_TEMPLATES,
    messages: [],
    settings: DEFAULT_SETTINGS,
    audit_logs: auditLogs,
    customer_accounts: [],
    customer_addresses: [],
    online_orders: [],
  };
}

export function getCleanPersonalDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    users: DEFAULT_USERS,
    customers: [],
    customer_transactions: [],
    customer_bottle_ledger: [],
    inventory: [
      {
        id: 'INV-ITEM-1',
        name: 'Empty 19-Liter Polycarbonate (PC) Bottles',
        category: 'empty_bottles',
        unit: 'Bottles',
        openingStock: 0,
        purchases: 0,
        usedInProduction: 0,
        damaged: 0,
        soldOrDelivered: 0,
        returned: 0,
        currentStock: 0,
        minimumStockLevel: 50,
        minThreshold: 50,
        unitCost: 450,
        lastUpdated: now,
      },
      {
        id: 'INV-ITEM-2',
        name: 'Filled 19-Liter Mineral Water Bottles',
        category: 'filled_bottles',
        unit: 'Bottles',
        openingStock: 0,
        purchases: 0,
        usedInProduction: 0,
        damaged: 0,
        soldOrDelivered: 0,
        returned: 0,
        currentStock: 0,
        minimumStockLevel: 30,
        minThreshold: 30,
        unitCost: 45,
        sellingPrice: 150,
        lastUpdated: now,
      },
      {
        id: 'INV-ITEM-3',
        name: 'Non-Spill Smart Caps (Blue 55mm)',
        category: 'caps',
        unit: 'Pcs',
        openingStock: 0,
        purchases: 0,
        usedInProduction: 0,
        damaged: 0,
        soldOrDelivered: 0,
        returned: 0,
        currentStock: 0,
        minimumStockLevel: 200,
        minThreshold: 200,
        unitCost: 4.5,
        lastUpdated: now,
      },
      {
        id: 'INV-ITEM-4',
        name: 'Heat Shrink Neck Sleeves & Tamper Seals',
        category: 'seals',
        unit: 'Pcs',
        openingStock: 0,
        purchases: 0,
        usedInProduction: 0,
        damaged: 0,
        soldOrDelivered: 0,
        returned: 0,
        currentStock: 0,
        minimumStockLevel: 200,
        minThreshold: 200,
        unitCost: 1.8,
        lastUpdated: now,
      },
      {
        id: 'INV-ITEM-5',
        name: 'Anmol Pure Branded Waterproof Body Labels',
        category: 'labels',
        unit: 'Pcs',
        openingStock: 0,
        purchases: 0,
        usedInProduction: 0,
        damaged: 0,
        soldOrDelivered: 0,
        returned: 0,
        currentStock: 0,
        minimumStockLevel: 200,
        minThreshold: 200,
        unitCost: 6.0,
        lastUpdated: now,
      },
    ],
    inventory_transactions: [],
    refilling: [],
    sales: [],
    payments: [],
    suppliers: [],
    supplier_transactions: [],
    purchases: [],
    expenses: [],
    deliveries: [],
    message_templates: DEFAULT_TEMPLATES,
    messages: [],
    settings: DEFAULT_SETTINGS,
    audit_logs: [
      {
        id: 'LOG-INIT-CLEAN',
        timestamp: now,
        userId: 'USR-1',
        userName: 'Admin',
        userRole: 'admin',
        action: 'ALL_DATA_CLEARED',
        module: 'Core System',
        details: 'All dummy sample records removed. Ready for personal business data entry.',
      },
    ],
    customer_accounts: [],
    customer_addresses: [],
    online_orders: [],
  };
}

class DatabaseManager {
  private db: DatabaseSchema | null = null;

  constructor() {
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load(): DatabaseSchema {
    this.ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      this.save(initial);
      this.db = initial;
      return initial;
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      parsed.customer_accounts = parsed.customer_accounts || [];
      parsed.customer_addresses = parsed.customer_addresses || [];
      parsed.online_orders = parsed.online_orders || [];
      parsed.users = parsed.users || [];

      let hasOwner = false;
      parsed.users.forEach((u: User) => {
        const defaultMatch = DEFAULT_USERS.find((du) => du.id === u.id || du.email === u.email);
        if (defaultMatch) {
          if (!u.passwordHash) {
            u.passwordHash = defaultMatch.passwordHash;
            u.salt = defaultMatch.salt;
          }
          if (!u.employeeId) u.employeeId = defaultMatch.employeeId;
          if (!u.department) u.department = defaultMatch.department;
          if (!u.authUserId) u.authUserId = defaultMatch.authUserId;
          if (!u.permissions) u.permissions = [...(defaultMatch.permissions || [])];
        }
        if (u.id === 'USR-1') {
          u.role = 'owner';
          if (!u.name.includes('Owner')) u.name = 'Ahmed Khan (Owner)';
          u.department = u.department || 'Executive Management';
          u.employeeId = u.employeeId || 'EMP-001';
          u.permissions = [...ALL_PERMISSIONS];
          hasOwner = true;
        } else if (u.role === 'owner') {
          hasOwner = true;
        }
        u.status = u.status || (u.active !== false ? 'active' : 'inactive');
      });

      if (!hasOwner && DEFAULT_USERS[0]) {
        parsed.users.unshift(DEFAULT_USERS[0]);
      }
      if (!parsed.users.some((u: User) => u.id === 'USR-4') && DEFAULT_USERS[3]) {
        parsed.users.push(DEFAULT_USERS[3]);
      }

      this.db = parsed;
      return this.db!;
    } catch (err) {
      console.error('Error reading DB, re-initializing fallback:', err);
      const initial = getInitialDatabase();
      this.save(initial);
      this.db = initial;
      return initial;
    }
  }

  public save(data: DatabaseSchema) {
    this.ensureDataDir();
    data.customer_accounts = data.customer_accounts || [];
    data.customer_addresses = data.customer_addresses || [];
    data.online_orders = data.online_orders || [];
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    this.db = data;
  }

  public get(): DatabaseSchema {
    if (!this.db) {
      return this.load();
    }
    return this.db;
  }

  public mutate<T>(mutator: (db: DatabaseSchema) => T): T {
    const current = this.load();
    const result = mutator(current);
    this.save(current);
    return result;
  }

  public clearAllData(): DatabaseSchema {
    const clean = getCleanPersonalDatabase();
    this.save(clean);
    return clean;
  }

  public resetDemoData(): DatabaseSchema {
    const fresh = getInitialDatabase();
    this.save(fresh);
    return fresh;
  }
}

export const dbManager = new DatabaseManager();
