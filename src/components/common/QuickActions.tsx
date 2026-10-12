import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  ShoppingCart,
  Receipt,
  Truck,
  Repeat,
  Wallet,
  ShoppingBag,
  Banknote,
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const { setQuickModal, setPortalMode, setCurrentView } = useApp();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Operational Quick Actions</h2>
          <p className="text-xs text-slate-500">Instant shortcuts for frequent factory & sales operations</p>
        </div>
        <button
          onClick={() => {
            setPortalMode('customer');
            setCurrentView('customer_portal');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Switch to Customer Web Store</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setQuickModal('customer')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 hover:text-blue-700 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-2">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 text-center leading-tight">
            Add Customer
          </span>
        </button>

        <button
          onClick={() => setQuickModal('sale')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/70 hover:border-emerald-200 hover:text-emerald-700 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-2">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 text-center leading-tight">
            New Sale
          </span>
        </button>

        <button
          onClick={() => setQuickModal('payment')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-cyan-50/70 hover:border-cyan-200 hover:text-cyan-700 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform mb-2">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-cyan-700 text-center leading-tight">
            Receive Payment
          </span>
        </button>

        <button
          onClick={() => setQuickModal('delivery')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-indigo-50/70 hover:border-indigo-200 hover:text-indigo-700 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-2">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 text-center leading-tight">
            Log Delivery
          </span>
        </button>

        <button
          onClick={() => setQuickModal('refill')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-teal-50/70 hover:border-teal-200 hover:text-teal-700 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform mb-2">
            <Repeat className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-teal-700 text-center leading-tight">
            Refill Batch
          </span>
        </button>

        <button
          onClick={() => setQuickModal('expense')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-rose-50/70 hover:border-rose-200 hover:text-rose-700 transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform mb-2">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-rose-700 text-center leading-tight">
            Add Expense
          </span>
        </button>

        <button
          onClick={() => setQuickModal('purchase')}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-amber-50/70 hover:border-amber-200 hover:text-amber-700 transition-all group cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform mb-2">
            <Banknote className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-amber-700 text-center leading-tight">
            New Purchase
          </span>
        </button>
      </div>
    </div>
  );
};
