export type UserRole = 'owner' | 'admin' | 'staff' | 'delivery' | 'customer';
export type StaffStatus = 'active' | 'inactive' | 'suspended';
export type CustomerSource = 'online' | 'walk_in' | 'admin_created' | 'whatsapp' | 'phone' | 'referral';
export type OrderSource = 'website' | 'walk_in' | 'whatsapp' | 'phone' | 'admin' | 'delivery';

export type PermissionKey =
  | 'dashboard.view'
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  | 'sales.view'
  | 'sales.create'
  | 'sales.edit'
  | 'sales.delete'
  | 'sales.export'
  | 'payments.view'
  | 'payments.create'
  | 'payments.edit'
  | 'payments.delete'
  | 'orders.view'
  | 'orders.create'
  | 'orders.confirm'
  | 'orders.reject'
  | 'orders.assign'
  | 'orders.cancel'
  | 'deliveries.view'
  | 'deliveries.create'
  | 'deliveries.update'
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.edit'
  | 'refilling.view'
  | 'refilling.create'
  | 'refilling.edit'
  | 'purchases.view'
  | 'purchases.create'
  | 'purchases.edit'
  | 'purchases.delete'
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.edit'
  | 'reports.view'
  | 'reports.export'
  | 'messages.view'
  | 'messages.send'
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.disable'
  | 'staff.permissions'
  | 'settings.view'
  | 'settings.edit'
  | 'audit_logs.view'
  | 'security.manage'
  | 'owner.manage'
  | 'database.manage';

export interface PermissionModuleGroup {
  module: string;
  label: string;
  permissions: {
    key: PermissionKey;
    label: string;
    action: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'manage';
  }[];
}

export interface AuthSession {
  token: string;
  user: User;
  permissions: PermissionKey[];
  isOwner: boolean;
  isAdmin: boolean;
  expiresAt: string;
}

export interface OwnerSecurityProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner';
  status: StaffStatus;
  mfaEnabled: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  createdAt: string;
  twoFactorType?: string;
}

export interface StaffPerformanceSummary {
  userId: string;
  name: string;
  role: UserRole;
  department: string;
  status: StaffStatus;
  loginCount: number;
  lastLogin?: string;
  customersCreated: number;
  salesCreated: number;
  paymentsCreated: number;
  ordersProcessed: number;
  ordersConfirmed: number;
  deliveriesCompleted: number;
  expensesCreated: number;
  recordsEdited: number;
  recordsDeleted: number;
  permissionChanges: number;
  activityCount: number;
}

export interface DeliveryStaffSummary {
  userId: string;
  name: string;
  phone: string;
  assignedArea: string;
  assignedOrders: number;
  deliveredOrders: number;
  failedDeliveries: number;
  cancelledDeliveries: number;
  bottlesDelivered: number;
  emptyBottlesReceived: number;
  cashCollected: number;
  avgDeliveriesPerDay: number;
}

export interface AccountsStaffSummary {
  userId: string;
  name: string;
  salesCreated: number;
  invoicesCreated: number;
  paymentsEntered: number;
  collectionsAmount: number;
  outstandingReceivablesManaged: number;
  discountsGiven: number;
  editsCount: number;
  correctionsCount: number;
  activityCount: number;
}

export interface CustomerAccount {
  id: string;
  customerId: string;
  fullName: string;
  full_name?: string;
  email: string;
  mobile: string;
  mobile_phone?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  houseOffice?: string;
  house_office?: string;
  streetRoad?: string;
  street_road?: string;
  area?: string;
  customArea?: string;
  custom_area?: string;
  gateBellFloor?: string;
  gate_bell_floor?: string;
  completeDeliveryAddress?: string;
  complete_delivery_address?: string;
  passwordHash: string;
  salt: string;
  authProvider: 'email' | 'google' | 'phone_otp';
  authUserId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  createdAt: string;
  created_at?: string;
  lastLoginAt?: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  fullAddress: string;
  houseOffice?: string;
  house_office?: string;
  streetRoad?: string;
  street_road?: string;
  area: string;
  customArea?: string;
  custom_area?: string;
  gateBellFloor?: string;
  gate_bell_floor?: string;
  completeDeliveryAddress?: string;
  complete_delivery_address?: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
}

