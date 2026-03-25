import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { ReplyTemplate } from '@/types';
import { Plus, Edit2, Trash2, Globe, User, Tag, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface FormState {
  name: string;
  subject: string;
  body: string;
  category: string;
  isGlobal: boolean;
}

const EMPTY_FORM: FormState = { name: '', subject: '', body: '', category: '', isGlobal: false };

const ReplyTemplates: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await api.get(ENDPOINTS.REPLY_TEMPLATES.BASE);
      setTemplates(res.data.data.templates);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (t: ReplyTemplate) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      subject: t.subject || '',
      body: t.body,
      category: t.category || '',
      isGlobal: t.isGlobal,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error('Name and body are required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(ENDPOINTS.REPLY_TEMPLATES.BY_ID(editId), form);
        toast.success('Template updated');
      } else {
        await api.post(ENDPOINTS.REPLY_TEMPLATES.BASE, form);
        toast.success('Template created');
      }
      setShowForm(false);
      await fetchTemplates();
    } catch (err) {
      toast.error(editId ? 'Failed to update template' : 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(ENDPOINTS.REPLY_TEMPLATES.BY_ID(id));
      toast.success('Template deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const globalTemplates = templates.filter((t) => t.isGlobal);
  const personalTemplates = templates.filter((t) => !t.isGlobal);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag size={22} className="text-peach-500" />
            <div>
              <h1 className="text-xl font-semibold text-dark-text">{t('templatesTitle')}</h1>
              <p className="text-xs text-dark-textMuted">Manage canned replies for faster responses</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-peach-500 text-white rounded text-sm hover:bg-peach-600 transition-colors"
          >
            <Plus size={15} /> {t('newTemplate')}
          </button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-dark-surface border border-dark-border rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dark-text">{editId ? 'Edit Template' : 'Create Template'}</h2>
              <button onClick={() => setShowForm(false)} className="text-dark-textMuted hover:text-dark-text">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-dark-textMuted mb-1 block">{t('templateName')} *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Welcome Response"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500"
                />
              </div>
              <div>
                <label className="text-xs text-dark-textMuted mb-1 block">{t('templateCategory')}</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. support, billing, sales"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-dark-textMuted mb-1 block">Subject (optional)</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Leave blank to auto-generate from email"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500"
              />
            </div>

            <div>
              <label className="text-xs text-dark-textMuted mb-1 block">{t('templateBody')} *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={6}
                placeholder="Write your template body here..."
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500 resize-none"
              />
            </div>

            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.isGlobal}
                  onChange={(e) => setForm({ ...form, isGlobal: e.target.checked })}
                  className="accent-peach-500"
                />
                <span className="text-sm text-dark-text">Make global (visible to all users)</span>
              </label>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-dark-border rounded text-dark-textMuted hover:text-dark-text">
                {t('cancel')}
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-peach-500 text-white rounded hover:bg-peach-600 disabled:opacity-50">
                <Save size={14} /> {saving ? 'Saving...' : t('saveTemplate')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-dark-textMuted py-12 text-sm">Loading templates...</div>
        ) : (
          <>
            {/* Global Templates */}
            {globalTemplates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={14} className="text-blue-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted">{t('globalTemplate')} Templates</h2>
                  <span className="text-xs text-dark-textMuted">({globalTemplates.length})</span>
                </div>
                <div className="space-y-2">
                  {globalTemplates.map((tmpl) => (
                    <TemplateCard key={tmpl.id} template={tmpl} onEdit={openEdit} onDelete={handleDelete} canEdit={isAdmin} />
                  ))}
                </div>
              </section>
            )}

            {/* Personal Templates */}
            {personalTemplates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-peach-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted">{t('personalTemplate')} Templates</h2>
                  <span className="text-xs text-dark-textMuted">({personalTemplates.length})</span>
                </div>
                <div className="space-y-2">
                  {personalTemplates.map((tmpl) => (
                    <TemplateCard key={tmpl.id} template={tmpl} onEdit={openEdit} onDelete={handleDelete} canEdit={true} />
                  ))}
                </div>
              </section>
            )}

            {templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-dark-textMuted gap-3">
                <Tag size={40} className="opacity-20" />
                <p className="text-sm">No templates yet</p>
                <button onClick={openCreate} className="text-peach-400 text-sm hover:underline">Create your first template</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

interface TemplateCardProps {
  template: ReplyTemplate;
  onEdit: (t: ReplyTemplate) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete, canEdit }) => (
  <div className="bg-dark-surface border border-dark-border rounded p-4 flex items-start gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium text-dark-text">{template.name}</p>
        {template.category && (
          <span className="text-[10px] px-1.5 py-0.5 bg-peach-500/10 text-peach-400 rounded uppercase font-bold">
            {template.category}
          </span>
        )}
        {template.isGlobal && (
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded uppercase font-bold">Global</span>
        )}
      </div>
      {template.subject && (
        <p className="text-xs text-dark-textMuted mb-1">Subject: {template.subject}</p>
      )}
      <p className="text-xs text-dark-textMuted line-clamp-2 leading-relaxed">{template.body}</p>
    </div>
    {canEdit && (
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(template)} className="p-1.5 text-dark-textMuted hover:text-dark-text rounded hover:bg-dark-bg transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDelete(template.id)} className="p-1.5 text-dark-textMuted hover:text-red-400 rounded hover:bg-dark-bg transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    )}
  </div>
);

export default ReplyTemplates;
