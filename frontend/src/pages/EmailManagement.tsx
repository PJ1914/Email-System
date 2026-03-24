import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Email, UserRole } from '@/types';
import { Mail, Plus, Edit, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '@/components/Skeleton';

const EmailManagement: React.FC = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEmail, setEditEmail] = useState<Email | null>(null);
  const [editForm, setEditForm] = useState({ address: '', provider: '', isActive: true });
  const [newEmail, setNewEmail] = useState({
    address: '',
    provider: 'Gmail',
  });

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchEmails();
    }
  }, [user]);

  const fetchEmails = async () => {
    try {
      const response = await api.get(ENDPOINTS.EMAILS.BASE);
      setEmails(response.data.data.emails);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(ENDPOINTS.EMAILS.CREATE, newEmail);
      toast.success('Email created successfully');
      setShowCreateModal(false);
      setNewEmail({ address: '', provider: 'Gmail' });
      fetchEmails();
    } catch (error) {
      console.error('Failed to create email:', error);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      await api.delete(ENDPOINTS.EMAILS.BY_ID(id));
      toast.success('Email deleted successfully');
      fetchEmails();
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const openEdit = (email: Email) => {
    setEditEmail(email);
    setEditForm({ address: email.address, provider: email.provider, isActive: email.isActive });
  };

  const handleEditEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmail) return;
    try {
      await api.put(ENDPOINTS.EMAILS.BY_ID(editEmail.id), editForm);
      toast.success('Email updated successfully');
      setEditEmail(null);
      fetchEmails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    }
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-dark-textMuted">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton variant="text" className="w-48 h-8 mb-2" />
              <Skeleton variant="text" className="w-64 h-4" />
            </div>
            <Skeleton variant="rectangular" className="w-32 h-10 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(key => (
              <div key={key} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton variant="text" className="w-36 h-4" />
                      <Skeleton variant="text" className="w-20 h-3" />
                    </div>
                  </div>
                  <Skeleton variant="circular" className="w-3 h-3" />
                </div>
                <div className="space-y-4">
                  <Skeleton variant="text" className="w-32 h-4" />
                  <div className="flex gap-2">
                    <Skeleton variant="rectangular" className="flex-1 h-8 rounded-lg" />
                    <Skeleton variant="rectangular" className="flex-1 h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-dark-text">Email Management</h1>
            <p className="text-sm text-dark-textMuted">Manage email accounts for the platform</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} />
            Create Email
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emails.map((email) => (
            <div key={email.id} className="bg-dark-surface border border-dark-border rounded flex flex-col overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-dark-border/60">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-peach-500/10 rounded-lg">
                      <Mail size={18} className="text-peach-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-text text-sm">{email.address}</p>
                      <p className="text-xs text-dark-textMuted">{email.provider}</p>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      email.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              <div className="px-5 py-4 bg-dark-bg/20 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 text-xs text-dark-textMuted">
                  <Users size={14} />
                  <span>{email.assignedTo.length} users assigned</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(email)}
                    className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-xs text-dark-text hover:bg-dark-border/50 transition-colors flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEmail(email.id)}
                    className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded text-xs text-dark-text hover:bg-red-500/10 hover:text-red-400 transition-colors flex-[0.5] flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit modal */}
        {editEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-md">
              <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
                <h2 className="font-semibold text-dark-text">Edit Email</h2>
              </div>
              <form onSubmit={handleEditEmail} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Provider
                  </label>
                  <select
                    value={editForm.provider}
                    onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option>Gmail</option>
                    <option>Outlook</option>
                    <option>Yahoo</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="text-sm font-medium text-dark-text">Active</label>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      editForm.isActive ? 'bg-peach-500' : 'bg-dark-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        editForm.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                  <button type="submit" className="btn-primary flex-1 text-sm py-2">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditEmail(null)}
                    className="px-4 py-2 bg-dark-bg border border-dark-border rounded text-sm font-medium text-dark-text hover:bg-dark-border/50 transition-colors flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-md">
              <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
                <h2 className="font-semibold text-dark-text">Create New Email</h2>
              </div>
              <form onSubmit={handleCreateEmail} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail.address}
                    onChange={(e) => setNewEmail({ ...newEmail, address: e.target.value })}
                    className="input-field text-sm"
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Provider
                  </label>
                  <select
                    value={newEmail.provider}
                    onChange={(e) => setNewEmail({ ...newEmail, provider: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option>Gmail</option>
                    <option>Outlook</option>
                    <option>Yahoo</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                  <button type="submit" className="btn-primary flex-1 text-sm py-2">
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
      </div>
    </Layout>
  );
};

export default EmailManagement;
