import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RefillBatch, InventoryItem } from '../types';
import {
  Repeat,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export const RefillingView: React.FC = () => {
  const {
    refreshTrigger,
    formatDate,
    setQuickModal,
  } = useApp();

  const [batches, setBatches] = useState<RefillBatch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getRefillBatches(), api.getInventory()])
      .then(([bList, invList]) => {
        setBatches(bList);
        setInventory(invList);
      })
      .catch((err) => console.error('Refilling fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const filledStock = inventory.find((i) => i.category === 'filled_bottles')?.currentStock || 0;
  const emptyStock = inventory.find((i) => i.category === 'empty_bottles')?.currentStock || 0;
  const totalProduced = batches.reduce((acc, b) => acc + (b.status === 'completed' ? b.filledBottlesProduced : 0), 0);
  const totalDamaged = batches.reduce((acc, b) => acc + (b.damagedBottles || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-6 h-6 text-cyan-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Water Plant Refilling & Production</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Plant batch logs, bottle washing & sanitization, RO filtration logs, and filled bottle stock replenishment
          </p>
        </div>
        <button
          onClick={() => setQuickModal('refill')}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Production Run</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-cyan-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-cyan-800 uppercase block">Total Produced</span>
          <span className="text-xl sm:text-2xl font-bold text-cyan-900">{totalProduced} Bottles</span>
          <span className="text-[11px] text-cyan-600 block mt-0.5">{batches.length} Production Batches</span>
        </div>
        <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-sky-800 uppercase block">Current Filled Stock</span>
          <span className="text-xl sm:text-2xl font-bold text-sky-600">{filledStock} Bottles</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Ready in storage warehouse</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Empty Stock in Plant</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800">{emptyStock} Bottles</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Available for next run</span>
        </div>
        <div className="p-4 bg-white border border-rose-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-rose-800 uppercase block">Scrapped / Damaged</span>
          <span className="text-xl sm:text-2xl font-bold text-rose-600">{totalDamaged} Bottles</span>
          <span className="text-[11px] text-rose-600 block mt-0.5">Defective / cracked write-off</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-sky-900 to-cyan-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Plant Water Quality Assurance</h4>
            <p className="text-xs text-sky-200">
              Multi-stage Reverse Osmosis, 5-Micron Sediment Filter, Carbon Filter & UV Disinfection Active.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 bg-white/10 rounded-lg">Target TDS: <strong>40-60 ppm</strong></span>
          <span className="px-3 py-1 bg-white/10 rounded-lg">Target pH: <strong>7.2 - 7.5</strong></span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Plant Production Batch Records</h3>
          <span className="text-xs text-slate-500">{batches.length} Production entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-center">Empty Consumed</th>
                <th className="py-3 px-4 text-center">Filled Produced</th>
                <th className="py-3 px-4 text-center">Damaged / Scrapped</th>
                <th className="py-3 px-4">Operator / In-Charge</th>
                <th className="py-3 px-4">Quality Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading production batches...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No refilling batches recorded yet.</td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-cyan-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-800">{batch.refillNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(batch.date)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">{batch.emptyBottlesUsed} Pcs</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-emerald-700">+{batch.filledBottlesProduced} Pcs</td>
                    <td className="py-3.5 px-4 text-center text-rose-600 font-bold">{batch.damagedBottles || 0}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{batch.operator}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{batch.notes || '-'}</td>
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
