import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Shield,
  Truck,
  UserCheck,
  Menu,
  X,
  Bell,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    currentUser,
    switchRole,
    setOpenSearchModal,
    setQuickModal,
    setPortalMode,
    setCurrentView,
    refreshAll,
    settings,
    pendingOnlineOrdersCount,
  } = useApp();

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
    owner: { label: 'Owner Mode', icon: Shield, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    admin: { label: 'Admin/Accounts', icon: UserCheck, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    staff: { label: 'Plant Staff', icon: RefreshCw, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    delivery: { label: 'Delivery Driver', icon: Truck, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    customer: { label: 'Customer Portal', icon: ShoppingBag, color: 'bg-teal-100 text-teal-700 border-teal-200' },
  };

  const currentBadge = roleLabels[currentUser.role] || roleLabels.owner;
  const RoleIcon = currentBadge.icon;

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between z-10 shrink-0">
      {/* Left items: Mobile toggle & Search shortcut */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Global Quick Search trigger */}
        <button
          onClick={() => setOpenSearchModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer border border-slate-200/50"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search customers, invoices, receipts...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded-md text-slate-400 shadow-2xs">
            /
          </kbd>
        </button>
      </div>

      {/* Right action controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pending Orders Pill */}
        {pendingOnlineOrdersCount > 0 && (
          <button
            onClick={() => setCurrentView('online_orders')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 text-xs font-semibold animate-pulse cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingOnlineOrdersCount} New Orders</span>
          </button>
        )}

        {/* Quick New Sale button */}
        <button
          onClick={() => setQuickModal('sale')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sale</span>
        </button>

        {/* Switch to Web Store / Customer Portal */}
        <button
          onClick={() => {
            setPortalMode('customer');
            setCurrentView('customer_portal');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          title="Open Customer Online Ordering Portal"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">Online Store</span>
        </button>

        {/* Refresh Data sync */}
        <button
          onClick={() => refreshAll()}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh All Plant & Sales Records"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Role Switcher Selector for RBAC demonstration */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-slate-500">{settings.businessName}</span>
          </div>

          <div className="relative">
            <select
              value={currentUser.role}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border appearance-none pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${currentBadge.color}`}
            >
              <option value="owner">👑 Owner</option>
              <option value="admin">💼 Admin</option>
              <option value="staff">⚙️ Staff</option>
              <option value="delivery">🚚 Driver</option>
            </select>
            <RoleIcon className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
          </div>
        </div>
      </div>
    </header>
  );
};
