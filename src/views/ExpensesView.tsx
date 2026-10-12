import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Expense } from '../types';
import { Wallet, Search, Plus } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { refreshTrigger, formatCurrency, formatDate, setQuickModal } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    api.getExpenses()
      .then((data) => setExpenses(data))
      .catch((err) => console.error('Expenses fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.voucherNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-6 h-6 text-rose-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Operating Expenses & Vouchers</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Fuel, electricity, plant maintenance, delivery vehicle servicing, and staff wages
          </p>
        </div>
        <button
          onClick={() => setQuickModal('expense')}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Expense Voucher</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-rose-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-rose-800 uppercase block">Total Expenses</span>
          <span className="text-2xl font-extrabold text-rose-600">{formatCurrency(totalExpense)}</span>
          <span className="text-xs text-slate-500 block mt-0.5">{filteredExpenses.length} Vouchers</span>
        </div>
        <div className="p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-amber-800 uppercase block">Vehicle & Fuel</span>
          <span className="text-2xl font-extrabold text-amber-700">
            {formatCurrency(
              filteredExpenses
                .filter((e) => e.category === 'Fuel' || e.category === 'Vehicle Maintenance')
                .reduce((a, b) => a + b.amount, 0)
            )}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Route van operating costs</span>
        </div>
        <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-sky-800 uppercase block">Plant Utilities & Power</span>
          <span className="text-2xl font-extrabold text-sky-800">
            {formatCurrency(
              filteredExpenses
                .filter((e) => e.category === 'Electricity' || e.category === 'Repairs')
                .reduce((a, b) => a + b.amount, 0)
            )}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">RO plant electricity & filters</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voucher, description, payee..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-rose-500 focus:outline-hidden"
            >
              <option value="all">All Expense Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading expenses...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No expenses recorded.</td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-800">{exp.voucherNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(exp.date)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{exp.description}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{exp.paidTo || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 text-xs sm:text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{exp.paymentMethod}</td>
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
