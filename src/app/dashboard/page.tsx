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

// Default User
const mockUser: User = {
  id: '1',
  name: 'ผู้ใช้งาน',
  email: 'user@demo.com',
  role: 'owner',
};

// Empty initial data
const mockSummary: DashboardSummary = {
  currentMonthIncome: 0,
  currentMonthExpense: 0,
  netProfit: 0,
  totalTransactions: 0,
};

const mockMonthlyData: MonthlyData[] = [];

const mockCategoryData: CategoryData[] = [];

// Empty initial transactions
const mockTransactions: Transaction[] = [];

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
