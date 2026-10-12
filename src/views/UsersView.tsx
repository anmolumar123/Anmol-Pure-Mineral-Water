import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import {
  Users,
  Plus,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { refreshTrigger, addToast, currentUser, isAdmin } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [department, setDepartment] = useState('Plant Operations');

  const loadData = () => {
    setLoading(true);
    api.getUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.error('Staff fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    try {
      await api.createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        department,
        active: true,
      });
      addToast('success', 'User Created', `${name} registered as ${role}.`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      loadData();
    } catch (err: any) {
      addToast('error', 'Failed to create user', err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-sky-600" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Users & Staff Accounts</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            System access roles: Owner, Admin, Plant Staff, Delivery Driver
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, role..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase text-[11px]">
            <tr>
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                <td className="p-3.5 text-slate-600 font-mono">{u.email}</td>
                <td className="p-3.5 text-slate-600">{u.phone || '-'}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-xs uppercase bg-sky-100 text-sky-800">
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5 text-slate-600">{u.department || 'Operations'}</td>
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b mb-3">
              <h3 className="font-bold text-sm">Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                >
                  <option value="delivery">Delivery Person / Van Driver</option>
                  <option value="staff">Plant Operator / Counter Staff</option>
                  <option value="admin">System Administrator</option>
                </select>
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
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
