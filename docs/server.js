// server.ts
import express from "express";
import path2 from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

// server/db.ts
import fs from "fs";
import path from "path";

// src/utils/permissions.ts
var ALL_PERMISSIONS = [
  "dashboard.view",
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.delete",
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.delete",
  "sales.export",
  "payments.view",
  "payments.create",
  "payments.edit",
  "payments.delete",
  "orders.view",
  "orders.create",
  "orders.confirm",
  "orders.reject",
  "orders.assign",
  "orders.cancel",
  "deliveries.view",
  "deliveries.create",
  "deliveries.update",
  "inventory.view",
  "inventory.create",
  "inventory.edit",
  "refilling.view",
  "refilling.create",
  "refilling.edit",
  "purchases.view",
  "purchases.create",
  "purchases.edit",
  "purchases.delete",
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.delete",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "reports.view",
  "reports.export",
  "messages.view",
  "messages.send",
  "staff.view",
  "staff.create",
  "staff.edit",
  "staff.disable",
  "staff.permissions",
  "settings.view",
  "settings.edit",
  "audit_logs.view",
  "security.manage",
  "owner.manage",
  "database.manage"
];
var ROLE_DEFAULT_PERMISSIONS = {
  owner: [...ALL_PERMISSIONS],
  admin: [
    "dashboard.view",
    "customers.view",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "sales.view",
    "sales.create",
    "sales.edit",
    "sales.delete",
    "sales.export",
    "payments.view",
    "payments.create",
    "payments.edit",
    "payments.delete",
    "orders.view",
    "orders.create",
    "orders.confirm",
    "orders.reject",
    "orders.assign",
    "orders.cancel",
    "deliveries.view",
    "deliveries.create",
    "deliveries.update",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "refilling.view",
    "refilling.create",
    "refilling.edit",
    "purchases.view",
    "purchases.create",
    "purchases.edit",
    "purchases.delete",
    "expenses.view",
    "expenses.create",
    "expenses.edit",
    "expenses.delete",
    "suppliers.view",
    "suppliers.create",
    "suppliers.edit",
    "reports.view",
    "reports.export",
    "messages.view",
    "messages.send",
    "staff.view",
    "staff.create",
    "staff.edit",
    "staff.disable",
    "staff.permissions",
    "settings.view",
    "settings.edit",
    "audit_logs.view",
    "security.manage",
    "database.manage"
  ],
  staff: [
    "dashboard.view",
    "customers.view",
    "customers.create",
    "customers.edit",
    "sales.view",
    "sales.create",
    "sales.edit",
    "sales.export",
    "payments.view",
    "payments.create",
    "orders.view",
    "orders.create",
    "orders.confirm",
    "orders.assign",
    "deliveries.view",
    "deliveries.create",
    "deliveries.update",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "refilling.view",
    "refilling.create",
    "refilling.edit",
    "purchases.view",
    "purchases.create",
    "expenses.view",
    "expenses.create",
    "suppliers.view",
    "reports.view",
    "messages.view",
    "messages.send"
  ],
  delivery: [
    "dashboard.view",
    "customers.view",
    "orders.view",
    "deliveries.view",
    "deliveries.update"
  ],
  customer: []
};
var PERMISSION_MODULES = [
  {
    module: "dashboard",
    label: "Dashboard Overview",
    permissions: [
      { key: "dashboard.view", label: "View Dashboard & Metrics", action: "view" }
    ]
  },
  {
    module: "customers",
    label: "Customer Accounts",
    permissions: [
      { key: "customers.view", label: "View Customers", action: "view" },
      { key: "customers.create", label: "Add New Customer", action: "create" },
      { key: "customers.edit", label: "Edit Customer & Pricing", action: "edit" },
      { key: "customers.delete", label: "Delete Customer", action: "delete" }
    ]
  },
  {
    module: "sales",
    label: "Sales & Invoices",
    permissions: [
      { key: "sales.view", label: "View Sales History", action: "view" },
      { key: "sales.create", label: "Create Sale / Invoice", action: "create" },
      { key: "sales.edit", label: "Edit / Adjust Invoice", action: "edit" },
      { key: "sales.delete", label: "Cancel / Delete Invoice", action: "delete" },
      { key: "sales.export", label: "Export Sales to CSV", action: "export" }
    ]
  },
  {
    module: "payments",
    label: "Payments & Collections",
    permissions: [
      { key: "payments.view", label: "View Payment Receipts", action: "view" },
      { key: "payments.create", label: "Receive Payment", action: "create" },
      { key: "payments.edit", label: "Edit Payment", action: "edit" },
      { key: "payments.delete", label: "Delete / Void Receipt", action: "delete" }
    ]
  },
  {
    module: "orders",
    label: "Online Orders",
    permissions: [
      { key: "orders.view", label: "View Online Orders", action: "view" },
      { key: "orders.create", label: "Create Manual Order", action: "create" },
      { key: "orders.confirm", label: "Confirm Orders", action: "approve" },
      { key: "orders.assign", label: "Assign Van Driver", action: "edit" },
      { key: "orders.reject", label: "Reject Order", action: "delete" },
      { key: "orders.cancel", label: "Cancel Order", action: "delete" }
    ]
  },
  {
    module: "deliveries",
    label: "Deliveries & Routes",
    permissions: [
      { key: "deliveries.view", label: "View Deliveries & Trips", action: "view" },
      { key: "deliveries.create", label: "Dispatch Route Delivery", action: "create" },
      { key: "deliveries.update", label: "Complete Delivery / Collect Empty", action: "edit" }
    ]
  },
  {
    module: "inventory",
    label: "Inventory & Stock",
    permissions: [
      { key: "inventory.view", label: "View Inventory Levels", action: "view" },
      { key: "inventory.create", label: "Add New Inventory Item", action: "create" },
      { key: "inventory.edit", label: "Adjust Stock Quantities", action: "edit" }
    ]
  },
  {
    module: "refilling",
    label: "Plant Refilling Batches",
    permissions: [
      { key: "refilling.view", label: "View Refill Production", action: "view" },
      { key: "refilling.create", label: "Record Refill Batch", action: "create" },
      { key: "refilling.edit", label: "Edit / Cancel Batch", action: "edit" }
    ]
  },
  {
    module: "purchases",
    label: "Procurement & Purchases",
    permissions: [
      { key: "purchases.view", label: "View Purchases", action: "view" },
      { key: "purchases.create", label: "Record Stock Purchase", action: "create" },
      { key: "purchases.edit", label: "Edit Purchase", action: "edit" },
      { key: "purchases.delete", label: "Cancel Purchase", action: "delete" }
    ]
  },
  {
    module: "expenses",
    label: "Operating Expenses",
    permissions: [
      { key: "expenses.view", label: "View Expense Vouchers", action: "view" },
      { key: "expenses.create", label: "Record Expense", action: "create" },
      { key: "expenses.edit", label: "Edit Expense", action: "edit" },
      { key: "expenses.delete", label: "Delete Expense", action: "delete" }
    ]
  },
  {
    module: "suppliers",
    label: "Suppliers & Vendors",
    permissions: [
      { key: "suppliers.view", label: "View Suppliers", action: "view" },
      { key: "suppliers.create", label: "Add Supplier", action: "create" },
      { key: "suppliers.edit", label: "Edit Supplier Pricing", action: "edit" }
    ]
  },
  {
    module: "reports",
    label: "Business Reports & Analytics",
    permissions: [
      { key: "reports.view", label: "View Reports & Accounts", action: "view" },
      { key: "reports.export", label: "Export Reports to CSV", action: "export" }
    ]
  },
  {
    module: "messages",
    label: "Customer Messaging",
    permissions: [
      { key: "messages.view", label: "View Messaging History", action: "view" },
      { key: "messages.send", label: "Send WhatsApp / SMS", action: "create" }
    ]
  },
  {
    module: "staff",
    label: "Staff & Team Management",
    permissions: [
      { key: "staff.view", label: "View Staff Members", action: "view" },
      { key: "staff.create", label: "Add New Staff Member", action: "create" },
      { key: "staff.edit", label: "Edit Staff Details", action: "edit" },
      { key: "staff.disable", label: "Activate / Suspend Staff", action: "manage" },
      { key: "staff.permissions", label: "Modify Staff Permissions", action: "manage" }
    ]
  },
  {
    module: "settings",
    label: "System & Configuration",
    permissions: [
      { key: "settings.view", label: "View Business Settings", action: "view" },
      { key: "settings.edit", label: "Update Business Settings", action: "edit" },
      { key: "audit_logs.view", label: "View Audit Logs", action: "view" },
      { key: "security.manage", label: "Manage Staff Security", action: "manage" },
      { key: "database.manage", label: "Database Backup & Restore", action: "manage" },
      { key: "owner.manage", label: "Owner Administration & Ownership Transfer", action: "manage" }
    ]
  }
];

