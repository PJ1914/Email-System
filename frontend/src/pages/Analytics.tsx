import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS, SLA_MS } from '@/config/constants';
import { Message, Sentiment } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { BarChart3, TrendingUp, Mail, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import Skeleton from '@/components/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
  urgent: '#f97316',
  frustrated: '#eab308',
};

const PRIORITY_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280'];

function toMs(v: any): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return new Date(v).getTime();
  if (v._seconds) return v._seconds * 1000;
  if (v.seconds) return v.seconds * 1000;
  return new Date(v).getTime();
}

function buildVolumeTrend(messages: Message[]) {
  const map: Record<string, number> = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const m of messages) {
    const key = new Date(toMs(m.receivedAt)).toISOString().slice(0, 10);
    if (key in map) map[key]++;
  }
  return Object.entries(map).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }));
}

function buildSentimentDist(messages: Message[]) {
  const sentiments: Sentiment[] = ['positive', 'negative', 'neutral', 'urgent', 'frustrated'];
  return sentiments.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: messages.filter((m) => m.sentiment === s).length,
    color: COLORS[s],
  }));
}

function buildPriorityDist(messages: Message[]) {
  return [
    { name: 'Urgent', value: messages.filter((m) => m.priority === 'urgent').length },
    { name: 'High',   value: messages.filter((m) => m.priority === 'high').length },
    { name: 'Medium', value: messages.filter((m) => m.priority === 'medium').length },
    { name: 'Low',    value: messages.filter((m) => m.priority === 'low').length },
  ];
}

