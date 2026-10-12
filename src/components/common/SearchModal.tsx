import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Customer, Sale, Payment, InventoryItem } from '../../types';
import { Search, X, Users, ShoppingCart, Receipt, Package, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  onClose?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const {
    setActiveCustomerProfileId,
    setActiveInvoiceData,
    setActiveReceiptData,
    setCurrentView,
  } = useApp();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    inventory: InventoryItem[];
  }>({
    customers: [],
    sales: [],
    payments: [],
    inventory: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ customers: [], sales: [], payments: [], inventory: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchGlobal(q);
        setResults({
          customers: res.customers || [],
          sales: res.sales || [],
          payments: res.payments || [],
          inventory: res.inventory || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults =
    results.customers.length +
    results.sales.length +
    results.payments.length +
    results.inventory.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, invoice #, receipt #, stock items..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              ESC
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Type to search across customers, invoices, payment receipts, and plant inventory...
            </div>
          )}

          {loading && (
            <div className="py-8 text-center text-slate-400 text-xs">Searching records...</div>
          )}

          {!loading && query.trim() && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          )}

          {!loading && results.customers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Customers ({results.customers.length})
              </p>
              <div className="space-y-1.5">
                {results.customers.slice(0, 5).map((c: Customer) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveCustomerProfileId(c.id);
                      if (onClose) onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.area || 'Karachi'} • {c.mobile || c.whatsapp || 'No contact'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div className="text-[11px]">
                        <span className="text-slate-400">Due:</span>{' '}
                        <strong className="text-slate-800">Rs. {Number(c.currentBalance || 0).toLocaleString()}</strong>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.sales.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                Sales Invoices ({results.sales.length})
              </p>
              <div className="space-y-1.5">
                {results.sales.slice(0, 5).map((s: Sale) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveInvoiceData(s);
                      if (onClose) onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {s.invoiceNumber} - {s.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {s.date} • {s.quantity} Bottles Delivered
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold text-emerald-800">
                      Rs. {s.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.payments.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-cyan-500" />
                Payments ({results.payments.length})
              </p>
              <div className="space-y-1.5">
                {results.payments.slice(0, 5).map((p: Payment) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveReceiptData(p);
                      if (onClose) onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-cyan-50/70 border border-transparent hover:border-cyan-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {p.receiptNumber} - {p.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {p.date} • Method: {p.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold text-cyan-800">
                      Rs. {p.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.inventory.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                Inventory Items ({results.inventory.length})
              </p>
              <div className="space-y-1.5">
                {results.inventory.slice(0, 5).map((inv: InventoryItem) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setCurrentView('inventory');
                      if (onClose) onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{inv.name}</p>
                      <p className="text-[11px] text-slate-500">Category: {inv.category}</p>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-800">
                      {inv.currentStock} {inv.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