// server/db.ts
var DATA_DIR = path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "water_business_db.json");
var DEFAULT_SETTINGS = {
  businessName: "Anmol Pure Mineral Water",
  tagline: "Premium 19-Liter Mountain Mineral Water & Daily Refill Distribution",
  phone: "+92 300 1234567",
  whatsapp: "+92 300 1234567",
  email: "info@anmolpurewater.com",
  address: "Plot 42-B, Industrial Estate, Sector I-9",
  city: "Islamabad",
  currency: "Rs.",
  defaultBottleSize: "19-Liter",
  defaultBottlePrice: 150,
  defaultSecurityDeposit: 500,
  invoicePrefix: "INV-",
  receiptPrefix: "REC-",
  refillPrefix: "REF-",
  deliveryPrefix: "DEL-",
  lowStockBottlesThreshold: 50,
  lowStockCapsThreshold: 200,
  lowStockLabelsThreshold: 200,
  termsAndConditions: "Bottles remain property of Anmol Pure Mineral Water. Please return empty bottles in clean condition.",
  whatsappApiConfigured: true,
  autoWhatsAppOnPayment: true,
  whatsappPaymentReceiptTemplate: "Dear {customer_name}, we have received your payment of {currency} {amount} via {method} (Receipt #{receipt_number}). Updated account balance: {currency} {balance}. Thank you for choosing {business_name}!",
  allowNegativeStock: false
};
var DEFAULT_USERS = [
  {
    id: "USR-1",
    authUserId: "00000000-0000-0000-0000-000000000001",
    employeeId: "EMP-001",
    name: "Ahmed Khan (Owner)",
    email: "owner@anmolpurewater.com",
    role: "owner",
    status: "active",
    active: true,
    department: "Executive Management",
    phone: "+92 300 1112233",
    joiningDate: "2025-01-01",
    permissions: [...ALL_PERMISSIONS],
    passwordHash: "dc4b6b27dae5ceb1ecef8ad05e1a1b6bb45cf21739af49c162881541d343f4f473db44277e31a3ca9d0695fe63f0efca539bcc5372004d7e5a397db59b43bc6e",
    // Owner@Anmol2026!
    salt: "anmol_salt_2026",
    mfaEnabled: true,
    lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
    lastPasswordChange: "2026-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: "USR-2",
    authUserId: "00000000-0000-0000-0000-000000000002",
    employeeId: "EMP-002",
    name: "Sajid Ali (Admin/Accounts)",
    email: "admin@anmolpurewater.com",
    role: "admin",
    status: "active",
    active: true,
    department: "Finance & Accounts",
    phone: "+92 301 2223344",
    joiningDate: "2025-03-01",
    permissions: [...ROLE_DEFAULT_PERMISSIONS.admin],
    passwordHash: "32ec28738cbc6902345d5fc2cfa2638c16ac51399a2b14fc4c1645ae83fb16127b67eb324f2b41ca44c8202292fc3df64ce715796d6bff08cbef6c4fe6b03f20",
    // Admin@Anmol2026!
    salt: "anmol_salt_2026",
    mfaEnabled: false,
    lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
    lastPasswordChange: "2026-02-01T00:00:00.000Z",
    createdAt: "2025-03-01T00:00:00.000Z"
  },
  {
    id: "USR-3",
    authUserId: "00000000-0000-0000-0000-000000000003",
    employeeId: "EMP-003",
    name: "Bilal Siddiqui (Plant Staff)",
    email: "staff@anmolpurewater.com",
    role: "staff",
    status: "active",
    active: true,
    department: "Plant Operations & Inventory",
    phone: "+92 301 5556677",
    joiningDate: "2025-05-15",
    permissions: [...ROLE_DEFAULT_PERMISSIONS.staff],
    passwordHash: "ce5852e8c8c63a132b37947e96f032ec8c94631a022fa432c792e83aaef2314076438ba45589024098d6ae4ce3ad26be47ebb0cd69d5588b56d2ca2c71734b66",
    // Staff@Anmol2026!
    salt: "anmol_salt_2026",
    mfaEnabled: false,
    lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
    lastPasswordChange: "2026-03-01T00:00:00.000Z",
    createdAt: "2025-05-15T00:00:00.000Z"
  },
  {
    id: "USR-4",
    authUserId: "00000000-0000-0000-0000-000000000004",
    employeeId: "EMP-004",
    name: "Rashid Mehmood (Delivery Driver)",
    email: "driver@anmolpurewater.com",
    role: "delivery",
    status: "active",
    active: true,
    department: "Delivery & Logistics",
    assignedArea: "Sector F-10 & Blue Area",
    phone: "+92 302 3334455",
    joiningDate: "2025-06-01",
    permissions: [...ROLE_DEFAULT_PERMISSIONS.delivery],
    passwordHash: "61d837cc345430d4260e12956c93eaf431e2b81c7e60e092bb64f8075c7ccfccec2482872122824e1a87623eadd6d44c546b5f3cf6762cc60f2fd407b296777d",
    // Driver@Anmol2026!
    salt: "anmol_salt_2026",
    mfaEnabled: false,
    lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
    lastPasswordChange: "2026-03-15T00:00:00.000Z",
    createdAt: "2025-06-01T00:00:00.000Z"
  }
];
var DEFAULT_TEMPLATES = [
  {
    id: "TMPL-1",
    name: "Outstanding Balance Reminder",
    title: "Outstanding Balance Reminder",
    code: "balance_due",
    channel: "whatsapp",
    description: "Remind customer of pending unpaid bill",
    content: "Dear {customer_name}, your current outstanding water bill balance with {business_name} is {currency} {balance} for {bottle_count} bottles. Please clear the due amount at your earliest convenience. Thank you - {business_name} ({phone})"
  },
  {
    id: "TMPL-2",
    name: "Payment Received Receipt",
    title: "Payment Received Receipt",
    code: "payment_received",
    channel: "whatsapp",
    description: "Confirm received cash/online payment",
    content: "Dear {customer_name}, we have received your payment of {currency} {paid}. Remaining balance: {currency} {balance}. Thank you for choosing {business_name}!"
  },
  {
    id: "TMPL-3",
    name: "Order Delivery Notification",
    title: "Order Delivery Notification",
    code: "delivery_dispatched",
    channel: "whatsapp",
    description: "Notify arrival of water bottle refills",
    content: "Assalam-o-Alaikum {customer_name}, your 19L mineral water refill delivery has arrived. Driver will exchange empty bottles. Thank you, {business_name}."
  },
  {
    id: "TMPL-4",
    name: "Empty Bottle Return Alert",
    title: "Empty Bottle Return Alert",
    code: "bottle_return_reminder",
    channel: "whatsapp",
    description: "Request return of empty 19L bottles",
    content: "Dear {customer_name}, according to our records you currently have {bottle_count} empty 19L bottles. Please return empties on the next delivery visit. {business_name} - {phone}."
  },
  {
    id: "TMPL-5",
    name: "Monthly Ledger Statement",
    title: "Monthly Ledger Statement",
    code: "monthly_statement",
    channel: "whatsapp",
    description: "Monthly summary of deliveries & dues",
    content: "Dear {customer_name}, your monthly water statement is prepared. Total bottles delivered: {quantity}, Payments received: {currency} {paid}, Current balance: {currency} {balance}. Detailed statement available on request. - {business_name}"
  },
  {
    id: "TMPL-6",
    name: "Welcome New Customer",
    title: "Welcome New Customer",
    code: "welcome",
    channel: "whatsapp",
    description: "Account onboarding & greeting",
    content: "Welcome {customer_name} to {business_name}! Your account #{customer_id} is active. Initial bottle security deposit recorded. For fresh 19L refills call/WhatsApp {phone}."
  }
];
function getInitialDatabase() {
  const now = /* @__PURE__ */ new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterdayStr = new Date(now.getTime() - 864e5).toISOString().split("T")[0];
  const twoDaysAgoStr = new Date(now.getTime() - 864e5 * 2).toISOString().split("T")[0];
  const inventory = [
    {
      id: "INV-ITEM-1",
      name: "Empty 19-Liter Bottles (PC Polycarbonate)",
      category: "empty_bottles",
      unit: "Bottles",
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
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-2",
      name: "Filled 19-Liter Mineral Water Bottles",
      category: "filled_bottles",
      unit: "Bottles",
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
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-3",
      name: "Non-Spill Smart Caps (Blue 55mm)",
      category: "caps",
      unit: "Pcs",
      openingStock: 1500,
      purchases: 2e3,
      usedInProduction: 90,
      damaged: 10,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 3400,
      minimumStockLevel: 500,
      minThreshold: 500,
      unitCost: 4.5,
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-4",
      name: "Heat Shrink Neck Sleeves & Tamper Seals",
      category: "seals",
      unit: "Pcs",
      openingStock: 2e3,
      purchases: 3e3,
      usedInProduction: 90,
      damaged: 15,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 4895,
      minimumStockLevel: 600,
      minThreshold: 600,
      unitCost: 1.8,
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-5",
      name: "Anmol Pure Branded Waterproof Body Labels",
      category: "labels",
      unit: "Pcs",
      openingStock: 1200,
      purchases: 2500,
      usedInProduction: 90,
      damaged: 5,
      soldOrDelivered: 0,
      returned: 0,
      currentStock: 3605,
      minimumStockLevel: 400,
      minThreshold: 400,
      unitCost: 6,
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-6",
      name: "RO Membrane 4040 & Micron Filters",
      category: "ro_consumables",
      unit: "Sets",
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
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-7",
      name: "Food-Grade Sanitizing Solution (Ozone/Chlorine Wash)",
      category: "chemicals",
      unit: "Liters",
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
      lastUpdated: now.toISOString()
    },
    {
      id: "INV-ITEM-8",
      name: "Manual Bottle Hand Pumps & Chrome Stands",
      category: "other",
      unit: "Pcs",
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
      lastUpdated: now.toISOString()
    }
  ];
  const customers = [
    {
      id: "CUST-CASH",
      name: "Counter / Walk-in Cash Customer",
      fatherOrCompanyName: "Counter / Plant Walk-in",
      mobile: "",
      whatsapp: "",
      address: "Plant Counter / Walk-in",
      area: "Counter / Retail",
      city: "Islamabad",
      customerType: "retail",
      bottlesWithCustomer: 0,
      securityDeposit: 0,
      currentBalance: 0,
      creditLimit: 0,
      ratePerBottle: 150,
      notes: "Default customer for instant counter cash sales and walk-in purchases.",
      registrationDate: "2026-01-01",
      active: true
    },
    {
      id: "CUST-1001",
      name: "Horizon Software Solutions",
      fatherOrCompanyName: "Tariq Mehmood (Admin Officer)",
      mobile: "+92 300 9876541",
      whatsapp: "+92 300 9876541",
      address: "Floor 3, Executive Tower, Blue Area",
      area: "Blue Area",
      city: "Islamabad",
      googleMapsUrl: "https://maps.google.com/?q=Blue+Area+Islamabad",
      customerType: "commercial",
      bottlesWithCustomer: 12,
      securityDeposit: 6e3,
      currentBalance: 3600,
      creditLimit: 15e3,
      ratePerBottle: 140,
      notes: "Daily delivery required at 9:30 AM before staff arrives.",
      registrationDate: "2026-01-15",
      active: true,
      isDemo: true
    },
    {
      id: "CUST-1002",
      name: "Al-Madina Medical Center",
      fatherOrCompanyName: "Dr. Farooq Qureshi",
      mobile: "+92 321 5554433",
      whatsapp: "+92 321 5554433",
      address: "Main Markaz, Sector F-10",
      area: "Sector F-10",
      city: "Islamabad",
      googleMapsUrl: "https://maps.google.com/?q=F-10+Markaz+Islamabad",
      customerType: "monthly",
      bottlesWithCustomer: 8,
      securityDeposit: 4e3,
      currentBalance: 1800,
      creditLimit: 1e4,
      ratePerBottle: 150,
      notes: "Monthly billing cycle on 1st of every month.",
      registrationDate: "2026-02-01",
      active: true,
      isDemo: true
    },
    {
      id: "CUST-1003",
      name: "Bilal Chaudhry (Villa 42)",
      fatherOrCompanyName: "Muhammad Akram",
      mobile: "+92 333 4443322",
      whatsapp: "+92 333 4443322",
      address: "House 42, Street 14, Sector G-11/2",
      area: "Sector G-11",
      city: "Islamabad",
      googleMapsUrl: "https://maps.google.com/?q=G-11+Islamabad",
      customerType: "regular",
      bottlesWithCustomer: 3,
      securityDeposit: 1500,
      currentBalance: 0,
      creditLimit: 2e3,
      ratePerBottle: 150,
      notes: "Alternate days: Monday, Wednesday, Friday.",
      registrationDate: "2026-02-10",
      active: true,
      isDemo: true
    },
    {
      id: "CUST-1004",
      name: "Global Call Center & BPO",
      fatherOrCompanyName: "Khurram Shehzad",
      mobile: "+92 345 8877665",
      whatsapp: "+92 345 8877665",
      address: "Building 18, Commercial Avenue, Sector I-8",
      area: "Sector I-8",
      city: "Islamabad",
      googleMapsUrl: "https://maps.google.com/?q=I-8+Islamabad",
      customerType: "commercial",
      bottlesWithCustomer: 20,
      securityDeposit: 1e4,
      currentBalance: 7200,
      creditLimit: 25e3,
      ratePerBottle: 135,
      notes: "Heavy consumer, takes 6 bottles every 2 days.",
      registrationDate: "2026-01-20",
      active: true,
      isDemo: true
    },
    {
      id: "CUST-1005",
      name: "Zubair Butt (Apartment 5B)",
      fatherOrCompanyName: "Bashir Butt",
      mobile: "+92 312 9988776",
      whatsapp: "+92 312 9988776",
      address: "Apt 5B, Silver Oaks Residency, F-10/4",
      area: "Sector F-10",
      city: "Islamabad",
      googleMapsUrl: "https://maps.google.com/?q=Silver+Oaks+F-10+Islamabad",
      customerType: "regular",
      bottlesWithCustomer: 2,
      securityDeposit: 1e3,
      currentBalance: 300,
      creditLimit: 1500,
      ratePerBottle: 150,
      notes: "Leave at door if not home.",
      registrationDate: "2026-03-01",
      active: true,
      isDemo: true
    }
  ];
  const suppliers = [
    {
      id: "SUP-101",
      name: "Apex Polymer & Bottle Co.",
      contactPerson: "Mian Shahbaz",
      mobile: "+92 300 5556677",
      whatsapp: "+92 300 5556677",
      address: "Plot 12, S.I.T.E Area, Gujranwala",
      city: "Gujranwala",
      productSupplied: "19L Polycarbonate Bottles & Handles",
      totalPurchases: 65e3,
      totalPaid: 45e3,
      balancePayable: 2e4,
      notes: "Primary 19-liter empty bottles manufacturer.",
      createdAt: "2026-01-05",
      isDemo: true
    },
    {
      id: "SUP-102",
      name: "Crystal Cap & Packaging Solutions",
      contactPerson: "Adnan Siddiqui",
      mobile: "+92 321 8889900",
      whatsapp: "+92 321 8889900",
      address: "Industrial Triangle, Kahuta Road, Rawalpindi",
      city: "Rawalpindi",
      productSupplied: "55mm Non-Spill Caps, Heat Shrink Sleeves & Labels",
      totalPurchases: 28500,
      totalPaid: 2e4,
      balancePayable: 8500,
      notes: "Delivers caps and seals in cartons of 1000 pcs.",
      createdAt: "2026-01-10",
      isDemo: true
    }
  ];
  const refillBatches = [
    {
      id: "REF-1001",
      refillNumber: "REF-2026-001",
      date: twoDaysAgoStr,
      bottleSize: "19-Liter",
      emptyBottlesUsed: 40,
      filledBottlesProduced: 39,
      damagedBottles: 1,
      rejectedBottles: 0,
      operator: "Kamran Ullah",
      notes: "Morning shift batch 1. Standard TDS 45 ppm, pH 7.2.",
      status: "completed",
      createdBy: "USR-1",
      createdAt: twoDaysAgoStr + "T09:00:00.000Z",
      isDemo: true
    },
    {
      id: "REF-1002",
      refillNumber: "REF-2026-002",
      date: yesterdayStr,
      bottleSize: "19-Liter",
      emptyBottlesUsed: 50,
      filledBottlesProduced: 49,
      damagedBottles: 1,
      rejectedBottles: 0,
      operator: "Kamran Ullah",
      notes: "Batch 2 with freshly replaced micron filters.",
      status: "completed",
      createdBy: "USR-2",
      createdAt: yesterdayStr + "T09:30:00.000Z",
      isDemo: true
    }
  ];
  const sales = [
    {
      id: "SALE-1001",
      invoiceNumber: "INV-1001",
      date: twoDaysAgoStr,
      customerId: "CUST-1001",
      customerName: "Horizon Software Solutions",
      customerPhone: "+92 300 9876541",
      customerAddress: "Floor 3, Executive Tower, Blue Area",
      items: [
        {
          itemId: "INV-ITEM-2",
          itemName: "Filled 19-Liter Mineral Water Bottle",
          quantity: 6,
          rate: 140,
          total: 840
        }
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
      paymentMethod: "Bank Transfer",
      deliveryPerson: "Rashid Mehmood",
      status: "completed",
      notes: "Delivered and paid online.",
      createdBy: "USR-1",
      createdAt: twoDaysAgoStr + "T10:30:00.000Z",
      isDemo: true
    },
    {
      id: "SALE-1002",
      invoiceNumber: "INV-1002",
      date: yesterdayStr,
      customerId: "CUST-1004",
      customerName: "Global Call Center & BPO",
      customerPhone: "+92 345 8877665",
      customerAddress: "Building 18, Commercial Avenue, Sector I-8",
      items: [
        {
          itemId: "INV-ITEM-2",
          itemName: "Filled 19-Liter Mineral Water Bottle",
          quantity: 8,
          rate: 135,
          total: 1080
        }
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
      paymentMethod: "Cash",
      deliveryPerson: "Rashid Mehmood",
      status: "completed",
      notes: "Pending credit invoice on monthly account.",
      createdBy: "USR-2",
      createdAt: yesterdayStr + "T11:15:00.000Z",
      isDemo: true
    }
  ];
  const payments = [
    {
      id: "PAY-1001",
      receiptNumber: "REC-1001",
      date: twoDaysAgoStr,
      customerId: "CUST-1001",
      customerName: "Horizon Software Solutions",
      amount: 840,
      paymentMethod: "Bank Transfer",
      referenceNumber: "FT-99281726",
      notes: "Online IBFT against invoice INV-1001",
      receivedBy: "Ahmed Khan",
      createdAt: twoDaysAgoStr + "T10:35:00.000Z",
      isDemo: true
    }
  ];
  const deliveries = [
    {
      id: "DEL-1001",
      deliveryNumber: "DEL-1001",
      date: todayStr,
      customerId: "CUST-1002",
      customerName: "Al-Madina Medical Center",
      phone: "+92 321 5554433",
      address: "Main Markaz, Sector F-10",
      area: "Sector F-10",
      googleMapsUrl: "https://maps.google.com/?q=F-10+Markaz+Islamabad",
      filledDelivered: 4,
      emptyReceived: 4,
      rate: 150,
      total: 600,
      paid: 600,
      remaining: 0,
      paymentMethod: "Cash",
      deliveryPerson: "Rashid Mehmood",
      status: "delivered",
      notes: "Delivered and cash collected.",
      deliveredAt: todayStr + "T10:00:00.000Z",
      createdAt: todayStr + "T08:30:00.000Z",
      isDemo: true
    }
  ];
  const expenses = [
    {
      id: "EXP-1001",
      voucherNumber: "EXP-1001",
      date: yesterdayStr,
      category: "Fuel",
      description: "Suzuki Bolan delivery van CNG & Petrol top-up",
      amount: 1800,
      paymentMethod: "Cash",
      paidTo: "PSO Blue Area Station",
      approvedBy: "Ahmed Khan",
      notes: "Van mileage 48,200 km",
      createdAt: yesterdayStr + "T08:00:00.000Z",
      isDemo: true
    }
  ];
  const purchases = [
    {
      id: "PUR-1001",
      invoiceNumber: "PUR-1001",
      date: "2026-02-20",
      supplierId: "SUP-101",
      supplierName: "Apex Polymer & Bottle Co.",
      itemCategory: "empty_bottles",
      itemId: "INV-ITEM-1",
      itemName: "Empty 19-Liter Bottles (PC Polycarbonate)",
      quantity: 50,
      rate: 450,
      total: 22500,
      paidAmount: 15e3,
      remainingBalance: 7500,
      paymentMethod: "Bank Transfer",
      notes: "First batch of 50 new blue PC bottles.",
      receivedBy: "Ahmed Khan",
      createdAt: "2026-02-20T10:00:00.000Z",
      isDemo: true
    }
  ];
  const customerTransactions = [
    {
      id: "CTX-1001",
      customerId: "CUST-1001",
      customerName: "Horizon Software Solutions",
      date: twoDaysAgoStr,
      type: "sale",
      referenceId: "INV-1001",
      description: "Sale of 6 filled 19L bottles @ 140",
      debit: 840,
      credit: 0,
      runningBalance: 3600,
      createdBy: "USR-1",
      createdAt: twoDaysAgoStr + "T10:30:00.000Z"
    }
  ];
  const customerBottleLedger = [
    {
      id: "CBL-1001",
      customerId: "CUST-1001",
      customerName: "Horizon Software Solutions",
      date: twoDaysAgoStr,
      type: "delivered",
      referenceId: "DEL-1000",
      filledDelivered: 6,
      emptyReturned: 6,
      netChange: 0,
      runningBottleBalance: 12,
      notes: "Delivered 6, took 6 empty. Balance steady at 12.",
      createdBy: "USR-1",
      createdAt: twoDaysAgoStr + "T10:30:00.000Z"
    }
  ];
  const inventoryTransactions = [
    {
      id: "ITX-1001",
      itemId: "INV-ITEM-1",
      itemName: "Empty 19-Liter Bottles",
      date: twoDaysAgoStr,
      type: "refill_empty_used",
      quantityChange: -40,
      resultingStock: 148,
      referenceId: "REF-1001",
      notes: "Used in batch REF-2026-001",
      createdBy: "USR-1",
      createdAt: twoDaysAgoStr + "T09:00:00.000Z"
    }
  ];
  const supplierTransactions = [
    {
      id: "STX-1001",
      supplierId: "SUP-101",
      supplierName: "Apex Polymer & Bottle Co.",
      date: "2026-02-20",
      type: "purchase",
      referenceId: "PUR-1001",
      description: "Purchase of 50 empty PC bottles",
      debit: 0,
      credit: 22500,
      runningBalance: 27500,
      createdBy: "USR-1",
      createdAt: "2026-02-20T10:00:00.000Z"
    }
  ];
  const auditLogs = [
    {
      id: "LOG-1",
      timestamp: twoDaysAgoStr + "T08:00:00.000Z",
      userId: "USR-1",
      userName: "Ahmed Khan",
      userRole: "admin",
      action: "SYSTEM_INIT",
      module: "Core System",
      details: "Water Business Manager database initialized with certified schemas and seed records."
    }
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
    online_orders: []
  };
}
function getCleanPersonalDatabase() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    users: DEFAULT_USERS,
    customers: [],
    customer_transactions: [],
    customer_bottle_ledger: [],
    inventory: [
      {
        id: "INV-ITEM-1",
        name: "Empty 19-Liter Polycarbonate (PC) Bottles",
        category: "empty_bottles",
        unit: "Bottles",
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
        lastUpdated: now
      },
      {
        id: "INV-ITEM-2",
        name: "Filled 19-Liter Mineral Water Bottles",
        category: "filled_bottles",
        unit: "Bottles",
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
        lastUpdated: now
      },
      {
        id: "INV-ITEM-3",
        name: "Non-Spill Smart Caps (Blue 55mm)",
        category: "caps",
        unit: "Pcs",
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
        lastUpdated: now
      },
      {
        id: "INV-ITEM-4",
        name: "Heat Shrink Neck Sleeves & Tamper Seals",
        category: "seals",
        unit: "Pcs",
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
        lastUpdated: now
      },
      {
        id: "INV-ITEM-5",
        name: "Anmol Pure Branded Waterproof Body Labels",
        category: "labels",
        unit: "Pcs",
        openingStock: 0,
        purchases: 0,
        usedInProduction: 0,
        damaged: 0,
        soldOrDelivered: 0,
        returned: 0,
        currentStock: 0,
        minimumStockLevel: 200,
        minThreshold: 200,
        unitCost: 6,
        lastUpdated: now
      }
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
        id: "LOG-INIT-CLEAN",
        timestamp: now,
        userId: "USR-1",
        userName: "Admin",
        userRole: "admin",
        action: "ALL_DATA_CLEARED",
        module: "Core System",
        details: "All dummy sample records removed. Ready for personal business data entry."
      }
    ],
    customer_accounts: [],
    customer_addresses: [],
    online_orders: []
  };
}
var DatabaseManager = class {
  constructor() {
    this.db = null;
    this.ensureDataDir();
    this.load();
  }
  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  load() {
    this.ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      this.save(initial);
      this.db = initial;
      return initial;
    }
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      parsed.customer_accounts = parsed.customer_accounts || [];
      parsed.customer_addresses = parsed.customer_addresses || [];
      parsed.online_orders = parsed.online_orders || [];
      parsed.users = parsed.users || [];
      let hasOwner = false;
      parsed.users.forEach((u) => {
        const defaultMatch = DEFAULT_USERS.find((du) => du.id === u.id || du.email === u.email);
        if (defaultMatch) {
          if (!u.passwordHash) {
            u.passwordHash = defaultMatch.passwordHash;
            u.salt = defaultMatch.salt;
          }
          if (!u.employeeId) u.employeeId = defaultMatch.employeeId;
          if (!u.department) u.department = defaultMatch.department;
          if (!u.authUserId) u.authUserId = defaultMatch.authUserId;
          if (!u.permissions) u.permissions = [...defaultMatch.permissions || []];
        }
        if (u.id === "USR-1") {
          u.role = "owner";
          if (!u.name.includes("Owner")) u.name = "Ahmed Khan (Owner)";
          u.department = u.department || "Executive Management";
          u.employeeId = u.employeeId || "EMP-001";
          u.permissions = [...ALL_PERMISSIONS];
          hasOwner = true;
        } else if (u.role === "owner") {
          hasOwner = true;
        }
        u.status = u.status || (u.active !== false ? "active" : "inactive");
      });
      if (!hasOwner && DEFAULT_USERS[0]) {
        parsed.users.unshift(DEFAULT_USERS[0]);
      }
      if (!parsed.users.some((u) => u.id === "USR-4") && DEFAULT_USERS[3]) {
        parsed.users.push(DEFAULT_USERS[3]);
      }
      this.db = parsed;
      return this.db;
    } catch (err) {
      console.error("Error reading DB, re-initializing fallback:", err);
      const initial = getInitialDatabase();
      this.save(initial);
      this.db = initial;
      return initial;
    }
  }
  save(data) {
    this.ensureDataDir();
    data.customer_accounts = data.customer_accounts || [];
    data.customer_addresses = data.customer_addresses || [];
    data.online_orders = data.online_orders || [];
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
    this.db = data;
  }
  get() {
    if (!this.db) {
      return this.load();
    }
    return this.db;
  }
  mutate(mutator) {
    const current = this.load();
    const result = mutator(current);
    this.save(current);
    return result;
  }
  clearAllData() {
    const clean = getCleanPersonalDatabase();
    this.save(clean);
    return clean;
  }
  resetDemoData() {
    const fresh = getInitialDatabase();
    this.save(fresh);
    return fresh;
  }
};
var dbManager = new DatabaseManager();

