'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Star, BarChart3 } from 'lucide-react';

interface MonthlyReportProps {
  transactions: Transaction[];
  user: User | null;
}

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  avgDailyProfit: number;
  revenueExpenseRatio: number;
  bestDay: { day: number; profit: number } | null;
  worstDay: { day: number; profit: number } | null;
  daysWithLoss: number;
  daysWithProfit: number;
  daysWithData: number;
}

type Badge = 'excellent' | 'good' | 'average' | 'needsImprovement';

export default function MonthlyReport({ transactions, user }: MonthlyReportProps) {
  const report = useMemo((): ReportData => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const dailyData: { [day: number]: { income: number; expense: number; profit: number } } = {};

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const day = tDate.getDate();
        if (!dailyData[day]) {
          dailyData[day] = { income: 0, expense: 0, profit: 0 };
        }
        if (t.type === 'income') {
          dailyData[day].income += t.amount;
        } else {
          dailyData[day].expense += t.amount;
        }
        dailyData[day].profit = dailyData[day].income - dailyData[day].expense;
      }
    });

    let totalIncome = 0, totalExpense = 0;
    let bestDay: { day: number; profit: number } | null = null;
    let worstDay: { day: number; profit: number } | null = null;
    let daysWithLoss = 0, daysWithProfit = 0;

    Object.entries(dailyData).forEach(([dayStr, data]) => {
      const day = parseInt(dayStr);
      totalIncome += data.income;
      totalExpense += data.expense;

      if (data.profit > 0) daysWithProfit++;
      if (data.profit < 0) daysWithLoss++;

      if (!bestDay || data.profit > bestDay.profit) {
        bestDay = { day, profit: data.profit };
      }
      if (!worstDay || data.profit < worstDay.profit) {
        worstDay = { day, profit: data.profit };
      }
    });

    const daysWithData = Object.keys(dailyData).length;
    const totalProfit = totalIncome - totalExpense;
    const avgDailyProfit = daysWithData > 0 ? totalProfit / daysWithData : 0;
    const revenueExpenseRatio = totalExpense > 0 ? totalIncome / totalExpense : totalIncome > 0 ? Infinity : 0;

    return {
      totalIncome,
      totalExpense,
      totalProfit,
      avgDailyProfit,
      revenueExpenseRatio,
      bestDay,
      worstDay,
      daysWithLoss,
      daysWithProfit,
      daysWithData
    };
  }, [transactions]);

  const getBadge = (): { type: Badge; label: string; color: string; icon: React.ReactNode } => {
    const { revenueExpenseRatio, daysWithLoss, daysWithProfit, totalProfit } = report;

    if (totalProfit > 0 && revenueExpenseRatio >= 2 && daysWithLoss === 0) {
      return {
        type: 'excellent',
        label: 'ดีเยี่ยม',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <Star className="w-4 h-4" />
      };
    }
    if (totalProfit > 0 && revenueExpenseRatio >= 1.5) {
      return {
        type: 'good',
        label: 'ดีมาก',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <CheckCircle className="w-4 h-4" />
      };
    }
    if (totalProfit > 0) {
      return {
        type: 'average',
        label: 'ผ่าน',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <BarChart3 className="w-4 h-4" />
      };
    }
    return {
      type: 'needsImprovement',
      label: 'ควรปรับปรุง',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: <AlertTriangle className="w-4 h-4" />
    };
  };

  const badge = getBadge();
  const monthName = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  const getInsights = (): string[] => {
    const insights: string[] = [];

    if (report.totalProfit > 0) {
      insights.push(`✅ กำไรรวม ฿${report.totalProfit.toLocaleString()} เดือนนี้`);
    } else {
      insights.push(`⚠️ ขาดทุน ฿${Math.abs(report.totalProfit).toLocaleString()} เดือนนี้`);
    }

    if (report.avgDailyProfit > 0) {
      insights.push(`📈 กำไรเฉลี่ย ฿${Math.round(report.avgDailyProfit).toLocaleString()}/วัน`);
    }

    if (report.revenueExpenseRatio >= 2) {
      insights.push(`💪 รายรับมากกว่ารายจ่าย ${report.revenueExpenseRatio.toFixed(1)} เท่า`);
    } else if (report.revenueExpenseRatio >= 1) {
      insights.push(`📊 อัตราส่วนรายรับ/รายจ่าย = ${report.revenueExpenseRatio.toFixed(2)}`);
    }

    if (report.daysWithLoss > 0) {
      insights.push(`🔴 มีวันขาดทุน ${report.daysWithLoss} วัน`);
    } else if (report.daysWithProfit > 0) {
      insights.push(`🟢 ไม่มีวันขาดทุนเลย!`);
    }

    if (report.bestDay) {
      insights.push(`🏆 วันดีที่สุด: วันที่ ${report.bestDay.day} (฿${report.bestDay.profit.toLocaleString()})`);
    }

    return insights;
  };

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Monthly Report
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${badge.color}`}>
          {badge.icon}
          {badge.label}
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        รายงานเดือน {monthName}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">รายรับรวม</div>
          <div className="text-lg font-bold text-green-600">
            ฿{report.totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">รายจ่ายรวม</div>
          <div className="text-lg font-bold text-red-500">
            ฿{report.totalExpense.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">กำไรสุทธิ</div>
          <div className={`text-lg font-bold ${report.totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            ฿{report.totalProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">กำไรเฉลี่ย/วัน</div>
          <div className="font-bold text-gray-800">
            ฿{Math.round(report.avgDailyProfit).toLocaleString()}
          </div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Revenue/Expense Ratio</div>
          <div className="font-bold text-gray-800">
            {report.revenueExpenseRatio === Infinity ? '∞' : report.revenueExpenseRatio.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Insights
        </div>
        <div className="space-y-2">
          {getInsights().map((insight, i) => (
            <div key={i} className="text-sm text-gray-600">
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
