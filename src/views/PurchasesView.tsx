import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Purchase } from '../types';
import { ShoppingBag, Search, Plus } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { refreshTrigger, formatCurrency, formatDate, setQuickModal } = useApp();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    api.getPurchases()
      .then((data) => setPurchases(data))
      .catch((err) => console.error('Purchases fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const filteredPurchases = purchases.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.itemName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Stock & Consumable Purchases</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Raw material purchases for bottles, caps, shrink seals, labels, and RO plant chemicals
          </p>
        </div>
        <button
          onClick={() => setQuickModal('purchase')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Purchase Order</span>
        </button>
      </div>

      <div className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-xs">
        <span className="text-xs font-semibold text-indigo-800 uppercase block">Total Purchases</span>
        <span className="text-2xl font-extrabold text-indigo-900">{formatCurrency(totalSpent)}</span>
        <span className="text-xs text-slate-500 block mt-0.5">{filteredPurchases.length} Purchase Invoices</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 text-center">Qty / Rate</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid / Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading purchases...</td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No purchases recorded yet.</td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-800">{p.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(p.date)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.supplierName}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{p.itemName}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-900 block">{p.quantity} pcs</span>
                      <span className="text-[11px] text-slate-500">@ {formatCurrency(p.rate)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">{formatCurrency(p.total)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold text-emerald-700 block">{formatCurrency(p.paidAmount)}</span>
                      {p.remainingBalance > 0 && (
                        <span className="text-[11px] font-bold text-rose-600">
                          Due: {formatCurrency(p.remainingBalance)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
