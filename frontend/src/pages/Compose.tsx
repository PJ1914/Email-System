import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { ENDPOINTS } from '@/config/constants';
import { Email } from '@/types';
import {
  Send, Trash2, Paperclip, Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link2, Type,
  ChevronDown, X, Plus, Clock, Minimize2, Maximize2, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '@/components/Skeleton';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExt from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';

// ── Recipient chip input ───────────────────────────────────────────────────
const RecipientInput: React.FC<{
  label: string;
  chips: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}> = ({ label, chips, onAdd, onRemove }) => {
  const [val, setVal] = useState('');

  const commit = () => {
    const v = val.trim();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !chips.includes(v)) {
      onAdd(v);
    }
    setVal('');
  };

  return (
    <div className="flex items-start gap-2 py-2 px-4 border-b border-dark-border/60 min-h-[42px]">
      <span className="text-xs text-dark-textMuted pt-1.5 w-10 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5 flex-1 items-center">
        {chips.map((c) => (
          <span key={c} className="flex items-center gap-1 bg-dark-border/60 text-dark-text text-xs px-2 py-0.5 rounded-full">
            {c}
            <button type="button" onClick={() => onRemove(c)} className="hover:text-red-400 transition-colors ml-0.5">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Backspace' && !val && chips.length > 0) {
              onRemove(chips[chips.length - 1]);
            }
          }}
          onBlur={commit}
          placeholder={chips.length === 0 ? 'Add recipient...' : ''}
          className="bg-transparent text-sm text-dark-text outline-none flex-1 min-w-[120px] placeholder:text-dark-textMuted/50"
        />
      </div>
    </div>
  );
};

// ── Toolbar button ─────────────────────────────────────────────────────────
const ToolBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={`p-1.5 rounded transition-colors ${
      active
        ? 'bg-peach-500/20 text-peach-400'
        : 'text-dark-textMuted hover:text-dark-text hover:bg-dark-border/40'
    } disabled:opacity-30`}
  >
    {children}
  </button>
);

