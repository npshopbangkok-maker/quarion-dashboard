'use client';

import { useMemo, useState } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Award, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface YearlyOverviewDashboardProps {
  transactions: Transaction[];
  user: User | null;
}

interface MonthData {
  month: string;
  monthNum: number;
  income: number;
  expense: number;
  profit: number;
}

export default function YearlyOverviewDashboard({ transactions, user }: YearlyOverviewDashboardProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  type YearlyDataResult = {
    months: MonthData[];
    totalIncome: number;
    totalExpense: number;
    totalProfit: number;
    avgMonthlyProfit: number;
    bestMonth: MonthData | null;
    worstMonth: MonthData | null;
    monthsWithLoss: number;
    monthsWithProfit: number;
  };

  const yearlyData = useMemo((): YearlyDataResult => {
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // Initialize all months
    const monthlyData: MonthData[] = monthNames.map((name, i) => ({
      month: name,
      monthNum: i,
      income: 0,
      expense: 0,
      profit: 0
    }));

    // Aggregate transactions
    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === selectedYear) {
        const month = tDate.getMonth();
        if (t.type === 'income') {
          monthlyData[month].income += t.amount;
        } else {
          monthlyData[month].expense += t.amount;
        }
        monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expense;
      }
    });

    // Calculate yearly totals
    let totalIncome = 0, totalExpense = 0;
    let bestMonth: MonthData | null = null;
    let worstMonth: MonthData | null = null;
    let monthsWithLoss = 0;

    monthlyData.forEach((m) => {
      totalIncome += m.income;
      totalExpense += m.expense;

      if (m.income > 0 || m.expense > 0) {
        if (!bestMonth || m.profit > bestMonth.profit) bestMonth = m;
        if (!worstMonth || m.profit < worstMonth.profit) worstMonth = m;
        if (m.profit < 0) monthsWithLoss++;
      }
    });

    return {
      months: monthlyData,
      totalIncome,
      totalExpense,
      totalProfit: totalIncome - totalExpense,
      avgMonthlyProfit: (totalIncome - totalExpense) / 12,
      bestMonth,
      worstMonth,
      monthsWithLoss,
      monthsWithProfit: monthlyData.filter(m => m.profit > 0).length
    };
  }, [transactions, selectedYear]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthData;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-800 mb-2">{data.month}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">รายรับ: ฿{data.income.toLocaleString()}</p>
            <p className="text-red-500">รายจ่าย: ฿{data.expense.toLocaleString()}</p>
            <p className={`font-bold ${data.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              กำไร: {data.profit >= 0 ? '+' : ''}฿{data.profit.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 2, currentYear - 1, currentYear];

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          Yearly Business Overview
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            disabled={selectedYear <= currentYear - 2}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-gray-700 min-w-[60px] text-center">
            {selectedYear + 543}
          </span>
          <button
            onClick={() => setSelectedYear(y => y + 1)}
            disabled={selectedYear >= currentYear}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-green-600 mb-1">รายรับรวม</div>
          <div className="text-xl font-bold text-green-700">
            ฿{yearlyData.totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="text-sm text-red-600 mb-1">รายจ่ายรวม</div>
          <div className="text-xl font-bold text-red-700">
            ฿{yearlyData.totalExpense.toLocaleString()}
          </div>
        </div>
        <div className={`rounded-xl p-4 ${yearlyData.totalProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <div className={`text-sm mb-1 ${yearlyData.totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            กำไรรวม
          </div>
          <div className={`text-xl font-bold ${yearlyData.totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            ฿{yearlyData.totalProfit.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm text-purple-600 mb-1">กำไรเฉลี่ย/เดือน</div>
          <div className="text-xl font-bold text-purple-700">
            ฿{Math.round(yearlyData.avgMonthlyProfit).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearlyData.months} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis 
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" name="รายรับ" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Month */}
        {yearlyData.bestMonth && (yearlyData.bestMonth.income > 0 || yearlyData.bestMonth.expense > 0) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">เดือนที่ดีที่สุด</span>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {yearlyData.bestMonth.month}
            </div>
            <div className="text-sm text-green-600 mt-1">
              กำไร ฿{yearlyData.bestMonth.profit.toLocaleString()}
            </div>
          </div>
        )}

        {/* Worst Month */}
        {yearlyData.worstMonth && yearlyData.bestMonth && yearlyData.worstMonth.profit < yearlyData.bestMonth.profit && (
          <div className={`rounded-xl p-4 ${yearlyData.worstMonth.profit < 0 ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-yellow-50 to-amber-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {yearlyData.worstMonth.profit < 0 ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-yellow-600" />
              )}
              <span className={`font-medium ${yearlyData.worstMonth.profit < 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                เดือนที่ควรปรับปรุง
              </span>
            </div>
            <div className={`text-2xl font-bold ${yearlyData.worstMonth.profit < 0 ? 'text-red-800' : 'text-yellow-800'}`}>
              {yearlyData.worstMonth.month}
            </div>
            <div className={`text-sm mt-1 ${yearlyData.worstMonth.profit < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
              กำไร ฿{yearlyData.worstMonth.profit.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span>เดือนกำไร: {yearlyData.monthsWithProfit}</span>
        </div>
        {yearlyData.monthsWithLoss > 0 && (
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span>เดือนขาดทุน: {yearlyData.monthsWithLoss}</span>
          </div>
        )}
      </div>
    </div>
  );
}
