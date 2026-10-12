import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
  Truck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    refreshTrigger,
    formatCurrency,
    formatDate,
    addToast,
    setActiveCustomerProfileId,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | 'all_summary'
    | 'pnl'
    | 'sales'
    | 'collections'
    | 'expenses'
    | 'receivables'
    | 'bottles'
    | 'daily_audit'
  >('all_summary');

  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [refills, setRefills] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [datePreset, setDatePreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [subSearch, setSubSearch] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSales(),
      api.getExpenses(),
      api.getPurchases(),
      api.getPayments(),
      api.getCustomers(),
      api.getRefillBatches(),
      api.getDeliveries(),
    ])
      .then(([s, e, p, pay, c, ref, del]) => {
        setSales(s || []);
        setExpenses(e || []);
        setPurchases(p || []);
        setPayments(pay || []);
        setCustomers(c || []);
        setRefills(ref || []);
        setDeliveries(del || []);
      })
      .catch((err) => console.error('Reports fetch error:', err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const handleApplyPreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today.getTime() - 86400000);
      setStartDate(y.toISOString().split('T')[0]);
      setEndDate(y.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const inSelectedRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  const periodSales = useMemo(() => sales.filter((s) => s.status !== 'cancelled' && inSelectedRange(s.date)), [sales, startDate, endDate]);
  const periodPayments = useMemo(() => payments.filter((p) => inSelectedRange(p.date)), [payments, startDate, endDate]);
  const periodExpenses = useMemo(() => expenses.filter((e) => inSelectedRange(e.date)), [expenses, startDate, endDate]);
  const periodPurchases = useMemo(() => purchases.filter((p) => inSelectedRange(p.date)), [purchases, startDate, endDate]);
  const periodRefills = useMemo(() => refills.filter((r) => r.status === 'completed' && inSelectedRange(r.date)), [refills, startDate, endDate]);
  const periodDeliveries = useMemo(() => deliveries.filter((d) => inSelectedRange(d.date)), [deliveries, startDate, endDate]);

  const totalSalesRevenue = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalBottlesSold = periodSales.reduce((acc, s) => acc + (s.quantity || 0), 0);
  const totalCollections = periodPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPurchases = periodPurchases.reduce((acc, p) => acc + p.total, 0);
  const netEstimatedProfit = totalSalesRevenue - totalExpenses - totalPurchases;

  const totalReceivables = customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance || 0), 0);
  const totalCustomerBottles = customers.reduce((acc, c) => acc + (c.bottlesWithCustomer || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-6 h-6 text-sky-600 shrink-0" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Custom Date & Period Reports Generator</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Check any time, any day, weekly, or monthly reports with customized Date-to-Date accounting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
          >
            <Printer className="w-4 h-4 inline mr-1" /> Print Report
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-sky-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 no-print">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Date Range Filter</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['today', 'yesterday', 'this_month', 'all'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleApplyPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                datePreset === preset ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {preset.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-800">Sales Revenue</span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 block mt-1">
            {formatCurrency(totalSalesRevenue)}
          </span>
          <span className="text-xs text-slate-500">{totalBottlesSold} Bottles</span>
        </div>
        <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-sky-800">Collections</span>
          <span className="text-xl sm:text-2xl font-extrabold text-sky-700 block mt-1">
            {formatCurrency(totalCollections)}
          </span>
          <span className="text-xs text-slate-500">{periodPayments.length} Receipts</span>
        </div>
        <div className="p-4 bg-white border border-rose-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-rose-800">Expenses</span>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-600 block mt-1">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="text-xs text-slate-500">{periodExpenses.length} Vouchers</span>
        </div>
        <div className="p-4 bg-white border border-indigo-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase text-indigo-800">Net Profit</span>
          <span className={`text-xl sm:text-2xl font-black block mt-1 ${netEstimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(netEstimatedProfit)}
          </span>
          <span className="text-xs text-slate-500">Sales - Costs</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Period Summary Statement</h3>
        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          <div className="py-2.5 flex justify-between">
            <span>Gross Sales Revenue ({periodSales.length} Invoices)</span>
            <span className="font-bold text-emerald-700">{formatCurrency(totalSalesRevenue)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span>Operating Expenses Incurred</span>
            <span className="font-bold text-rose-700">({formatCurrency(totalExpenses)})</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span>Consumables & Stock Purchases</span>
            <span className="font-bold text-indigo-700">({formatCurrency(totalPurchases)})</span>
          </div>
          <div className="py-3 flex justify-between font-black text-base border-t-2">
            <span>Estimated Net Profit</span>
            <span className={netEstimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {formatCurrency(netEstimatedProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
