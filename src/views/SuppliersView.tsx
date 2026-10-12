import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Supplier, SupplierTransaction, Purchase } from '../types';
import {
  Briefcase,
  Search,
  Plus,
  Phone,
  FileText,
  Trash2,
  Edit2,
  Truck,
  X,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const {
    refreshTrigger,
    formatCurrency,
    formatDate,
    isAdmin,
    addToast,
    refreshAll,
  } = useApp();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [productSupplied, setProductSupplied] = useState<string>('Empty 19-Liter PC Bottles');
  const [unitRate, setUnitRate] = useState<number>(450);
  const [address, setAddress] = useState<string>('');

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editContact, setEditContact] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editProduct, setEditProduct] = useState<string>('');
  const [editUnitRate, setEditUnitRate] = useState<number>(0);
  const [editAddress, setEditAddress] = useState<string>('');
  const [editBalancePayable, setEditBalancePayable] = useState<number>(0);

  const [paySupplierModal, setPaySupplierModal] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('Bank Transfer');
  const [payRef, setPayRef] = useState<string>('');

  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([]);

  const loadData = () => {
    setLoading(true);
    api.getSuppliers()
      .then((data) => setSuppliers(data))
      .catch((err) => console.error('Suppliers fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      addToast('error', 'Validation Error', 'Enter supplier name and phone number.');
      return;
    }
    try {
      await api.createSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        mobile: phone.trim(),
        productSupplied: productSupplied.trim(),
        unitRate: Number(unitRate) || undefined,
        address: address.trim(),
        balancePayable: 0,
      } as any);
      addToast('success', 'Supplier Added', `${name} registered successfully.`);
      setShowAddModal(false);
      setName('');
      setPhone('');
      loadData();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to add supplier', err.message);
    }
  };

  const handleSaveSupplierEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      await api.updateSupplier(editingSupplier.id, {
        name: editName.trim(),
        contactPerson: editContact.trim(),
        mobile: editPhone.trim(),
        productSupplied: editProduct.trim(),
        unitRate: Number(editUnitRate) || 0,
        address: editAddress.trim(),
        balancePayable: Number(editBalancePayable) || 0,
      });
      addToast('success', 'Supplier Updated', `${editName} updated successfully.`);
      setEditingSupplier(null);
      loadData();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to update supplier', err.message);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.deleteSupplier(id);
      addToast('success', 'Supplier Deleted', 'Supplier removed.');
      loadData();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Failed to delete supplier', err.message);
    }
  };

  const handlePaySupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierModal || payAmount <= 0) return;
    try {
      await api.paySupplier(paySupplierModal.id, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef,
      });
      addToast('success', 'Payment Recorded', `Paid ${formatCurrency(payAmount)} to ${paySupplierModal.name}.`);
      setPaySupplierModal(null);
      setPayAmount(0);
      loadData();
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Payment Failed', err.message);
    }
  };

  const openSupplierLedger = (sup: Supplier) => {
    setSelectedSupplierForLedger(sup);
    api.getSupplierById(sup.id)
      .then((res) => setSupplierTransactions(res.transactions || []))
      .catch(() => {});
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.productSupplied.toLowerCase().includes(q) ||
        s.mobile.includes(q)
      );
    }
    return true;
  });

  const totalPayable = filteredSuppliers.reduce((sum, s) => sum + (s.balancePayable || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Suppliers & Vendor Accounts</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Vendor price management, raw materials directory, bottle/caps purchase ledgers
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-indigo-800 uppercase block">Total Suppliers</span>
          <span className="text-2xl font-extrabold text-slate-900">{filteredSuppliers.length}</span>
        </div>
        <div className="p-4 bg-white border border-rose-100 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-rose-800 uppercase block">Total Balance Payable</span>
          <span className="text-2xl font-extrabold text-rose-600">{formatCurrency(totalPayable)}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, phone, materials..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Product Supplied</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Payable Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading suppliers...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No suppliers registered.</td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sup.name}</td>
                    <td className="py-3.5 px-4">{sup.productSupplied}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-700">
                      {sup.unitRate ? formatCurrency(sup.unitRate) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{sup.mobile}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                      {formatCurrency(sup.balancePayable || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setPaySupplierModal(sup);
                            setPayAmount(sup.balancePayable || 0);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => openSupplierLedger(sup)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border max-w-md w-full">
            <h3 className="font-bold text-base mb-3">Add Supplier</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Product Supplied</label>
                <input
                  type="text"
                  value={productSupplied}
                  onChange={(e) => setProductSupplied(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paySupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border max-w-md w-full">
            <h3 className="font-bold text-base mb-3">Pay Supplier: {paySupplierModal.name}</h3>
            <form onSubmit={handlePaySupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Amount (Rs) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-semibold"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaySupplierModal(null)}
                  className="px-3 py-1.5 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSupplierForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <h3 className="font-bold text-sm">Supplier Ledger: {selectedSupplierForLedger.name}</h3>
              <button onClick={() => setSelectedSupplierForLedger(null)}>✕</button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2 text-right">Debit</th>
                  <th className="py-2 px-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {supplierTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 px-2 font-mono">{formatDate(tx.date)}</td>
                    <td className="py-2 px-2 capitalize">{tx.type}</td>
                    <td className="py-2 px-2">{tx.description}</td>
                    <td className="py-2 px-2 text-right font-bold">{tx.debit ? formatCurrency(tx.debit) : '-'}</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-700">{tx.credit ? formatCurrency(tx.credit) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