export interface OnlineOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OnlineOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderSource: OrderSource;
  addressId: string;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryCity: string;
  googleMapsUrl?: string;
  deliveryInstructions?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  items: OnlineOrderItem[];
  totalBottles: number;
  totalAmount: number;
  status: OnlineOrderStatus;
  paymentMethod: string;
  paymentStatus: 'unpaid' | 'paid_online' | 'cash_on_delivery';
  customerNotes?: string;
  internalNotes?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  deliveryId?: string;
  saleId?: string;
  createdAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface CustomerAuthSession {
  token: string;
  account: {
    id: string;
    customerId: string;
    fullName: string;
    email: string;
    mobile: string;
    whatsapp?: string;
    accountStatus: string;
  };
  customer: Customer;
  defaultAddress?: CustomerAddress;
}

export interface User {
  id: string;
  authUserId?: string;
  employeeId?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: StaffStatus;
  active: boolean;
  department?: string;
  assignedArea?: string;
  joiningDate?: string;
  permissions?: PermissionKey[];
  passwordHash?: string;
  salt?: string;
  mfaEnabled?: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export type CustomerType = 'regular' | 'monthly' | 'retail' | 'commercial';

export interface Customer {
  id: string;
  name: string;
  full_name?: string;
  fatherOrCompanyName?: string;
  mobile: string;
  mobile_phone?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  email?: string;
  address: string;
  complete_delivery_address?: string;
  houseOffice?: string;
  house_office?: string;
  streetRoad?: string;
  street_road?: string;
  area: string;
  customArea?: string;
  custom_area?: string;
  gateBellFloor?: string;
  gate_bell_floor?: string;
  city: string;
  googleMapsUrl?: string;
  customerType: CustomerType;
  customerSource?: CustomerSource;
  accountStatus?: 'active' | 'inactive' | 'pending';
  authProvider?: string;
  authUserId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  bottlesWithCustomer: number;
  securityDeposit: number;
  currentBalance: number;
  creditLimit: number;
  ratePerBottle: number;
  notes?: string;
  registrationDate: string;
  created_at?: string;
  active: boolean;
  isDemo?: boolean;
}

export type TransactionType = 'sale' | 'payment' | 'deposit' | 'discount' | 'refund' | 'adjustment';

export interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: TransactionType;
  referenceId?: string;
  referenceNumber?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  balance?: number;
  createdBy: string;
  createdAt: string;
}

export type BottleTransactionType = 'delivered' | 'returned' | 'damaged_reported' | 'adjustment';

