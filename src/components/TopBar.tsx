'use client';

import { Search, Bell, ChevronDown } from 'lucide-react';
import { User } from '@/types/database';

interface TopBarProps {
  user: User | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TopBar({ user, searchQuery = '', onSearchChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 
                       lg:block hidden">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหารายการ..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 
                         rounded-xl text-sm focus:outline-none focus:ring-2 
                         focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 
                             hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <button className="flex items-center gap-3 p-2 hover:bg-gray-100 
                             rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                            flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'viewer'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>
        </div>
      </div>
    </header>
  );
}

// Mobile Search Bar Component
export function MobileSearchBar({ searchQuery = '', onSearchChange }: { 
  searchQuery?: string; 
  onSearchChange?: (query: string) => void;
}) {
  return (
    <div className="lg:hidden fixed top-16 left-0 right-0 z-40 px-4 py-3 bg-white border-b border-gray-100">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหารายการ..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 
                     rounded-xl text-sm focus:outline-none focus:ring-2 
                     focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        />
      </div>
    </div>
  );
}
