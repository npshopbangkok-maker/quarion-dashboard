'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar, { MobileSearchBar } from '@/components/TopBar';
import DashboardCards from '@/components/DashboardCards';
import { IncomeExpenseChart, CategoryDonutChart } from '@/components/Charts';
import TransactionsTable from '@/components/TransactionsTable';
import { 
  User, 
  Transaction, 
  DashboardSummary, 
  MonthlyData, 
  CategoryData 
} from '@/types/database';

// Mock Data for Demo
const mockUser: User = {
  id: '1',
  name: 'สมชาย ใจดี',
  email: 'owner@demo.com',
  role: 'owner',
};

const mockSummary: DashboardSummary = {
  currentMonthIncome: 485000,
  currentMonthExpense: 312500,
  netProfit: 172500,
  totalTransactions: 156,
};

const mockMonthlyData: MonthlyData[] = [
  { month: 'ม.ค.', income: 320000, expense: 180000 },
  { month: 'ก.พ.', income: 380000, expense: 220000 },
  { month: 'มี.ค.', income: 420000, expense: 280000 },
  { month: 'เม.ย.', income: 350000, expense: 240000 },
  { month: 'พ.ค.', income: 480000, expense: 310000 },
  { month: 'มิ.ย.', income: 520000, expense: 350000 },
  { month: 'ก.ค.', income: 485000, expense: 312500 },
];

const mockCategoryData: CategoryData[] = [
  { name: 'เงินเดือน', value: 150000, color: '#ef4444' },
  { name: 'ค่าเช่า', value: 45000, color: '#f97316' },
  { name: 'ค่าน้ำค่าไฟ', value: 12500, color: '#eab308' },
  { name: 'อุปกรณ์สำนักงาน', value: 35000, color: '#22c55e' },
  { name: 'การตลาด', value: 55000, color: '#3b82f6' },
  { name: 'อื่นๆ', value: 15000, color: '#8b5cf6' },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 150000,
    category: 'ขายสินค้า',
    description: 'รายได้จากการขายสินค้า',
    date: '2026-01-15',
    created_by: '1',
    slip_url: null,
    created_at: '2026-01-15T10:00:00Z',
    user: { id: '1', name: 'สมชาย ใจดี', email: 'owner@demo.com', role: 'owner' },
  },
  {
    id: '2',
    type: 'expense',
    amount: 45000,
    category: 'ค่าเช่า',
    description: 'ค่าเช่าสำนักงาน',
    date: '2026-01-14',
    created_by: '2',
    slip_url: 'https://example.com/slip1.jpg',
    created_at: '2026-01-14T09:00:00Z',
    user: { id: '2', name: 'สมหญิง รักงาน', email: 'admin@demo.com', role: 'admin' },
  },
  {
    id: '3',
    type: 'income',
    amount: 85000,
    category: 'บริการ',
    description: 'รายได้จากบริการให้คำปรึกษา',
    date: '2026-01-13',
    created_by: '1',
    slip_url: null,
    created_at: '2026-01-13T14:00:00Z',
    user: { id: '1', name: 'สมชาย ใจดี', email: 'owner@demo.com', role: 'owner' },
  },
  {
    id: '4',
    type: 'expense',
    amount: 12500,
    category: 'ค่าน้ำค่าไฟ',
    description: 'ค่าสาธารณูปโภคประจำเดือน',
    date: '2026-01-12',
    created_by: '2',
    slip_url: 'https://example.com/slip2.jpg',
    created_at: '2026-01-12T11:00:00Z',
    user: { id: '2', name: 'สมหญิง รักงาน', email: 'admin@demo.com', role: 'admin' },
  },
  {
    id: '5',
    type: 'expense',
    amount: 35000,
    category: 'อุปกรณ์สำนักงาน',
    description: 'ซื้อคอมพิวเตอร์ใหม่',
    date: '2026-01-10',
    created_by: '1',
    slip_url: null,
    created_at: '2026-01-10T15:00:00Z',
    user: { id: '1', name: 'สมชาย ใจดี', email: 'owner@demo.com', role: 'owner' },
  },
  {
    id: '6',
    type: 'income',
    amount: 250000,
    category: 'ขายสินค้า',
    description: 'รายได้จากโปรเจกต์ใหญ่',
    date: '2026-01-08',
    created_by: '1',
    slip_url: 'https://example.com/slip3.jpg',
    created_at: '2026-01-08T16:00:00Z',
    user: { id: '1', name: 'สมชาย ใจดี', email: 'owner@demo.com', role: 'owner' },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(mockUser);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleLogout = () => {
    router.push('/login');
  };

  // Filter transactions based on search
  const filteredTransactions = mockTransactions.filter((t) =>
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />
      
      {/* Mobile Navigation */}
      <MobileNav user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300 pt-16 lg:pt-0">
        {/* Desktop Top Bar */}
        <TopBar 
          user={user} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Mobile Search */}
        <MobileSearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dashboard Content */}
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm lg:text-base text-gray-500">ภาพรวมรายรับ-รายจ่ายของคุณ</p>
            </div>
            <div className="text-xs lg:text-sm text-gray-500">
              อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
            </div>
          </div>

          {/* Summary Cards */}
          <DashboardCards summary={mockSummary} isLoading={isLoading} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="xl:col-span-2">
              <IncomeExpenseChart data={mockMonthlyData} isLoading={isLoading} />
            </div>
            <div>
              <CategoryDonutChart data={mockCategoryData} isLoading={isLoading} />
            </div>
          </div>

          {/* Transactions Table */}
          <TransactionsTable 
            transactions={filteredTransactions} 
            isLoading={isLoading} 
          />
        </div>
      </main>
    </div>
  );
}