export interface CustomerBottleTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: BottleTransactionType;
  referenceId?: string;
  filledDelivered: number;
  emptyReturned: number;
  netChange: number;
  runningBottleBalance: number;
  balanceBottles?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type InventoryCategory =
  | 'empty_bottles'
  | 'filled_bottles'
  | 'caps'
  | 'seals'
  | 'labels'
  | 'ro_consumables'
  | 'chemicals'
  | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  openingStock: number;
  purchases: number;
  usedInProduction: number;
  damaged: number;
  soldOrDelivered: number;
  returned: number;
  currentStock: number;
  minimumStockLevel: number;
  minThreshold?: number;
  unitCost: number;
  sellingPrice?: number;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'refill_produced' | 'refill_empty_used' | 'purchase' | 'sale_delivered' | 'customer_return' | 'damaged' | 'adjustment';
  quantityChange: number;
  resultingStock: number;
  newStock?: number;
  referenceId?: string;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface RefillBatch {
  id: string;
  refillNumber: string;
  date: string;
  bottleSize: string;
  emptyBottlesUsed: number;
  filledBottlesProduced: number;
  damagedBottles: number;
  rejectedBottles: number;
  operator: string;
  notes?: string;
  status: 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Easypaisa' | 'JazzCash' | 'Cheque' | 'Other';

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItem[];
  quantity: number;
  emptyBottlesReceived: number;
  rate: number;
  subtotal: number;
  discount: number;
  deliveryCharges: number;
  total: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  deliveryPerson: string;
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
  isDemo?: boolean;
  isCashSale?: boolean;
  cashTendered?: number;
  changeReturned?: number;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  receivedBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  whatsapp?: string;
  address: string;
  city?: string;
  productSupplied: string;
  unitRate?: number;
  totalPurchases: number;
  totalPaid: number;
  balancePayable: number;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  type: 'purchase' | 'payment' | 'adjustment';
  referenceId?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  balance?: number;
  createdBy: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemCategory: InventoryCategory;
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  total: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  receivedBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export type ExpenseCategory =
  | 'Electricity'
  | 'Fuel'
  | 'Vehicle Maintenance'
  | 'Staff Salary'
  | 'Rent'
  | 'Bottle Purchase'
  | 'Caps'
  | 'Labels'
  | 'Cleaning'
  | 'Repairs'
  | 'Delivery Expenses'
  | 'Other';

export interface Expense {
  id: string;
  voucherNumber: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

export type DeliveryStatus = 'pending' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface DeliveryRecord {
  id: string;
  deliveryNumber: string;
  invoiceNumber?: string;
  date: string;
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  googleMapsUrl?: string;
  filledDelivered: number;
  emptyReceived: number;
  rate: number;
  total: number;
  paid: number;
  remaining: number;
  paymentMethod: PaymentMethod;
  deliveryPerson: string;
  status: DeliveryStatus;
  notes?: string;
  deliveredAt?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface MessageTemplate {
  id: string;
  name?: string;
  title?: string;
  code: string;
  content: string;
  channel?: 'whatsapp' | 'sms' | string;
  description?: string;
}

export interface SentMessage {
  id: string;
  customerId: string;
  customerName: string;
  recipientPhone: string;
  templateCode: string;
  message: string;
  content?: string;
  channel: 'whatsapp' | 'sms';
  status: 'sent' | 'opened_in_whatsapp' | 'copied';
  sentAt: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  currency: string;
  defaultBottleSize: string;
  defaultBottlePrice: number;
  defaultRatePerBottle?: number;
  defaultSecurityDeposit: number;
  invoicePrefix: string;
  receiptPrefix: string;
  refillPrefix: string;
  deliveryPrefix: string;
  lowStockBottlesThreshold: number;
  lowStockCapsThreshold: number;
  lowStockLabelsThreshold: number;
  termsAndConditions: string;
  whatsappApiConfigured: boolean;
  whatsappApiKey?: string;
  autoWhatsAppOnPayment?: boolean;
  whatsappPaymentReceiptTemplate?: string;
  whatsappReminderTemplate?: string;
  allowNegativeStock: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  details: string;
}

export interface LowInventoryAlert {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  category?: string;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  bottles: number;
}

export interface ExpenseCategoryPoint {
  category: string;
  amount: number;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalFilledBottles: number;
  filledBottlesStock: number;
  totalEmptyBottles: number;
  emptyBottlesStock: number;
  bottlesWithCustomers: number;
  totalBottlesWithCustomers: number;
  todaySales: number;
  todaySalesAmount: number;
  todaySalesCount: number;
  todayBottlesSold: number;
  thisMonthSalesAmount: number;
  thisMonthExpenses: number;
  netMonthlyProfit: number;
  todayCollection: number;
  totalOutstandingReceivables: number;
  totalReceivableBalance: number;
  totalPayables: number;
  totalSupplierPayable: number;
  todayExpenses: number;
  todayRefilling: number;
  damagedBottlesCount: number;
  lowInventoryAlertsCount: number;
  lowStockItems: InventoryItem[];
  lowInventoryAlerts: LowInventoryAlert[];
  salesTrendLast7Days: SalesTrendPoint[];
  expenseCategories: ExpenseCategoryPoint[];
  recentSales: Sale[];
  recentDeliveries: DeliveryRecord[];
  recentRefilling: RefillBatch[];
  pendingOnlineOrdersCount?: number;
  newOnlineOrdersCount?: number;
  onlineCustomersCount?: number;
}