// ── Main Compose ───────────────────────────────────────────────────────────
const Compose: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [emailId, setEmailId] = useState('');
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [scheduleTime, setScheduleTime] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'low'>('normal');
  const [showPriority, setShowPriority] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkExt.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: 'Write your message here…' }),
    ],
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[260px] text-sm text-dark-text leading-relaxed px-1',
      },
    },
  });

  useEffect(() => {
    fetchEmails();
  }, []);

  // close priority dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setShowPriority(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await api.get(ENDPOINTS.EMAILS.BASE);
      const list: Email[] = response.data.data.emails;
      setEmails(list);
      if (list.length > 0) setEmailId(list[0].id);
    } catch {
      /* ignore */
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((f) => f.name !== name));
  };

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkUrl('');
    setShowLinkModal(false);
  }, [editor, linkUrl]);

  const handleDiscard = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject('');
    setAttachments([]);
    setScheduleTime('');
    setShowCc(false);
    setShowBcc(false);
    editor?.commands.clearContent();
    toast('Draft discarded', { icon: '🗑️' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (to.length === 0) { toast.error('Add at least one recipient'); return; }
    if (!emailId) { toast.error('Select a From email'); return; }

    const htmlBody = editor?.getHTML() || '';
    const textBody = editor?.getText() || '';

    if (!textBody.trim()) { toast.error('Message body is empty'); return; }

    setLoading(true);
    try {
      await api.post(ENDPOINTS.MESSAGES.SEND, {
        emailId,
        to: to[0],          // primary recipient
        cc: cc.join(','),
        bcc: bcc.join(','),
        subject,
        body: htmlBody,
        priority,
        scheduledAt: scheduleTime || undefined,
      });

      toast.success(scheduleTime ? `Scheduled for ${new Date(scheduleTime).toLocaleString()}` : 'Message sent!');
      setTo([]);
      setCc([]);
      setBcc([]);
      setSubject('');
      setAttachments([]);
      setScheduleTime('');
      setShowSchedule(false);
      editor?.commands.clearContent();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const fontColors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#ffffff', '#9ca3af'];

  if (initialLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton variant="text" className="w-48 h-7 bg-dark-border/50" />
          <div className="border border-dark-border rounded bg-dark-surface p-6 space-y-4">
            {[1,2,3].map(k => <Skeleton key={k} variant="rectangular" className="w-full h-10 rounded bg-dark-border/50" />)}
            <Skeleton variant="rectangular" className="w-full h-64 rounded bg-dark-border/50" />
            <Skeleton variant="rectangular" className="w-40 h-10 rounded bg-dark-border/50" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`flex flex-col mx-auto w-full transition-all duration-200 ${isFullscreen ? 'fixed inset-0 z-50 bg-dark-bg p-4' : 'max-w-4xl'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-dark-text tracking-tight">New Message</h1>
          <div className="flex items-center gap-2">
            {/* Priority badge */}
            <div ref={priorityRef} className="relative">
              <button
                type="button"
                onClick={() => setShowPriority((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors ${
                  priority === 'high' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                  priority === 'low'  ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' :
                  'border-dark-border text-dark-textMuted bg-dark-surface'
                }`}
              >
                Priority: {priority} <ChevronDown size={12} />
              </button>
              {showPriority && (
                <div className="absolute right-0 top-8 bg-dark-card border border-dark-border rounded shadow-lg z-10 w-28 overflow-hidden">
                  {(['high', 'normal', 'low'] as const).map((p) => (
                    <button key={p} type="button" onClick={() => { setPriority(p); setShowPriority(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-dark-border/40 transition-colors ${priority === p ? 'text-peach-400' : 'text-dark-text'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setIsFullscreen((v) => !v)}
              className="p-1.5 text-dark-textMuted hover:text-dark-text hover:bg-dark-border/40 rounded transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>

        {/* Compose card */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 border border-dark-border rounded bg-dark-surface overflow-hidden shadow-sm">

          {/* From */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-dark-border/60">
            <span className="text-xs text-dark-textMuted w-10 shrink-0">From</span>
            <select value={emailId} onChange={(e) => setEmailId(e.target.value)}
              className="bg-transparent text-sm text-dark-text outline-none flex-1 cursor-pointer appearance-none"
              required
            >
              {emails.map((em) => (
                <option key={em.id} value={em.id} className="bg-dark-card">{em.address}</option>
              ))}
            </select>
            <div className="flex gap-2 text-[11px] text-dark-textMuted shrink-0">
              {!showCc && <button type="button" onClick={() => setShowCc(true)} className="hover:text-dark-text transition-colors">Cc</button>}
              {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="hover:text-dark-text transition-colors">Bcc</button>}
            </div>
          </div>

          {/* To / Cc / Bcc */}
          <RecipientInput label="To" chips={to} onAdd={(v) => setTo((p) => [...p, v])} onRemove={(v) => setTo((p) => p.filter((x) => x !== v))} />
          {showCc && <RecipientInput label="Cc" chips={cc} onAdd={(v) => setCc((p) => [...p, v])} onRemove={(v) => setCc((p) => p.filter((x) => x !== v))} />}
          {showBcc && <RecipientInput label="Bcc" chips={bcc} onAdd={(v) => setBcc((p) => [...p, v])} onRemove={(v) => setBcc((p) => p.filter((x) => x !== v))} />}

          {/* Subject */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-dark-border/60">
            <span className="text-xs text-dark-textMuted w-10 shrink-0">Subj</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="bg-transparent text-sm text-dark-text outline-none flex-1 placeholder:text-dark-textMuted/50"
              required
            />
          </div>

          {/* Formatting toolbar */}
          {editor && (
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-dark-border/60 bg-dark-card/40">
              <ToolBtn title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold size={14} /></ToolBtn>
              <ToolBtn title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic size={14} /></ToolBtn>
              <ToolBtn title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UnderlineIcon size={14} /></ToolBtn>
              <div className="w-px h-4 bg-dark-border mx-1" />
              <ToolBtn title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}><AlignLeft size={14} /></ToolBtn>
              <ToolBtn title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter size={14} /></ToolBtn>
              <ToolBtn title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}><AlignRight size={14} /></ToolBtn>
              <div className="w-px h-4 bg-dark-border mx-1" />
              <ToolBtn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List size={14} /></ToolBtn>
              <ToolBtn title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered size={14} /></ToolBtn>
              <div className="w-px h-4 bg-dark-border mx-1" />
              {/* Heading */}
              <select
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'p') editor.chain().focus().setParagraph().run();
                  else editor.chain().focus().setHeading({ level: parseInt(v) as 1|2|3 }).run();
                }}
                value={
                  editor.isActive('heading', { level: 1 }) ? '1' :
                  editor.isActive('heading', { level: 2 }) ? '2' :
                  editor.isActive('heading', { level: 3 }) ? '3' : 'p'
                }
                className="bg-dark-card border border-dark-border rounded text-xs text-dark-textMuted px-1 py-0.5 outline-none cursor-pointer mr-1"
              >
                <option value="p">Normal</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
              </select>
              {/* Font color */}
              <div className="flex items-center gap-0.5 mr-1">
                <Type size={13} className="text-dark-textMuted" />
                <div className="flex gap-0.5">
                  {fontColors.map((c) => (
                    <button key={c} type="button" title={`Color ${c}`}
                      onClick={() => editor.chain().focus().setColor(c).run()}
                      style={{ backgroundColor: c }}
                      className="w-3 h-3 rounded-full border border-dark-border/60 hover:scale-125 transition-transform"
                    />
                  ))}
                  <button type="button" title="Remove color"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    className="w-3 h-3 rounded-full border border-dark-border/60 bg-dark-bg hover:scale-125 transition-transform flex items-center justify-center"
                  >
                    <X size={7} className="text-dark-textMuted" />
                  </button>
                </div>
              </div>
              <div className="w-px h-4 bg-dark-border mx-1" />
              {/* Link */}
              <ToolBtn title="Insert link" onClick={() => setShowLinkModal(true)} active={editor.isActive('link')}><Link2 size={14} /></ToolBtn>
              <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}><RotateCcw size={13} /></ToolBtn>
            </div>
          )}

          {/* Editor body */}
          <div className="flex-1 px-5 py-4 overflow-y-auto min-h-[260px]">
            <EditorContent editor={editor} />
          </div>

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t border-dark-border/60 flex flex-wrap gap-2">
              {attachments.map((f) => (
                <div key={f.name} className="flex items-center gap-1.5 bg-dark-border/40 rounded px-2 py-1 text-xs text-dark-text">
                  <Paperclip size={11} className="text-dark-textMuted" />
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <span className="text-dark-textMuted">({(f.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => removeAttachment(f.name)} className="hover:text-red-400 transition-colors ml-0.5">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Schedule picker */}
          {showSchedule && (
            <div className="px-4 py-2 border-t border-dark-border/60 flex items-center gap-3">
              <Clock size={13} className="text-dark-textMuted shrink-0" />
              <input
                type="datetime-local"
                value={scheduleTime}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-dark-card border border-dark-border rounded text-xs text-dark-text px-2 py-1 outline-none"
              />
              <button type="button" onClick={() => { setShowSchedule(false); setScheduleTime(''); }}
                className="text-xs text-dark-textMuted hover:text-red-400 transition-colors">Cancel
              </button>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border bg-dark-card/30">
            <div className="flex items-center gap-2">
              {/* Send / Schedule Send */}
              <button type="submit" disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
              >
                <Send size={15} />
                {loading ? 'Sending…' : scheduleTime ? 'Schedule Send' : 'Send'}
              </button>

              {/* Schedule toggle */}
              <button type="button" title="Schedule send"
                onClick={() => setShowSchedule((v) => !v)}
                className={`p-2 rounded transition-colors ${showSchedule ? 'bg-peach-500/20 text-peach-400' : 'text-dark-textMuted hover:text-dark-text hover:bg-dark-border/40'}`}
              >
                <Clock size={15} />
              </button>

              {/* Attach */}
              <button type="button" title="Attach files" onClick={() => fileRef.current?.click()}
                className="p-2 text-dark-textMuted hover:text-dark-text hover:bg-dark-border/40 rounded transition-colors"
              >
                <Paperclip size={15} />
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleAttach} />

              {/* Add recipient */}
              <button type="button" title="Add Cc/Bcc"
                onClick={() => { setShowCc(true); setShowBcc(true); }}
                className="p-2 text-dark-textMuted hover:text-dark-text hover:bg-dark-border/40 rounded transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Discard */}
            <button type="button" onClick={handleDiscard}
              className="p-2 text-dark-textMuted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Discard"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </form>

        {/* Link modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-dark-card border border-dark-border rounded-lg p-5 w-80 shadow-xl">
              <h3 className="text-sm font-semibold text-dark-text mb-3">Insert Link</h3>
              <input
                type="url"
                value={linkUrl}
                autoFocus
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                placeholder="https://example.com"
                className="input-field text-sm mb-3"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowLinkModal(false); setLinkUrl(''); }}
                  className="px-3 py-1.5 text-xs text-dark-textMuted hover:text-dark-text border border-dark-border rounded transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={insertLink}
                  className="px-3 py-1.5 text-xs btn-primary">
                  Insert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tiptap placeholder styles */}
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }
        .tiptap a { color: #fb923c; text-decoration: underline; }
        .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
        .tiptap h2 { font-size: 1.25rem; font-weight: 600; margin: 0.4rem 0; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0.3rem 0; }
        .tiptap ul { list-style: disc; padding-left: 1.25rem; }
        .tiptap ol { list-style: decimal; padding-left: 1.25rem; }
      `}</style>
    </Layout>
  );
};

export default Compose;
