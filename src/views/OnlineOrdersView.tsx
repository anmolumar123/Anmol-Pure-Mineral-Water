import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { OnlineOrder, OnlineOrderStatus } from '../types';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  FileText,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const OnlineOrdersView: React.FC = () => {
  const {
    refreshTrigger,
    refreshAll,
    formatCurrency,
    formatDate,
    settings,
    addToast,
    setCurrentView,
    setActiveCustomerProfileId,
  } = useApp();

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [assignedDriver, setAssignedDriver] = useState<string>('Rashid Mehmood');
  const [internalNoteInput, setInternalNoteInput] = useState<string>('');
  const [driverNoteInput, setDriverNoteInput] = useState<string>('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOnlineOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to load online orders:', err);
      addToast('error', 'Error Loading Orders', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [refreshTrigger]);

  const handleUpdateStatus = async (newStatus: OnlineOrderStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.updateOnlineOrderStatus(selectedOrder.id, {
        status: newStatus,
        assignedDriverName: newStatus === 'assigned' || newStatus === 'out_for_delivery' ? assignedDriver : undefined,
        internalNotes: internalNoteInput.trim() || undefined,
        deliveryNotes: driverNoteInput.trim() || undefined,
      });
      addToast('success', 'Order Status Updated', `Order #${updated.orderNumber} is now ${newStatus.replace(/_/g, ' ').toUpperCase()}`);
      setSelectedOrder(updated);
      loadOrders();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: OnlineOrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            Confirmed
          </span>
        );
      case 'assigned':
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            {status === 'assigned' ? 'Driver Assigned' : 'Out for Delivery'}
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {status === 'rejected' ? 'Rejected' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && order.orderSource !== sourceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        order.deliveryAddress.toLowerCase().includes(q) ||
        order.deliveryArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const outCount = orders.filter((o) => o.status === 'assigned' || o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Online Customer Orders & Web Dispatch</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage customer self-service requests, assign drivers, verify address instructions, and fulfill online 19L water deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Pending Action</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">{pendingCount}</div>
          <p className="text-[11px] text-amber-700 mt-1">Requires confirmation</p>
        </div>
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span>In Delivery</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900">{outCount}</div>
          <p className="text-[11px] text-indigo-700 mt-1">Assigned to drivers</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Fulfilled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">{deliveredCount}</div>
          <p className="text-[11px] text-emerald-700 mt-1">Delivered successfully</p>
        </div>
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Delivered Value</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-900 truncate">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-sky-700 mt-1">Online sales revenue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name, mobile, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="pending">Pending ({orders.filter((o) => o.status === 'pending').length})</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Assigned</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="website">Website Portal</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone / Direct</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer & Contact</th>
                <th className="py-3 px-4">Delivery Address</th>
                <th className="py-3 px-4">Items / Qty</th>
                <th className="py-3 px-4">Schedule / Slot</th>
                <th className="py-3 px-4">Total & Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                    Loading online orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">No online orders found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try changing your search terms or filters.' : 'Orders placed via the Customer Portal will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedOrder(order);
                      setInternalNoteInput(order.internalNotes || '');
                      setDriverNoteInput('');
                    }}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                      <div className="flex items-center gap-1.5">
                        <span>{order.orderNumber}</span>
                        {order.orderSource === 'website' && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                            Web
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{order.customerName}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCustomerProfileId(order.customerId);
                          }}
                          className="text-slate-400 hover:text-sky-600 transition-colors"
                          title="View Customer Ledger"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="text-slate-800 truncate font-medium" title={order.deliveryAddress}>
                        {order.deliveryAddress}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {order.deliveryArea}, {order.deliveryCity}
                      </div>
                      {order.deliveryInstructions && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 truncate">
                          Note: {order.deliveryInstructions}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">
                        {order.totalBottles} × 19L Bottles
                      </div>
                      <div className="text-[11px] text-slate-500">
                        @{formatCurrency(order.items[0]?.unitPrice || 150)}/btl
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.preferredDate ? formatDate(order.preferredDate) : 'Today'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {order.preferredTimeSlot || 'Standard Delivery'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                        order.paymentStatus === 'paid_online'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.paymentStatus === 'paid_online' ? 'Paid Online' : 'Cash on Delivery'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status)}
                      {order.assignedDriverName && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5 text-indigo-500" />
                          <span className="truncate">{order.assignedDriverName}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setInternalNoteInput(order.internalNotes || '');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Dispatch Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      Order #{selectedOrder.orderNumber}
                    </h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Placed on {formatDate(selectedOrder.createdAt)} via {selectedOrder.orderSource.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Customer and Contact Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Customer</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{selectedOrder.customerEmail}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(null);
                      setActiveCustomerProfileId(selectedOrder.customerId);
                    }}
                    className="text-xs font-bold text-sky-600 hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    View Account Ledger <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Delivery Destination</span>
                  <div className="text-xs font-semibold text-slate-800">{selectedOrder.deliveryAddress}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedOrder.deliveryArea}, {selectedOrder.deliveryCity}</div>
                  {selectedOrder.googleMapsUrl && (
                    <a
                      href={selectedOrder.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 font-bold hover:underline inline-flex items-center gap-1 mt-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {selectedOrder.deliveryInstructions && (
                    <div className="mt-2 text-xs bg-amber-100/60 text-amber-900 p-2 rounded-xl border border-amber-200/60 font-medium">
                      Note: {selectedOrder.deliveryInstructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Products & Payment */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Order Summary</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="font-bold text-slate-900">{it.productName}</span>
                        <div className="text-xs text-slate-500">{it.quantity} units @ {formatCurrency(it.unitPrice)}</div>
                      </div>
                      <span className="font-extrabold text-slate-900">{formatCurrency(it.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="p-3.5 bg-slate-50 flex items-center justify-between text-sm font-black">
                    <span>Total Amount Payable</span>
                    <span className="text-sky-700 text-base">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Payment Mode: <strong>{selectedOrder.paymentMethod}</strong></span>
                  <span>Payment Status: <strong className="uppercase">{selectedOrder.paymentStatus}</strong></span>
                </div>
              </div>

              {/* Delivery Assignment Controls */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  Driver Assignment & Schedule
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Assign Delivery Driver</label>
                    <select
                      value={assignedDriver}
                      onChange={(e) => setAssignedDriver(e.target.value)}
                      className="w-full p-2 bg-white border border-sky-200 rounded-xl font-medium text-slate-800 focus:outline-hidden"
                    >
                      <option value="Rashid Mehmood">Rashid Mehmood (Main Delivery Van)</option>
                      <option value="Bilal Ahmed">Bilal Ahmed (Route Driver 2)</option>
                      <option value="Tariq Khan">Tariq Khan (Emergency Delivery)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Requested Slot</label>
                    <div className="p-2 bg-white border border-sky-200 rounded-xl font-medium text-slate-800">
                      {selectedOrder.preferredDate ? formatDate(selectedOrder.preferredDate) : 'Today'} - {selectedOrder.preferredTimeSlot || 'Standard'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold text-xs mb-1">Internal Dispatch Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified with customer via call; dispatch on van #2"
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action Buttons based on order lifecycle */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Update Order Lifecycle
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('confirmed')}
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Order</span>
                      </button>
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('out_for_delivery')}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Assign Driver & Dispatch</span>
                      </button>
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus('rejected')}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Order</span>
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('out_for_delivery')}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Dispatch (Out for Delivery)</span>
                    </button>
                  )}
                  {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'assigned' || selectedOrder.status === 'out_for_delivery') && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('delivered')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Delivered & Update Ledger</span>
                    </button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus('cancelled')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Linked Customer ID: <strong className="font-mono text-slate-700">{selectedOrder.customerId}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
