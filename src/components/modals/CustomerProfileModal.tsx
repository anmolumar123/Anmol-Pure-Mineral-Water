import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Customer,
  CustomerTransaction,
  CustomerBottleTransaction,
  Sale,
  Payment,
  BottleTransactionType,
} from '../../types';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  Send,
} from 'lucide-react';

interface CustomerProfileModalProps {
  customerId: string;
  onClose: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ customerId, onClose }) => {
  const {
    refreshAll,
    addToast,
    formatCurrency,
    formatDate,
    setActiveInvoiceData,
    setActiveReceiptData,
    setActiveMessageCustomer,
  } = useApp();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bottles' | 'ledger' | 'sales' | 'payments'>('overview');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [bottleTxns, setBottleTxns] = useState<CustomerBottleTransaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Adjustment Modal state
  const [showAdjustBottle, setShowAdjustBottle] = useState(false);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<BottleTransactionType>('returned');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    if (!customerId) return;
    loadDetails();
  }, [customerId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomerById(customerId);
      setCustomer(res.customer);
      setTransactions(res.transactions || []);
      setBottleTxns(res.bottleLedger || []);
      setSales(res.sales || []);
      setPayments(res.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBottleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    try {
      const isReturn = adjustType === 'returned';
      await api.recordCustomerBottleTx(customer.id, {
        date: new Date().toISOString().split('T')[0],
        type: adjustType,
        filledDelivered: isReturn ? 0 : Number(adjustQty),
        emptyReturned: isReturn ? Number(adjustQty) : 0,
        notes: adjustNotes || 'Manual bottle ledger adjustment',
      });
      addToast('success', 'Bottles Updated', 'Customer bottle balance adjusted.');
      setShowAdjustBottle(false);
      setAdjustNotes('');
      refreshAll();
      await loadDetails();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not adjust bottle balance.');
    }
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/30 text-blue-300 uppercase">
                {customer.customerType || 'REGULAR'}
              </span>
              <h2 className="text-xl font-bold text-white">{customer.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {customer.area || 'Karachi'}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.mobile || customer.whatsapp || 'No contact'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Since {formatDate(customer.registrationDate || customer.created_at || '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMessageCustomer(customer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200/80">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Current Ledger Balance</p>
            <p
              className={`text-xl font-black mt-1 ${
                (customer.currentBalance || 0) > 0
                  ? 'text-rose-600'
                  : (customer.currentBalance || 0) < 0
                  ? 'text-emerald-600'
                  : 'text-slate-800'
              }`}
            >
              {formatCurrency(customer.currentBalance || 0)}
            </p>
            <p className="text-[10px] text-slate-400">
              {(customer.currentBalance || 0) > 0 ? 'Receivable from customer' : 'Settled / In Advance'}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Bottles Holding</p>
              <button
                onClick={() => setShowAdjustBottle(true)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Adjust
              </button>
            </div>
            <p className="text-xl font-black text-blue-600 mt-1">
              {customer.bottlesWithCustomer || 0}{' '}
              <span className="text-xs font-normal text-slate-500">bottles</span>
            </p>
            <p className="text-[10px] text-slate-400">Deposit: {formatCurrency(customer.securityDeposit || 0)}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Sales Orders</p>
            <p className="text-xl font-black text-slate-800 mt-1">{sales.length}</p>
            <p className="text-[10px] text-slate-400">Total Payments: {payments.length}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Bottle Rate</p>
            <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(customer.ratePerBottle || 100)}</p>
            <p className="text-[10px] text-slate-400">Credit Limit: {formatCurrency(customer.creditLimit || 0)}</p>
          </div>
        </div>

        {/* Adjust Bottle Popup */}
        {showAdjustBottle && (
          <form
            onSubmit={handleBottleAdjust}
            className="p-4 bg-blue-50/70 border-b border-blue-200/80 flex flex-wrap items-center gap-3 text-xs"
          >
            <span className="font-bold text-blue-900">Adjust Bottle Ledger:</span>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as BottleTransactionType)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700"
            >
              <option value="returned">Empty Received (+ Return)</option>
              <option value="delivered">Delivered (+ Issue)</option>
              <option value="damaged_reported">Damaged / Broken</option>
              <option value="adjustment">Manual Adjustment</option>
            </select>
            <input
              type="number"
              min="1"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              placeholder="Qty"
              className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700"
            />
            <input
              type="text"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="Reason / Notes..."
              className="flex-1 min-w-[150px] bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Save Adjustment
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustBottle(false)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-bold text-slate-500">
          {(['overview', 'bottles', 'ledger', 'sales', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 capitalize border-b-2 cursor-pointer transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {tab === 'bottles' ? '19L Bottle History' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading && (
            <div className="py-12 text-center text-xs text-slate-400">Loading history records...</div>
          )}

          {!loading && activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Delivery & Address Details
                  </h4>
                  <p><strong>Address:</strong> {customer.address || 'Karachi'}</p>
                  <p><strong>Area:</strong> {customer.area || 'Karachi'}</p>
                  <p><strong>City:</strong> {customer.city || 'Karachi'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Commercial Terms
                  </h4>
                  <p><strong>Customer Category:</strong> {customer.customerType}</p>
                  <p><strong>Per Bottle Rate:</strong> {formatCurrency(customer.ratePerBottle || 100)}</p>
                  <p><strong>Security Deposit:</strong> {formatCurrency(customer.securityDeposit || 0)}</p>
                  <p><strong>Status:</strong> {customer.active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              {customer.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong>Notes:</strong> {customer.notes}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'bottles' && (
            <div className="space-y-2">
              {bottleTxns.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No bottle transactions yet.</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Date</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5 text-center">Delivered</th>
                      <th className="p-2.5 text-center">Returned</th>
                      <th className="p-2.5 text-center">Balance Holding</th>
                      <th className="p-2.5 rounded-r-lg">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {bottleTxns.map((b: CustomerBottleTransaction) => (
                      <tr key={b.id}>
                        <td className="p-2.5 text-slate-600">{formatDate(b.date)}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.type === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.type === 'delivered'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold">{b.filledDelivered}</td>
                        <td className="p-2.5 text-center font-bold">{b.emptyReturned}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{b.runningBottleBalance}</td>
                        <td className="p-2.5 text-slate-500">{b.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {!loading && activeTab === 'ledger' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No ledger transactions yet.</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Debit (Bill)</th>
                      <th className="p-2.5 text-right">Credit (Paid)</th>
                      <th className="p-2.5 text-right rounded-r-lg">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transactions.map((t: CustomerTransaction) => (
                      <tr key={t.id}>
                        <td className="p-2.5 text-slate-600">{formatDate(t.date)}</td>
                        <td className="p-2.5">{t.description}</td>
                        <td className="p-2.5 text-right font-bold text-rose-600">
                          {t.debit > 0 ? `Rs. ${t.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">
                          {t.credit > 0 ? `Rs. ${t.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-800">
                          Rs. {(t.runningBalance ?? t.balance ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {!loading && activeTab === 'sales' && (
            <div className="space-y-2">
              {sales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No sales recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {sales.map((s: Sale) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveInvoiceData(s)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.invoiceNumber}</p>
                        <p className="text-slate-500">
                          {formatDate(s.date)} • {s.quantity} Filled Delivered • {s.emptyBottlesReceived} Empty Returned
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">Rs. {s.total.toLocaleString()}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {(s.paymentStatus || 'unpaid').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'payments' && (
            <div className="space-y-2">
              {payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No payments recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p: Payment) => (
                    <div
                      key={p.id}
                      onClick={() => setActiveReceiptData(p)}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{p.receiptNumber}</p>
                        <p className="text-slate-500">
                          {formatDate(p.date)} • Method: {p.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-700">Rs. {p.amount.toLocaleString()}</p>
                        <span className="text-[10px] text-slate-500">View Receipt</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
