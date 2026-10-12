import React from 'react';
import { useApp, ActiveView } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Layers,
  ShoppingCart,
  Truck,
  Repeat,
  Package,
  Receipt,
  Briefcase,
  ShoppingBag,
  Wallet,
  FileText,
  MessageSquare,
  ShieldCheck,
  Settings,
  Droplets,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    currentView,
    setCurrentView,
    settings,
    pendingOnlineOrdersCount,
    setPortalMode,
  } = useApp();

  const navItems: { category: string; items: NavItem[] }[] = [
    {
      category: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'online_orders', label: 'Online Orders', icon: ShoppingBag, badge: pendingOnlineOrdersCount },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'bottle_ledger', label: '19L Bottle Ledger', icon: Layers },
      ],
    },
    {
      category: 'Sales & Plant',
      items: [
        { id: 'sales', label: 'Sales & Invoices', icon: ShoppingCart },
        { id: 'payments', label: 'Payments', icon: Receipt },
        { id: 'deliveries', label: 'Delivery Routes', icon: Truck },
        { id: 'refilling', label: 'Plant Refilling', icon: Repeat },
        { id: 'inventory', label: 'Inventory Stock', icon: Package },
      ],
    },
    {
      category: 'Finance & Vendors',
      items: [
        { id: 'suppliers', label: 'Suppliers', icon: Briefcase },
        { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
        { id: 'expenses', label: 'Expenses', icon: Wallet },
        { id: 'reports', label: 'Financial Reports', icon: FileText },
      ],
    },
    {
      category: 'Administration',
      items: [
        { id: 'messages', label: 'WhatsApp / SMS', icon: MessageSquare },
        { id: 'users', label: 'Staff & Security', icon: ShieldCheck },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (view: ActiveView) => {
    setCurrentView(view);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-1/2 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-white tracking-wide truncate">
              {settings.businessName}
            </h1>
            <p className="text-[10px] text-cyan-400 font-medium truncate">19L Plant Management</p>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {navItems.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.category}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Switcher to Customer Web Store */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              setPortalMode('customer');
              setCurrentView('customer_portal');
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-cyan-900/60 hover:from-blue-800 hover:to-cyan-800 border border-blue-500/30 text-cyan-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>Open Customer Portal</span>
            <ExternalLink className="w-3 h-3 text-cyan-400 ml-auto" />
          </button>
        </div>
      </aside>
    </>
  );
};
