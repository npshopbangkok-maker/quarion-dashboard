'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Receipt, 
  Upload, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3
} from 'lucide-react';
import { canAccessPage, PERMISSIONS, User } from '@/lib/auth';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

// Menu items configuration
const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    page: 'dashboard' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    page: 'transactions' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Upload Slip',
    href: '/upload',
    icon: Upload,
    page: 'upload' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    page: 'reports' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    page: 'calendar' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    page: 'analytics' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    page: 'users' as keyof typeof PERMISSIONS.pages,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    page: 'settings' as keyof typeof PERMISSIONS.pages,
  },
];

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    return canAccessPage(user.role, item.page);
  });

  return (
    <aside 
      className={`
        hidden lg:block fixed left-0 top-0 h-screen bg-[#1e1e2d] text-white
        transition-all duration-300 ease-in-out z-50
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-[#1e1e2d] rounded-full p-1.5 
                   border border-gray-700 hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Profile Card */}
      <div className="p-6 border-b border-gray-700">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                          flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* User Info */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role || 'viewer'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-3">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }
                    ${isCollapsed ? 'justify-center px-3' : ''}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className={`
            flex items-center gap-3 w-full px-4 py-3 rounded-xl
            text-gray-400 hover:text-white hover:bg-red-500/20 
            transition-all duration-200
            ${isCollapsed ? 'justify-center px-3' : ''}
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
