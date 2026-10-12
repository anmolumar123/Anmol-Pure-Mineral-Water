import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Payment, Customer } from '../types';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  User,
  CreditCard,
  Trash2,
  Download,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { sendAutomaticPaymentWhatsApp } from '../utils/whatsappHelper';

export const PaymentsView: React.FC = () => {
  const {
    settings,
    refreshTrigger,
    formatCurrency,
    formatDate,
    setQuickModal,
    setActiveReceiptData,
    isAdmin,
    addToast,
    refreshAll,
  } = useApp();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('all');

  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getPayments(), api.getCustomers()])
      .then(([payData, custData]) => {
        setPayments(payData);
        setCustomers(custData);
      })
      .catch((err) => console.error('Payments fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today.getTime() - 86400000);
      setStartDate(y.toISOString().split('T')[0]);
      setEndDate(y.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
    if (startDate && p.date < startDate) return false;
    if (endDate && p.date > endDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerId.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleClearAllPayments = async () => {
    setIsClearing(true);
    try {
      const res = await api.clearAllPayments({ recalculateFromSales: true });
      addToast('success', 'Payments Cleared', res.message || 'All payment and receipt records have been cleared.');
      setShowClearModal(false);
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Clear Failed', err.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePayment(paymentToDelete.id);
      addToast('success', 'Receipt Deleted', `Receipt ${paymentToDelete.receiptNumber} was deleted.`);
      setPaymentToDelete(null);
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendWhatsAppReceipt = async (p: Payment) => {
    const cust = customers.find((c) => c.id === p.customerId);
    const targetCust = cust || {
      id: p.customerId,
      name: p.customerName,
      mobile: '',
      whatsapp: '',
      currentBalance: 0,
    };
    const res = await sendAutomaticPaymentWhatsApp({
      customer: targetCust,
      payment: p,
      settings,
      openDirectly: true,
    });
    if (res.success) {
      addToast('success', 'WhatsApp Receipt Dispatched', `Opened WhatsApp receipt for ${p.customerName}.`);
    } else {
      addToast('error', 'No Phone Number', `Customer ${p.customerName} does not have a phone number.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Payments & Receipts Ledger</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Customer receipt history, cash/online collection records, and balance reconciliations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Clear All Payments</span>
            </button>
          )}
          <button
            onClick={() => setQuickModal('payment')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Receive Customer Payment</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase block">Total Collections</span>
          <span className="text-2xl font-extrabold text-emerald-700">{formatCurrency(totalCollected)}</span>
          <span className="text-xs text-slate-500 block mt-0.5">{filteredPayments.length} Total Receipts</span>
        </div>
        <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-sky-800 uppercase block">Cash Collections</span>
          <span className="text-2xl font-extrabold text-sky-700">
            {formatCurrency(filteredPayments.filter((p) => p.paymentMethod === 'Cash').reduce((a, b) => a + b.amount, 0))}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Direct cash received</span>
        </div>
        <div className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-indigo-800 uppercase block">Digital / Bank / Mobile</span>
          <span className="text-2xl font-extrabold text-indigo-700">
            {formatCurrency(filteredPayments.filter((p) => p.paymentMethod !== 'Cash').reduce((a, b) => a + b.amount, 0))}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Online & wallet transfers</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt #, customer name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Payment Channels</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Easypaisa">Easypaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading receipts...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No payment receipts found.</td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(p.date)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.customerName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 text-xs block">{p.paymentMethod}</span>
                      {p.referenceNumber && (
                        <span className="font-mono text-[11px] text-slate-400">{p.referenceNumber}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-xs sm:text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSendWhatsAppReceipt(p)}
                          title="Send WhatsApp Receipt"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-emerald-200"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => setActiveReceiptData(p)}
                          title="Print Payment Receipt"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setPaymentToDelete(p)}
                            title="Delete receipt"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Clear All Payment Receipts?</h3>
            <p className="text-xs text-slate-600">
              This will erase all payment receipts and recalculate customer balances from sales.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllPayments}
                disabled={isClearing}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Delete Receipt #{paymentToDelete.receiptNumber}?</h3>
            <p className="text-xs text-slate-600">
              The amount ({formatCurrency(paymentToDelete.amount)}) will be re-added to the customer's balance.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPaymentToDelete(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
