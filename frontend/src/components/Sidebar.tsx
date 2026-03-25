import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  Inbox,
  Send,
  Settings,
  Users,
  Bot,
  LogOut,
  Menu,
  X,
  Cloud,
  Shield,
  BarChart3,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Inbox, label: 'Inbox', path: '/inbox' },
    { icon: Send, label: 'Sent', path: '/sent' },
    { icon: Mail, label: 'Compose', path: '/compose' },
    { icon: Bot, label: 'AI Dashboard', path: '/ai-dashboard' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Tag, label: 'Templates', path: '/templates' },
  ];

  if (user?.role === UserRole.ADMIN) {
    menuItems.push(
      { icon: Mail, label: 'Email Management', path: '/emails' },
      { icon: Cloud, label: 'SES Configuration', path: '/ses-config' },
      { icon: Shield, label: 'Roles', path: '/roles' },
      { icon: Users, label: 'Users', path: '/users' }
    );
  }

  menuItems.push({ icon: Settings, label: 'Settings', path: '/settings' });

  return (
    <div
      className={`${collapsed ? 'w-20' : 'w-64'
        } h-screen bg-dark-bg border-r border-dark-border flex flex-col transition-all duration-300`}
    >
      <div className="h-16 flex items-center justify-between px-5 border-b border-dark-border">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-dark-text tracking-wide flex items-center gap-2">
             <Bot size={20} className="text-peach-500" />
             AI Platform
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-dark-textMuted hover:bg-dark-surface hover:text-dark-text rounded transition-colors ml-auto flex items-center justify-center"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-5 py-2.5 relative transition-colors ${
                isActive(item.path)
                ? 'bg-dark-surface text-dark-text'
                : 'text-dark-textMuted hover:bg-dark-surface/50 hover:text-dark-text'
              }`}
          >
            {isActive(item.path) && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-peach-500" />
            )}
            <item.icon size={18} className={isActive(item.path) ? 'text-peach-500' : 'text-dark-textMuted'} />
            {!collapsed && <span className={`text-sm font-medium ${isActive(item.path) ? 'text-dark-text' : ''}`}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="py-4 border-t border-dark-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 py-2.5 w-full text-left text-dark-textMuted hover:bg-dark-surface/50 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium flex-1">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
