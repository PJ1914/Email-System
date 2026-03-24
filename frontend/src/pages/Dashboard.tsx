import React, { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Mail, Inbox, CheckCircle, Clock } from 'lucide-react';
import Skeleton from '@/components/Skeleton';
import { Message, Email, TaskStatus } from '@/types';

const POLL_INTERVAL = 30_000; // refresh every 30 seconds

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchDashboardData();
    pollRef.current = setInterval(fetchDashboardData, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [inboxRes, sentRes, emailsRes] = await Promise.all([
        api.get(ENDPOINTS.MESSAGES.INBOX),
        api.get(ENDPOINTS.MESSAGES.SENT),
        api.get(ENDPOINTS.EMAILS.BASE),
      ]);

      const inboxMessages: Message[] = inboxRes.data.data.messages;
      const sentMessages: Message[] = sentRes.data.data.messages;
      const allMessages = [...inboxMessages, ...sentMessages];

      setRecentMessages(inboxMessages.slice(0, 5));
      setEmails(emailsRes.data.data.emails);

      const allTasks = allMessages.flatMap((m: Message) => m.tasks || []);
      const completedTasks = allTasks.filter(
        (t) => t.status === TaskStatus.COMPLETED
      ).length;
      const pendingTasks = allTasks.filter(
        (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
      ).length;

      setStats({
        totalMessages: allMessages.length,
        unreadMessages: inboxMessages.filter((m: Message) => !m.processedAt).length,
        completedTasks,
        pendingTasks,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
  }> = ({ icon: Icon, label, value, color }) => (
    <div className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32 hover:border-dark-textMuted/40 transition-colors">
      <div className="flex items-start justify-between">
        <p className="text-dark-textMuted text-sm font-medium">{label}</p>
        <Icon size={18} className={`text-${color}-500/80`} />
      </div>
      <div>
        <p className="text-3xl font-semibold text-dark-text tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <Skeleton variant="text" className="w-32 h-8 mb-2" />
            <Skeleton variant="text" className="w-48 h-4" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map(key => (
               <div key={key} className="bg-dark-surface border border-dark-border p-5 rounded flex flex-col justify-between h-32">
                 <div className="flex items-start justify-between mb-4">
                   <Skeleton variant="text" className="w-24 h-4" />
                   <Skeleton variant="circular" className="w-5 h-5 bg-dark-border" />
                 </div>
                 <Skeleton variant="text" className="w-12 h-8 mt-auto" />
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-surface border border-dark-border rounded overflow-hidden flex flex-col shadow-sm">
              <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
                <Skeleton variant="text" className="w-32 h-4" />
              </div>
              <div className="flex flex-col divide-y divide-dark-border/60">
                {[1, 2, 3, 4, 5].map(key => (
                  <div key={key} className="p-4 flex flex-col gap-2">
                    <Skeleton variant="text" className="w-3/4 h-4" />
                    <Skeleton variant="text" className="w-1/4 h-3" />
                    <Skeleton variant="text" className="w-full h-3" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded overflow-hidden flex flex-col shadow-sm">
              <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
                <Skeleton variant="text" className="w-32 h-4" />
              </div>
              <div className="flex flex-col divide-y divide-dark-border/60">
                {[1, 2, 3, 4, 5].map(key => (
                  <div key={key} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 w-full">
                      <Skeleton variant="rectangular" className="w-8 h-8 rounded shrink-0 bg-dark-border" />
                      <div className="flex flex-col w-full gap-1.5">
                        <Skeleton variant="text" className="w-1/2 h-4" />
                        <Skeleton variant="text" className="w-1/4 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-dark-text tracking-tight mb-1">Overview</h1>
          <p className="text-dark-textMuted text-sm">Welcome back, {user?.displayName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Mail} label="Total Messages" value={stats.totalMessages} color="peach" />
          <StatCard icon={Inbox} label="Unread" value={stats.unreadMessages} color="blue" />
          <StatCard icon={CheckCircle} label="Completed Tasks" value={stats.completedTasks} color="green" />
          <StatCard icon={Clock} label="Pending Tasks" value={stats.pendingTasks} color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden flex flex-col shadow-sm">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dark-text uppercase tracking-wider">Recent Messages</h2>
            </div>
            <div className="flex flex-col divide-y divide-dark-border/60">
              {recentMessages.length === 0 ? (
                <div className="p-10 text-center text-dark-textMuted text-sm">No messages yet in your inbox.</div>
              ) : (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex flex-col p-4 hover:bg-dark-border/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-semibold text-dark-text text-sm group-hover:text-peach-400 transition-colors truncate pr-4">{message.subject}</p>
                      {message.priority && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold whitespace-nowrap ${
                            message.priority === 'urgent'
                              ? 'bg-red-500/10 text-red-500'
                              : message.priority === 'high'
                              ? 'bg-orange-500/10 text-orange-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {message.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                       <Mail size={12} className="text-dark-textMuted" />
                       <p className="text-xs text-dark-textMuted font-medium truncate">{message.from}</p>
                    </div>
                    {message.summary && (
                      <p className="text-xs text-dark-textMuted leading-relaxed line-clamp-2">{message.summary}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded overflow-hidden flex flex-col shadow-sm">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dark-text uppercase tracking-wider">Monitored Inboxes</h2>
            </div>
            <div className="flex flex-col divide-y divide-dark-border/60">
              {emails.length === 0 ? (
                <div className="p-10 text-center text-dark-textMuted text-sm">No email addresses assigned to monitor.</div>
              ) : (
                emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 hover:bg-dark-border/20 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-dark-bg border border-dark-border flex items-center justify-center">
                        <Inbox size={14} className="text-dark-textMuted" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-dark-text group-hover:text-white transition-colors">{email.address}</p>
                        <p className="text-xs text-dark-textMuted mt-0.5">{email.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dark-textMuted hidden sm:block">
                        {email.isActive ? 'Active' : 'Offline'}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          email.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
