import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { User, UserRole, Role } from '@/types';
import { Users as UsersIcon, Plus, Shield, User as UserIcon, Pencil } from 'lucide-react';
import Skeleton from '@/components/Skeleton';
import toast from 'react-hot-toast';

const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: UserRole.USER,
  });

  // Change-role state
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchUsers();
      fetchRoles();
    }
  }, [user]);

  const fetchRoles = async () => {
    try {
      const res = await api.get(ENDPOINTS.ROLES.BASE);
      setRoles(res.data.data.roles);
    } catch {
      // non-critical
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(ENDPOINTS.AUTH.USERS);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(ENDPOINTS.AUTH.CREATE_USER, newUser);
      toast.success(`User created with role: ${newUser.role}`);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', displayName: '', role: UserRole.USER });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRoleUser || !selectedRole) return;
    try {
      await api.put(ENDPOINTS.USERS.UPDATE_ROLE(changeRoleUser.uid), { role: selectedRole });
      toast.success('Role updated successfully');
      setChangeRoleUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const openChangeRole = (u: User) => {
    setChangeRoleUser(u);
    setSelectedRole(u.role as string);
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-textMuted">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <UsersIcon className="text-peach-500 mt-1" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-dark-text">User Management</h1>
              <p className="text-sm text-dark-textMuted">Manage system users and access</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} />
            Create User
          </button>
        </div>

        {loading ? (
          <div className="bg-dark-surface rounded border border-dark-border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-dark-card">
                <tr className="border-b border-dark-border/60">
                  <th className="text-left px-6 py-4"><Skeleton variant="text" className="w-24 h-4 bg-dark-border/50" /></th>
                  <th className="text-left px-6 py-4"><Skeleton variant="text" className="w-32 h-4 bg-dark-border/50" /></th>
                  <th className="text-left px-6 py-4"><Skeleton variant="text" className="w-20 h-4 bg-dark-border/50" /></th>
                  <th className="text-left px-6 py-4"><Skeleton variant="text" className="w-20 h-4 bg-dark-border/50" /></th>
                  <th className="text-left px-6 py-4"><Skeleton variant="text" className="w-32 h-4 bg-dark-border/50" /></th>
                  <th className="text-left px-6 py-4"><Skeleton variant="text" className="w-16 h-4 bg-dark-border/50" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((key) => (
                  <tr key={key} className="border-b border-dark-border last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-8 h-8 shrink-0 bg-dark-border/50" />
                        <Skeleton variant="text" className="w-32 h-4 bg-dark-border/50" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-48 h-4 bg-dark-border/50" /></td>
                    <td className="px-6 py-4"><Skeleton variant="rectangular" className="w-20 h-6 rounded-full inline-block bg-dark-border/50" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-16 h-4 bg-dark-border/50" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-8 h-4 bg-dark-border/50" /></td>
                    <td className="px-6 py-4"><Skeleton variant="rectangular" className="w-24 h-8 rounded-lg inline-block bg-dark-border/50" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-dark-surface rounded border border-dark-border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-dark-card">
                <tr className="border-b border-dark-border/60">
                  <th className="text-left px-6 py-4 text-dark-textMuted font-medium">User</th>
                  <th className="text-left px-6 py-4 text-dark-textMuted font-medium">Email</th>
                  <th className="text-left px-6 py-4 text-dark-textMuted font-medium">Role</th>
                  <th className="text-left px-6 py-4 text-dark-textMuted font-medium">Auto Mode</th>
                  <th className="text-left px-6 py-4 text-dark-textMuted font-medium">Assigned Emails</th>
                  <th className="text-left px-6 py-4 text-dark-textMuted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b border-dark-border last:border-0 hover:bg-dark-card transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-peach-500/20 flex items-center justify-center">
                          {u.role === UserRole.ADMIN
                            ? <Shield size={16} className="text-peach-500" />
                            : <UserIcon size={16} className="text-dark-textMuted" />
                          }
                        </div>
                        <span className="text-dark-text font-medium">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-textMuted">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === UserRole.ADMIN
                          ? 'bg-peach-500/20 text-peach-500'
                          : 'bg-dark-card text-dark-textMuted'
                      }`}>
                        {roles.find((r) => r.name === u.role)?.displayName ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${u.autoMode ? 'text-green-400' : 'text-dark-textMuted'}`}>
                        {u.autoMode ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-textMuted">
                      {u.assignedEmails?.length ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openChangeRole(u)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-dark-border text-dark-text bg-dark-bg hover:bg-dark-border/30 transition-colors"
                      >
                        <Pencil size={12} /> Change Role
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-dark-textMuted">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-md flex flex-col">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
              <h2 className="font-semibold text-dark-text">Create New User</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                >
                  {roles.length > 0
                    ? roles.map((r) => (
                        <option key={r.id} value={r.name}>{r.displayName}</option>
                      ))
                    : (
                        <>
                          <option value={UserRole.USER}>User</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                        </>
                      )
                  }
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 text-sm py-2"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-dark-bg border border-dark-border rounded text-sm font-medium text-dark-text hover:bg-dark-border/50 transition-colors flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {changeRoleUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-sm flex flex-col">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center justify-between">
              <h2 className="font-semibold text-dark-text">Change Role</h2>
            </div>
            <form onSubmit={handleChangeRole} className="p-5 space-y-4">
              <div className="mb-2">
                <p className="text-sm font-medium text-dark-text truncate">{changeRoleUser.displayName}</p>
                <p className="text-xs text-dark-textMuted truncate">{changeRoleUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">New Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>{r.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 text-sm py-2"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setChangeRoleUser(null)}
                  className="px-4 py-2 bg-dark-bg border border-dark-border rounded text-sm font-medium text-dark-text hover:bg-dark-border/50 transition-colors flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;
