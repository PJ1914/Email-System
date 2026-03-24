import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Email, SESConfig, UserRole, VerificationStatus } from '@/types';
import {
  Cloud,
  Plus,
  Trash2,
  TestTube,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Link,
  RefreshCw,
  Mail,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '@/components/Skeleton';

/* ── helpers ── */
const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
  'ca-central-1', 'sa-east-1',
];

const EMPTY_FORM = {
  organizationName: '',
  accessKeyId: '',
  secretAccessKey: '',
  region: 'us-east-1',
  fromEmail: '',
  fromName: '',
  domain: '',
};

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, { label: string; icon: React.ReactNode; cls: string }> = {
    unverified: { label: 'Unverified', icon: <XCircle size={14} />, cls: 'text-gray-400 bg-gray-800' },
    pending: { label: 'Pending', icon: <Clock size={14} />, cls: 'text-yellow-400 bg-yellow-900/30' },
    verified: { label: 'Verified', icon: <CheckCircle size={14} />, cls: 'text-green-400 bg-green-900/30' },
    failed: { label: 'Failed', icon: <XCircle size={14} />, cls: 'text-red-400 bg-red-900/30' },
  };
  const { label, icon, cls } = map[status] ?? map.unverified;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {icon} {label}
    </span>
  );
}

/* ── main component ── */
const SESConfiguration: React.FC = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SESConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [emailAccounts, setEmailAccounts] = useState<Email[]>([]);
  const [dkimTokens, setDkimTokens] = useState<Record<string, string[]>>({});
  const [domainInput, setDomainInput] = useState<Record<string, string>>({});
  const [linkEmailId, setLinkEmailId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchConfigs();
      fetchEmailAccounts();
    }
  }, [user]);

  const fetchConfigs = async () => {
    try {
      const res = await api.get(ENDPOINTS.SES_CONFIG.BASE);
      setConfigs(res.data.data.configs);
    } catch {
      toast.error('Failed to load SES configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailAccounts = async () => {
    try {
      const res = await api.get(ENDPOINTS.EMAILS.BASE);
      setEmailAccounts(res.data.data.emails ?? []);
    } catch {
      // non-critical — dropdown just shows empty
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(ENDPOINTS.SES_CONFIG.BASE, form);
      toast.success('SES configuration saved & connection verified ✓');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SES configuration?')) return;
    try {
      await api.delete(ENDPOINTS.SES_CONFIG.BY_ID(id));
      toast.success('Configuration deleted');
      fetchConfigs();
    } catch {
      toast.error('Failed to delete configuration');
    }
  };

  const handleTest = async (id: string) => {
    toast.loading('Testing connection…', { id: `test-${id}` });
    try {
      const res = await api.post(ENDPOINTS.SES_CONFIG.TEST(id));
      if (res.data.data.success) {
        toast.success(res.data.data.message, { id: `test-${id}` });
      } else {
        toast.error(res.data.data.message, { id: `test-${id}` });
      }
    } catch {
      toast.error('Connection test failed', { id: `test-${id}` });
    }
  };

  const handleVerifyEmail = async (id: string) => {
    try {
      const res = await api.post(ENDPOINTS.SES_CONFIG.VERIFY_EMAIL(id));
      toast.success(res.data.message);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleVerifyDomain = async (id: string) => {
    const domain = domainInput[id];
    if (!domain) return toast.error('Enter a domain first');
    try {
      const res = await api.post(ENDPOINTS.SES_CONFIG.VERIFY_DOMAIN(id), { domain });
      setDkimTokens((prev) => ({ ...prev, [id]: res.data.data.dkimTokens }));
      toast.success('Domain verification initiated — publish the DNS records below');
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Domain verification failed');
    }
  };

  const handleRefreshEmailStatus = async (id: string) => {
    try {
      await api.post(ENDPOINTS.SES_CONFIG.EMAIL_STATUS(id));
      toast.success('Email verification status refreshed');
      fetchConfigs();
    } catch {
      toast.error('Failed to refresh email status');
    }
  };

  const handleRefreshDomainStatus = async (id: string) => {
    try {
      await api.post(ENDPOINTS.SES_CONFIG.DOMAIN_STATUS(id));
      toast.success('Domain status refreshed');
      fetchConfigs();
    } catch {
      toast.error('Failed to refresh domain status');
    }
  };

  const handleLinkEmail = async (id: string) => {
    const emailId = linkEmailId[id];
    if (!emailId) return toast.error('Enter an email account ID');
    try {
      await api.post(ENDPOINTS.SES_CONFIG.LINK_EMAIL(id), { emailId });
      toast.success('Email account linked to this SES configuration');
      setLinkEmailId((prev) => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to link email');
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="text-peach-500" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-dark-text">AWS SES Configuration</h1>
              <p className="text-sm text-dark-textMuted mt-0.5">
                Each organisation configures its own SES credentials and verified domain.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} /> Add Configuration
          </button>
        </div>

        {/* How it works banner */}
        <div className="bg-dark-card border border-dark-border rounded p-4 flex gap-4 shadow-sm">
          <Shield className="text-peach-500 mt-0.5 shrink-0" size={20} />
          <div className="text-sm text-dark-textMuted space-y-1">
            <p className="text-dark-text font-semibold">How multi-tenant SES works</p>
            <p>
              Each organisation (college, startup, enterprise…) adds its own AWS Access Key, Secret,
              and verified sending domain. When a linked email account sends a message, the platform
              automatically routes it through that organisation's SES account — so deliverability,
              reputation, and billing stay completely separate.
            </p>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
                <h2 className="font-semibold text-dark-text">New SES Configuration</h2>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto">
                <Field label="Organisation Name" required>
                  <input
                    required
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    placeholder="e.g. Acme University IT Department"
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="AWS Access Key ID" required>
                    <input
                      required
                      value={form.accessKeyId}
                      onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
                      placeholder="AKIA…"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="AWS Secret Access Key" required>
                    <input
                      required
                      type="password"
                      value={form.secretAccessKey}
                      onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="AWS Region" required>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className={inputCls}
                  >
                    {AWS_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="From Email" required>
                    <input
                      required
                      type="email"
                      value={form.fromEmail}
                      onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                      placeholder="noreply@yourdomain.com"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="From Name">
                    <input
                      value={form.fromName}
                      onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                      placeholder="Acme University"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Domain (optional — for DKIM verification)">
                  <input
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    placeholder="yourdomain.com"
                    className={inputCls}
                  />
                </Field>

                <p className="text-xs text-dark-textMuted bg-dark-card rounded-lg p-3">
                  <strong className="text-dark-text">Connection test:</strong> Saving will
                  automatically verify your credentials by calling AWS SES. If the test fails the
                  configuration will NOT be saved.
                </p>

                <div className="flex gap-3 pt-4 border-t border-dark-border mt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary text-sm py-2"
                  >
                    {saving ? 'Saving & testing…' : 'Save Configuration'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
                    className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded text-sm font-medium text-dark-text hover:bg-dark-border/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Config list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((key) => (
              <div key={key} className="bg-dark-surface border border-dark-border rounded overflow-hidden p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circular" className="w-10 h-10" />
                  <div className="space-y-2">
                    <Skeleton variant="text" className="w-48 h-4" />
                    <Skeleton variant="text" className="w-32 h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
                  <Skeleton variant="rectangular" className="w-20 h-8 rounded" />
                  <Skeleton variant="rectangular" className="w-8 h-8 rounded" />
                  <Skeleton variant="rectangular" className="w-8 h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-16 text-dark-textMuted">
            <Cloud size={48} className="mx-auto mb-3 opacity-30" />
            <p>No SES configurations yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((cfg) => (
              <div key={cfg.id} className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-peach-500/20 flex items-center justify-center">
                      <Cloud size={18} className="text-peach-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-text">{cfg.organizationName}</p>
                      <p className="text-xs text-dark-textMuted">{cfg.fromEmail} · {cfg.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                      {cfg.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleTest(cfg.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-dark-border rounded text-dark-textMuted hover:bg-dark-card transition-colors"
                      title="Test connection"
                    >
                      <TestTube size={14} /> Test
                    </button>
                    <button
                      onClick={() => handleDelete(cfg.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === cfg.id ? null : cfg.id)}
                      className="p-1.5 text-dark-textMuted hover:bg-dark-card rounded transition-colors"
                    >
                      {expanded === cfg.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === cfg.id && (
                  <div className="border-t border-dark-border px-6 py-5 space-y-6">
                    {/* Credentials summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <InfoRow label="Access Key ID" value={cfg.accessKeyId} />
                      <InfoRow label="Secret Key" value={cfg.secretAccessKey} />
                      <InfoRow label="Region" value={cfg.region} />
                      <InfoRow label="From Name" value={cfg.fromName || '—'} />
                    </div>

                    <hr className="border-dark-border" />

                    {/* Email identity verification */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-peach-500" />
                          <p className="font-medium text-dark-text text-sm">Sender Email Verification</p>
                          <VerificationBadge status={cfg.emailVerificationStatus} />
                          <button
                            onClick={() => handleRefreshEmailStatus(cfg.id)}
                            className="ml-1 flex items-center gap-1 text-xs text-dark-textMuted hover:text-dark-text"
                            title="Sync status from AWS"
                          >
                            <RefreshCw size={12} /> Refresh
                          </button>
                        </div>
                        {cfg.emailVerificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleVerifyEmail(cfg.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-peach-500 text-white rounded hover:bg-peach-600 transition-colors"
                          >
                            <Mail size={12} /> Send Verification Email
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-dark-textMuted">
                        AWS SES will send a confirmation link to <strong className="text-dark-text">{cfg.fromEmail}</strong>.
                        Click it to verify your sending identity. If you already verified it in AWS, click <strong>Refresh</strong> above.
                      </p>
                    </div>

                    <hr className="border-dark-border" />

                    {/* Domain verification */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-peach-500" />
                        <p className="font-medium text-dark-text text-sm">Domain DKIM Verification</p>
                        <VerificationBadge status={cfg.domainVerificationStatus} />
                        {cfg.domain && (
                          <button
                            onClick={() => handleRefreshDomainStatus(cfg.id)}
                            className="ml-auto flex items-center gap-1 text-xs text-dark-textMuted hover:text-dark-text"
                          >
                            <RefreshCw size={12} /> Refresh
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          value={domainInput[cfg.id] || cfg.domain || ''}
                          onChange={(e) => setDomainInput({ ...domainInput, [cfg.id]: e.target.value })}
                          placeholder="yourdomain.com"
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          onClick={() => handleVerifyDomain(cfg.id)}
                          className="px-4 py-2 text-sm bg-peach-500 text-white rounded hover:bg-peach-600 transition-colors whitespace-nowrap"
                        >
                          Verify Domain
                        </button>
                      </div>

                      {/* Show DKIM tokens if we have them */}
                      {(dkimTokens[cfg.id] || cfg.domainVerificationToken) && (
                        <div className="bg-dark-card rounded-lg p-4 space-y-2">
                          <p className="text-xs font-semibold text-dark-text">
                            Publish these CNAME records in your DNS provider:
                          </p>
                          {(dkimTokens[cfg.id] || cfg.domainVerificationToken!.split(',')).map(
                            (token, i) => (
                              <div key={i} className="font-mono text-xs text-dark-textMuted space-y-0.5">
                                <p>
                                  <span className="text-peach-400">Host:</span>{' '}
                                  {token}._domainkey.{cfg.domain || domainInput[cfg.id]}
                                </p>
                                <p>
                                  <span className="text-peach-400">Value:</span>{' '}
                                  {token}.dkim.amazonses.com
                                </p>
                              </div>
                            )
                          )}
                          <p className="text-xs text-yellow-400/80 pt-1">
                              re-check status once records are published.
                            </p>
                          </div>
                      )}
                    </div>

                    <hr className="border-dark-border" />

                    {/* Link email account */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Link size={16} className="text-peach-500" />
                        <p className="font-medium text-dark-text text-sm">Link Email Account</p>
                      </div>
                      <p className="text-xs text-dark-textMuted">
                        Select an Email Account to route its outbound mail through this SES
                        configuration. Create accounts first in{' '}
                        <strong className="text-dark-text">Email Management</strong>.
                      </p>
                      <div className="flex gap-2">
                        {emailAccounts.length === 0 ? (
                          <p className="text-xs text-yellow-400/80 flex-1">
                            No email accounts found. Go to Email Management to create one (e.g.
                            hr@codetapasya.com).
                          </p>
                        ) : (
                          <select
                            value={linkEmailId[cfg.id] || ''}
                            onChange={(e) =>
                              setLinkEmailId({ ...linkEmailId, [cfg.id]: e.target.value })
                            }
                            className={`${inputCls} flex-1`}
                          >
                            <option value="">— select an email account —</option>
                            {emailAccounts.map((ea) => (
                              <option key={ea.id} value={ea.id}>
                                {ea.address}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => handleLinkEmail(cfg.id)}
                          disabled={!linkEmailId[cfg.id]}
                          className="px-4 py-2 text-sm bg-peach-500 text-white rounded hover:bg-peach-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

/* ── small helpers ── */
const inputCls =
  'w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-peach-500';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-dark-textMuted mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-dark-textMuted">{label}</p>
      <p className="text-sm text-dark-text font-mono">{value}</p>
    </div>
  );
}

export default SESConfiguration;
