import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { BusinessSettings } from '../types';
import {
  Settings,
  Save,
  Download,
  Building,
  DollarSign,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    setSettings,
    addToast,
    refreshAll,
  } = useApp();

  const [formData, setFormData] = useState<BusinessSettings>(settings);
  const [saving, setSaving] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings(formData);
      setSettings(updated);
      addToast('success', 'Settings Saved', 'Business profile & preferences updated.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBackupDownload = async () => {
    try {
      const backupData = await api.getBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `water_business_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast('success', 'Backup Downloaded', 'Full database export created.');
    } catch (err: any) {
      addToast('error', 'Backup Failed', err.message);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to CLEAR ALL dummy data to start clean?')) {
      return;
    }
    setClearing(true);
    try {
      await api.clearAllData();
      addToast('success', 'All Dummy Data Cleared', 'System is clean and ready for your real records.');
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Clear Failed', err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-6 h-6 text-sky-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Business Settings & System Configuration</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Company branding, bottle pricing, WhatsApp messaging templates, and automated database backups
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>Plant / Company Profile</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Phone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plant / Store Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Bottle Pricing & Deposit Defaults</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default 19L Refill Rate
                </label>
                <input
                  type="number"
                  value={formData.defaultBottlePrice}
                  onChange={(e) => setFormData({ ...formData, defaultBottlePrice: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Bottle Security Deposit
                </label>
                <input
                  type="number"
                  value={formData.defaultSecurityDeposit}
                  onChange={(e) => setFormData({ ...formData, defaultSecurityDeposit: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-600" />
              <span>Data Backup & Export</span>
            </h3>
            <p className="text-xs text-slate-500">
              Download complete database backup including customers, sales, inventory, ledgers, and transactions.
            </p>
            <button
              onClick={handleBackupDownload}
              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>Clear All Dummy Data</span>
            </h3>
            <p className="text-xs text-amber-800">
              Clear all demo sample records so you can start entering your real customers and sales.
            </p>
            <button
              onClick={handleClearAllData}
              disabled={clearing}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? 'Clearing Records...' : 'Clear All Dummy Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
