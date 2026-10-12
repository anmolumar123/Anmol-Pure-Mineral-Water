import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Customer, CustomerType } from '../types';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Layers,
  DollarSign,
  MessageSquare,
  FileText,
  CreditCard,
  Trash2,
  Edit2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { CustomerProfileModal } from '../components/modals/CustomerProfileModal';

export const CustomersView: React.FC = () => {
  const {
    refreshTrigger,
    formatCurrency,
    formatDate,
    currentUser,
    isAdmin,
    setQuickModal,
    setActiveCustomerProfileId,
    activeCustomerProfileId,
    setActiveMessageCustomer,
    addToast,
    refreshAll,
  } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'bottles'>('name');

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [priceEditCustomer, setPriceEditCustomer] = useState<Customer | null>(null);
  const [newCustomerRate, setNewCustomerRate] = useState<number>(150);
  const [savingPrice, setSavingPrice] = useState<boolean>(false);

  const [showBulkPriceModal, setShowBulkPriceModal] = useState<boolean>(false);
  const [bulkTargetArea, setBulkTargetArea] = useState<string>('all');
  const [bulkTargetType, setBulkTargetType] = useState<string>('all');
  const [bulkMode, setBulkMode] = useState<'set_fixed' | 'adjust_diff'>('set_fixed');
  const [bulkFixedRate, setBulkFixedRate] = useState<number>(160);
  const [bulkAdjustDiff, setBulkAdjustDiff] = useState<number>(10);
  const [submittingBulk, setSubmittingBulk] = useState<boolean>(false);

  const loadCustomers = () => {
    setLoading(true);
    api.getCustomers()
      .then((data) => setCustomers(data))
      .catch((err) => console.error('Customers fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [refreshTrigger]);

  const areas = Array.from(new Set(customers.map((c) => c.area).filter(Boolean)));

  const filteredCustomers = customers
    .filter((c) => {
      if (selectedType !== 'all' && c.customerType !== selectedType) return false;
      if (selectedArea !== 'all' && c.area !== selectedArea) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (c.name || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q) ||
          (c.mobile || '').includes(q) ||
          (c.area || '').toLowerCase().includes(q) ||
          (c.address || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'balance') return (b.currentBalance || 0) - (a.currentBalance || 0);
      if (sortBy === 'bottles') return (b.bottlesWithCustomer || 0) - (a.bottlesWithCustomer || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const totalOutstanding = filteredCustomers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const totalBottlesInCirculation = filteredCustomers.reduce((sum, c) => sum + (c.bottlesWithCustomer || 0), 0);

  const handleSaveCustomerPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceEditCustomer) return;
    setSavingPrice(true);
    try {
      await api.updateCustomer(priceEditCustomer.id, {
        ratePerBottle: Number(newCustomerRate),
      });
      addToast('success', 'Price Updated', `Bottle rate for ${priceEditCustomer.name} set to ${formatCurrency(newCustomerRate)}/btl.`);
      setPriceEditCustomer(null);
      loadCustomers();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to update price', err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  const handleBulkPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBulk(true);
    try {
      const payload: any = {
        area: bulkTargetArea,
        customerType: bulkTargetType,
      };
      if (bulkMode === 'set_fixed') {
        payload.newRate = Number(bulkFixedRate);
      } else {
        payload.adjustAmount = Number(bulkAdjustDiff);
      }
      const res = await api.bulkUpdateCustomerRates(payload);
      addToast('success', 'Bulk Price Update Complete', `Successfully updated rates for ${res.count} customers.`);
      setShowBulkPriceModal(false);
      loadCustomers();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Bulk Price Update Failed', err.message);
    } finally {
      setSubmittingBulk(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await api.deleteCustomer(customerToDelete.id);
      addToast('success', 'Customer Deleted', `Customer ${customerToDelete.name} (${customerToDelete.id}) removed from system.`);
      setCustomerToDelete(null);
      loadCustomers();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to delete customer', err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-sky-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Customer Accounts & Bottle Records</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time balance, bottle holding ledger, price rate settings, and customer directory
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowBulkPriceModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Bulk Price Change</span>
            </button>
          )}
          <button
            onClick={() => setQuickModal('customer')}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-sky-100 rounded-2xl">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Total Customers</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900">{filteredCustomers.length}</span>
        </div>
        <div className="p-4 bg-white border border-amber-100 rounded-2xl">
          <span className="text-xs font-semibold text-amber-800 uppercase block">Total Outstanding Dues</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</span>
        </div>
        <div className="p-4 bg-white border border-cyan-100 rounded-2xl">
          <span className="text-xs font-semibold text-cyan-800 uppercase block">Bottles with Customers</span>
          <span className="text-xl sm:text-2xl font-bold text-cyan-900">{totalBottlesInCirculation} Pcs</span>
        </div>
        <div className="p-4 bg-white border border-emerald-100 rounded-2xl">
          <span className="text-xs font-semibold text-emerald-800 uppercase block">Security Deposits</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700">
            {formatCurrency(filteredCustomers.reduce((acc, c) => acc + (c.securityDeposit || 0), 0))}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, phone, area..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
            >
              <option value="all">All Areas ({areas.length})</option>
              {areas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium capitalize"
            >
              <option value="all">All Account Types</option>
              <option value="regular">Regular</option>
              <option value="monthly">Monthly Contract</option>
              <option value="commercial">Commercial / Corporate</option>
              <option value="retail">Retail Shop</option>
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
            >
              <option value="name">Sort by Customer Name</option>
              <option value="balance">Sort by Highest Dues</option>
              <option value="bottles">Sort by Most Bottles Held</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Area / Location</th>
                <th className="py-3 px-4 text-center">Bottles Held</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Rate / Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {(customer.name || 'CU').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => setActiveCustomerProfileId(customer.id)}
                              className="font-bold text-slate-900 hover:text-sky-700 cursor-pointer text-xs sm:text-sm"
                            >
                              {customer.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                              {customer.customerType}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-400">{customer.id}</span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400" /> {customer.mobile}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 text-xs block">{customer.area}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{customer.address}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 font-extrabold text-xs">
                        <Layers className="w-3 h-3 text-cyan-600" />
                        {customer.bottlesWithCustomer || 0} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className={`text-xs sm:text-sm font-extrabold ${customer.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(customer.currentBalance || 0)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(customer.ratePerBottle || 150)} <span className="text-[10px] text-slate-500 font-normal">/btl</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveCustomerProfileId(customer.id)}
                          title="Open Customer Statement & Ledger"
                          className="p-1.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveMessageCustomer(customer)}
                          title="Send WhatsApp Reminder / Bill"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setQuickModal('payment')}
                          title="Receive Payment"
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            title="Delete Customer Account"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {activeCustomerProfileId && (
        <CustomerProfileModal
          customerId={activeCustomerProfileId}
          onClose={() => setActiveCustomerProfileId(null)}
        />
      )}
    </div>
  );
};
