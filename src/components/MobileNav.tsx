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
  Menu,
  X,
  Calendar
} from 'lucide-react';
import { canAccessPage, PERMISSIONS, User } from '@/lib/auth';

interface MobileNavProps {
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

export default function MobileNav({ user, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    return canAccessPage(user.role, item.page);
  });

  return (
    <>
      {/* Mobile Header - supports iOS safe area */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1e1e2d] text-white pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-3 h-14">
          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 
                            flex items-center justify-center text-white font-bold text-sm shadow-lg">
              Q
            </div>
            <span className="font-semibold">Quarion</span>
          </div>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                          flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 h-full w-72 bg-[#1e1e2d] text-white z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                            flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'viewer'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                       text-gray-400 hover:text-white hover:bg-red-500/20 
                       transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