function buildAutoReplyTrend(messages: Message[]) {
  const map: Record<string, { total: number; auto: number }> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { total: 0, auto: 0 };
  }
  for (const m of messages) {
    const key = new Date(toMs(m.receivedAt)).toISOString().slice(0, 10);
    if (key in map) {
      map[key].total++;
      if (m.isAutoReplied) map[key].auto++;
    }
  }
  return Object.entries(map).map(([date, { total, auto }]) => ({
    date: date.slice(5),
    total,
    auto,
    rate: total > 0 ? Math.round((auto / total) * 100) : 0,
  }));
}

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchData = async (initial = false) => {
    if (!initial) setRefreshing(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get(ENDPOINTS.MESSAGES.INBOX),
        api.get(ENDPOINTS.MESSAGES.SENT),
      ]);
      const all: Message[] = [
        ...inboxRes.data.data.messages,
        ...sentRes.data.data.messages,
      ];
      setMessages(all);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(true); }, []);

  // Derived stats
  const processed = messages.filter((m) => m.processedAt);
  const autoReplied = messages.filter((m) => m.isAutoReplied);
  const slaBreached = messages.filter((m) => {
    const req = SLA_MS[m.priority || 'low'];
    return (Date.now() - toMs(m.receivedAt)) > req;
  });
  const responseRate = processed.length > 0
    ? Math.round((autoReplied.length / processed.length) * 100)
    : 0;
  const slaBreachRate = messages.length > 0
    ? Math.round((slaBreached.length / messages.length) * 100)
    : 0;
  const avgResponseMs = processed.length > 0
    ? processed.reduce((a, m) => a + (toMs(m.processedAt) - toMs(m.receivedAt)), 0) / processed.length
    : 0;

  const volumeTrend = buildVolumeTrend(messages);
  const sentimentDist = buildSentimentDist(messages);
  const priorityDist = buildPriorityDist(messages);
  const autoReplyTrend = buildAutoReplyTrend(messages);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(k => (
              <div key={k} className="bg-dark-surface border border-dark-border rounded p-5 h-28">
                <Skeleton variant="text" className="w-24 h-4 mb-3 bg-dark-border/50" />
                <Skeleton variant="text" className="w-16 h-8 bg-dark-border/50" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4].map(k => (
              <div key={k} className="bg-dark-surface border border-dark-border rounded p-6 h-72">
                <Skeleton variant="rectangular" className="w-full h-full bg-dark-border/50" />
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-peach-500" />
            <div>
              <h1 className="text-xl font-semibold text-dark-text">{t('analyticsTitle')}</h1>
              <p className="text-xs text-dark-textMuted">All-time performance overview</p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-dark-border rounded text-dark-textMuted hover:text-dark-text transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-surface border border-dark-border rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-dark-textMuted font-medium uppercase tracking-wide">{t('totalEmails')}</p>
              <Mail size={16} className="text-dark-textMuted" />
            </div>
            <p className="text-2xl font-bold text-dark-text">{messages.length}</p>
            <p className="text-xs text-dark-textMuted mt-1">{processed.length} processed</p>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-dark-textMuted font-medium uppercase tracking-wide">{t('responseRate')}</p>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{responseRate}%</p>
            <p className="text-xs text-dark-textMuted mt-1">{autoReplied.length} auto-replied</p>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-dark-textMuted font-medium uppercase tracking-wide">{t('avgResponseTime')}</p>
              <Clock size={16} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {avgResponseMs > 0 ? formatDistanceToNow(Date.now() - avgResponseMs) : 'N/A'}
            </p>
            <p className="text-xs text-dark-textMuted mt-1">Average AI processing</p>
          </div>

          <div className={`bg-dark-surface border rounded p-5 ${slaBreachRate > 20 ? 'border-red-500/40' : 'border-dark-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-dark-textMuted font-medium uppercase tracking-wide">{t('slaBreachRate')}</p>
              <ShieldAlert size={16} className={slaBreachRate > 20 ? 'text-red-400' : 'text-dark-textMuted'} />
            </div>
            <p className={`text-2xl font-bold ${slaBreachRate > 20 ? 'text-red-400' : 'text-dark-text'}`}>{slaBreachRate}%</p>
            <p className="text-xs text-dark-textMuted mt-1">{slaBreached.length} breached</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Volume — 30-day trend */}
          <div className="bg-dark-surface border border-dark-border rounded p-6">
            <h2 className="text-sm font-semibold text-dark-text mb-4">{t('emailVolume')} (30 days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumeTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6 }}
                  labelStyle={{ color: '#e5e5e5', fontSize: 11 }}
                  itemStyle={{ color: '#ff7e52', fontSize: 11 }}
                />
                <Bar dataKey="count" fill="#ff7e52" radius={[3, 3, 0, 0]} name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-dark-surface border border-dark-border rounded p-6">
            <h2 className="text-sm font-semibold text-dark-text mb-4">{t('sentimentDistribution')}</h2>
            {sentimentDist.every((s) => s.value === 0) ? (
              <div className="flex items-center justify-center h-52 text-dark-textMuted text-sm">
                No sentiment data yet (AI processing pending)
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sentimentDist.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#444' }}
                  >
                    {sentimentDist.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6 }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Distribution */}
          <div className="bg-dark-surface border border-dark-border rounded p-6">
            <h2 className="text-sm font-semibold text-dark-text mb-4">Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityDist} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6 }}
                  itemStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} name="Count">
                  {priorityDist.map((_, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Auto-Reply Rate — 7-day trend */}
          <div className="bg-dark-surface border border-dark-border rounded p-6">
            <h2 className="text-sm font-semibold text-dark-text mb-4">Auto-Reply Rate (7 days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={autoReplyTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6 }}
                  itemStyle={{ fontSize: 11 }}
                />
                <Line type="monotone" dataKey="total" stroke="#6b7280" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="auto" stroke="#22c55e" strokeWidth={2} dot={false} name="Auto-Replied" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Senders */}
        <div className="bg-dark-surface border border-dark-border rounded p-6">
          <h2 className="text-sm font-semibold text-dark-text mb-4">Top Senders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left">
                  <th className="pb-2 text-xs text-dark-textMuted font-medium">Sender</th>
                  <th className="pb-2 text-xs text-dark-textMuted font-medium">Messages</th>
                  <th className="pb-2 text-xs text-dark-textMuted font-medium">Auto-Replied</th>
                  <th className="pb-2 text-xs text-dark-textMuted font-medium">SLA Breaches</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  messages.reduce<Record<string, { total: number; auto: number; breaches: number }>>((acc, m) => {
                    const from = m.from || 'Unknown';
                    if (!acc[from]) acc[from] = { total: 0, auto: 0, breaches: 0 };
                    acc[from].total++;
                    if (m.isAutoReplied) acc[from].auto++;
                    const req = SLA_MS[m.priority || 'low'];
                    if ((Date.now() - toMs(m.receivedAt)) > req) acc[from].breaches++;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1].total - a[1].total)
                  .slice(0, 10)
                  .map(([sender, stats]) => (
                    <tr key={sender} className="border-b border-dark-border/30 hover:bg-dark-bg/30">
                      <td className="py-2 text-dark-text truncate max-w-xs">{sender}</td>
                      <td className="py-2 text-dark-textMuted">{stats.total}</td>
                      <td className="py-2 text-green-400">{stats.auto}</td>
                      <td className="py-2">
                        {stats.breaches > 0
                          ? <span className="text-red-400">{stats.breaches}</span>
                          : <span className="text-dark-textMuted">0</span>
                        }
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
