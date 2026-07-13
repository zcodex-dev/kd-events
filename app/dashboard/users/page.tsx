'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  Check, 
  X,
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { LoadingSpinner } from '@/components/shared/loading';
import type { SubUser } from '@/types';

export default function UsersPage() {
  const { openSidebar, session } = useDashboard();
  const [users, setUsers] = useState<SubUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SubUser | null>(null);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [canUpload, setCanUpload] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [canReplace, setCanReplace] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load users');
      }
    } catch {
      toast.error('Error fetching users database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.role === 'admin') {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('user');
    setCanUpload(true);
    setCanDelete(false);
    setCanReplace(false);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: SubUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setCanUpload(user.permissions.canUpload);
    setCanDelete(user.permissions.canDelete);
    setCanReplace(user.permissions.canReplace);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Username and password are required');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      username: username.trim(),
      password: password.trim(),
      role,
      permissions: {
        canUpload,
        canDelete,
        canReplace,
      }
    };

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingUser ? 'User details updated' : 'Sub-account created successfully');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub-user?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch {
      toast.error('Network error during deletion');
    }
  };

  // Unauthorized screen for non-admin
  if (session?.role !== 'admin') {
    return (
      <>
        <Header title="Users Control" onMenuClick={openSidebar} />
        <div className="max-w-md mx-auto mt-20 p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-neutral-900">Access Denied</h2>
          <p className="text-xs text-neutral-500 mt-2">
            You do not have permission to access the user control dashboard. Please contact a super admin.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Users Control"
        description="Manage events sub-users and access roles"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6"
      >
        {/* Header Bar */}
        <div className="flex justify-between items-center bg-white p-4 border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <UsersIcon className="w-5 h-5 text-neutral-700" />
            <div>
              <h2 className="text-sm font-bold text-neutral-800">Events Personnel</h2>
              <p className="text-[11px] text-neutral-400">Total sub-users registered: {users.length}</p>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>

        {/* Users Table / List */}
        {isLoading ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 flex flex-col items-center justify-center gap-2 shadow-xs">
            <LoadingSpinner size={24} />
            <span className="text-xs text-neutral-500 font-medium">Querying users list...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-xs">
            <UsersIcon className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-800">No sub-accounts yet</p>
            <p className="text-xs text-neutral-400 mt-1 mb-4">Create accounts to allow others to upload or view event posters.</p>
            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 text-xs text-neutral-700 border border-neutral-200 hover:bg-neutral-50 transition-colors rounded-lg font-medium cursor-pointer"
            >
              Register First User
            </button>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 text-center">Uploads</th>
                    <th className="px-5 py-3 text-center">Replace/Edit</th>
                    <th className="px-5 py-3 text-center">Deletions</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-neutral-900 flex items-center gap-2">
                        <div className="w-6.5 h-6.5 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center text-[10px] uppercase font-bold text-neutral-600">
                          {u.username.slice(0, 2)}
                        </div>
                        {u.username}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          {u.permissions.canUpload ? (
                            <span className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          {u.permissions.canReplace ? (
                            <span className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex justify-center">
                          {u.permissions.canDelete ? (
                            <span className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit settings"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Remove account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Register/Edit User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 w-full max-w-sm rounded-xl shadow-lg overflow-hidden font-sans"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center">
                <span className="text-sm font-bold text-neutral-900">
                  {editingUser ? 'Edit Event Account' : 'Register Sub-Account'}
                </span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. josh_kd"
                        disabled={!!editingUser} // Prevent editing username directly
                        className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 bg-white text-neutral-900 rounded-lg focus:outline-none focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 w-4 h-4 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Secret code"
                        className="w-full pl-9 pr-9 py-2 text-xs border border-neutral-200 bg-white text-neutral-900 rounded-lg focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Role / Account Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRole('user');
                          // Default regular user permissions
                          setCanUpload(true);
                          setCanDelete(false);
                          setCanReplace(false);
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          role === 'user'
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        Normal User
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRole('admin');
                          // Default admin permissions (all allowed)
                          setCanUpload(true);
                          setCanDelete(true);
                          setCanReplace(true);
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          role === 'admin'
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        Co-Admin
                      </button>
                    </div>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                      Account Permissions
                    </label>
                    
                    {/* canUpload Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={canUpload}
                        onChange={(e) => setCanUpload(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span className="text-xs text-neutral-700">Allow uploading new event files</span>
                    </label>

                    {/* canReplace Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={canReplace}
                        onChange={(e) => setCanReplace(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                        disabled={role === 'admin'} // Admins always have it
                      />
                      <span className="text-xs text-neutral-700">Allow replacing / reordering artworks</span>
                    </label>

                    {/* canDelete Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={canDelete}
                        onChange={(e) => setCanDelete(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                        disabled={role === 'admin'} // Admins always have it
                      />
                      <span className="text-xs text-neutral-700">Allow deleting files / images from repository</span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-4 border-t border-neutral-150 bg-neutral-50/50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? <LoadingSpinner size={12} /> : 'Save Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
