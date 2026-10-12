import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Sale } from '../types';
import {
  ShoppingCart,
  Search,
  Plus,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  User,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Banknote,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { cleanPhoneNumber } from '../utils/whatsappHelper';

export const SalesView: React.FC = () => {
  const {
    refreshTrigger,
    formatCurrency,
    formatDate,
    setQuickModal,
    setActiveInvoiceData,
    settings,
  } = useApp();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cash' | 'account'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    api.getSales()
      .then((data) => setSales(data))
      .catch((err) => console.error('Sales fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const filteredSales = sales.filter((s) => {
    if (statusFilter !== 'all' && s.paymentStatus !== statusFilter) return false;
    if (typeFilter === 'cash' && !(s.isCashSale || s.customerId === 'CUST-CASH')) return false;
    if (typeFilter === 'account' && (s.isCashSale || s.customerId === 'CUST-CASH')) return false;
    if (dateFilter && s.date !== dateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.customerId.toLowerCase().includes(q) ||
        s.deliveryPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalBottlesSold = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
  const totalPaid = filteredSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalRemaining = filteredSales.reduce((acc, s) => acc + s.remainingBalance, 0);

  const handleSendWhatsAppReceipt = (sale: Sale) => {
    const phone = sale.customerPhone || '';
    const cleanNum = cleanPhoneNumber(phone);
    const currency = settings.currency || 'Rs.';

    let msg = `*══════════════════════════*\n`;
    msg += `*${sale.isCashSale ? '⚡ CASH SALE RECEIPT' : '💧 SALES INVOICE'}*\n`;
    msg += `*${settings.businessName || 'Anmol Pure Mineral Water'}*\n`;
    msg += `*══════════════════════════*\n\n`;
    msg += `Dear *${sale.customerName}*,\n\n`;
    msg += `Here is your transaction receipt:\n\n`;
    msg += `  *Invoice No:* ${sale.invoiceNumber}\n`;
    msg += `  *Date:* ${new Date(sale.date).toLocaleDateString('en-GB')}\n`;
    msg += `  *Quantity:* ${sale.quantity} x 19L Bottle(s)\n`;
    if (sale.emptyBottlesReceived > 0) {
      msg += `  *Empty Returned:* ${sale.emptyBottlesReceived} Bottle(s)\n`;
    }
    msg += `  *Rate:* ${currency} ${sale.rate}/bottle\n`;
    if (sale.discount > 0) msg += `  *Discount:* ${currency} ${sale.discount}\n`;
    msg += `  *Total Bill:* *${currency} ${sale.total.toLocaleString()}*\n`;
    msg += `  *Amount Paid:* *${currency} ${sale.paidAmount.toLocaleString()}*\n`;
    if (sale.remainingBalance > 0) {
      msg += `  *Remaining Due:* *${currency} ${sale.remainingBalance.toLocaleString()}*\n`;
    } else {
      msg += `  *Status:* *PAID IN FULL (CASH)*\n`;
    }
    if (sale.cashTendered && sale.changeReturned !== undefined) {
      msg += `  *Cash Received:* ${currency} ${sale.cashTendered.toLocaleString()}\n`;
      msg += `  *Change Returned:* ${currency} ${sale.changeReturned.toLocaleString()}\n`;
    }
    msg += `\nThank you for choosing ${settings.businessName || 'Anmol Pure Mineral Water'}!\n`;
    if (settings.phone) msg += `  Helpline: ${settings.phone}\n`;
    msg += `*══════════════════════════*`;

    if (cleanNum) {
      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-6 h-6 text-sky-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Sales Invoices & Water Orders</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Counter cash POS, route delivery billing, empty bottle balance tracking & WhatsApp receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickModal('cash_sale')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Banknote className="w-4 h-4" />
            <span>⚡ Instant Cash Sale</span>
          </button>
          <button
            onClick={() => setQuickModal('sale')}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Regular / Account Sale</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Total Sales</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(totalSalesRevenue)}</span>
          <span className="text-[11px] text-sky-600 block mt-0.5">{filteredSales.length} Orders</span>
        </div>
        <div className="p-4 bg-white border border-cyan-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-cyan-800 uppercase block">Bottles Sold</span>
          <span className="text-xl sm:text-2xl font-bold text-cyan-900">{totalBottlesSold} Pcs</span>
          <span className="text-[11px] text-cyan-600 block mt-0.5">19-Liter refilled</span>
        </div>
        <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase block">Collected Cash</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Received instantly</span>
        </div>
        <div className="p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-amber-800 uppercase block">Unpaid / Due Balance</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-600">{formatCurrency(totalRemaining)}</span>
          <span className="text-[11px] text-amber-600 block mt-0.5">Customer ledger</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sales ({sales.length})
          </button>
          <button
            onClick={() => setTypeFilter('cash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'cash'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Cash Sales ({sales.filter((s) => s.isCashSale || s.customerId === 'CUST-CASH').length})</span>
          </button>
          <button
            onClick={() => setTypeFilter('account')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'account'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Account / Route Orders ({sales.filter((s) => !s.isCashSale && s.customerId !== 'CUST-CASH').length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, customer name, driver..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-sky-500 focus:outline-hidden"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-sky-500 focus:outline-hidden"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid / Due</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Bottles (Del/Ret)</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Paid / Tendered</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading sales records...</td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No sales found matching criteria.</td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCash = sale.isCashSale || sale.customerId === 'CUST-CASH';
                  return (
                    <tr key={sale.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sky-700">{sale.invoiceNumber}</span>
                          {isCash && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              CASH
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{formatDate(sale.date)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        <span className="text-[11px] text-slate-500">
                          {isCash ? 'Counter / POS Sale' : `Delivered by: ${sale.deliveryPerson}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900 block">{sale.quantity} Delivered</span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          {sale.emptyBottlesReceived || 0} Empties Ret
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          {formatCurrency(sale.total)}
                        </span>
                        <span className="text-[11px] text-slate-500">@ {formatCurrency(sale.rate)}/btl</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-emerald-700 block">{formatCurrency(sale.paidAmount)}</span>
                        {sale.remainingBalance > 0 ? (
                          <span className="text-[11px] font-bold text-rose-600">
                            Due: {formatCurrency(sale.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600">100% Paid</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-emerald-100 text-emerald-800">
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveInvoiceData(sale)}
                            title="Print Sales Invoice"
                            className="p-1.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Print</span>
                          </button>
                          <button
                            onClick={() => handleSendWhatsAppReceipt(sale)}
                            title="Send WhatsApp Receipt"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
