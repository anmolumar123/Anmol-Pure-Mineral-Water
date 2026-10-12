import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/layout/ToastContainer';
import { QuickActionModals } from './components/modals/QuickActionModals';
import { CustomerProfileModal } from './components/modals/CustomerProfileModal';
import { SearchModal } from './components/common/SearchModal';
import { InvoiceModal } from './components/common/InvoiceModal';
import { MessageModal } from './components/common/MessageModal';

// Views
import { DashboardView } from './views/DashboardView';
import { OnlineOrdersView } from './views/OnlineOrdersView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { CustomersView } from './views/CustomersView';
import { BottleLedgerView } from './views/BottleLedgerView';
import { SalesView } from './views/SalesView';
import { DeliveriesView } from './views/DeliveriesView';
import { RefillingView } from './views/RefillingView';
import { InventoryView } from './views/InventoryView';
import { PaymentsView } from './views/PaymentsView';
import { SuppliersView } from './views/SuppliersView';
import { PurchasesView } from './views/PurchasesView';
import { ExpensesView } from './views/ExpensesView';
import { ReportsView } from './views/ReportsView';
import { MessagesView } from './views/MessagesView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const {
    currentView,
    portalMode,
    activeCustomerProfileId,
    setActiveCustomerProfileId,
    activeInvoiceData,
    setActiveInvoiceData,
    activeReceiptData,
    setActiveReceiptData,
    activeMessageCustomer,
    setActiveMessageCustomer,
    openSearchModal,
    setOpenSearchModal,
  } = useApp();

  // If user switched to Customer Portal experience or view is customer_portal
  if (portalMode === 'customer' || currentView === 'customer_portal') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <CustomerPortalView />
        <ToastContainer />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'online_orders':
        return <OnlineOrdersView />;
      case 'customers':
        return <CustomersView />;
      case 'bottle_ledger':
        return <BottleLedgerView />;
      case 'sales':
        return <SalesView />;
      case 'deliveries':
        return <DeliveriesView />;
      case 'refilling':
        return <RefillingView />;
      case 'inventory':
        return <InventoryView />;
      case 'payments':
        return <PaymentsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'purchases':
        return <PurchasesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'messages':
        return <MessagesView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Left Oceanic Navy Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Clean Minimalist Navbar */}
        <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <QuickActionModals />

      {activeCustomerProfileId && (
        <CustomerProfileModal
          customerId={activeCustomerProfileId}
          onClose={() => setActiveCustomerProfileId(null)}
        />
      )}

      {activeInvoiceData && (
        <InvoiceModal
          sale={activeInvoiceData}
          onClose={() => setActiveInvoiceData(null)}
        />
      )}

      {activeReceiptData && (
        <InvoiceModal
          payment={activeReceiptData}
          onClose={() => setActiveReceiptData(null)}
        />
      )}

      {activeMessageCustomer && (
        <MessageModal
          customer={activeMessageCustomer}
          onClose={() => setActiveMessageCustomer(null)}
        />
      )}

      {openSearchModal && (
        <SearchModal onClose={() => setOpenSearchModal(false)} />
      )}

      {/* Toast Notification Stack */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
