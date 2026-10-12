import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CustomerAddress, OnlineOrder } from '../types';
import { KarachiAreaSelector } from '../components/common/KarachiAreaSelector';
import {
  validatePakistaniPhone,
  constructCompleteDeliveryAddress,
  CUSTOM_AREA_OPTION,
} from '../utils/karachiAreas';
import {
  Droplet,
  ShoppingBag,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Shield,
  ArrowRight,
  LogOut,
  Truck,
  RotateCcw,
  Sparkles,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  Home,
  Briefcase,
  Store,
} from 'lucide-react';

export const CustomerPortalView: React.FC = () => {
  const {
    settings,
    formatCurrency,
    formatDate,
    addToast,
    setPortalMode,
    customerSession,
    setCustomerSession,
    customerLogout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'order' | 'orders' | 'addresses' | 'profile'>('order');

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [houseOffice, setHouseOffice] = useState<string>('');
  const [streetRoad, setStreetRoad] = useState<string>('');
  const [regArea, setRegArea] = useState<string>('');
  const [customArea, setCustomArea] = useState<string>('');
  const [gateBellFloor, setGateBellFloor] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Portal data states
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Order form state
  const [orderQuantity, setOrderQuantity] = useState<number>(2);
  const [preferredDate, setPreferredDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('Morning (9:00 AM - 1:00 PM)');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [placedOrderSuccess, setPlacedOrderSuccess] = useState<OnlineOrder | null>(null);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState<string>('Home');
  const [addrFull, setAddrFull] = useState<string>('');
  const [addrArea, setAddrArea] = useState<string>('Clifton');
  const [addrCity, setAddrCity] = useState<string>(settings.city || 'Karachi');
  const [addrInstructions, setAddrInstructions] = useState<string>('');
  const [addrIsDefault, setAddrIsDefault] = useState<boolean>(true);
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editWhatsapp, setEditWhatsapp] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const pricePerBottle = customerSession?.customer?.ratePerBottle || settings.defaultBottlePrice || 150;
  const currencySymbol = settings.currency || 'Rs.';

  const loadCustomerData = async () => {
    if (!customerSession) return;
    try {
      const [addrRes, ordersRes] = await Promise.all([
        api.customerGetAddresses(),
        api.customerGetOrders(),
      ]);
      setAddresses(addrRes);
      setOrders(ordersRes);
      const def = addrRes.find((a) => a.isDefault) || addrRes[0];
      if (def && !selectedAddressId) {
        setSelectedAddressId(def.id);
      }
    } catch (err: any) {
      console.error('Failed to load customer portal data:', err);
    }
  };

  useEffect(() => {
    if (customerSession) {
      loadCustomerData();
      setEditFullName(customerSession.account.fullName || '');
      setEditEmail(customerSession.account.email || '');
      setEditWhatsapp(customerSession.account.whatsapp || customerSession.account.mobile || '');
    }
  }, [customerSession?.token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!identifier.trim() || !password) {
      setAuthError('Please enter your mobile phone or email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.customerLogin(identifier.trim(), password);
      setCustomerSession(res);
      addToast('success', `Welcome back, ${res.account.fullName}!`, 'Signed into customer self-service portal.');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!mobile.trim()) {
      errors.mobile = 'Mobile Phone is required.';
    } else {
      const mobVal = validatePakistaniPhone(mobile, 'Mobile Phone');
      if (!mobVal.isValid) errors.mobile = mobVal.error || 'Invalid mobile phone';
    }

    if (!whatsapp.trim()) {
      errors.whatsapp = 'WhatsApp Number is required.';
    } else {
      const waVal = validatePakistaniPhone(whatsapp, 'WhatsApp Number');
      if (!waVal.isValid) errors.whatsapp = waVal.error || 'Invalid WhatsApp number';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!houseOffice.trim()) errors.houseOffice = 'House / Office # is required.';
    if (!streetRoad.trim()) errors.streetRoad = 'Street / Road is required.';
    if (!regArea.trim()) errors.regArea = 'Area is required.';
    if (regArea === CUSTOM_AREA_OPTION && !customArea.trim()) {
      errors.customArea = 'Custom area name is required.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAuthError('Please complete all required fields.');
      return;
    }

    const mobVal = validatePakistaniPhone(mobile);
    const waVal = validatePakistaniPhone(whatsapp);
    const completeAddress = constructCompleteDeliveryAddress({
      houseOffice: houseOffice.trim(),
      streetRoad: streetRoad.trim(),
      area: regArea.trim(),
      customArea: customArea.trim() || undefined,
      gateBellFloor: gateBellFloor.trim() || undefined,
    });

    setAuthLoading(true);
    try {
      const res = await api.customerRegister({
        fullName: fullName.trim(),
        mobile: mobVal.normalized,
        whatsapp: waVal.normalized,
        password,
        email: email.trim() || undefined,
        houseOffice: houseOffice.trim(),
        streetRoad: streetRoad.trim(),
        area: regArea.trim(),
        customArea: customArea.trim() || undefined,
        gateBellFloor: gateBellFloor.trim() || undefined,
        completeDeliveryAddress: completeAddress,
        city: 'Karachi',
      });
      setCustomerSession(res);
      addToast('success', `Welcome, ${res.account.fullName}!`, 'Your customer account is registered and active.');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerSession) return;
    if (orderQuantity < 1) {
      addToast('error', 'Invalid Quantity', 'Please order at least 1 bottle.');
      return;
    }
    if (!selectedAddressId && addresses.length === 0) {
      addToast('error', 'Address Required', 'Please add a delivery address first.');
      setShowAddressModal(true);
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await api.customerCreateOrder({
        addressId: selectedAddressId || addresses[0]?.id,
        quantity: orderQuantity,
        preferredDate,
        preferredTimeSlot,
        customerNotes,
        paymentMethod: 'Cash on Delivery',
      });
      setPlacedOrderSuccess(order);
      addToast('success', 'Order Submitted Successfully!', `Order #${order.orderNumber} is pending confirmation.`);
      loadCustomerData();
      setCustomerNotes('');
    } catch (err: any) {
      addToast('error', 'Failed to Place Order', err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this pending order?')) return;
    try {
      await api.customerCancelOrder(orderId);
      addToast('info', 'Order Cancelled', 'Your order was cancelled successfully.');
      loadCustomerData();
    } catch (err: any) {
      addToast('error', 'Cannot Cancel Order', err.message);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrFull.trim()) {
      addToast('error', 'Validation Error', 'Please enter your street address.');
      return;
    }
    setSavingAddress(true);
    try {
      if (editingAddressId) {
        await api.customerUpdateAddress(editingAddressId, {
          label: addrLabel,
          fullAddress: addrFull.trim(),
          area: addrArea.trim(),
          city: addrCity.trim(),
          deliveryInstructions: addrInstructions.trim(),
          isDefault: addrIsDefault,
        });
        addToast('success', 'Address Updated', 'Your delivery address has been saved.');
      } else {
        const newAddr = await api.customerAddAddress({
          label: addrLabel,
          fullAddress: addrFull.trim(),
          area: addrArea.trim(),
          city: addrCity.trim(),
          deliveryInstructions: addrInstructions.trim(),
          isDefault: addrIsDefault || addresses.length === 0,
        });
        setSelectedAddressId(newAddr.id);
        addToast('success', 'Address Added', `${addrLabel} address added.`);
      }
      setShowAddressModal(false);
      setEditingAddressId(null);
      setAddrFull('');
      setAddrInstructions('');
      loadCustomerData();
    } catch (err: any) {
      addToast('error', 'Failed to save address', err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this delivery address?')) return;
    try {
      await api.customerDeleteAddress(id);
      addToast('info', 'Address Removed', 'The address has been deleted.');
      loadCustomerData();
    } catch (err: any) {
      addToast('error', 'Failed to delete address', err.message);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.customerSetDefaultAddress(id);
      setSelectedAddressId(id);
      addToast('success', 'Default Address Updated', 'Selected address is now your default delivery destination.');
      loadCustomerData();
    } catch (err: any) {
      addToast('error', 'Failed to update default address', err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.customerUpdateProfile({
        fullName: editFullName.trim(),
        email: editEmail.trim() || undefined,
        whatsapp: editWhatsapp.trim() || undefined,
      });
      if (customerSession) {
        setCustomerSession({
          ...customerSession,
          account: res.account,
          customer: res.customer,
        });
      }
      setIsEditingProfile(false);
      addToast('success', 'Profile Updated', 'Your account details have been updated.');
    } catch (err: any) {
      addToast('error', 'Failed to update profile', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 -m-4 sm:-m-6 lg:-m-8">
      {/* Top Banner / Switch to Admin Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium text-white">Anmol Pure Customer Self-Service Portal</span>
          <span className="hidden sm:inline text-slate-400">| Doorstep 19-Liter Water Refill Delivery</span>
        </div>
        <button
          onClick={() => setPortalMode('admin')}
          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
        >
          <span>Switch to Staff/Admin System</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Customer Header */}
      <header className="bg-white border-b border-sky-100 shadow-xs sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-extrabold text-lg">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                {settings.businessName || 'Anmol Pure Mineral Water'}
              </h1>
              <p className="text-xs text-sky-600 font-medium">Customer Self-Service Delivery</p>
            </div>
          </div>
          {customerSession ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900">{customerSession.account.fullName}</p>
                <p className="text-[11px] text-slate-500">{customerSession.account.mobile}</p>
              </div>
              <button
                onClick={customerLogout}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                title="Sign out of customer account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthMode('login')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  authMode === 'login' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-bold shadow-xs transition-colors ${
                  authMode === 'register' ? 'bg-sky-600 text-white shadow-sky-500/20' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                New Account
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs (when logged in) */}
        {customerSession && (
          <div className="max-w-5xl mx-auto px-4 flex border-t border-slate-100 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('order')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'order'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplet className="w-4 h-4 text-sky-600" />
              <span>Order Water</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap relative ${
                activeTab === 'orders'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-sky-600" />
              <span>My Orders</span>
              {orders.filter((o) => o.status === 'pending' || o.status === 'out_for_delivery').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'addresses'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>My Addresses ({addresses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-sky-600" />
              <span>My Profile</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {!customerSession ? (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Pure Mountain Mineral Water
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Order 19L Water Refills
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fast home & office delivery, doorstep empty bottle exchange, and instant status updates.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-sky-100 shadow-md p-6 sm:p-8">
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number or Email
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. 03001234567 or you@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md shadow-sky-500/20 text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {authLoading ? 'Signing In...' : 'Sign In to Order'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('03009876541');
                        setPassword('password123');
                      }}
                      className="text-xs text-sky-600 hover:underline cursor-pointer"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile *</label>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp *</label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700">Delivery Address *</p>
                    <input
                      type="text"
                      value={houseOffice}
                      onChange={(e) => setHouseOffice(e.target.value)}
                      placeholder="House / Office #"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                    <input
                      type="text"
                      value={streetRoad}
                      onChange={(e) => setStreetRoad(e.target.value)}
                      placeholder="Street / Road"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                    <KarachiAreaSelector
                      value={regArea}
                      onChange={(val) => setRegArea(val)}
                      placeholder="Select Area (e.g. Clifton, DHA)"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-3 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                  >
                    {authLoading ? 'Creating...' : 'Register Account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'order' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-gradient-to-br from-sky-600 to-cyan-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-2">
                        Official Plant Refill
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black">19-Liter Pure Mineral Water Refill</h2>
                      <p className="text-xs sm:text-sm text-sky-100 mt-1">
                        Multi-stage RO purification, ozonation, and UV sterilized mountain mineral water in sealed food-grade 19L polycarbonate bottles.
                      </p>
                      <div className="mt-4 pt-4 border-t border-white/20 flex items-baseline justify-between">
                        <div>
                          <span className="text-3xl font-black">{currencySymbol} {pricePerBottle}</span>
                          <span className="text-xs text-sky-200 ml-1">/ bottle refill</span>
                        </div>
                        <span className="text-xs font-bold bg-emerald-500/30 text-emerald-200 px-2 py-1 rounded-md border border-emerald-400/40">
                          Free Doorstep Delivery
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs">
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Select Quantity (19-Liter Bottles)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[1, 2, 3, 5, 10].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setOrderQuantity(qty)}
                          className={`flex-1 min-w-[50px] py-2.5 rounded-xl font-extrabold text-sm border transition-all cursor-pointer ${
                            orderQuantity === qty
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Delivery Address</label>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Address
                      </button>
                    </div>
                    {addresses.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                        <p className="text-xs font-bold text-amber-900">No address saved yet</p>
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(true)}
                          className="mt-2 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Add Address
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {addresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                              selectedAddressId === addr.id
                                ? 'bg-sky-50 border-sky-500'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="orderAddress"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-900">{addr.label}</span>
                              <p className="text-xs text-slate-600">{addr.fullAddress}</p>
                              <span className="text-[11px] text-slate-400">{addr.area}, {addr.city}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
                    <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                      <span>Order Summary</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700">Cash on Delivery</span>
                    </h3>
                    <div className="py-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-bold">{orderQuantity} × 19L Bottle(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Rate:</span>
                        <span className="font-bold">{currencySymbol} {pricePerBottle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <span className="text-emerald-600 font-bold">FREE</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between text-sm font-black">
                        <span>Total Payable:</span>
                        <span className="text-sky-600 text-lg">
                          {currencySymbol} {(orderQuantity * pricePerBottle).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={submittingOrder}
                      className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl shadow-md text-sm transition-all cursor-pointer"
                    >
                      {submittingOrder ? 'Submitting...' : 'Confirm & Place Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900">Your Water Orders</h2>
                {orders.length === 0 ? (
                  <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div key={ord.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-sky-700">#{ord.orderNumber}</span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{ord.totalBottles} × 19L Bottles - {currencySymbol} {ord.totalAmount}</p>
                          <span className="text-[11px] text-slate-400">{formatDate(ord.createdAt)}</span>
                        </div>
                        <span className="px-3 py-1 bg-sky-50 text-sky-800 rounded-full font-bold text-xs uppercase">
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-sm">Add Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Street Address *</label>
                <textarea
                  rows={2}
                  value={addrFull}
                  onChange={(e) => setAddrFull(e.target.value)}
                  placeholder="House/Plot #, Street #, Colony"
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Karachi Area *</label>
                <KarachiAreaSelector
                  value={addrArea}
                  onChange={(val) => setAddrArea(val)}
                  placeholder="Select area"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-3 py-1.5 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {placedOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">Order Placed!</h3>
            <p className="text-xs text-slate-600">
              Your order <strong>#{placedOrderSuccess.orderNumber}</strong> has been received by our plant dispatch.
            </p>
            <button
              onClick={() => {
                setPlacedOrderSuccess(null);
                setActiveTab('orders');
              }}
              className="w-full py-2 bg-sky-600 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              View Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
