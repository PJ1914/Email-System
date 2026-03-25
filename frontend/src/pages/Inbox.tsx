import React, { useEffect, useState, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS, SLA_MS } from '@/config/constants';
import { Message, ReplyTemplate, Sentiment } from '@/types';
import {
  Inbox as InboxIcon, Search, Filter, ChevronLeft, ChevronRight,
  Trash2, CheckCheck, Reply, Download, Bell, BellOff, X,
  AlertTriangle, Clock, Tag, ChevronDown,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Skeleton from '@/components/Skeleton';
import toast from 'react-hot-toast';
import { STORAGE_KEYS } from '@/config/constants';

/** Firestore returns timestamps as { seconds, nanoseconds } â€” handle both shapes. */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (value._seconds !== undefined) return new Date(value._seconds * 1000);
  if (value.seconds !== undefined) return new Date(value.seconds * 1000);
  return new Date(value);
}

function toMs(value: any): number { return toDate(value).getTime(); }

function getSLAStatus(message: Message) {
  const slaRequired = SLA_MS[message.priority || 'low'];
  const elapsed = Date.now() - toMs(message.receivedAt);
  const breached = elapsed > slaRequired;
  const percentage = Math.min(100, Math.round((elapsed / slaRequired) * 100));
  return { slaRequired, elapsed, breached, percentage };
}

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: 'text-green-400 bg-green-500/10',
  negative: 'text-red-400 bg-red-500/10',
  neutral: 'text-gray-400 bg-gray-500/10',
  urgent: 'text-orange-400 bg-orange-500/10',
  frustrated: 'text-yellow-400 bg-yellow-500/10',
};
const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  positive: 'ðŸ˜Š', negative: 'ðŸ˜Ÿ', neutral: 'ðŸ˜', urgent: 'ðŸš¨', frustrated: 'ðŸ˜¤',
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-500 bg-red-500/10',
  high: 'text-orange-500 bg-orange-500/10',
  medium: 'text-blue-500 bg-blue-500/10',
  low: 'text-gray-500 bg-gray-500/10',
};

