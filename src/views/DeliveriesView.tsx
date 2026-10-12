import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DeliveryRecord } from '../types';
import {
  Truck,
  Search,
  Plus,
  MapPin,
} from 'lucide-react';

export const DeliveriesView: React.FC = () => {
  const {
    refreshTrigger,
    formatCurrency,
    formatDate,
    setQuickModal,
    addToast,
    refreshAll,
  } = useApp();

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const [activeDelivForAction, setActiveDelivForAction] = useState<DeliveryRecord | null>(null);
  const [markEmptyReceived, setMarkEmptyReceived] = useState<number>(0);
  const [markPaid, setMarkPaid] = useState<number>(0);
  const [markMethod, setMarkMethod] = useState<string>('Cash');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    api.getDeliveries()
      .then((data) => setDeliveries(data))
      .catch((err) => console.error('Deliveries fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const areas = Array.from(new Set(deliveries.map((d) => d.area).filter(Boolean)));

  const filteredDeliveries = deliveries.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (selectedArea !== 'all' && d.area !== selectedArea) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.deliveryNumber.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.deliveryPerson.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCompleteDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDelivForAction) return;
    setSubmitting(true);
    try {
      await api.updateDeliveryStatus(activeDelivForAction.id, {
        status: 'delivered',
        emptyReceived: Number(markEmptyReceived),
        paid: Number(markPaid),
        paymentMethod: markMethod,
      });
      addToast('success', 'Delivery Completed', `Order ${activeDelivForAction.deliveryNumber} marked delivered.`);
      setActiveDelivForAction(null);
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to complete delivery', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = deliveries.filter((d) => d.status === 'pending').length;
  const outForDeliveryCount = deliveries.filter((d) => d.status === 'out_for_delivery').length;
  const completedCount = deliveries.filter((d) => d.status === 'delivered').length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Delivery Routes & Van Dispatch</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time delivery fulfillment, driver tracking, empty bottle collection, and cash on delivery
          </p>
        </div>
        <button
          onClick={() => setQuickModal('delivery')}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Dispatch New Delivery</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Total Orders</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{deliveries.length}</span>
        </div>
        <div className="p-4 bg-white border border-amber-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-amber-800 uppercase block">Out on Van / Route</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-600">{outForDeliveryCount}</span>
        </div>
        <div className="p-4 bg-white border border-sky-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-sky-800 uppercase block">Pending Scheduled</span>
          <span className="text-xl sm:text-2xl font-bold text-sky-700">{pendingCount}</span>
        </div>
        <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 uppercase block">Completed Today</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700">{completedCount}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, driver, address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-500 focus:outline-hidden"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="pending">Pending</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
            >
              <option value="all">All Delivery Routes / Sectors</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
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
                <th className="py-3 px-4">Delivery #</th>
                <th className="py-3 px-4">Customer & Destination</th>
                <th className="py-3 px-4 text-center">Bottles (Filled / Empty)</th>
                <th className="py-3 px-4 text-right">Amount / Paid</th>
                <th className="py-3 px-4">Driver / Person</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading delivery routes...</td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No deliveries scheduled matching filters.</td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-amber-800 block">{del.deliveryNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDate(del.date)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{del.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-xs">{del.address}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-sky-700 block">+{del.filledDelivered} Filled</span>
                      <span className="text-[11px] font-bold text-emerald-700">-{del.emptyReceived} Empty</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 block">{formatCurrency(del.total)}</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Paid: {formatCurrency(del.paid)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 text-xs block">{del.deliveryPerson}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          del.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : del.status === 'out_for_delivery'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : del.status === 'pending'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {del.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {del.status !== 'delivered' && del.status !== 'cancelled' ? (
                        <button
                          onClick={() => {
                            setActiveDelivForAction(del);
                            setMarkEmptyReceived(del.filledDelivered);
                            setMarkPaid(del.total);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Mark Delivered
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeDelivForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-md w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Complete Delivery: {activeDelivForAction.deliveryNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{activeDelivForAction.customerName}</p>
            <form onSubmit={handleCompleteDeliverySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Empty Bottles Collected
                </label>
                <input
                  type="number"
                  min="0"
                  value={markEmptyReceived}
                  onChange={(e) => setMarkEmptyReceived(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cash Collected on Delivery
                </label>
                <input
                  type="number"
                  min="0"
                  value={markPaid}
                  onChange={(e) => setMarkPaid(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-emerald-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveDelivForAction(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
