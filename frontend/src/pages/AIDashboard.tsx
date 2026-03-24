import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Message } from '@/types';
import { Bot, TrendingUp, Clock, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Skeleton from '@/components/Skeleton';
import { formatDistanceToNow } from 'date-fns';

const POLL_INTERVAL = 30_000;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildActivityData(messages: Message[]) {
  // Last 7 days rolling window
  const counts: Record<string, number> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    counts[d.toDateString()] = 0;
  }
  for (const m of messages) {
    const d = new Date(m.receivedAt).toDateString();
    if (d in counts) counts[d]++;
  }
  return Object.entries(counts).map(([dateStr, count]) => ({
    name: DAY_LABELS[new Date(dateStr).getDay()],
    messages: count,
  }));
}

function calcAvgProcessingMs(messages: Message[]): number {
  const processed = messages.filter((m) => m.processedAt && m.receivedAt);
  if (processed.length === 0) return 0;
  const total = processed.reduce((acc, m) => {
    return acc + (new Date(m.processedAt!).getTime() - new Date(m.receivedAt).getTime());
  }, 0);
  return Math.round(total / processed.length / 100) / 10; // seconds, 1 dp
}

const AIDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    autoReplied: 0,
    tasksExtracted: 0,
    avgProcessingTime: 0,
  });
  const [activityData, setActivityData] = useState<{ name: string; messages: number }[]>([]);
  const [priorityData, setPriorityData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [performance, setPerformance] = useState({ summary: 0, taskRate: 0, priorityDetection: 0 });
  const [recentReplies, setRecentReplies] = useState<Message[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData(true);
    pollRef.current = setInterval(() => fetchData(false), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const fetchData = async (initial = false) => {
    if (!initial) setRefreshing(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get(ENDPOINTS.MESSAGES.INBOX),
        api.get(ENDPOINTS.MESSAGES.SENT),
      ]);
      const inbox: Message[] = inboxRes.data.data.messages;
      const sent: Message[] = sentRes.data.data.messages;
      const all = [...inbox, ...sent];

      const processed = all.filter((m) => m.processedAt);
      const autoReplied = all.filter((m) => m.isAutoReplied);
      const totalTasks = all.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
      const avgMs = calcAvgProcessingMs(all);

      setStats({
        totalProcessed: processed.length,
        autoReplied: autoReplied.length,
        tasksExtracted: totalTasks,
        avgProcessingTime: avgMs,
      });

      setActivityData(buildActivityData(all));

      const pData = [
        { name: 'Urgent', value: all.filter((m) => m.priority === 'urgent').length, color: '#ef4444' },
        { name: 'High',   value: all.filter((m) => m.priority === 'high').length,   color: '#f97316' },
        { name: 'Medium', value: all.filter((m) => m.priority === 'medium').length,  color: '#3b82f6' },
        { name: 'Low',    value: all.filter((m) => m.priority === 'low').length,     color: '#6b7280' },
      ];
      setPriorityData(pData);

      // Performance rates based on processed messages
      const total = processed.length || 1;
      setPerformance({
        summary:        Math.round((processed.filter((m) => m.summary).length / total) * 100),
        taskRate:       Math.round((processed.filter((m) => (m.tasks?.length || 0) > 0).length / total) * 100),
        priorityDetection: Math.round((processed.filter((m) => m.priority).length / total) * 100),
      });

      // Last 5 auto-replied messages
      setRecentReplies(
        autoReplied
          .slice()
          .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
          .slice(0, 5)
      );
    } catch (err) {
      console.error('AI Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton variant="circular" className="w-8 h-8 shrink-0 bg-dark-border/50" />
            <div className="space-y-2">
              <Skeleton variant="text" className="w-48 h-6 bg-dark-border/50" />
              <Skeleton variant="text" className="w-64 h-4 bg-dark-border/50" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map(key => (
               <div key={key} className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32">
                 <div className="flex items-start justify-between mb-4">
                   <Skeleton variant="text" className="w-24 h-4 bg-dark-border/50" />
                   <Skeleton variant="circular" className="w-6 h-6 bg-dark-border/50" />
                 </div>
                 <Skeleton variant="text" className="w-16 h-8 mt-auto bg-dark-border/50" />
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-dark-surface border border-dark-border rounded overflow-hidden p-6 h-96 flex flex-col">
                <Skeleton variant="text" className="w-32 h-6 mb-6 bg-dark-border/50" />
                <Skeleton variant="rectangular" className="w-full flex-1 bg-dark-border/50" />
             </div>
             <div className="bg-dark-surface border border-dark-border rounded overflow-hidden p-6 h-96 flex flex-col">
                <Skeleton variant="text" className="w-40 h-6 mb-6 bg-dark-border/50" />
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton variant="circular" className="w-48 h-48 bg-dark-border/50" />
                </div>
             </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden p-6">
             <Skeleton variant="text" className="w-48 h-6 mb-6 bg-dark-border/50" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[1, 2, 3].map(key => (
                 <div key={key} className="space-y-3">
                   <Skeleton variant="text" className="w-32 h-4 bg-dark-border/50" />
                   <div className="flex items-center gap-3">
                     <Skeleton variant="rectangular" className="flex-1 h-2 rounded-full bg-dark-border/50" />
                     <Skeleton variant="text" className="w-8 h-4 bg-dark-border/50" />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Bot size={28} className="text-peach-500 mt-1" />
            <div>
              <h1 className="text-2xl font-bold text-dark-text">AI Dashboard</h1>
              <p className="text-sm text-dark-textMuted">AI Agent Performance & Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-textMuted">
            <RefreshCw size={12} className={refreshing ? 'animate-spin text-peach-500' : ''} />
            <span>Auto-refreshes every 30s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-dark-textMuted text-sm font-medium">Processed Messages</h3>
              <div className="text-peach-500 bg-peach-500/10 p-2 rounded">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-dark-text tracking-tight">{stats.totalProcessed}</p>
          </div>

          <div className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-dark-textMuted text-sm font-medium">Auto-Replied</h3>
              <div className="text-green-500 bg-green-500/10 p-2 rounded">
                <CheckCircle size={18} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-dark-text tracking-tight">{stats.autoReplied}</p>
          </div>

          <div className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-dark-textMuted text-sm font-medium">Tasks Extracted</h3>
              <div className="text-blue-500 bg-blue-500/10 p-2 rounded">
                <BarChart3 size={18} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-dark-text tracking-tight">{stats.tasksExtracted}</p>
          </div>

          <div className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-dark-textMuted text-sm font-medium">Avg Processing Time</h3>
              <div className="text-yellow-500 bg-yellow-500/10 p-2 rounded">
                <Clock size={18} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-dark-text tracking-tight">{stats.avgProcessingTime}s</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden flex flex-col shadow-sm">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
              <h2 className="font-semibold text-dark-text">Message Activity</h2>
            </div>
            <div className="p-6 flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" stroke="#a3a3a3" tick={{fontSize: 12}} />
                  <YAxis stroke="#a3a3a3" tick={{fontSize: 12}} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="messages" fill="#ff7e52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden flex flex-col shadow-sm">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
              <h2 className="font-semibold text-dark-text">Priority Distribution</h2>
            </div>
            <div className="p-6 flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              {priorityData.every((d) => d.value === 0) && (
                <p className="text-center text-dark-textMuted text-sm mt-4">No priority data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
          <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
            <h2 className="font-semibold text-dark-text">AI Agent Performance</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-dark-textMuted">Summary Accuracy</p>
                <span className="text-xs font-semibold text-dark-text">{performance.summary}%</span>
              </div>
              <div className="flex-1 bg-dark-bg/50 border border-dark-border rounded h-2">
                <div className="bg-peach-500 h-full rounded transition-all duration-500" style={{ width: `${performance.summary}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-dark-textMuted">Task Extraction Rate</p>
                <span className="text-xs font-semibold text-dark-text">{performance.taskRate}%</span>
              </div>
              <div className="flex-1 bg-dark-bg/50 border border-dark-border rounded h-2">
                <div className="bg-green-500 h-full rounded transition-all duration-500" style={{ width: `${performance.taskRate}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-dark-textMuted">Priority Detection</p>
                <span className="text-xs font-semibold text-dark-text">{performance.priorityDetection}%</span>
              </div>
              <div className="flex-1 bg-dark-bg/50 border border-dark-border rounded h-2">
                <div className="bg-blue-500 h-full rounded transition-all duration-500" style={{ width: `${performance.priorityDetection}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {recentReplies.length > 0 && (
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
              <h2 className="font-semibold text-dark-text">Recent AI Replies</h2>
            </div>
            <ul className="divide-y divide-dark-border">
              {recentReplies.map((m) => (
                <li key={m.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-text truncate">{m.subject || '(no subject)'}</p>
                    <p className="text-xs text-dark-textMuted truncate">From: {m.from}</p>
                  </div>
                  <span className="text-xs text-dark-textMuted whitespace-nowrap">
                    {formatDistanceToNow(new Date(m.receivedAt), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AIDashboard;
