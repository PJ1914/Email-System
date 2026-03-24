import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Message } from '@/types';
import { Send, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const Sent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchSent();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchSent = async () => {
    try {
      const res = await api.get(ENDPOINTS.MESSAGES.SENT);
      setMessages(res.data.data.messages);
    } catch (error) {
      console.error('Failed to fetch sent messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = messages.filter(
    (m) =>
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.to.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const currentMessages = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
          <div className="mb-6">
             <Skeleton variant="text" className="w-32 h-8 mb-4 bg-dark-border/50" />
             <Skeleton variant="rectangular" className="w-full h-9 rounded bg-dark-border/50" />
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
          <h1 className="text-2xl font-bold text-dark-text mb-4">Sent</h1>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textMuted"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sent mail…"
              className="w-full pl-9 pr-3 py-2 bg-dark-surface border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500"
            />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 border border-dark-border rounded overflow-hidden bg-dark-surface shadow-sm">
          {/* List panel */}
          <div className="col-span-1 border-r border-dark-border flex flex-col overflow-hidden">
            <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center justify-between">
              <h2 className="font-semibold text-dark-text">
                {filtered.length} sent {filtered.length === 1 ? 'message' : 'messages'}
              </h2>
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
                  <Send size={32} className="mx-auto text-dark-textMuted mb-2 opacity-50" />
                  <p className="text-sm text-dark-textMuted">No sent messages yet</p>
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelected(msg)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selected?.id === msg.id
                        ? 'bg-peach-500/10 border-l-2 border-l-peach-500'
                        : 'bg-dark-surface hover:bg-dark-bg border-l-2 border-l-transparent'
                    }`}
                  >
                    <p className="font-medium text-dark-text text-sm line-clamp-1 mb-1.5 pr-2">
                      {msg.subject}
                    </p>
                    <p className="text-xs text-dark-textMuted mb-1 line-clamp-1">To: {msg.to}</p>
                    <p className="text-xs text-dark-textMuted">
                      {format(toDate(msg.receivedAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="col-span-2 overflow-y-auto flex flex-col bg-dark-surface">
            {selected ? (
              <div className="p-6 space-y-6">
                <div>
                  <div className="border-b border-dark-border pb-4 mb-4">
                    <h2 className="text-xl font-bold text-dark-text mb-2">{selected.subject}</h2>
                    <p className="text-sm text-dark-textMuted">
                      <span className="font-medium text-dark-text">To:</span> {selected.to}
                    </p>
                    <p className="text-sm text-dark-textMuted mt-1">
                      <span className="font-medium text-dark-text">Sent:</span>{' '}
                      {format(toDate(selected.receivedAt), 'PPpp')}
                    </p>
                  </div>
                  
                  <div className="text-sm text-dark-text whitespace-pre-wrap leading-relaxed">
                    {selected.body}
                  </div>
                </div>

                {selected.isAutoReplied && selected.autoReply && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">Auto-Reply Sent</p>
                    <p className="text-sm text-dark-text whitespace-pre-wrap">{selected.autoReply}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full flex-col text-dark-textMuted">
                <Send size={48} className="mb-4 opacity-50" />
                <p className="text-sm">Select a message to view content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sent;
