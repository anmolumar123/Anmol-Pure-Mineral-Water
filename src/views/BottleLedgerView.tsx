import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Customer, InventoryItem } from '../types';
import {
  Layers,
  Search,
  Plus,
  RefreshCw,
  Package,
  Droplets,
  User,
} from 'lucide-react';

export const BottleLedgerView: React.FC = () => {
  const {
    refreshTrigger,
    formatDate,
    setActiveCustomerProfileId,
    addToast,
    refreshAll,
  } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [txType, setTxType] = useState<'delivered' | 'returned' | 'damaged_reported' | 'adjustment'>('returned');
  const [filledQty, setFilledQty] = useState<number>(0);
  const [emptyQty, setEmptyQty] = useState<number>(0);
  const [txNotes, setTxNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showQuickDialog, setShowQuickDialog] = useState<boolean>(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getCustomers(),
      api.getInventory(),
    ])
      .then(([custList, invList]) => {
        setCustomers(custList);
        setInventory(invList);
        if (custList.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custList[0].id);
        }
      })
      .catch((err) => console.error('Error loading bottle ledger data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const areas = Array.from(new Set(customers.map((c) => c.area).filter(Boolean)));

  const filteredCustomers = customers.filter((c) => {
    if (areaFilter !== 'all' && c.area !== areaFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filledInPlant = inventory.find((i) => i.category === 'filled_bottles')?.currentStock || 0;
  const emptyInPlant = inventory.find((i) => i.category === 'empty_bottles')?.currentStock || 0;
  const withCustomers = customers.reduce((sum, c) => sum + (c.bottlesWithCustomer || 0), 0);
  const totalCompanyBottles = filledInPlant + emptyInPlant + withCustomers;

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('error', 'Select Customer', 'Please select a customer.');
      return;
    }
    if (filledQty <= 0 && emptyQty <= 0) {
      addToast('error', 'Invalid Quantity', 'Please enter filled or empty bottle count.');
      return;
    }

    setSubmitting(true);
    try {
      await api.recordCustomerBottleTx(selectedCustomerId, {
        type: txType,
        filledDelivered: Number(filledQty),
        emptyReturned: Number(emptyQty),
        notes: txNotes || `Bottle ${txType} adjustment`,
      });
      addToast('success', 'Bottle Movement Logged', 'Customer bottle balance updated.');
      setShowQuickDialog(false);
      setFilledQty(0);
      setEmptyQty(0);
      setTxNotes('');
      loadData();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to record movement', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-6 h-6 text-cyan-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">19-Liter Bottle Inventory & Ledger Pool</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Total company bottle pool balance, filled stock, plant empty storage, and customer holding tracking
          </p>
        </div>
        <button
          onClick={() => setShowQuickDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Bottle Movement</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Bottle Asset Pool</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-sky-950">{totalCompanyBottles} Pcs</span>
          <span className="text-[11px] text-sky-700 block mt-0.5">All assets accounted</span>
        </div>
        <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-sky-700 uppercase">Filled Ready in Plant</span>
            <Droplets className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-sky-600">{filledInPlant} Pcs</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Production stock</span>
        </div>
        <div className="p-4 bg-white border border-cyan-100 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-cyan-700 uppercase">Empty in Plant</span>
            <Layers className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-cyan-800">{emptyInPlant} Pcs</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Ready for refilling</span>
        </div>
        <div className="p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-700 uppercase">With Customers (Market)</span>
            <User className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-700">{withCustomers} Pcs</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">In circulation</span>
        </div>
      </div>

      {showQuickDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Bottle Transaction</h3>
              <button onClick={() => setShowQuickDialog(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) - Currently Holding: {c.bottlesWithCustomer} Bottles
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Movement Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <option value="returned">Customer Returned Empty Bottles (-)</option>
                  <option value="delivered">Delivered Filled Bottles to Customer (+)</option>
                  <option value="damaged_reported">Damaged / Broken Bottle Write-off</option>
                  <option value="adjustment">Manual Count Adjustment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivered (+)</label>
                  <input
                    type="number"
                    min="0"
                    value={filledQty}
                    onChange={(e) => setFilledQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Returned (-)</label>
                  <input
                    type="number"
                    min="0"
                    value={emptyQty}
                    onChange={(e) => setEmptyQty(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="e.g. Returned by driver"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickDialog(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter customer bottle holding..."
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium w-64"
            />
          </div>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="all">All Delivery Routes / Sectors</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Area & Route</th>
                <th className="py-3 px-4 text-center">Bottles Held</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div
                      onClick={() => setActiveCustomerProfileId(c.id)}
                      className="font-bold text-slate-900 hover:text-sky-700 cursor-pointer"
                    >
                      {c.name}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{c.id}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 font-medium">{c.area}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-900 font-extrabold text-xs sm:text-sm rounded-full">
                      {c.bottlesWithCustomer} Pcs
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setActiveCustomerProfileId(c.id)}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      View Bottle Ledger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
