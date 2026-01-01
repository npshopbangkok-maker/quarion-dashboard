'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar, { MobileSearchBar } from '@/components/TopBar';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter
} from 'lucide-react';
import { User, MonthlyData, CategoryData } from '@/types/database';
import { IncomeExpenseChart, CategoryDonutChart } from '@/components/Charts';
import {
  getTransactions,
  initializeUser,
  calculateMonthlyData,
  calculateCategoryData,
} from '@/lib/storage';

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date().getFullYear() + '-01-01',
    end: new Date().getFullYear() + '-12-31',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const loadedUser = initializeUser();
    setUser(loadedUser);

    const transactions = getTransactions();
    setMonthlyData(calculateMonthlyData(transactions));
    setCategoryData(calculateCategoryData(transactions));
  }, []);

  const handleLogout = () => router.push('/login');

  // Calculate totals
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const netProfit = totalIncome - totalExpense;

  // Export functions
  const handleExportPDF = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('ดาวน์โหลด PDF สำเร็จ!');
    setIsExporting(false);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('ดาวน์โหลด Excel สำเร็จ!');
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <MobileNav user={user} onLogout={handleLogout} />

      <main className="lg:ml-64 min-h-screen transition-all duration-300 pt-16 lg:pt-0">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <MobileSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Reports</h1>
              <p className="text-sm lg:text-base text-gray-500">รายงานสรุปข้อมูลทางการเงิน</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-gray-200 
                           rounded-xl text-gray-600 hover:bg-gray-50 transition-colors
                           disabled:opacity-50 text-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span> PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 
                           text-white rounded-xl shadow-lg shadow-green-500/25 
                           hover:shadow-green-500/40 transition-all disabled:opacity-50 text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span> Excel
              </button>
            </div>
          </div>

          {/* Date Filter */}
          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-5 h-5" />
                <span className="font-medium text-sm lg:text-base">ช่วงเวลา:</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                />
                <span className="text-gray-400 hidden sm:inline">ถึง</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 
                                 rounded-lg hover:bg-purple-100 transition-colors">
                <Filter className="w-4 h-4" />
                <span>กรอง</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
            <div className="card bg-gradient-to-br from-pink-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500 mb-1">รายรับรวม</p>
                  <p className="text-lg lg:text-2xl font-bold text-purple-600">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl shadow-lg">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500 mb-1">รายจ่ายรวม</p>
                  <p className="text-lg lg:text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`card ${netProfit >= 0 
              ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' 
              : 'bg-gradient-to-br from-red-500/10 to-rose-500/10'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500 mb-1">กำไรสุทธิ</p>
                  <p className={`text-lg lg:text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div className={`p-2 lg:p-3 rounded-xl shadow-lg ${netProfit >= 0 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-br from-red-500 to-rose-500'}`}
                >
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2">
              <IncomeExpenseChart data={monthlyData} />
            </div>
            <div>
              <CategoryDonutChart data={categoryData} />
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="card">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">สรุปรายเดือน</h3>
            {monthlyData.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="table-container overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>เดือน</th>
                      <th className="text-right">รายรับ</th>
                      <th className="text-right">รายจ่าย</th>
                      <th className="text-right">กำไร/ขาดทุน</th>
                      <th className="text-right">%กำไร</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((data) => {
                      const profit = data.income - data.expense;
                      const profitPercent = data.income > 0 ? ((profit / data.income) * 100).toFixed(1) : '0.0';
                      
                      return (
                        <tr key={data.month} className="hover:bg-gray-50">
                          <td className="font-medium text-gray-700">{data.month}</td>
                          <td className="text-right text-purple-600">{formatCurrency(data.income)}</td>
                          <td className="text-right text-red-600">{formatCurrency(data.expense)}</td>
                          <td className={`text-right font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                          </td>
                          <td className="text-right">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                              ${profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                            `}>
                              {profit >= 0 ? '+' : ''}{profitPercent}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="text-gray-800">รวมทั้งหมด</td>
                      <td className="text-right text-purple-600">{formatCurrency(totalIncome)}</td>
                      <td className="text-right text-red-600">{formatCurrency(totalExpense)}</td>
                      <td className={`text-right ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                      </td>
                      <td className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                          ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {netProfit >= 0 ? '+' : ''}{totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
