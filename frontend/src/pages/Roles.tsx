import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Role, UserRole } from '@/types';
import { Shield, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '@/components/Skeleton';

const emptyForm = { displayName: '', isAdmin: false, description: '' };

const Roles: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createLoading, setCreateLoading] = useState(false);

  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get(ENDPOINTS.ROLES.BASE);
      setRoles(res.data.data.roles);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post(ENDPOINTS.ROLES.BASE, createForm);
      toast.success('Role created');
      setShowCreate(false);
      setCreateForm(emptyForm);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    setEditForm({ displayName: role.displayName, isAdmin: role.isAdmin, description: role.description });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole) return;
    setEditLoading(true);
    try {
      await api.put(ENDPOINTS.ROLES.BY_ID(editRole.id), editForm);
      toast.success('Role updated');
      setEditRole(null);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.displayName}"? Users with this role will keep it until reassigned.`)) return;
    try {
      await api.delete(ENDPOINTS.ROLES.BY_ID(role.id));
      toast.success('Role deleted');
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
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
            <Shield className="text-peach-500 mt-1" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-dark-text">Role Management</h1>
              <p className="text-sm text-dark-textMuted">Configure roles and access levels</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} />
            Create Role
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(key => (
              <div key={key} className="bg-dark-surface border border-dark-border rounded p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circular" className="w-10 h-10" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton variant="text" className="w-32 h-4" />
                      <Skeleton variant="text" className="w-16 h-4" />
                    </div>
                    <Skeleton variant="text" className="w-48 h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="rectangular" className="w-8 h-8 rounded" />
                  <Skeleton variant="rectangular" className="w-8 h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-dark-surface border border-dark-border rounded p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role.isAdmin ? 'bg-peach-500/20' : 'bg-dark-card'}`}>
                    <Shield size={18} className={role.isAdmin ? 'text-peach-500' : 'text-dark-textMuted'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark-text">{role.displayName}</span>
                      <span className="text-xs text-dark-textMuted font-mono bg-dark-card px-2 py-0.5 rounded">
                        {role.name}
                      </span>
                      {role.isAdmin && (
                        <span className="text-xs bg-peach-500/20 text-peach-500 px-2 py-0.5 rounded-full font-semibold">
                          Admin Access
                        </span>
                      )}
                      {role.isSystem && (
                        <span className="text-xs bg-dark-card text-dark-textMuted px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Lock size={10} /> System
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-dark-textMuted mt-0.5">{role.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(role)}
                    className="p-1.5 rounded text-dark-textMuted hover:bg-dark-card hover:text-dark-text transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    disabled={role.isSystem}
                    className="p-1.5 rounded text-dark-textMuted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={role.isSystem ? 'System roles cannot be deleted' : 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {roles.length === 0 && (
              <div className="text-center py-12 text-dark-textMuted">
                No roles found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-md flex flex-col">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
              <h2 className="font-semibold text-dark-text">Create New Role</h2>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Display Name <span className="text-red-400">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. HR Manager"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                />
                {createForm.displayName && (
                  <p className="text-xs text-dark-textMuted mt-1">
                    Slug: <span className="font-mono">{createForm.displayName.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of this role"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium text-dark-text">Admin Access</p>
                  <p className="text-xs text-dark-textMuted">Grants full platform access (like Admin)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, isAdmin: !createForm.isAdmin })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${createForm.isAdmin ? 'bg-peach-500' : 'bg-dark-border'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${createForm.isAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {createLoading ? 'Creating...' : 'Create Role'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateForm(emptyForm); }}
                  className="px-4 py-2 bg-dark-bg border border-dark-border rounded text-sm font-medium text-dark-text hover:bg-dark-border/50 transition-colors flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRole && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-md flex flex-col">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center justify-between">
              <h2 className="font-semibold text-dark-text">Edit Role</h2>
              <span className="text-xs text-dark-textMuted font-mono px-2 py-0.5 bg-dark-bg rounded border border-dark-border">
                {editRole.name}
              </span>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  disabled={editRole.isSystem}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500"
                />
              </div>
              {!editRole.isSystem && (
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-dark-text">Admin Access</p>
                    <p className="text-xs text-dark-textMuted">Grants full platform access</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isAdmin: !editForm.isAdmin })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editForm.isAdmin ? 'bg-peach-500' : 'bg-dark-border'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editForm.isAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}
              {editRole.isSystem && (
                <p className="text-xs text-dark-textMuted flex items-center gap-1.5 pt-2">
                  <Lock size={12} className="text-peach-500" /> System role — configuration is locked.
                </p>
              )}
              <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditRole(null)}
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

export default Roles;
