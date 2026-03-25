import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon, Bell, Shield, Zap, Globe, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, updateAutoMode } = useAuth();
  const { t, i18n } = useTranslation();
  const [autoMode, setAutoMode] = React.useState(user?.autoMode || false);
  const [language, setLanguage] = React.useState(localStorage.getItem('language') || 'en');
  const [pushEnabled, setPushEnabled] = React.useState(
    localStorage.getItem('push_notifications') === 'true'
  );

  const handleAutoModeToggle = async () => {
    try {
      await updateAutoMode(!autoMode);
      setAutoMode(!autoMode);
    } catch (error) {
      console.error('Failed to update auto mode:', error);
    }
  };

  const handleLanguageChange = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    toast.success(lng === 'hi' ? 'भाषा बदली गई' : 'Language changed to English');
  };

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      if (!('Notification' in window)) {
        toast.error('Browser does not support notifications');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }
    }
    const next = !pushEnabled;
    setPushEnabled(next);
    localStorage.setItem('push_notifications', String(next));
    toast.success(next ? 'Push notifications enabled' : 'Push notifications disabled');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={28} className="text-peach-500 mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-dark-text">Settings</h1>
            <p className="text-sm text-dark-textMuted">Manage your account and preferences</p>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
          <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center gap-2">
            <Shield size={18} className="text-dark-textMuted" />
            <h2 className="font-semibold text-dark-text">Account Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={user?.displayName || ''}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text text-sm focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text text-sm focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text text-sm focus:outline-none capitalize disabled:opacity-75 disabled:cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
          <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center gap-2">
            <Zap size={18} className="text-dark-textMuted" />
            <h2 className="font-semibold text-dark-text">Automation Settings</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded">
              <div className="flex-1">
                <p className="font-medium text-dark-text text-sm">Auto-Reply Mode</p>
                <p className="text-xs text-dark-textMuted mt-0.5">
                  Automatically generate and send AI-powered replies to incoming messages
                </p>
              </div>
              <button
                onClick={handleAutoModeToggle}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ml-4 shrink-0 ${
                  autoMode ? 'bg-peach-500' : 'bg-dark-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
              <p className="text-xs text-blue-400 font-medium">
                When auto-reply mode is enabled, AI agents will automatically process incoming
                messages and send professional responses. You can review all auto-replies in your
                inbox.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
          <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center gap-2">
            <Bell size={18} className="text-dark-textMuted" />
            <h2 className="font-semibold text-dark-text">{t('notifications')}</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded">
              <div>
                <p className="font-medium text-dark-text text-sm">Email Notifications</p>
                <p className="text-xs text-dark-textMuted mt-0.5">Receive email alerts for new messages</p>
              </div>
              <button className="relative inline-flex h-5 w-10 items-center rounded-full bg-peach-500 shrink-0 ml-4">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded">
              <div>
                <p className="font-medium text-dark-text text-sm">Task Reminders</p>
                <p className="text-xs text-dark-textMuted mt-0.5">Get notified about upcoming task deadlines</p>
              </div>
              <button className="relative inline-flex h-5 w-10 items-center rounded-full bg-peach-500 shrink-0 ml-4">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-bg border border-dark-border rounded">
              <div className="flex items-start gap-3">
                <BellRing size={18} className="text-peach-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-dark-text text-sm">{t('pushNotifications')}</p>
                  <p className="text-xs text-dark-textMuted mt-0.5">{t('enablePushNotifications')}</p>
                </div>
              </div>
              <button
                onClick={handlePushToggle}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ml-4 shrink-0 ${pushEnabled ? 'bg-peach-500' : 'bg-dark-border'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
          <div className="bg-dark-card px-5 py-3 border-b border-dark-border flex items-center gap-2">
            <Globe size={18} className="text-dark-textMuted" />
            <h2 className="font-semibold text-dark-text">{t('language')}</h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-dark-textMuted mb-4">Choose the interface language. Content will update immediately.</p>
            <div className="flex gap-3">
              {[{ code: 'en', label: 'English', native: 'English' }, { code: 'hi', label: 'Hindi', native: 'हिंदी' }].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex-1 px-4 py-3 rounded border text-sm font-medium transition-colors ${
                    language === lang.code
                      ? 'border-peach-500 bg-peach-500/10 text-peach-400'
                      : 'border-dark-border text-dark-textMuted hover:border-dark-text hover:text-dark-text'
                  }`}
                >
                  <span className="block">{lang.native}</span>
                  <span className="text-xs opacity-60">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded overflow-hidden shadow-sm">
          <div className="bg-dark-card px-5 py-3 border-b border-dark-border">
            <h2 className="font-semibold text-dark-text">Assigned Emails</h2>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {user?.assignedEmails && user.assignedEmails.length > 0 ? (
                user.assignedEmails.map((emailId) => (
                  <div
                    key={emailId}
                    className="px-4 py-3 bg-dark-bg border border-dark-border rounded flex items-center justify-between"
                  >
                    <p className="text-dark-text text-sm font-medium">{emailId}</p>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                ))
              ) : (
                <p className="text-dark-textMuted text-xs text-center py-4 bg-dark-bg border border-dark-border rounded">No emails assigned yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