const ITEMS_PER_PAGE = 10;

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [replyBody, setReplyBody] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [threadView, setThreadView] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const prevCountRef = useRef(0);

  const pushNotification = useCallback((msg: Message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New email: ${msg.subject}`, { body: `From: ${msg.from}`, icon: '/favicon.ico' });
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const [inboxRes, tmplRes] = await Promise.all([
        api.get(ENDPOINTS.MESSAGES.INBOX),
        api.get(ENDPOINTS.REPLY_TEMPLATES.BASE).catch(() => ({ data: { data: { templates: [] } } })),
      ]);
      const incoming: Message[] = inboxRes.data.data.messages;
      setMessages(incoming);
      prevCountRef.current = incoming.length;
      setTemplates(tmplRes.data.data.templates);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // SSE real-time connection
  useEffect(() => {
    fetchMessages();
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const es = new EventSource(`${ENDPOINTS.MESSAGES.STREAM}?token=${encodeURIComponent(token || '')}`);
    sseRef.current = es;
    es.addEventListener('messages', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const incoming: Message[] = data.messages;
      setMessages((_prev) => {
        const prevCount = prevCountRef.current;
        if (incoming.length > prevCount) {
          incoming.slice(prevCount).forEach(pushNotification);
        }
        prevCountRef.current = incoming.length;
        return incoming;
      });
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, [fetchMessages, pushNotification]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') setNotificationsEnabled(true);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, filterPriority, filterSentiment, filterRead]);

  const requestNotification = async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setNotificationsEnabled(p === 'granted');
    if (p === 'granted') toast.success('Notifications enabled');
    else toast.error('Notifications blocked by browser');
  };

  const filtered = messages.filter((m) => {
    const matchSearch = m.subject.toLowerCase().includes(search.toLowerCase()) || m.from.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority ? m.priority === filterPriority : true;
    const matchSentiment = filterSentiment ? m.sentiment === filterSentiment : true;
    const matchRead = filterRead === 'unread' ? !m.isRead : filterRead === 'read' ? m.isRead : true;
    return matchSearch && matchPriority && matchSentiment && matchRead;
  });

  const displayMessages = threadView
    ? Object.values(
        filtered.reduce<Record<string, Message>>((acc, m) => {
          const key = m.threadId || m.id;
          if (!acc[key] || toMs(m.receivedAt) > toMs(acc[key].receivedAt)) acc[key] = m;
          return acc;
        }, {})
      ).sort((a, b) => toMs(b.receivedAt) - toMs(a.receivedAt))
    : filtered;

  const totalPages = Math.ceil(displayMessages.length / ITEMS_PER_PAGE) || 1;
  const currentMessages = displayMessages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const threadMessages = selectedMessage?.threadId
    ? messages.filter((m) => m.threadId === selectedMessage.threadId).sort((a, b) => toMs(a.receivedAt) - toMs(b.receivedAt))
    : selectedMessage ? [selectedMessage] : [];

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    setShowReply(false);
    setReplyBody('');
    if (!message.isRead) {
      api.patch(ENDPOINTS.MESSAGES.MARK_READ(message.id)).catch(() => {});
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleBulkAction = async (action: 'delete' | 'mark_read') => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await api.post(ENDPOINTS.MESSAGES.BULK, { ids: Array.from(selectedIds), action });
      if (action === 'delete') {
        setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
        if (selectedMessage && selectedIds.has(selectedMessage.id)) setSelectedMessage(null);
      } else {
        setMessages((prev) => prev.map((m) => (selectedIds.has(m.id) ? { ...m, isRead: true } : m)));
      }
      setSelectedIds(new Set());
      toast.success(action === 'delete' ? 'Messages deleted' : 'Marked as read');
    } catch { toast.error('Bulk action failed'); }
    finally { setBulkLoading(false); }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyBody.trim()) return;
    setReplyLoading(true);
    try {
      await api.post(ENDPOINTS.MESSAGES.REPLY(selectedMessage.id), { body: replyBody });
      toast.success('Reply sent');
      setShowReply(false);
      setReplyBody('');
    } catch { toast.error('Failed to send reply'); }
    finally { setReplyLoading(false); }
  };

  const handleExport = () => {
    api.get(ENDPOINTS.MESSAGES.EXPORT, { responseType: 'blob' }).then((res) => {
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'inbox.csv';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    });
  };

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
              <div className="h-10 bg-dark-card border-b border-dark-border px-4 flex items-center">
                <Skeleton variant="text" className="w-24 h-4 bg-dark-border/50" />
              </div>
              <div className="flex-1 divide-y divide-dark-border/60">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="p-4 space-y-2">
                    <Skeleton variant="text" className="w-3/4 h-4 bg-dark-border/50" />
                    <Skeleton variant="text" className="w-1/2 h-3 bg-dark-border/50" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block col-span-2 p-6 space-y-4">
              <Skeleton variant="text" className="w-1/2 h-6 bg-dark-border/50" />
              <Skeleton variant="text" className="w-full h-4 bg-dark-border/50" />
              <Skeleton variant="text" className="w-3/4 h-4 bg-dark-border/50" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-dark-text">Inbox</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setThreadView((v) => !v)} className={`px-3 py-1.5 text-xs rounded border transition-colors ${threadView ? 'border-peach-500 text-peach-400 bg-peach-500/10' : 'border-dark-border text-dark-textMuted hover:text-dark-text'}`}>
                Threads
              </button>
              <button onClick={requestNotification} title={notificationsEnabled ? 'Notifications on' : 'Enable notifications'} className="p-1.5 rounded border border-dark-border text-dark-textMuted hover:text-dark-text transition-colors">
                {notificationsEnabled ? <Bell size={15} className="text-peach-400" /> : <BellOff size={15} />}
              </button>
              <button onClick={handleExport} title="Export CSV" className="p-1.5 rounded border border-dark-border text-dark-textMuted hover:text-dark-text transition-colors">
                <Download size={15} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textMuted" size={15} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..." className="w-full pl-9 pr-3 py-2 bg-dark-surface border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500" />
            </div>
            <button onClick={() => setShowFilters((v) => !v)} className={`px-3 py-2 border rounded text-sm flex items-center gap-2 transition-colors ${showFilters || filterPriority || filterSentiment || filterRead ? 'border-peach-500 text-peach-400 bg-peach-500/10' : 'border-dark-border text-dark-textMuted bg-dark-surface hover:bg-dark-card'}`}>
              <Filter size={14} /> Filter {(filterPriority || filterSentiment || filterRead) && <span className="w-2 h-2 rounded-full bg-peach-500" />}
            </button>
          </div>

          {showFilters && (
            <div className="p-3 bg-dark-card border border-dark-border rounded flex flex-wrap gap-3">
              {[
                { label: 'Priority', value: filterPriority, setter: setFilterPriority, options: [['','All'],['urgent','Urgent'],['high','High'],['medium','Medium'],['low','Low']] },
                { label: 'Sentiment', value: filterSentiment, setter: setFilterSentiment, options: [['','All'],['positive','Positive ðŸ˜Š'],['negative','Negative ðŸ˜Ÿ'],['neutral','Neutral ðŸ˜'],['urgent','Urgent ðŸš¨'],['frustrated','Frustrated ðŸ˜¤']] },
                { label: 'Read', value: filterRead, setter: setFilterRead, options: [['','All'],['unread','Unread'],['read','Read']] },
              ].map(({ label, value, setter, options }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs text-dark-textMuted font-medium">{label}</label>
                  <select value={value} onChange={(e) => setter(e.target.value)} className="bg-dark-surface border border-dark-border rounded px-2 py-1 text-xs text-dark-text">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={() => { setFilterPriority(''); setFilterSentiment(''); setFilterRead(''); }} className="self-end flex items-center gap-1 text-xs text-dark-textMuted hover:text-red-400 transition-colors">
                <X size={11} /> Clear
              </button>
            </div>
          )}

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 py-2 px-3 bg-peach-500/10 border border-peach-500/30 rounded">
              <span className="text-xs text-peach-400 font-medium">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkAction('mark_read')} disabled={bulkLoading} className="flex items-center gap-1.5 text-xs px-3 py-1 bg-dark-surface border border-dark-border rounded hover:bg-dark-card text-dark-text transition-colors">
                <CheckCheck size={12} /> Mark read
              </button>
              <button onClick={() => handleBulkAction('delete')} disabled={bulkLoading} className="flex items-center gap-1.5 text-xs px-3 py-1 bg-red-500/10 border border-red-500/30 rounded hover:bg-red-500/20 text-red-400 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-dark-textMuted hover:text-dark-text"><X size={13} /></button>
            </div>
          )}
        </div>

        {/* Main split panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 border border-dark-border rounded overflow-hidden bg-dark-surface shadow-sm min-h-0">
          {/* Left: message list — hidden on mobile when detail is open */}
          <div className={`col-span-1 border-r border-dark-border flex flex-col overflow-hidden ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
            <div className="bg-dark-card px-4 py-2.5 border-b border-dark-border flex items-center justify-between">
              <h2 className="font-semibold text-dark-text text-sm">
                {threadView ? 'Threads' : 'Messages'}
                <span className="ml-1.5 text-xs font-normal text-dark-textMuted">({displayMessages.length})</span>
              </h2>
              <div className="flex items-center gap-1">
                <span className="text-xs text-dark-textMuted">{currentPage}/{totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 text-dark-textMuted hover:text-dark-text disabled:opacity-30"><ChevronLeft size={13} /></button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 text-dark-textMuted hover:text-dark-text disabled:opacity-30"><ChevronRight size={13} /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-dark-border/60">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-dark-textMuted">
                  <InboxIcon size={32} className="opacity-30" />
                  <p className="text-sm">No messages</p>
                </div>
              ) : currentMessages.map((message) => {
                const sla = getSLAStatus(message);
                const threadCount = message.threadId ? messages.filter((m) => m.threadId === message.threadId).length : 1;
                return (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-3 cursor-pointer transition-colors border-l-2 ${selectedMessage?.id === message.id ? 'bg-peach-500/10 border-l-peach-500' : 'border-l-transparent hover:bg-dark-bg'} ${!message.isRead ? 'bg-dark-card/40' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={selectedIds.has(message.id)} onChange={() => {}} onClick={(e) => toggleSelect(message.id, e)} className="mt-0.5 shrink-0 accent-peach-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <p className={`text-sm line-clamp-1 ${!message.isRead ? 'font-semibold text-dark-text' : 'text-dark-text/90'}`}>
                            {message.subject}
                            {threadView && threadCount > 1 && <span className="ml-1 text-[10px] px-1.5 rounded-full bg-dark-border text-dark-textMuted font-normal">{threadCount}</span>}
                            {!message.isRead && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-peach-500 align-middle" />}
                          </p>
                          {message.priority && <span className={`text-[9px] px-1 py-0.5 rounded uppercase font-bold shrink-0 ${PRIORITY_COLORS[message.priority]}`}>{message.priority}</span>}
                        </div>
                        <p className="text-xs text-dark-textMuted truncate">{message.from}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-dark-textMuted">{format(toDate(message.receivedAt), 'MMM dd, HH:mm')}</p>
                          <div className="flex items-center gap-1">
                            {message.sentiment && <span className={`text-[10px] px-1 py-0.5 rounded ${SENTIMENT_COLORS[message.sentiment]}`}>{SENTIMENT_EMOJI[message.sentiment]}</span>}
                            {sla.breached && <AlertTriangle size={11} className="text-red-400" />}
                          </div>
                        </div>
                        {message.priority && ['urgent', 'high'].includes(message.priority) && (
                          <div className="mt-1 h-0.5 bg-dark-border/40 rounded overflow-hidden">
                            <div className={`h-full rounded ${sla.breached ? 'bg-red-500' : sla.percentage > 75 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${sla.percentage}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: detail panel */}
          <div className={`col-span-2 flex flex-col overflow-hidden bg-dark-surface ${selectedMessage ? 'flex' : 'hidden md:flex'}`}>
            {selectedMessage ? (
              <>
                {/* Detail header */}
                <div className="p-4 border-b border-dark-border bg-dark-card flex items-start justify-between gap-3 shrink-0">
                  <div className="min-w-0">
                    {/* Mobile back button */}
                    <button onClick={() => setSelectedMessage(null)} className="md:hidden mb-2 flex items-center gap-1 text-xs text-peach-400 hover:text-peach-300">
                      <ChevronLeft size={14} /> Back to inbox
                    </button>
                    <h2 className="text-base font-bold text-dark-text mb-1 truncate">{selectedMessage.subject}</h2>
                    <div className="flex flex-wrap gap-x-3 text-xs text-dark-textMuted">
                      <span><b className="text-dark-text/80">From:</b> {selectedMessage.from}</span>
                      <span><b className="text-dark-text/80">To:</b> {selectedMessage.to}</span>
                      <span>{format(toDate(selectedMessage.receivedAt), 'PPpp')}</span>
                    </div>
                    {threadMessages.length > 1 && <p className="text-xs text-dark-textMuted mt-0.5">{threadMessages.length} messages in thread</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedMessage.priority && <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${PRIORITY_COLORS[selectedMessage.priority]}`}>{selectedMessage.priority}</span>}
                    {selectedMessage.sentiment && <span className={`px-2 py-1 rounded text-xs font-medium ${SENTIMENT_COLORS[selectedMessage.sentiment]}`}>{SENTIMENT_EMOJI[selectedMessage.sentiment]} {selectedMessage.sentiment}</span>}
                    <button onClick={() => setShowReply((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-peach-500/10 border border-peach-500/30 rounded text-xs text-peach-400 hover:bg-peach-500/20 transition-colors">
                      <Reply size={12} /> Reply
                    </button>
                  </div>
                </div>

                {/* SLA bar */}
                {(() => {
                  const sla = getSLAStatus(selectedMessage);
                  return (
                    <div className={`px-4 py-1.5 flex items-center gap-2 text-xs border-b border-dark-border/50 shrink-0 ${sla.breached ? 'bg-red-500/5' : ''}`}>
                      <Clock size={11} className={sla.breached ? 'text-red-400' : 'text-dark-textMuted'} />
                      <span className={sla.breached ? 'text-red-400' : 'text-dark-textMuted'}>
                        SLA: {sla.breached ? 'BREACHED â€” ' : ''}{formatDistanceToNow(toDate(selectedMessage.receivedAt))} elapsed
                      </span>
                      <div className="flex-1 h-1 bg-dark-border/40 rounded overflow-hidden mx-2">
                        <div className={`h-full rounded ${sla.breached ? 'bg-red-500' : sla.percentage > 75 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${sla.percentage}%` }} />
                      </div>
                      <span className={`font-medium ${sla.breached ? 'text-red-400' : 'text-dark-textMuted'}`}>{sla.percentage}%</span>
                    </div>
                  );
                })()}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {(threadView ? threadMessages : [selectedMessage]).map((msg) => (
                    <div key={msg.id} className={threadMessages.length > 1 ? 'border border-dark-border rounded p-4 bg-dark-card/20' : ''}>
                      {threadMessages.length > 1 && (
                        <div className="flex justify-between text-xs text-dark-textMuted border-b border-dark-border/50 pb-2 mb-3">
                          <b className="text-dark-text">{msg.from}</b>
                          <span>{format(toDate(msg.receivedAt), 'PPpp')}</span>
                        </div>
                      )}
                      {msg.summary && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mb-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">AI Summary</p>
                          <p className="text-sm text-dark-text">{msg.summary}</p>
                        </div>
                      )}
                      <div className="text-sm text-dark-text whitespace-pre-wrap leading-relaxed">{msg.body}</div>
                      {msg.tasks && msg.tasks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dark-border/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-dark-textMuted mb-2">Extracted Tasks</p>
                          <div className="space-y-2">
                            {msg.tasks.map((task) => (
                              <div key={task.id} className="bg-dark-bg border border-dark-border rounded p-3">
                                <p className="text-sm text-dark-text mb-1">{task.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</span>
                                  {task.deadline && <span className="text-xs text-dark-textMuted">Due: {format(toDate(task.deadline), 'PPP')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.isAutoReplied && msg.autoReply && (
                        <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1">Auto-Reply Sent</p>
                          <p className="text-sm text-dark-text whitespace-pre-wrap">{msg.autoReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reply composer */}
                {showReply && (
                  <div className="border-t border-dark-border p-4 bg-dark-card shrink-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-dark-textMuted uppercase tracking-wider">Reply to {selectedMessage.from}</p>
                      {templates.length > 0 && (
                        <div className="relative">
                          <button onClick={() => setShowTemplates((v) => !v)} className="flex items-center gap-1 text-xs text-dark-textMuted hover:text-peach-400 transition-colors">
                            <Tag size={11} /> Templates <ChevronDown size={11} />
                          </button>
                          {showTemplates && (
                            <div className="absolute right-0 bottom-full mb-1 w-52 bg-dark-card border border-dark-border rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                              {templates.map((t) => (
                                <button key={t.id} onClick={() => { setReplyBody(t.body); setShowTemplates(false); }} className="w-full text-left px-3 py-2 text-xs text-dark-text hover:bg-dark-surface border-b border-dark-border/50 last:border-0">
                                  <p className="font-medium">{t.name}</p>
                                  {t.category && <p className="text-dark-textMuted">{t.category}</p>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={4} placeholder="Write your reply..." className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-dark-text focus:outline-none focus:border-peach-500 resize-none" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setShowReply(false); setReplyBody(''); }} className="px-3 py-1.5 text-xs border border-dark-border rounded text-dark-textMuted hover:text-dark-text">Cancel</button>
                      <button onClick={handleReply} disabled={replyLoading || !replyBody.trim()} className="px-4 py-1.5 text-xs bg-peach-500 text-white rounded hover:bg-peach-600 disabled:opacity-50 transition-colors">
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-dark-textMuted gap-3">
                <InboxIcon size={48} className="opacity-20" />
                <p className="text-sm">Select a message to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;
