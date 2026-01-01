'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Eye,
  Search,
  UserPlus
} from 'lucide-react';
import { User, UserRole } from '@/types/database';

// Default User
const mockUser: User = {
  id: '1',
  name: 'ผู้ใช้งาน',
  email: 'user@demo.com',
  role: 'owner',
};

// Initial user (just current user)
const mockUsers: User[] = [
  {
    id: '1',
    name: 'ผู้ใช้งาน',
    email: 'user@demo.com',
    role: 'owner',
  },
];

const roleConfig = {
  owner: {
    label: 'Owner',
    color: 'bg-purple-100 text-purple-700',
    icon: ShieldCheck,
    description: 'สิทธิ์เต็ม - จัดการทุกอย่าง',
  },
  admin: {
    label: 'Admin',
    color: 'bg-blue-100 text-blue-700',
    icon: Shield,
    description: 'จัดการรายการ และอัปโหลดสลิป',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-gray-100 text-gray-700',
    icon: Eye,
    description: 'ดู Dashboard เท่านั้น',
  },
};

export default function UsersPage() {
  const router = useRouter();
  const [user] = useState<User>(mockUser);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as UserRole,
    password: '',
  });

  const handleLogout = () => router.push('/login');

  // Filter users
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Update existing user
      setUsers(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, name: formData.name, email: formData.email, role: formData.role }
            : u
        )
      );
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      setUsers(prev => [...prev, newUser]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'viewer',
      password: '',
    });
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id === user.id) {
      alert('ไม่สามารถลบบัญชีตัวเองได้');
      return;
    }
    if (confirm('คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <MobileNav user={user} onLogout={handleLogout} />

      <main className="lg:ml-64 min-h-screen transition-all duration-300 pt-14 lg:pt-0">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Mobile Search */}
          <div className="lg:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 
                           rounded-xl text-base focus:outline-none focus:ring-2 
                           focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Users</h1>
              <p className="text-sm lg:text-base text-gray-500">จัดการผู้ใช้งานในระบบ</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 
                         text-white rounded-xl shadow-lg shadow-purple-500/25 
                         hover:shadow-purple-500/40 transition-all text-sm lg:text-base"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้</span>
            </button>
          </div>

          {/* Role Legend */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">สิทธิ์การใช้งาน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {Object.entries(roleConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm lg:text-base">{config.label}</p>
                      <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile User Cards */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((userItem) => {
              const config = roleConfig[userItem.role];
              const RoleIcon = config.icon;
              return (
                <div key={userItem.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                                      flex items-center justify-center text-white font-bold">
                        {userItem.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          {userItem.name}
                          {userItem.id === user.id && <span className="text-xs text-purple-500 ml-1">(คุณ)</span>}
                        </p>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                      <RoleIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => handleEdit(userItem)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {userItem.id !== user.id && (
                      <button onClick={() => handleDelete(userItem.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Users Table */}
          <div className="card hidden lg:block">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">รายชื่อผู้ใช้</h3>
              <span className="text-sm text-gray-500">{filteredUsers.length} คน</span>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>อีเมล</th>
                    <th>สิทธิ์</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400">
                        ไม่พบผู้ใช้
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((userItem) => {
                      const config = roleConfig[userItem.role];
                      const RoleIcon = config.icon;

                      return (
                        <tr key={userItem.id} className="hover:bg-gray-50">
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 
                                              flex items-center justify-center text-white font-bold">
                                {userItem.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">{userItem.name}</p>
                                {userItem.id === user.id && (
                                  <span className="text-xs text-purple-500">(คุณ)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-gray-600">{userItem.email}</td>
                          <td>
                            <span className={`
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                              text-xs font-medium ${config.color}
                            `}>
                              <RoleIcon className="w-3.5 h-3.5" />
                              {config.label}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(userItem)}
                                className="p-2 text-gray-400 hover:text-blue-500 
                                           hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {userItem.id !== user.id && (
                                <button
                                  onClick={() => handleDelete(userItem.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 
                                             hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ชื่อผู้ใช้"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500"
                />
              </div>

              {/* Password (only for new users) */}
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่าน
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500"
                  />
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สิทธิ์
                </label>
                <div className="space-y-2">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    const isDisabled = editingUser?.id === user.id && role !== 'owner';

                    return (
                      <label
                        key={role}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                          ${formData.role === role
                            ? 'bg-purple-50 border-2 border-purple-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={formData.role === role}
                          onChange={() => setFormData(prev => ({ ...prev, role }))}
                          disabled={isDisabled}
                          className="hidden"
                        />
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{config.label}</p>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl 
                             hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 
                             text-white rounded-xl shadow-lg hover:shadow-purple-500/40 
                             transition-all"
                >
                  {editingUser ? 'บันทึก' : 'เพิ่มผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
