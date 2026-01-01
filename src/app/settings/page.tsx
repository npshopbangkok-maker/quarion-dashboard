'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import { 
  User as UserIcon, 
  Bell, 
  Lock, 
  Palette, 
  Database,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '@/types/database';

// Mock Data
const mockUser: User = {
  id: '1',
  name: 'สมชาย ใจดี',
  email: 'owner@demo.com',
  role: 'owner',
};

export default function SettingsPage() {
  const router = useRouter();
  const [user] = useState<User>(mockUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: mockUser.name,
    email: mockUser.email,
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    transactionAlerts: true,
    weeklyReport: false,
    monthlyReport: true,
  });

  const handleLogout = () => router.push('/login');

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('บันทึกข้อมูลสำเร็จ!');
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('เปลี่ยนรหัสผ่านสำเร็จ!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'โปรไฟล์', icon: UserIcon },
    { id: 'security', label: 'ความปลอดภัย', icon: Lock },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'appearance', label: 'ธีม', icon: Palette },
    { id: 'database', label: 'ฐานข้อมูล', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <MobileNav user={user} onLogout={handleLogout} />

      <main className="lg:ml-64 min-h-screen transition-all duration-300 pt-14 lg:pt-0">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-sm lg:text-base text-gray-500">จัดการการตั้งค่าระบบ</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Tabs Navigation - Horizontal scroll on mobile */}
            <div className="card lg:col-span-1 order-1">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0 lg:space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100 bg-gray-50 lg:bg-transparent'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="font-medium text-sm lg:text-base">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 order-2">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="card">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4 lg:mb-6">ข้อมูลโปรไฟล์</h3>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 
                                    flex items-center justify-center text-white text-3xl lg:text-4xl font-bold shadow-lg">
                      {profileForm.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left">
                      <button className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl 
                                        hover:bg-purple-100 transition-colors text-sm">
                        เปลี่ยนรูปภาพ
                      </button>
                      <p className="text-xs lg:text-sm text-gray-400 mt-2">JPG, PNG สูงสุด 2MB</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">สิทธิ์</label>
                      <input
                        type="text"
                        value={user.role.toUpperCase()}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl
                                   text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 
                                 text-white rounded-xl shadow-lg hover:shadow-purple-500/40 transition-all
                                 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">เปลี่ยนรหัสผ่าน</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่านปัจจุบัน
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                     focus:outline-none focus:ring-2 focus:ring-purple-500/20 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่านใหม่
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ยืนยันรหัสผ่านใหม่
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 
                                 text-white rounded-xl shadow-lg hover:shadow-purple-500/40 transition-all
                                 disabled:opacity-50"
                    >
                      <Lock className="w-5 h-5" />
                      <span>{isSaving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">การแจ้งเตือน</h3>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'รับการแจ้งเตือนทางอีเมล', desc: 'รับข่าวสารและการอัปเดตทางอีเมล' },
                      { key: 'transactionAlerts', label: 'แจ้งเตือนรายการใหม่', desc: 'รับการแจ้งเตือนเมื่อมีรายการใหม่' },
                      { key: 'weeklyReport', label: 'รายงานประจำสัปดาห์', desc: 'รับสรุปรายงานทุกสัปดาห์' },
                      { key: 'monthlyReport', label: 'รายงานประจำเดือน', desc: 'รับสรุปรายงานทุกเดือน' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-700">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications(prev => ({ 
                              ...prev, 
                              [item.key]: e.target.checked 
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                                          peer-checked:after:translate-x-full peer-checked:after:border-white 
                                          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                          after:bg-white after:border-gray-300 after:border after:rounded-full 
                                          after:h-5 after:w-5 after:transition-all 
                                          peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500">
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="card">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4 lg:mb-6">ธีมการแสดงผล</h3>
                  
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <button className="p-4 lg:p-6 bg-white border-2 border-purple-500 rounded-xl text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                        ☀️
                      </div>
                      <p className="font-medium text-gray-700 text-sm lg:text-base">Light</p>
                      <p className="text-xs lg:text-sm text-purple-500">กำลังใช้งาน</p>
                    </button>
                    <button className="p-4 lg:p-6 bg-gray-800 border-2 border-transparent rounded-xl text-center 
                                       hover:border-gray-600 transition-colors">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 bg-gray-700 rounded-xl flex items-center justify-center">
                        🌙
                      </div>
                      <p className="font-medium text-white text-sm lg:text-base">Dark</p>
                      <p className="text-xs lg:text-sm text-gray-400">เร็วๆ นี้</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Database Tab */}
              {activeTab === 'database' && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">ข้อมูล Supabase</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Project URL</p>
                      <p className="font-mono text-sm text-gray-700">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL || 'ยังไม่ได้ตั้งค่า'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">สถานะการเชื่อมต่อ</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        <span className="text-sm text-yellow-600">รอการเชื่อมต่อ</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY 
                      ในไฟล์ .env.local เพื่อเชื่อมต่อกับ Supabase
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
