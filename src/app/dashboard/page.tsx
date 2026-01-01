'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import DashboardCards from '@/components/DashboardCards';
import { IncomeExpenseChart, CategoryDonutChart } from '@/components/Charts';
import TransactionsTable from '@/components/TransactionsTable';
import ProtectedPage from '@/components/ProtectedPage';
import PushNotificationManager from '@/components/PushNotificationManager';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Transaction, 
  DashboardSummary, 
  MonthlyData, 
  CategoryData 
} from '@/types/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchTransactions,
  calculateSummary,
  calculateMonthlyData,
  calculateCategoryData,
} from '@/lib/database';
import {
  getTransactions as getLocalTransactions,
  calculateSummary as localCalculateSummary,
  calculateMonthlyData as localCalculateMonthlyData,
  calculateCategoryData as localCalculateCategoryData,
} from '@/lib/storage';
import { startPaymentReminders, requestNotificationPermission } from '@/lib/notifications';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    netProfit: 0,
    totalTransactions: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      let loadedTransactions: Transaction[];

      // Try Supabase first, fallback to localStorage
      if (isSupabaseConfigured()) {
        loadedTransactions = await fetchTransactions();
        // If Supabase returns empty but we have local data, use local
        if (loadedTransactions.length === 0) {
          const localData = getLocalTransactions();
          if (localData.length > 0) {
            loadedTransactions = localData;
          }
        }
      } else {
        loadedTransactions = getLocalTransactions();
      }

      setTransactions(loadedTransactions);
      setSummary(calculateSummary(loadedTransactions));
      setMonthlyData(calculateMonthlyData(loadedTransactions));
      setCategoryData(calculateCategoryData(loadedTransactions));

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Start payment reminders
  useEffect(() => {
    // Request permission first, then start reminders
    requestNotificationPermission().then(() => {
      const cleanup = startPaymentReminders();
      return cleanup;
    });
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter((t) =>
    t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedPage requiredPage="dashboard">
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />
      
      {/* Mobile Navigation */}
      <MobileNav user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300 mobile-content-pt">
        {/* Desktop Top Bar */}
        <TopBar 
          user={user} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dashboard Content */}
        <div className="p-3 lg:p-6 space-y-3 lg:space-y-6">
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
          <DashboardCards summary={summary} isLoading={isLoading} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="xl:col-span-2">
              <IncomeExpenseChart data={monthlyData} isLoading={isLoading} />
            </div>
            <div>
              <CategoryDonutChart data={categoryData} isLoading={isLoading} />
            </div>
          </div>

          {/* Transactions Table */}
          <TransactionsTable 
            transactions={filteredTransactions} 
            isLoading={isLoading} 
          />
        </div>
        
        {/* Push Notification Prompt */}
        <PushNotificationManager />
      </main>
    </div>
    </ProtectedPage>
  );
}
