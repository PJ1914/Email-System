import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Message } from '@/types';
import { Inbox as InboxIcon, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import Skeleton from '@/components/Skeleton';

/** Firestore returns timestamps as { seconds, nanoseconds } — handle both shapes. */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (value._seconds !== undefined) return new Date(value._seconds * 1000);
  if (value.seconds !== undefined) return new Date(value.seconds * 1000);
  return new Date(value);
}

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = messages.filter(
    (m) =>
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.from.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const currentMessages = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const fetchMessages = async () => {
    try {
      const response = await api.get(ENDPOINTS.MESSAGES.INBOX);
      setMessages(response.data.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
          <div className="mb-6">
             <Skeleton variant="text" className="w-32 h-8 mb-4 bg-dark-border/50" />
             <div className="flex gap-4">
               <Skeleton variant="rectangular" className="w-full h-9 rounded bg-dark-border/50" />
               <Skeleton variant="rectangular" className="w-24 h-9 rounded bg-dark-border/50 shrink-0" />
             </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 border border-dark-border rounded overflow-hidden bg-dark-surface shadow-sm">
            <div className="col-span-1 border-r border-dark-border flex flex-col">
               <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
                 <Skeleton variant="text" className="w-24 h-5 bg-dark-border/50" />
               </div>
               <div className="flex-1 divide-y divide-dark-border/60">
                 {[1, 2, 3, 4, 5].map(i => (
                   <div key={i} className="p-4 flex flex-col gap-2">
                     <Skeleton variant="text" className="w-3/4 h-4 bg-dark-border/50" />
                     <Skeleton variant="text" className="w-1/2 h-3 bg-dark-border/50" />
                     <Skeleton variant="text" className="w-1/4 h-3 bg-dark-border/50" />
                   </div>
                 ))}
               </div>
            </div>
            <div className="hidden md:block col-span-2 p-6 space-y-6 bg-dark-surface">
              <div>
                <Skeleton variant="text" className="w-1/2 h-8 mb-4 bg-dark-border/50" />
                <div className="space-y-2 mb-6">
                   <Skeleton variant="text" className="w-1/4 h-4 bg-dark-border/50" />
                   <Skeleton variant="text" className="w-1/3 h-4 bg-dark-border/50" />
                </div>
                <div className="space-y-2">
                   <Skeleton variant="text" className="w-full h-4 bg-dark-border/50" />
                   <Skeleton variant="text" className="w-full h-4 bg-dark-border/50" />
                   <Skeleton variant="text" className="w-3/4 h-4 bg-dark-border/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-text mb-4">Inbox</h1>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textMuted" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 bg-dark-surface border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500"
              />
            </div>
            <button className="px-4 py-2 bg-dark-surface border border-dark-border rounded text-sm flex items-center gap-2 hover:bg-dark-card transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 border border-dark-border rounded overflow-hidden bg-dark-surface shadow-sm">
          <div className="col-span-1 border-r border-dark-border flex flex-col overflow-hidden">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center justify-between">
               <h2 className="font-semibold text-dark-text">Messages</h2>
               <div className="flex items-center gap-3">
                 <span className="text-xs text-dark-textMuted">
                   {currentPage} / {totalPages}
                 </span>
                 <div className="flex">
                   <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-1 rounded text-dark-textMuted hover:text-dark-text disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <ChevronLeft size={16} />
                   </button>
                   <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                     className="p-1 rounded text-dark-textMuted hover:text-dark-text disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <ChevronRight size={16} />
                   </button>
                 </div>
               </div>
            </div>
            <div className="overflow-y-auto flex-1 flex flex-col divide-y divide-dark-border/60">
              {currentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <InboxIcon size={32} className="mx-auto text-dark-textMuted mb-2 opacity-50" />
                  <p className="text-sm text-dark-textMuted">No messages</p>
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id
                        ? 'bg-peach-500/10 border-l-2 border-l-peach-500'
                        : 'bg-dark-surface hover:bg-dark-bg border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="font-medium text-dark-text text-sm line-clamp-1 pr-2">
                        {message.subject}
                      </p>
                      {message.priority && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${getPriorityColor(
                            message.priority
                          )}`}
                        >
                          {message.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-textMuted mb-1 line-clamp-1">From: {message.from}</p>
                    <p className="text-xs text-dark-textMuted">
                      {format(toDate(message.receivedAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="col-span-2 overflow-y-auto flex flex-col bg-dark-surface">
            {selectedMessage ? (
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-4 border-b border-dark-border pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-dark-text mb-2">
                        {selectedMessage.subject}
                      </h2>
                      <p className="text-sm text-dark-textMuted">
                        <span className="font-medium text-dark-text">From:</span> {selectedMessage.from}
                      </p>
                      <p className="text-sm text-dark-textMuted">
                        <span className="font-medium text-dark-text">To:</span> {selectedMessage.to}
                      </p>
                      <p className="text-sm text-dark-textMuted mt-1">
                        {format(toDate(selectedMessage.receivedAt), 'PPpp')}
                      </p>
                    </div>
                    {selectedMessage.priority && (
                      <span
                        className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${getPriorityColor(
                          selectedMessage.priority
                        )}`}
                      >
                        {selectedMessage.priority}
                      </span>
                    )}
                  </div>

                  {selectedMessage.summary && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4 mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">AI Summary</p>
                      <p className="text-sm text-dark-text">{selectedMessage.summary}</p>
                    </div>
                  )}

                  <div className="text-sm text-dark-text whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.body}
                  </div>
                </div>

                {selectedMessage.tasks && selectedMessage.tasks.length > 0 && (
                  <div className="pt-4 border-t border-dark-border">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-textMuted mb-3">Extracted Tasks</h3>
                    <div className="space-y-2 flex flex-col divide-y divide-dark-border/60 border border-dark-border rounded">
                      {selectedMessage.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-dark-surface p-4 flex flex-col gap-2"
                        >
                          <p className="text-sm text-dark-text">{task.description}</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.deadline && (
                              <span className="text-xs text-dark-textMuted">
                                Due: {format(toDate(task.deadline), 'PPP')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMessage.isAutoReplied && selectedMessage.autoReply && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">Auto-Reply Sent</p>
                    <p className="text-sm text-dark-text whitespace-pre-wrap">{selectedMessage.autoReply}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full flex-col text-dark-textMuted">
                <InboxIcon size={48} className="mb-4 opacity-50" />
                <p className="text-sm">Select a message to view content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;
