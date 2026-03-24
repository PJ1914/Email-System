import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="h-16 bg-dark-bg border-b border-dark-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textMuted" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-1.5 bg-dark-surface border border-dark-border/80 rounded text-sm text-dark-text placeholder-dark-textMuted focus:outline-none focus:border-peach-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-dark-textMuted hover:bg-dark-surface hover:text-dark-text rounded transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-peach-500 rounded-full border-2 border-dark-bg"></span>
        </button>

        <div className="flex items-center gap-3 ml-2 border-l border-dark-border pl-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-dark-text">{user?.displayName}</p>
            <p className="text-xs text-dark-textMuted capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 bg-dark-surface border border-dark-border rounded flex items-center justify-center text-peach-500 font-semibold text-sm">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
