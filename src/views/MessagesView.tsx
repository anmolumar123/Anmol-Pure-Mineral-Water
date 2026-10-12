import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Customer, SentMessage } from '../types';
import {
  MessageSquare,
  Send,
  Search,
} from 'lucide-react';

export const MessagesView: React.FC = () => {
  const {
    refreshTrigger,
    formatCurrency,
    formatDate,
    setActiveMessageCustomer,
  } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCustomers(), api.getMessages()])
      .then(([cList, mList]) => {
        setCustomers(cList);
        setMessages(mList);
      })
      .catch((err) => console.error('Messages fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const filteredCustomers = customers.filter((c) => {
    if (filterDueOnly && c.currentBalance <= 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Customer Messaging & WhatsApp Hub</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Dispatch monthly invoices, payment reminders, bottle return alerts directly to WhatsApp & SMS
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer by name, area, phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterDueOnly}
                onChange={(e) => setFilterDueOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Only Unpaid Dues</span>
            </label>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Bottles Held</th>
                  <th className="py-3 px-4 text-center">Send Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{c.mobile}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-cyan-800">{c.bottlesWithCustomer}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setActiveMessageCustomer(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 mx-auto cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Sent Messages</h3>
            <span className="text-xs text-slate-400">{messages.length} logs</span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No messages sent yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{m.customerName}</span>
                    <span className="text-[10px] text-emerald-700 uppercase bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      {m.channel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{m.content || m.message}</p>
                  <div className="text-[10px] text-slate-400 text-right">{formatDate(m.sentAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
