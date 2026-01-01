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
  X
} from 'lucide-react';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types/database';

interface MobileNavProps {
  user: User | null;
  onLogout: () => void;
}

// Helper function to check permission
function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Menu items configuration
const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'canViewDashboard' as const,
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    permission: 'canManageTransactions' as const,
  },
  {
    name: 'Upload Slip',
    href: '/upload',
    icon: Upload,
    permission: 'canUploadSlip' as const,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    permission: 'canViewReports' as const,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    permission: 'canManageUsers' as const,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'canViewDashboard' as const,
  },
];

export default function MobileNav({ user, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    return hasPermission(user.role, item.permission);
  });

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1e1e2d] text-white h-[72px]">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-3 hover:bg-gray-700 rounded-xl transition-colors active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 
                            flex items-center justify-center text-white font-bold text-lg shadow-lg">
              Q
            </div>
            <span className="font-bold text-lg">Quarion</span>
          </div>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                          flex items-center justify-center text-white font-bold shadow-lg">
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
