import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { InventoryItem, InventoryTransaction } from '../types';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    refreshTrigger,
    formatDate,
    setQuickModal,
    addToast,
    refreshAll,
  } = useApp();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Physical inventory audit count verification');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getInventory(), api.getInventoryTransactions()])
      .then(([invList, txList]) => {
        setItems(invList);
        setTransactions(txList);
      })
      .catch((err) => console.error('Inventory fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQty === 0) {
      addToast('error', 'Invalid Adjustment', 'Please enter a non-zero adjustment amount (+ or -).');
      return;
    }
    setSubmitting(true);
    try {
      await api.adjustInventory({
        itemId: adjustItem.id,
        adjustmentQty: Number(adjustQty),
        reason: adjustReason,
      });
      addToast('success', 'Stock Adjusted', `${adjustItem.name} stock updated successfully.`);
      setAdjustItem(null);
      setAdjustQty(0);
      setAdjustReason('Physical inventory audit count verification');
      loadData();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Adjustment Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = items.filter((i) => i.currentStock <= (i.minThreshold ?? i.minimumStockLevel)).length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-6 h-6 text-sky-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Inventory & Consumables Warehouse</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Live physical stock for filled bottles, plant empties, caps, neck seals, labels, and RO filters
          </p>
        </div>
        <button
          onClick={() => setQuickModal('purchase')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Purchase Stock</span>
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-rose-950">
              {lowStockCount} raw material / stock item(s) are below minimum threshold!
            </span>
          </div>
          <button
            onClick={() => setQuickModal('purchase')}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl"
          >
            Reorder Now
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'stock'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Warehouse Stock Levels ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Stock Movement Log ({transactions.length})
        </button>
      </div>

      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const minT = item.minThreshold ?? item.minimumStockLevel;
            const isLow = item.currentStock <= minT;
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isLow ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    {isLow ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Normal
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.name}</h3>
                  <div className="flex items-baseline gap-2 mt-3 mb-2">
                    <span className={`text-2xl sm:text-3xl font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.currentStock}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Min Safety Stock: <strong>{minT} {item.unit}</strong></div>
                    <div>Last Movement: {formatDate(item.lastUpdated)}</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setAdjustItem(item);
                      setAdjustQty(0);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Audit / Adjust Stock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Change Qty</th>
                  <th className="py-3 px-4 text-right">Balance Stock</th>
                  <th className="py-3 px-4">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{formatDate(tx.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{tx.itemName}</td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-700">{tx.type.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{tx.resultingStock ?? tx.newStock}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{tx.reason || tx.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-md w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">Adjust Stock: {adjustItem.name}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Stock: <strong>{adjustItem.currentStock} {adjustItem.unit}</strong>
            </p>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quantity to Add (+) or Deduct (-)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="e.g. +50 or -10"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-base font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
