import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Customer,
  InventoryItem,
  Supplier,
  CustomerType,
  PaymentMethod,
  ExpenseCategory,
} from '../../types';
import {
  X,
  UserPlus,
  ShoppingCart,
  Receipt,
  Truck,
  Repeat,
  Wallet,
  ShoppingBag,
} from 'lucide-react';
import { KarachiAreaSelector } from '../common/KarachiAreaSelector';

export const QuickActionModals: React.FC = () => {
  const {
    quickModal,
    setQuickModal,
    refreshAll,
    addToast,
    setActiveInvoiceData,
    setActiveReceiptData,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form states
  // Add Customer
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custWhatsapp, setCustWhatsapp] = useState('');
  const [custArea, setCustArea] = useState('Gulshan-e-Iqbal');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<CustomerType>('regular');
  const [custRate, setCustRate] = useState(100);
  const [custDeposit, setCustDeposit] = useState(0);
  const [custBottlesHolding, setCustBottlesHolding] = useState(0);

  // New Sale
  const [saleCustId, setSaleCustId] = useState('');
  const [saleQty, setSaleQty] = useState(2);
  const [saleEmptyReturned, setSaleEmptyReturned] = useState(2);
  const [saleRate, setSaleRate] = useState(100);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [salePaid, setSalePaid] = useState(0);
  const [saleMethod, setSaleMethod] = useState<PaymentMethod>('Cash');

  // Receive Payment
  const [payCustId, setPayCustId] = useState('');
  const [payAmount, setPayAmount] = useState(500);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Log Delivery
  const [delDriver, setDelDriver] = useState('Rashid Mehmood');
  const [delCustId, setDelCustId] = useState('');
  const [delDelivered, setDelDelivered] = useState(2);
  const [delEmpty, setDelEmpty] = useState(2);
  const [delCollected, setDelCollected] = useState(200);

  // Refill Batch
  const [refillFilled, setRefillFilled] = useState(50);
  const [refillEmpty, setRefillEmpty] = useState(50);
  const [refillDamaged, setRefillDamaged] = useState(0);

  // Expense
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState(1000);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Fuel');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('Cash');
  const [expNotes, setExpNotes] = useState('');

  // Purchase
  const [purSupplierId, setPurSupplierId] = useState('');
  const [purItemId, setPurItemId] = useState('');
  const [purQty, setPurQty] = useState(100);
  const [purUnitCost, setPurUnitCost] = useState(10);
  const [purPaid, setPurPaid] = useState(1000);

  useEffect(() => {
    if (!quickModal) return;
    Promise.all([
      api.getCustomers().catch(() => []),
      api.getInventory().catch(() => []),
      api.getSuppliers().catch(() => []),
    ]).then(([cl, il, sl]) => {
      setCustomers(cl);
      setInventory(il);
      setSuppliers(sl);
      if (cl.length > 0) {
        if (!saleCustId) setSaleCustId(cl[0].id);
        if (!payCustId) setPayCustId(cl[0].id);
        if (!delCustId) setDelCustId(cl[0].id);
      }
      if (sl.length > 0 && !purSupplierId) setPurSupplierId(sl[0].id);
      if (il.length > 0 && !purItemId) setPurItemId(il[0].id);
    });
  }, [quickModal]);

  if (!quickModal) return null;

  const handleClose = () => setQuickModal(null);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createCustomer({
        name: custName,
        mobile: custMobile,
        whatsapp: custWhatsapp || custMobile,
        area: custArea,
        address: custAddress,
        city: 'Karachi',
        customerType: custType,
        ratePerBottle: Number(custRate),
        securityDeposit: Number(custDeposit),
        bottlesWithCustomer: Number(custBottlesHolding),
        currentBalance: 0,
        active: true,
      });
      addToast('success', 'Customer Added', `${custName} has been registered.`);
      refreshAll();
      handleClose();
    } catch (err: any) {
      addToast('error', 'Failed to Add Customer', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selCust = customers.find((c: Customer) => c.id === saleCustId) || customers[0];
    if (!selCust) return;
    setLoading(true);
    try {
      const rate = Number(saleRate) || selCust.ratePerBottle || 100;
      const subtotal = Number(saleQty) * rate;
      const totalAmount = Math.max(0, subtotal - Number(saleDiscount));
      const paid = Number(salePaid);
      const remainingBalance = Math.max(0, totalAmount - paid);

      const newSale = await api.createSale({
        customerId: selCust.id,
        customerName: selCust.name,
        date: new Date().toISOString().split('T')[0],
        quantity: Number(saleQty),
        emptyBottlesReceived: Number(saleEmptyReturned),
        rate,
        subtotal,
        discount: Number(saleDiscount),
        total: totalAmount,
        paidAmount: paid,
        remainingBalance,
        paymentStatus: paid >= totalAmount ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
        paymentMethod: saleMethod,
        items: [
          {
            itemId: 'ITEM-1',
            itemName: '19L Mineral Water Bottle Refill',
            quantity: Number(saleQty),
            rate,
            total: subtotal,
          },
        ],
      });

      addToast('success', 'Sale Logged', `Invoice #${newSale.invoiceNumber} recorded.`);
      refreshAll();
      handleClose();
      setActiveInvoiceData(newSale);
    } catch (err: any) {
      addToast('error', 'Sale Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selCust = customers.find((c: Customer) => c.id === payCustId) || customers[0];
    if (!selCust) return;
    setLoading(true);
    try {
      const payment = await api.recordPayment({
        customerId: selCust.id,
        customerName: selCust.name,
        date: new Date().toISOString().split('T')[0],
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef || undefined,
        notes: payNotes || 'Cash collected',
      });
      addToast('success', 'Payment Received', `Rs. ${payment.amount} recorded for ${selCust.name}.`);
      refreshAll();
      handleClose();
      setActiveReceiptData(payment);
    } catch (err: any) {
      addToast('error', 'Payment Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selCust = customers.find((c: Customer) => c.id === delCustId) || customers[0];
    if (!selCust) return;
    setLoading(true);
    try {
      await api.createDelivery({
        date: new Date().toISOString().split('T')[0],
        deliveryPerson: delDriver,
        customerId: selCust.id,
        customerName: selCust.name,
        area: selCust.area || 'Karachi',
        address: selCust.address || 'Karachi',
        phone: selCust.mobile || '',
        filledDelivered: Number(delDelivered),
        emptyReceived: Number(delEmpty),
        paid: Number(delCollected),
        rate: selCust.ratePerBottle || 100,
        total: Number(delDelivered) * (selCust.ratePerBottle || 100),
        remaining: 0,
        paymentMethod: 'Cash',
        status: 'delivered',
      });
      addToast('success', 'Delivery Recorded', `Delivery to ${selCust.name} confirmed.`);
      refreshAll();
      handleClose();
    } catch (err: any) {
      addToast('error', 'Delivery Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createRefillBatch({
        date: new Date().toISOString().split('T')[0],
        operator: 'Bilal Siddiqui (Plant)',
        filledBottlesProduced: Number(refillFilled),
        emptyBottlesUsed: Number(refillEmpty),
        damagedBottles: Number(refillDamaged),
        bottleSize: '19-Liter',
        status: 'completed',
      });
      addToast('success', 'Batch Refilled', `${refillFilled} bottles added to finished inventory.`);
      refreshAll();
      handleClose();
    } catch (err: any) {
      addToast('error', 'Refill Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createExpense({
        description: expTitle,
        amount: Number(expAmount),
        category: expCategory,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: expMethod,
        notes: expNotes,
      });
      addToast('success', 'Expense Added', `Rs. ${expAmount} logged under ${expCategory}.`);
      refreshAll();
      handleClose();
    } catch (err: any) {
      addToast('error', 'Expense Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selSupp = suppliers.find((s: Supplier) => s.id === purSupplierId) || suppliers[0];
    const selItem = inventory.find((i: InventoryItem) => i.id === purItemId) || inventory[0];
    if (!selSupp || !selItem) return;
    setLoading(true);
    try {
      const total = Number(purQty) * Number(purUnitCost);
      await api.createPurchase({
        supplierId: selSupp.id,
        supplierName: selSupp.name,
        date: new Date().toISOString().split('T')[0],
        itemId: selItem.id,
        itemName: selItem.name,
        itemCategory: selItem.category,
        quantity: Number(purQty),
        rate: Number(purUnitCost),
        total,
        paidAmount: Number(purPaid),
        remainingBalance: Math.max(0, total - Number(purPaid)),
        paymentMethod: 'Cash',
      });
      addToast('success', 'Purchase Recorded', `Procured ${purQty} ${selItem.unit} from ${selSupp.name}.`);
      refreshAll();
      handleClose();
    } catch (err: any) {
      addToast('error', 'Purchase Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            {quickModal === 'customer' && <UserPlus className="w-5 h-5 text-blue-400" />}
            {quickModal === 'sale' && <ShoppingCart className="w-5 h-5 text-emerald-400" />}
            {quickModal === 'payment' && <Receipt className="w-5 h-5 text-cyan-400" />}
            {quickModal === 'delivery' && <Truck className="w-5 h-5 text-indigo-400" />}
            {quickModal === 'refill' && <Repeat className="w-5 h-5 text-teal-400" />}
            {quickModal === 'expense' && <Wallet className="w-5 h-5 text-rose-400" />}
            {quickModal === 'purchase' && <ShoppingBag className="w-5 h-5 text-amber-400" />}

            <h3 className="font-bold text-sm tracking-wide">
              {quickModal === 'customer' && 'Add New Water Customer'}
              {quickModal === 'sale' && 'Record New Water Delivery & Sale'}
              {quickModal === 'payment' && 'Receive Customer Payment'}
              {quickModal === 'delivery' && 'Log Route Delivery'}
              {quickModal === 'refill' && 'Log Plant Refilling Batch'}
              {quickModal === 'expense' && 'Record Operating Expense'}
              {quickModal === 'purchase' && 'New Supplier Purchase (Stock)'}
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Add Customer Form */}
          {quickModal === 'customer' && (
            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Dr. Salman / Habib Bank Clifton Branch"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp (Optional)</label>
                  <input
                    type="text"
                    value={custWhatsapp}
                    onChange={(e) => setCustWhatsapp(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Area / Sector *</label>
                <KarachiAreaSelector value={custArea} onChange={(val) => setCustArea(val)} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Street Address</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="House #, Street, Block / Floor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as CustomerType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="regular">Regular</option>
                    <option value="monthly">Monthly</option>
                    <option value="commercial">Commercial/Office</option>
                    <option value="retail">Retail Shop</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate (PKR)</label>
                  <input
                    type="number"
                    value={custRate}
                    onChange={(e) => setCustRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Init Bottles</label>
                  <input
                    type="number"
                    value={custBottlesHolding}
                    onChange={(e) => setCustBottlesHolding(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          )}

          {/* New Sale Form */}
          {quickModal === 'sale' && (
            <form onSubmit={handleNewSaleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={saleCustId}
                  onChange={(e) => {
                    setSaleCustId(e.target.value);
                    const c = customers.find((cust: Customer) => cust.id === e.target.value);
                    if (c?.ratePerBottle) setSaleRate(c.ratePerBottle);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                >
                  {customers.map((c: Customer) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.area || 'Karachi'}) - Due: Rs. {c.currentBalance || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivered Filled</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleQty}
                    onChange={(e) => setSaleQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Returned Empty</label>
                  <input
                    type="number"
                    min="0"
                    value={saleEmptyReturned}
                    onChange={(e) => setSaleEmptyReturned(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate (PKR)</label>
                  <input
                    type="number"
                    value={saleRate}
                    onChange={(e) => setSaleRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-500">Gross Total:</span>{' '}
                  <strong className="text-slate-900">Rs. {(saleQty * saleRate).toLocaleString()}</strong>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid Now (PKR)</label>
                  <input
                    type="number"
                    value={salePaid}
                    onChange={(e) => setSalePaid(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          )}

          {/* Receive Payment Form */}
          {quickModal === 'payment' && (
            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Account *</label>
                <select
                  required
                  value={payCustId}
                  onChange={(e) => setPayCustId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                >
                  {customers.map((c: Customer) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Current Due: Rs. {c.currentBalance || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Cash">Cash on Hand</option>
                    <option value="Bank Transfer">Bank Transfer (IBFT)</option>
                    <option value="Easypaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Optional IBFT TID / Slip number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Payment & Receipt'}
                </button>
              </div>
            </form>
          )}

          {/* Delivery Form */}
          {quickModal === 'delivery' && (
            <form onSubmit={handleDeliverySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Driver</label>
                  <input
                    type="text"
                    value={delDriver}
                    onChange={(e) => setDelDriver(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer</label>
                  <select
                    value={delCustId}
                    onChange={(e) => setDelCustId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.area || 'Karachi'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Filled Delivered</label>
                  <input
                    type="number"
                    value={delDelivered}
                    onChange={(e) => setDelDelivered(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Empty Collected</label>
                  <input
                    type="number"
                    value={delEmpty}
                    onChange={(e) => setDelEmpty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cash Collected (PKR)</label>
                  <input
                    type="number"
                    value={delCollected}
                    onChange={(e) => setDelCollected(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Log Delivery Route'}
                </button>
              </div>
            </form>
          )}

          {/* Refill Batch Form */}
          {quickModal === 'refill' && (
            <form onSubmit={handleRefillSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bottles Filled</label>
                  <input
                    type="number"
                    value={refillFilled}
                    onChange={(e) => setRefillFilled(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Empty Washed</label>
                  <input
                    type="number"
                    value={refillEmpty}
                    onChange={(e) => setRefillEmpty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Damaged/Discarded</label>
                  <input
                    type="number"
                    value={refillDamaged}
                    onChange={(e) => setRefillDamaged(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-800">
                19-Liter bottle sterilization cycle. Water filtration online.
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Updating stock...' : 'Confirm Refilling Batch'}
                </button>
              </div>
            </form>
          )}

          {/* Record Expense Form */}
          {quickModal === 'expense' && (
            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Delivery Van Suzuki Ravi Petrol / RO Plant Filter Replacement"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-rose-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Fuel">Fuel & Transport</option>
                    <option value="Electricity">Electricity / K-Electric</option>
                    <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                    <option value="Staff Salary">Staff Salaries</option>
                    <option value="Rent">Premises Rent</option>
                    <option value="Caps">Caps Purchase</option>
                    <option value="Labels">Labels Purchase</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </form>
          )}

          {/* New Purchase Form */}
          {quickModal === 'purchase' && (
            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={purSupplierId}
                    onChange={(e) => setPurSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {suppliers.map((s: Supplier) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.productSupplied})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item to Procure</label>
                  <select
                    value={purItemId}
                    onChange={(e) => setPurItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {inventory.map((inv: InventoryItem) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Stock: {inv.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={purQty}
                    onChange={(e) => setPurQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Cost (PKR)</label>
                  <input
                    type="number"
                    value={purUnitCost}
                    onChange={(e) => setPurUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid Now (PKR)</label>
                  <input
                    type="number"
                    value={purPaid}
                    onChange={(e) => setPurPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Procuring...' : 'Record Stock Purchase'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