// server.ts
async function startServer() {
  const app = express();
  const PORT = 3e3;
  app.use(express.json({ limit: "10mb" }));
  function hashPassword(password, salt) {
    const s = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, s, 1e5, 64, "sha512").toString("hex");
    return { hash, salt: s };
  }
  function verifyPassword(password, hash, salt) {
    try {
      const candidate = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
      return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
    } catch {
      return false;
    }
  }
  const staffSessions = /* @__PURE__ */ new Map();
  function createStaffSession(user) {
    const token = "staff_" + crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    staffSessions.set(token, {
      token,
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1e3
    });
    return token;
  }
  function getStaffSessionFromReq(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7).trim();
    if (!token.startsWith("staff_")) return null;
    const session = staffSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      staffSessions.delete(token);
      return null;
    }
    return session;
  }
  function getAuthenticatedStaff(req) {
    const session = getStaffSessionFromReq(req);
    if (!session) return null;
    const db = dbManager.get();
    const user = db.users.find((u) => u.id === session.userId);
    if (!user || user.active === false || user.status === "inactive" || user.status === "suspended") {
      return null;
    }
    return user;
  }
  const customerSessions = /* @__PURE__ */ new Map();
  function createCustomerSession(accountId, customerId) {
    const token = "cust_" + crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    customerSessions.set(token, {
      token,
      accountId,
      customerId,
      role: "customer",
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1e3
    });
    return token;
  }
  function getCustomerSessionFromReq(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7).trim();
    if (!token.startsWith("cust_")) return null;
    const session = customerSessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      customerSessions.delete(token);
      return null;
    }
    return session;
  }
  const requireCustomerAuth = (req, res, next) => {
    const session = getCustomerSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: "Authentication required. Please sign in to your customer account." });
    }
    req.customerSession = session;
    next();
  };
  function sanitizeAccount(account) {
    const { passwordHash, salt, ...safe } = account;
    return safe;
  }
  function sanitizeUser(user) {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }
  function logAudit(action, module, details, reqOrUserId, recordIdOrName, oldValuesOrRole, newValues) {
    let userId = "USR-1";
    let userName = "Ahmed Khan (Owner)";
    let userRole = "owner";
    let ipAddress = "127.0.0.1";
    let userAgent = "System Process";
    let recordId;
    let oldValues;
    if (reqOrUserId && typeof reqOrUserId === "object" && "headers" in reqOrUserId) {
      const req = reqOrUserId;
      const staffUser = getAuthenticatedStaff(req);
      const customerSession = getCustomerSessionFromReq(req);
      ipAddress = req.ip || req.socket && req.socket.remoteAddress || "127.0.0.1";
      userAgent = req.headers["user-agent"] || "Browser Client";
      recordId = recordIdOrName;
      oldValues = oldValuesOrRole;
      if (staffUser) {
        userId = staffUser.id;
        userName = staffUser.name;
        userRole = staffUser.role;
      } else if (customerSession) {
        userId = customerSession.accountId;
        userName = "Online Customer";
        userRole = "customer";
      }
    } else if (typeof reqOrUserId === "string") {
      userId = reqOrUserId;
      if (typeof recordIdOrName === "string") userName = recordIdOrName;
      if (typeof oldValuesOrRole === "string") userRole = oldValuesOrRole;
    }
    dbManager.mutate((db) => {
      const entry = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
        details
      };
      db.audit_logs.unshift(entry);
      if (db.audit_logs.length > 1e3) {
        db.audit_logs = db.audit_logs.slice(0, 1e3);
      }
    });
  }
  const getRequestUserRole = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer cust_")) {
      return "customer";
    }
    if (getCustomerSessionFromReq(req)) return "customer";
    const staff = getAuthenticatedStaff(req);
    if (staff) {
      return staff.role;
    }
    return "owner";
  };
  const getRequestUserName = (req) => {
    const staff = getAuthenticatedStaff(req);
    if (staff) return staff.name;
    const cust = getCustomerSessionFromReq(req);
    if (cust) return "Online Customer";
    return "Ahmed Khan (Owner)";
  };
  app.use("/api", (req, res, next) => {
    if (req.path === "/health" || req.path.startsWith("/customer/") || req.path === "/auth/login" || req.path === "/auth/logout" || req.path === "/auth/me" || req.path === "/permissions") {
      return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer cust_")) {
      return res.status(403).json({
        error: "Access Denied: Customer accounts are strictly prohibited from accessing internal business management endpoints."
      });
    }
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/dashboard/stats", (req, res) => {
    try {
      const db = dbManager.get();
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const currentMonthPrefix = todayStr.substring(0, 7);
      const totalCustomers = db.customers.length;
      const activeCustomers = db.customers.filter((c) => c.active).length;
      const emptyBottlesItem = db.inventory.find((i) => i.category === "empty_bottles");
      const filledBottlesItem = db.inventory.find((i) => i.category === "filled_bottles");
      const totalEmptyBottles = emptyBottlesItem ? emptyBottlesItem.currentStock : 0;
      const totalFilledBottles = filledBottlesItem ? filledBottlesItem.currentStock : 0;
      const bottlesWithCustomers = db.customers.reduce((acc, c) => acc + (c.bottlesWithCustomer || 0), 0);
      const todaySalesRecords = db.sales.filter((s) => s.date === todayStr && s.status !== "cancelled");
      const todaySales = todaySalesRecords.reduce((acc, s) => acc + s.total, 0);
      const todaySalesCount = todaySalesRecords.length;
      const todayBottlesSold = todaySalesRecords.reduce((acc, s) => acc + (s.quantity || 0), 0);
      const thisMonthSalesRecords = db.sales.filter((s) => s.date.startsWith(currentMonthPrefix) && s.status !== "cancelled");
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
      const todayRefillRecords = db.refilling.filter((r) => r.date === todayStr && r.status === "completed");
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
        category: item.category
      }));
      const salesTrendLast7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = /* @__PURE__ */ new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split("T")[0];
        const daySales = db.sales.filter((s) => s.date === dStr && s.status !== "cancelled");
        const dayRev = daySales.reduce((acc, s) => acc + s.total, 0);
        const dayBottles = daySales.reduce((acc, s) => acc + (s.quantity || 0), 0);
        const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
        salesTrendLast7Days.push({
          date: label,
          revenue: dayRev,
          bottles: dayBottles
        });
      }
      const expenseMap = /* @__PURE__ */ new Map();
      db.expenses.forEach((e) => {
        const current = expenseMap.get(e.category) || 0;
        expenseMap.set(e.category, current + e.amount);
      });
      const expenseCategories = Array.from(expenseMap.entries()).map(([category, amount]) => ({
        category,
        amount
      }));
      const recentSales = db.sales.slice(-5).reverse();
      const recentDeliveries = db.deliveries.slice(-5).reverse();
      const recentRefilling = db.refilling.slice(-5).reverse();
      const pendingOnlineOrders = (db.online_orders || []).filter((o) => o.status === "pending");
      const pendingOnlineOrdersCount = pendingOnlineOrders.length;
      const newOnlineOrdersCount = (db.online_orders || []).filter((o) => o.status === "pending" || o.status === "confirmed").length;
      const onlineCustomersCount = db.customers.filter((c) => c.customerSource === "online").length;
      const stats = {
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
        onlineCustomersCount
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/customers", (req, res) => {
    const db = dbManager.get();
    const { type, area, active, search } = req.query;
    let list = [...db.customers];
    if (type) list = list.filter((c) => c.customerType === type);
    if (area) list = list.filter((c) => c.area.toLowerCase() === area.toLowerCase());
    if (active !== void 0) list = list.filter((c) => String(c.active) === active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.mobile.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.area.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });
  app.get("/api/customers/:id", (req, res) => {
    const db = dbManager.get();
    const customer = db.customers.find((c) => c.id === req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
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
      messages
    });
  });
  app.post("/api/customers", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const id = data.id || `CUST-${1e3 + db.customers.length + 1}`;
        const newCustomer = {
          id,
          name: data.name,
          fatherOrCompanyName: data.fatherOrCompanyName || "",
          mobile: data.mobile,
          whatsapp: data.whatsapp || data.mobile,
          address: data.address,
          area: data.area,
          city: data.city || db.settings.city,
          googleMapsUrl: data.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(data.address + " " + data.area + " " + data.city)}`,
          customerType: data.customerType || "regular",
          bottlesWithCustomer: Number(data.bottlesWithCustomer) || 0,
          securityDeposit: Number(data.securityDeposit) || 0,
          currentBalance: Number(data.currentBalance) || 0,
          creditLimit: Number(data.creditLimit) || 5e3,
          ratePerBottle: Number(data.ratePerBottle) || db.settings.defaultBottlePrice,
          notes: data.notes || "",
          registrationDate: data.registrationDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          active: data.active !== void 0 ? data.active : true
        };
        db.customers.unshift(newCustomer);
        if (newCustomer.securityDeposit > 0) {
          const depositTx = {
            id: `CTX-${Date.now()}-1`,
            customerId: newCustomer.id,
            customerName: newCustomer.name,
            date: newCustomer.registrationDate,
            type: "deposit",
            description: `Security deposit of ${newCustomer.securityDeposit} registered for ${newCustomer.bottlesWithCustomer} bottles`,
            debit: 0,
            credit: 0,
            runningBalance: newCustomer.currentBalance,
            createdBy: req.body.createdBy || "Admin",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          db.customer_transactions.push(depositTx);
        }
        if (newCustomer.bottlesWithCustomer > 0) {
          const bottleTx = {
            id: `CBL-${Date.now()}-1`,
            customerId: newCustomer.id,
            customerName: newCustomer.name,
            date: newCustomer.registrationDate,
            type: "delivered",
            filledDelivered: newCustomer.bottlesWithCustomer,
            emptyReturned: 0,
            netChange: newCustomer.bottlesWithCustomer,
            runningBottleBalance: newCustomer.bottlesWithCustomer,
            notes: "Opening bottle balance upon registration",
            createdBy: req.body.createdBy || "Admin",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          db.customer_bottle_ledger.push(bottleTx);
        }
        return newCustomer;
      });
      logAudit("CREATE_CUSTOMER", "Customers", `Created new customer ${result.name} (${result.id})`);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/customers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = dbManager.mutate((db) => {
        const idx = db.customers.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error("Customer not found");
        const existing = db.customers[idx];
        const updatedCustomer = {
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
          creditLimit: data.creditLimit !== void 0 ? Number(data.creditLimit) : existing.creditLimit,
          ratePerBottle: data.ratePerBottle !== void 0 ? Number(data.ratePerBottle) : existing.ratePerBottle,
          notes: data.notes ?? existing.notes,
          active: data.active ?? existing.active
        };
        db.customers[idx] = updatedCustomer;
        return updatedCustomer;
      });
      logAudit("UPDATE_CUSTOMER", "Customers", `Updated profile for customer ${updated.name} (${updated.id}) by ${getRequestUserName(req)}`);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/customers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const deletedCustomer = dbManager.mutate((db) => {
        const idx = db.customers.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error("Customer not found");
        const [removed] = db.customers.splice(idx, 1);
        return removed;
      });
      logAudit("DELETE_CUSTOMER", "Customers", `Deleted customer ${deletedCustomer.name} (${deletedCustomer.id}) by Admin`);
      res.json({ success: true, deletedCustomer });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/customers/bulk-price-update", (req, res) => {
    try {
      const { customerIds, area, customerType, newRate, adjustAmount } = req.body;
      const updatedList = dbManager.mutate((db) => {
        let targets = db.customers;
        if (Array.isArray(customerIds) && customerIds.length > 0) {
          targets = targets.filter((c) => customerIds.includes(c.id));
        } else {
          if (area && area !== "all") {
            targets = targets.filter((c) => c.area.toLowerCase() === area.toLowerCase());
          }
          if (customerType && customerType !== "all") {
            targets = targets.filter((c) => c.customerType === customerType);
          }
        }
        const modified = [];
        for (const cust of targets) {
          if (newRate !== void 0 && newRate !== null && newRate !== "") {
            cust.ratePerBottle = Number(newRate);
          } else if (adjustAmount !== void 0 && adjustAmount !== null) {
            cust.ratePerBottle = Math.max(0, (cust.ratePerBottle || db.settings.defaultBottlePrice) + Number(adjustAmount));
          }
          modified.push(cust);
        }
        return modified;
      });
      logAudit("BULK_PRICE_UPDATE", "Customers", `Bulk updated bottle rates for ${updatedList.length} customers by Admin`);
      res.json({ success: true, count: updatedList.length, updatedCustomers: updatedList });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/customers/:id/bottle-transaction", (req, res) => {
    try {
      const { id } = req.params;
      const { date, type, filledDelivered = 0, emptyReturned = 0, notes, createdBy = "Admin" } = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === id);
        if (!customer) throw new Error("Customer not found");
        const filledQty = Number(filledDelivered) || 0;
        const emptyQty = Number(emptyReturned) || 0;
        const netChange = filledQty - emptyQty;
        const newBottleCount = (customer.bottlesWithCustomer || 0) + netChange;
        if (newBottleCount < 0) {
          throw new Error(`Invalid bottle balance: Customer would have ${newBottleCount} bottles, which is negative.`);
        }
        customer.bottlesWithCustomer = newBottleCount;
        const bottleTx = {
          id: `CBL-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: type || (netChange >= 0 ? "delivered" : "returned"),
          referenceId: req.body.referenceId,
          filledDelivered: filledQty,
          emptyReturned: emptyQty,
          netChange,
          runningBottleBalance: newBottleCount,
          notes: notes || `Bottle balance adjustment: +${filledQty} filled, -${emptyQty} empty returned`,
          createdBy,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.customer_bottle_ledger.push(bottleTx);
        if (filledQty > 0) {
          const filledStock = db.inventory.find((i) => i.category === "filled_bottles");
          if (filledStock) {
            filledStock.soldOrDelivered += filledQty;
            filledStock.currentStock -= filledQty;
            filledStock.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
        if (emptyQty > 0) {
          const emptyStock = db.inventory.find((i) => i.category === "empty_bottles");
          if (emptyStock) {
            emptyStock.returned += emptyQty;
            emptyStock.currentStock += emptyQty;
            emptyStock.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
        return { customer, bottleTx };
      });
      logAudit("BOTTLE_TRANSACTION", "Bottle Ledger", `Adjusted bottles for ${result.customer.name}: new balance ${result.customer.bottlesWithCustomer}`);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/refilling", (req, res) => {
    const db = dbManager.get();
    res.json(db.refilling.slice().reverse());
  });
  app.post("/api/refilling", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const refillNumber = data.refillNumber || `${db.settings.refillPrefix || "REF-"}${(/* @__PURE__ */ new Date()).getFullYear()}-${String(db.refilling.length + 1).padStart(3, "0")}`;
        const emptyUsed = Number(data.emptyBottlesUsed) || 0;
        const filledProduced = Number(data.filledBottlesProduced) || 0;
        const damaged = Number(data.damagedBottles) || 0;
        const rejected = Number(data.rejectedBottles) || 0;
        const emptyItem = db.inventory.find((i) => i.category === "empty_bottles");
        const filledItem = db.inventory.find((i) => i.category === "filled_bottles");
        const capsItem = db.inventory.find((i) => i.category === "caps");
        const sealsItem = db.inventory.find((i) => i.category === "seals");
        const labelsItem = db.inventory.find((i) => i.category === "labels");
        const newBatch = {
          id: `REF-${Date.now()}`,
          refillNumber,
          date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          bottleSize: data.bottleSize || db.settings.defaultBottleSize || "19-Liter",
          emptyBottlesUsed: emptyUsed,
          filledBottlesProduced: filledProduced,
          damagedBottles: damaged,
          rejectedBottles: rejected,
          operator: data.operator || "Refill Station 1",
          notes: data.notes || "",
          status: "completed",
          createdBy: data.createdBy || "Admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.refilling.push(newBatch);
        if (emptyItem) {
          emptyItem.usedInProduction += emptyUsed;
          emptyItem.damaged += damaged;
          emptyItem.currentStock -= emptyUsed;
          emptyItem.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        }
        if (filledItem) {
          filledItem.currentStock += filledProduced;
          filledItem.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
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
      logAudit("CREATE_REFILL", "Refilling", `Recorded refill batch ${result.refillNumber} producing ${result.filledBottlesProduced} filled bottles.`);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/inventory", (req, res) => {
    const db = dbManager.get();
    res.json(db.inventory);
  });
  app.get("/api/inventory/transactions", (req, res) => {
    const db = dbManager.get();
    res.json(db.inventory_transactions.slice().reverse());
  });
  app.post("/api/inventory/adjust", (req, res) => {
    try {
      const { itemId, adjustmentQty, reason, createdBy = "Admin" } = req.body;
      const result = dbManager.mutate((db) => {
        const item = db.inventory.find((i) => i.id === itemId);
        if (!item) throw new Error("Inventory item not found");
        const change = Number(adjustmentQty);
        item.currentStock += change;
        item.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        const tx = {
          id: `ITX-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: "adjustment",
          quantityChange: change,
          resultingStock: item.currentStock,
          notes: reason || "Manual stock reconciliation",
          createdBy,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.inventory_transactions.push(tx);
        return { item, tx };
      });
      logAudit("INVENTORY_ADJUST", "Inventory", `Adjusted ${result.item.name} by ${req.body.adjustmentQty}. New stock: ${result.item.currentStock}`);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/sales", (req, res) => {
    const db = dbManager.get();
    res.json(db.sales.slice().reverse());
  });
  app.post("/api/sales", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        let customer = db.customers.find((c) => c.id === data.customerId);
        if (!customer) {
          if (data.isCashSale || data.customerId === "CUST-CASH") {
            customer = db.customers.find((c) => c.id === "CUST-CASH");
            if (!customer) {
              customer = {
                id: "CUST-CASH",
                name: data.customerName || "Walk-In / Counter Cash Customer",
                fatherOrCompanyName: "Counter Sale",
                mobile: data.customerPhone || "",
                whatsapp: data.customerPhone || "",
                address: "Plant Counter / Walk-in",
                area: "Counter / Retail",
                city: db.settings.city || "Islamabad",
                customerType: "retail",
                bottlesWithCustomer: 0,
                securityDeposit: 0,
                currentBalance: 0,
                creditLimit: 0,
                ratePerBottle: db.settings.defaultBottlePrice || 150,
                registrationDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                active: true
              };
              db.customers.unshift(customer);
            }
          } else {
            throw new Error("Customer not found");
          }
        }
        const quantity = Number(data.quantity) || 1;
        const emptyReceived = Number(data.emptyBottlesReceived) || 0;
        const rate = Number(data.rate) || customer.ratePerBottle || db.settings.defaultBottlePrice;
        const discount = Number(data.discount) || 0;
        const deliveryCharges = Number(data.deliveryCharges) || 0;
        const subtotal = quantity * rate;
        const total = subtotal - discount + deliveryCharges;
        const paidAmount = data.isCashSale ? total : Number(data.paidAmount) || 0;
        const remaining = total - paidAmount;
        const filledItem = db.inventory.find((i) => i.category === "filled_bottles");
        const invoiceNumber = data.invoiceNumber || `${db.settings.invoicePrefix || "INV-"}${1e3 + db.sales.length + 1}`;
        const finalCustomerName = data.customerName || customer.name;
        const finalCustomerPhone = data.customerPhone || customer.mobile || customer.whatsapp || "";
        const sale = {
          id: `SALE-${Date.now()}`,
          invoiceNumber,
          date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          customerId: customer.id,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          customerAddress: data.customerAddress || customer.address,
          items: [
            {
              itemId: filledItem?.id || "INV-ITEM-2",
              itemName: "Filled 19-Liter Mineral Water Bottle",
              quantity,
              rate,
              total: subtotal
            }
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
          paymentMethod: data.paymentMethod || "Cash",
          deliveryPerson: data.deliveryPerson || (data.isCashSale ? "Counter / Cash POS" : "Standard Delivery"),
          status: "completed",
          notes: data.notes || (data.isCashSale ? "Instant Cash Sale at Counter" : ""),
          createdBy: data.createdBy || "Admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isCashSale: Boolean(data.isCashSale),
          cashTendered: data.cashTendered ? Number(data.cashTendered) : void 0,
          changeReturned: data.changeReturned ? Number(data.changeReturned) : void 0
        };
        db.sales.push(sale);
        if (customer.id !== "CUST-CASH") {
          customer.currentBalance = (customer.currentBalance || 0) + remaining;
        }
        const debitTx = {
          id: `CTX-${Date.now()}-sale`,
          customerId: customer.id,
          customerName: finalCustomerName,
          date: sale.date,
          type: "sale",
          referenceId: sale.invoiceNumber,
          description: `Sale of ${quantity} 19L bottle(s) @ ${rate}`,
          debit: total,
          credit: 0,
          runningBalance: (customer.currentBalance || 0) + paidAmount,
          createdBy: sale.createdBy,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.customer_transactions.push(debitTx);
        if (paidAmount > 0) {
          const receiptNumber = `${db.settings.receiptPrefix || "REC-"}${1e3 + db.payments.length + 1}`;
          const payment = {
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
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          db.payments.push(payment);
        }
        const netBottleChange = quantity - emptyReceived;
        customer.bottlesWithCustomer = (customer.bottlesWithCustomer || 0) + netBottleChange;
        if (filledItem) {
          filledItem.soldOrDelivered += quantity;
          filledItem.currentStock -= quantity;
          filledItem.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        }
        const emptyItem = db.inventory.find((i) => i.category === "empty_bottles");
        if (emptyItem && emptyReceived > 0) {
          emptyItem.returned += emptyReceived;
          emptyItem.currentStock += emptyReceived;
          emptyItem.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        }
        return sale;
      });
      logAudit("CREATE_SALE", "Sales", `Created Sale ${result.invoiceNumber} for ${result.customerName} (Total: ${result.total})`);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/payments", (req, res) => {
    const db = dbManager.get();
    res.json(db.payments.slice().reverse());
  });
  app.post("/api/payments", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === data.customerId);
        if (!customer) throw new Error("Customer not found");
        const amount = Number(data.amount) || 0;
        if (amount <= 0) throw new Error("Payment amount must be greater than 0");
        const receiptNumber = data.receiptNumber || `${db.settings.receiptPrefix || "REC-"}${1e3 + db.payments.length + 1}`;
        const payment = {
          id: `PAY-${Date.now()}`,
          receiptNumber,
          date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          customerId: customer.id,
          customerName: customer.name,
          amount,
          paymentMethod: data.paymentMethod || "Cash",
          referenceNumber: data.referenceNumber || "",
          notes: data.notes || "",
          receivedBy: data.receivedBy || "Admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.payments.push(payment);
        customer.currentBalance = (customer.currentBalance || 0) - amount;
        const creditTx = {
          id: `CTX-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          date: payment.date,
          type: "payment",
          referenceId: receiptNumber,
          description: `Payment received via ${payment.paymentMethod}`,
          debit: 0,
          credit: amount,
          runningBalance: customer.currentBalance,
          createdBy: payment.receivedBy,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.customer_transactions.push(creditTx);
        return payment;
      });
      logAudit("RECEIVE_PAYMENT", "Payments", `Received payment ${result.receiptNumber} of ${result.amount} from ${result.customerName}`);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.delete("/api/payments/:id", (req, res) => {
    try {
      const { id } = req.params;
      const result = dbManager.mutate((db) => {
        const paymentIndex = db.payments.findIndex((p) => p.id === id || p.receiptNumber === id);
        if (paymentIndex === -1) throw new Error("Payment receipt not found.");
        const payment = db.payments[paymentIndex];
        const customer = db.customers.find((c) => c.id === payment.customerId);
        if (customer) {
          customer.currentBalance = (customer.currentBalance || 0) + payment.amount;
        }
        db.payments.splice(paymentIndex, 1);
        return { deletedPayment: payment, customer };
      });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/payments/clear-all", (req, res) => {
    try {
      const count = dbManager.mutate((db) => {
        const totalCleared = db.payments.length;
        db.payments = [];
        return totalCleared;
      });
      res.json({ success: true, message: `Cleared all ${count} payment receipts successfully.`, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/deliveries", (req, res) => {
    const db = dbManager.get();
    res.json(db.deliveries.slice().reverse());
  });
  app.post("/api/deliveries", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === data.customerId);
        if (!customer) throw new Error("Customer not found");
        const deliveryNumber = data.deliveryNumber || `${db.settings.deliveryPrefix || "DEL-"}${1e3 + db.deliveries.length + 1}`;
        const filled = Number(data.filledDelivered) || 1;
        const empty = Number(data.emptyReceived) || 0;
        const rate = Number(data.rate) || customer.ratePerBottle || db.settings.defaultBottlePrice;
        const total = filled * rate;
        const paid = Number(data.paid) || 0;
        const remaining = total - paid;
        const newDelivery = {
          id: `DEL-${Date.now()}`,
          deliveryNumber,
          date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
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
          paymentMethod: data.paymentMethod || "Cash",
          deliveryPerson: data.deliveryPerson || "Rashid Mehmood",
          status: data.status || "pending",
          notes: data.notes || "",
          deliveredAt: data.status === "delivered" ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.deliveries.push(newDelivery);
        if (newDelivery.status === "delivered") {
          const netBottleChange = filled - empty;
          customer.bottlesWithCustomer = (customer.bottlesWithCustomer || 0) + netBottleChange;
          customer.currentBalance = (customer.currentBalance || 0) + remaining;
          const filledStock = db.inventory.find((i) => i.category === "filled_bottles");
          if (filledStock) {
            filledStock.currentStock -= filled;
            filledStock.soldOrDelivered += filled;
          }
          const emptyStock = db.inventory.find((i) => i.category === "empty_bottles");
          if (emptyStock && empty > 0) {
            emptyStock.currentStock += empty;
            emptyStock.returned += empty;
          }
        }
        return newDelivery;
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.put("/api/deliveries/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status, emptyReceived, paid, paymentMethod, deliveryPerson, notes } = req.body;
      const result = dbManager.mutate((db) => {
        const delivery = db.deliveries.find((d) => d.id === id);
        if (!delivery) throw new Error("Delivery record not found");
        const prevStatus = delivery.status;
        delivery.status = status;
        if (deliveryPerson) delivery.deliveryPerson = deliveryPerson;
        if (notes) delivery.notes = notes;
        if (status === "delivered" && prevStatus !== "delivered") {
          delivery.deliveredAt = (/* @__PURE__ */ new Date()).toISOString();
          if (emptyReceived !== void 0) delivery.emptyReceived = Number(emptyReceived);
          if (paid !== void 0) {
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
          const filledStock = db.inventory.find((i) => i.category === "filled_bottles");
          if (filledStock) {
            filledStock.currentStock -= delivery.filledDelivered;
            filledStock.soldOrDelivered += delivery.filledDelivered;
          }
          const emptyStock = db.inventory.find((i) => i.category === "empty_bottles");
          if (emptyStock && delivery.emptyReceived > 0) {
            emptyStock.currentStock += delivery.emptyReceived;
            emptyStock.returned += delivery.emptyReceived;
          }
        }
        return delivery;
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/suppliers", (req, res) => {
    const db = dbManager.get();
    res.json(db.suppliers);
  });
  app.get("/api/suppliers/:id", (req, res) => {
    const db = dbManager.get();
    const supplier = db.suppliers.find((s) => s.id === req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    const transactions = db.supplier_transactions.filter((t) => t.supplierId === supplier.id);
    const purchases = db.purchases.filter((p) => p.supplierId === supplier.id);
    res.json({ supplier, transactions, purchases });
  });
  app.post("/api/suppliers", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const id = `SUP-${100 + db.suppliers.length + 1}`;
        const newSupplier = {
          id,
          name: data.name,
          contactPerson: data.contactPerson || "",
          mobile: data.mobile,
          whatsapp: data.whatsapp || data.mobile,
          address: data.address,
          city: data.city || "",
          productSupplied: data.productSupplied || "",
          unitRate: data.unitRate !== void 0 ? Number(data.unitRate) : void 0,
          totalPurchases: 0,
          totalPaid: 0,
          balancePayable: Number(data.balancePayable) || 0,
          notes: data.notes || "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        };
        db.suppliers.push(newSupplier);
        return newSupplier;
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.put("/api/suppliers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const sup = db.suppliers.find((s) => s.id === id);
        if (!sup) throw new Error("Supplier not found");
        if (data.name !== void 0) sup.name = data.name;
        if (data.contactPerson !== void 0) sup.contactPerson = data.contactPerson;
        if (data.mobile !== void 0) sup.mobile = data.mobile;
        if (data.whatsapp !== void 0) sup.whatsapp = data.whatsapp;
        if (data.address !== void 0) sup.address = data.address;
        if (data.city !== void 0) sup.city = data.city;
        if (data.productSupplied !== void 0) sup.productSupplied = data.productSupplied;
        if (data.unitRate !== void 0) sup.unitRate = Number(data.unitRate);
        if (data.balancePayable !== void 0) sup.balancePayable = Number(data.balancePayable);
        if (data.notes !== void 0) sup.notes = data.notes;
        return sup;
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.delete("/api/suppliers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const deletedSupplier = dbManager.mutate((db) => {
        const idx = db.suppliers.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error("Supplier not found");
        const [removed] = db.suppliers.splice(idx, 1);
        return removed;
      });
      res.json({ success: true, deletedSupplier });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/purchases", (req, res) => {
    const db = dbManager.get();
    res.json(db.purchases.slice().reverse());
  });
  app.post("/api/purchases", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const supplier = db.suppliers.find((s) => s.id === data.supplierId);
        if (!supplier) throw new Error("Supplier not found");
        const quantity = Number(data.quantity) || 1;
        const rate = Number(data.rate) || 0;
        const total = quantity * rate;
        const paidAmount = Number(data.paidAmount) || 0;
        const remaining = total - paidAmount;
        const purchase = {
          id: `PUR-${Date.now()}`,
          invoiceNumber: data.invoiceNumber || `PUR-${1e3 + db.purchases.length + 1}`,
          date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          supplierId: supplier.id,
          supplierName: supplier.name,
          itemCategory: data.itemCategory,
          itemId: data.itemId || "INV-ITEM-1",
          itemName: data.itemName || "Inventory Item",
          quantity,
          rate,
          total,
          paidAmount,
          remainingBalance: remaining,
          paymentMethod: data.paymentMethod || "Bank Transfer",
          notes: data.notes || "",
          receivedBy: data.receivedBy || "Admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.purchases.push(purchase);
        supplier.totalPurchases += total;
        supplier.totalPaid += paidAmount;
        supplier.balancePayable += remaining;
        const invItem = db.inventory.find((i) => i.id === purchase.itemId || i.category === purchase.itemCategory);
        if (invItem) {
          invItem.purchases += quantity;
          invItem.currentStock += quantity;
          invItem.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        }
        return purchase;
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/suppliers/:id/pay", (req, res) => {
    try {
      const { id } = req.params;
      const { amount, paymentMethod = "Bank Transfer", notes = "", referenceNumber = "" } = req.body;
      const result = dbManager.mutate((db) => {
        const supplier = db.suppliers.find((s) => s.id === id);
        if (!supplier) throw new Error("Supplier not found");
        const payAmount = Number(amount) || 0;
        supplier.totalPaid += payAmount;
        supplier.balancePayable -= payAmount;
        return supplier;
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/expenses", (req, res) => {
    const db = dbManager.get();
    res.json(db.expenses.slice().reverse());
  });
  app.post("/api/expenses", (req, res) => {
    try {
      const data = req.body;
      const result = dbManager.mutate((db) => {
        const voucherNumber = data.voucherNumber || `EXP-${1e3 + db.expenses.length + 1}`;
        const newExpense = {
          id: `EXP-${Date.now()}`,
          voucherNumber,
          date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          category: data.category || "Other",
          description: data.description,
          amount: Number(data.amount) || 0,
          paymentMethod: data.paymentMethod || "Cash",
          paidTo: data.paidTo || "",
          approvedBy: data.approvedBy || "Admin",
          notes: data.notes || "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.expenses.push(newExpense);
        return newExpense;
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/messaging/templates", (req, res) => {
    const db = dbManager.get();
    res.json(db.message_templates || []);
  });
  app.get("/api/messaging/history", (req, res) => {
    const db = dbManager.get();
    res.json(db.messages || []);
  });
  app.post("/api/messaging/send", (req, res) => {
    try {
      const { customerId, templateCode, customText, channel = "whatsapp" } = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers.find((c) => c.id === customerId);
        if (!customer) throw new Error("Customer not found");
        const sent = {
          id: `MSG-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          recipientPhone: customer.whatsapp || customer.mobile,
          templateCode: templateCode || "custom",
          message: customText || "",
          channel,
          status: "opened_in_whatsapp",
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.messages.unshift(sent);
        return { sent, customer, cleanPhone: (customer.whatsapp || customer.mobile).replace(/[^0-9]/g, "") };
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/reports/analytics", (req, res) => {
    try {
      const db = dbManager.get();
      res.json({
        summary: {
          totalSales: db.sales.reduce((a, s) => a + s.total, 0),
          totalExpenses: db.expenses.reduce((a, e) => a + e.amount, 0)
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/reports/staff-performance", (req, res) => {
    const db = dbManager.get();
    res.json([]);
  });
  app.get("/api/reports/delivery-performance", (req, res) => {
    const db = dbManager.get();
    res.json([]);
  });
  app.get("/api/reports/accounts-performance", (req, res) => {
    const db = dbManager.get();
    res.json([]);
  });
  app.get("/api/search", (req, res) => {
    const db = dbManager.get();
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json({ customers: [], sales: [], payments: [], suppliers: [], deliveries: [], inventory: [] });
    const customers = db.customers.filter((c) => c.name.toLowerCase().includes(query) || c.mobile.includes(query)).slice(0, 5);
    const sales = db.sales.filter((s) => s.invoiceNumber.toLowerCase().includes(query) || s.customerName.toLowerCase().includes(query)).slice(0, 5);
    const payments = db.payments.filter((p) => p.receiptNumber.toLowerCase().includes(query) || p.customerName.toLowerCase().includes(query)).slice(0, 5);
    const suppliers = db.suppliers.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 5);
    const deliveries = db.deliveries.filter((d) => d.customerName.toLowerCase().includes(query)).slice(0, 5);
    const inventory = db.inventory.filter((i) => i.name.toLowerCase().includes(query)).slice(0, 5);
    res.json({ customers, sales, payments, suppliers, deliveries, inventory });
  });
  app.get("/api/settings", (req, res) => {
    const db = dbManager.get();
    res.json(db.settings);
  });
  app.put("/api/settings", (req, res) => {
    try {
      const data = req.body;
      const updated = dbManager.mutate((db) => {
        db.settings = { ...db.settings, ...data };
        return db.settings;
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/settings/backup/export", (req, res) => {
    const db = dbManager.get();
    res.json(db);
  });
  app.post("/api/settings/backup/import", (req, res) => {
    try {
      dbManager.save(req.body);
      res.json({ message: "Backup restored successfully", count: req.body.customers?.length || 0 });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/settings/reset-demo", (req, res) => {
    const fresh = dbManager.resetDemoData();
    res.json({ message: "Database reset to verified sample data.", db: fresh });
  });
  app.post("/api/settings/clear-all-data", (req, res) => {
    const clean = dbManager.clearAllData();
    res.json({ message: "All dummy records cleared successfully.", db: clean });
  });
  app.get("/api/permissions", (req, res) => {
    res.json({
      all: ALL_PERMISSIONS,
      modules: PERMISSION_MODULES,
      roleDefaults: ROLE_DEFAULT_PERMISSIONS
    });
  });
  app.post("/api/auth/login", (req, res) => {
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
        isOwner: user.role === "owner",
        isAdmin: user.role === "admin" || user.role === "owner",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully." });
  });
  app.get("/api/auth/me", (req, res) => {
    const db = dbManager.get();
    const user = getAuthenticatedStaff(req) || db.users[0];
    res.json({
      user: sanitizeUser(user),
      permissions: user.permissions || [...ALL_PERMISSIONS],
      isOwner: user.role === "owner",
      isAdmin: user.role === "admin" || user.role === "owner"
    });
  });
  app.get("/api/staff", (req, res) => {
    const db = dbManager.get();
    res.json((db.users || []).map((u) => sanitizeUser(u)));
  });
  app.get("/api/audit-logs", (req, res) => {
    const db = dbManager.get();
    res.json(db.audit_logs || []);
  });
  app.post("/api/customer/auth/login", (req, res) => {
    try {
      const { identifier, password } = req.body;
      const db = dbManager.get();
      let account = (db.customer_accounts || []).find((a) => a.mobile === identifier || a.email === identifier);
      let customer = db.customers[0];
      if (!account) {
        customer = db.customers.find((c) => c.id !== "CUST-CASH") || db.customers[0];
        const accountId = `CUST-ACC-${Date.now()}`;
        account = {
          id: accountId,
          customerId: customer.id,
          fullName: customer.name,
          email: customer.email || "customer@example.com",
          mobile: customer.mobile || "03001234567",
          passwordHash: "",
          salt: "",
          authProvider: "email",
          emailVerified: false,
          phoneVerified: false,
          accountStatus: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } else {
        customer = db.customers.find((c) => c.id === account.customerId) || db.customers[0];
      }
      const token = createCustomerSession(account.id, customer.id);
      res.json({
        token,
        account: sanitizeAccount(account),
        customer,
        defaultAddress: db.customer_addresses?.find((a) => a.customerId === customer.id)
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/customer/auth/register", (req, res) => {
    try {
      const { fullName, mobile, whatsapp, address, area, city } = req.body;
      const result = dbManager.mutate((db) => {
        const custId = `CUST-${1e3 + db.customers.length + 1}`;
        const newCustomer = {
          id: custId,
          name: fullName,
          mobile,
          whatsapp: whatsapp || mobile,
          address: address || "House / Street",
          area: area || "Clifton",
          city: city || "Karachi",
          customerType: "regular",
          bottlesWithCustomer: 0,
          securityDeposit: 0,
          currentBalance: 0,
          creditLimit: 0,
          ratePerBottle: db.settings.defaultBottlePrice || 150,
          registrationDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          active: true
        };
        db.customers.unshift(newCustomer);
        const accountId = `CUST-ACC-${Date.now()}`;
        const account = {
          id: accountId,
          customerId: newCustomer.id,
          fullName,
          email: "",
          mobile,
          whatsapp: whatsapp || mobile,
          passwordHash: "",
          salt: "",
          authProvider: "email",
          emailVerified: false,
          phoneVerified: false,
          accountStatus: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.customer_accounts.push(account);
        const newAddress = {
          id: `ADDR-${Date.now()}`,
          customerId: newCustomer.id,
          label: "Home",
          fullAddress: address || "House / Street",
          area: area || "Clifton",
          city: city || "Karachi",
          isDefault: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.customer_addresses.push(newAddress);
        return { account, customer: newCustomer, defaultAddress: newAddress };
      });
      const token = createCustomerSession(result.account.id, result.customer.id);
      res.status(201).json({
        token,
        account: sanitizeAccount(result.account),
        customer: result.customer,
        defaultAddress: result.defaultAddress
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/customer/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully." });
  });
  app.get("/api/customer/auth/me", (req, res) => {
    const session = getCustomerSessionFromReq(req);
    const db = dbManager.get();
    const account = session ? db.customer_accounts.find((a) => a.id === session.accountId) : db.customer_accounts[0];
    const customer = account ? db.customers.find((c) => c.id === account.customerId) : db.customers[0];
    res.json({
      account: account ? sanitizeAccount(account) : null,
      customer: customer || null,
      addresses: db.customer_addresses || []
    });
  });
  app.get("/api/customer/addresses", (req, res) => {
    const db = dbManager.get();
    res.json(db.customer_addresses || []);
  });
  app.get("/api/customer/orders", (req, res) => {
    const db = dbManager.get();
    res.json(db.online_orders || []);
  });
  app.post("/api/customer/orders", (req, res) => {
    try {
      const { quantity = 2, preferredDate, preferredTimeSlot, customerNotes } = req.body;
      const result = dbManager.mutate((db) => {
        const customer = db.customers[0];
        const unitPrice = customer?.ratePerBottle || db.settings.defaultBottlePrice || 150;
        const totalAmount = quantity * unitPrice;
        const orderNum = `ORD-${1e3 + db.online_orders.length + 1}`;
        const newOrder = {
          id: orderNum,
          orderNumber: orderNum,
          customerId: customer?.id || "CUST-1001",
          customerName: customer?.name || "Customer",
          customerPhone: customer?.mobile || "03001234567",
          orderSource: "website",
          addressId: "ADDR-1",
          deliveryAddress: customer?.address || "Street 1",
          deliveryArea: customer?.area || "Clifton",
          deliveryCity: customer?.city || "Karachi",
          preferredDate: preferredDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          preferredTimeSlot: preferredTimeSlot || "Morning",
          items: [
            {
              productId: "prod_19L",
              productName: "19-Liter Mineral Water Bottle Refill",
              quantity,
              unitPrice,
              totalPrice: totalAmount
            }
          ],
          totalBottles: quantity,
          totalAmount,
          status: "pending",
          paymentMethod: "Cash on Delivery",
          paymentStatus: "cash_on_delivery",
          customerNotes: customerNotes || "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.online_orders.unshift(newOrder);
        return newOrder;
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/online-orders", (req, res) => {
    const db = dbManager.get();
    res.json(db.online_orders || []);
  });
  app.put("/api/online-orders/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = dbManager.mutate((db) => {
        const order = (db.online_orders || []).find((o) => o.id === id);
        if (order) order.status = status;
        return order;
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Water Business Manager server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
