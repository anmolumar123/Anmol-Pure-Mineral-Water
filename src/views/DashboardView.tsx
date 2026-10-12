import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardStats, Customer, Sale, OnlineOrder } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { QuickActions } from '../components/common/QuickActions';
import {
  Package,
  Layers,
  Repeat,
  DollarSign,
  Users,
  ShoppingBag,
} from 'lucide-react';


export const DashboardView: React.FC = () => {
  const {
    setCurrentView,
    setActiveCustomerProfileId,
    setActiveInvoiceData,
    setQuickModal,
    refreshTrigger,
  } = useApp();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, custList, salesList, ordersList] = await Promise.all([
        api.getDashboardStats(),
        api.getCustomers().catch(() => []),
        api.getSales().catch(() => []),
        api.getOnlineOrders().catch(() => []),
      ]);
      setStats(statsData);
      setCustomers(custList);
      setSales(salesList);
      setOnlineOrders(ordersList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { day: 'Mon', sales: 4800, bottles: 48 },
    { day: 'Tue', sales: 6200, bottles: 62 },
    { day: 'Wed', sales: 5500, bottles: 55 },
    { day: 'Thu', sales: 7100, bottles: 71 },
    { day: 'Fri', sales: 8400, bottles: 84 },
    { day: 'Sat', sales: 9200, bottles: 92 },
    { day: 'Sun', sales: 6900, bottles: 69 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick operational shortcuts */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Plant Operations & Distribution
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time tracking of 19L water stocks, route deliveries, and bottle balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickModal('sale')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>+ New Sale</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Filled 19L in Stock"
          value={stats?.filledBottlesStock ?? 320}
          subtitle="Ready for dispatch"
          icon={Package}
          colorScheme="blue"
          badge="In Plant"
          badgeType="positive"
          onClick={() => setCurrentView('inventory')}
        />

        <MetricCard
          title="Empty Bottles at Plant"
          value={stats?.emptyBottlesStock ?? 145}
          subtitle="Awaiting washing & refill"
          icon={Repeat}
          colorScheme="cyan"
          badge="Refill Queue"
          badgeType="neutral"
          onClick={() => setCurrentView('refilling')}
        />

        <MetricCard
          title="Bottles in Circulation"
          value={stats?.bottlesWithCustomers ?? 850}
          subtitle="Across active customers"
          icon={Layers}
          colorScheme="indigo"
          badge="With Clients"
          badgeType="positive"
          onClick={() => setCurrentView('bottle_ledger')}
        />

        <MetricCard
          title="Today's Sales Revenue"
          value={`Rs. ${(stats?.todaySalesAmount ?? 14200).toLocaleString()}`}
          subtitle={`Collected: Rs. ${(stats?.todayCollection ?? 12500).toLocaleString()}`}
          icon={DollarSign}
          colorScheme="emerald"
          badge="+12% vs avg"
          badgeType="positive"
          onClick={() => setCurrentView('sales')}
        />
      </div>

      {/* Secondary Quick Operation Row */}
      <QuickActions />

      {/* Middle Grid: Production / Sales Trend + Pending Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Delivery Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">7-Day Sales & Dispatch Trend</h2>
              <p className="text-xs text-slate-500">PKR sales revenue and total 19L bottles delivered</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Weekly Report
            </span>
          </div>

          <div className="h-64 w-full relative flex flex-col justify-end">
            {hoveredIndex !== null && (
              <div
                className="absolute top-2 right-2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg pointer-events-none transition-all flex items-center gap-3 z-10"
              >
                <div>
                  <span className="font-bold text-blue-400">{chartData[hoveredIndex].day}</span>
                  <span className="ml-2 font-mono font-semibold">Rs. {chartData[hoveredIndex].sales.toLocaleString()}</span>
                </div>
                <div className="border-l border-slate-700 pl-2 text-slate-300">
                  {chartData[hoveredIndex].bottles} bottles
                </div>
              </div>
            )}
            <div className="w-full h-full">
              <svg viewBox="0 0 560 210" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid horizontal lines */}
                {[0, 2500, 5000, 7500, 10000].map((val) => {
                  const y = 175 - (val / 10000) * 145;
                  return (
                    <g key={val}>
                      <line x1="45" y1={y} x2="550" y2={y} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                      <text x="38" y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" className="font-mono">
                        {val === 0 ? '0' : `${val / 1000}k`}
                      </text>
                    </g>
                  );
                })}

                {/* SVG Area polygon */}
                {(() => {
                  const points = chartData.map((d, i) => {
                    const x = 50 + (i / (chartData.length - 1)) * 490;
                    const y = 175 - (d.sales / 10000) * 145;
                    return { x, y };
                  });
                  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const areaD = `${pathD} L ${points[points.length - 1].x} 175 L ${points[0].x} 175 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#salesGradient)" />
                      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredIndex === i ? 6 : 4}
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            className="transition-all"
                          />
                          <text
                            x={p.x}
                            y="198"
                            textAnchor="middle"
                            fontSize="11"
                            fill={hoveredIndex === i ? '#1e293b' : '#64748b'}
                            fontWeight={hoveredIndex === i ? '700' : '500'}
                          >
                            {chartData[i].day}
                          </text>
                          {/* Hover hit target */}
                          <rect
                            x={p.x - 30}
                            y="10"
                            width="60"
                            height="195"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Customer Balances & Quick Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Pending Online Orders</h2>
            <button
              onClick={() => setCurrentView('online_orders')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {onlineOrders.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No new online orders.</div>
            ) : (
              onlineOrders.slice(0, 4).map((order: OnlineOrder) => (
                <div
                  key={order.id}
                  onClick={() => setCurrentView('online_orders')}
                  className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{order.customerName}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {order.totalBottles} Bottles • {order.deliveryArea}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">Rs. {order.totalAmount}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setQuickModal('customer')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Register New Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales & Outstanding Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Sales & Dispatches</h2>
              <p className="text-xs text-slate-500">Latest deliveries from the plant</p>
            </div>
            <button
              onClick={() => setCurrentView('sales')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View Sales
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {sales.slice(0, 5).map((sale: Sale) => (
              <div
                key={sale.id}
                onClick={() => setActiveInvoiceData(sale)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{sale.invoiceNumber}</span>
                    <span className="font-semibold text-slate-700">{sale.customerName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sale.quantity} Filled • {sale.emptyBottlesReceived} Returned • {sale.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">Rs. {sale.total.toLocaleString()}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sale.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sale.paymentStatus === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {sale.paymentStatus?.toUpperCase() || 'UNPAID'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Outstanding Customer Receivables */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Receivables & Bottle Balance</h2>
              <p className="text-xs text-slate-500">Customers with pending dues and bottles held</p>
            </div>
            <button
              onClick={() => setCurrentView('bottle_ledger')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Bottle Ledger
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {customers
              .slice()
              .sort((a: Customer, b: Customer) => (b.currentBalance || 0) - (a.currentBalance || 0))
              .slice(0, 5)
              .map((c: Customer) => (
                <div
                  key={c.id}
                  onClick={() => setActiveCustomerProfileId(c.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {c.area || 'Karachi'} • Holding: <strong className="text-blue-600">{c.bottlesWithCustomer || 0}</strong> bottles
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-black ${
                        (c.currentBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      Rs. {Number(c.currentBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">Due Balance</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
