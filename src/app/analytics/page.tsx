'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import ProtectedPage from '@/components/ProtectedPage';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchTransactions } from '@/lib/database';
import { getTransactions as getLocalTransactions } from '@/lib/storage';
import { isOwner } from '@/lib/auth';
import { BarChart3, Loader2 } from 'lucide-react';

// Owner-only components
import {
  FlowSignalHeatmap,
  MonthlyProgressTracker,
  MonthlyInsightChart,
  SavingGoalCard,
  QuickSnapshot,
  MonthlyReport,
  DailyFlowDirection,
  YearlyOverviewDashboard,
  RecentAdminActivity,
  CurrentBalanceCard,
  AICFOAdvisor
} from '@/components/owner';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      let loadedTransactions: Transaction[];

      if (isSupabaseConfigured()) {
        loadedTransactions = await fetchTransactions();
        if (loadedTransactions.length === 0) {
          loadedTransactions = getLocalTransactions();
        }
      } else {
        loadedTransactions = getLocalTransactions();
      }

      setTransactions(loadedTransactions);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Additional owner check (page is already protected)
  if (!isOwner(user)) {
    return (
      <ProtectedPage requiredPage="analytics">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-xl font-bold text-gray-800">ไม่มีสิทธิ์เข้าถึง</h1>
            <p className="text-gray-500 mt-2">หน้านี้สำหรับ Owner เท่านั้น</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredPage="analytics">
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Sidebar user={user} onLogout={handleLogout} />
        <MobileNav user={user} onLogout={handleLogout} />

        <main className="lg:ml-64 min-h-screen transition-all duration-300 mobile-content-pt overflow-x-hidden">
          <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <div className="p-3 lg:p-6 space-y-3 lg:space-y-6 max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                  Business Analytics
                </h1>
                <p className="text-sm lg:text-base text-gray-500">
                  วิเคราะห์ธุรกิจขั้นสูง (Owner Only)
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <>
                {/* Row 1: Current Balance + Quick Snapshot + Progress Tracker + Saving Goal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                  <CurrentBalanceCard transactions={transactions} user={user} />
                  <QuickSnapshot transactions={transactions} user={user} />
                  <MonthlyProgressTracker transactions={transactions} user={user} />
                  <SavingGoalCard transactions={transactions} user={user} />
                </div>

                {/* Row 2: Flow Signal + Monthly Insight */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                  <FlowSignalHeatmap transactions={transactions} user={user} />
                  <MonthlyInsightChart transactions={transactions} user={user} />
                </div>

                {/* Row 3: Daily Flow Direction */}
                <DailyFlowDirection transactions={transactions} user={user} />

                {/* Row 4: Monthly Report */}
                <MonthlyReport transactions={transactions} user={user} />

                {/* Row 5: AI CFO Advisor */}
                <AICFOAdvisor transactions={transactions} user={user} />

                {/* Row 6: Admin Activity + Yearly Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                  <RecentAdminActivity transactions={transactions} user={user} />
                  <YearlyOverviewDashboard transactions={transactions} user={user} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
