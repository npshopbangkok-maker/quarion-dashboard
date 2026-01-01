'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { ArrowUp, ArrowDown, Minus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface DailyFlowDirectionProps {
  transactions: Transaction[];
  user: User | null;
}

interface PeriodData {
  income: number;
  expense: number;
  profit: number;
  days: number;
  avgIncome: number;
  avgProfit: number;
}

interface MonthComparison {
  early: PeriodData; // 1-14
  mid: PeriodData;   // 15-24
  late: PeriodData;  // 25-end
  lastMonth: {
    early: PeriodData;
    mid: PeriodData;
    late: PeriodData;
    total: PeriodData;
  };
}

export default function DailyFlowDirection({ transactions, user }: DailyFlowDirectionProps) {
  const comparison = useMemo((): MonthComparison => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastMonth = month === 0 ? 11 : month - 1;
    const lastMonthYear = month === 0 ? year - 1 : year;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const initPeriod = (): PeriodData => ({
      income: 0, expense: 0, profit: 0, days: 0, avgIncome: 0, avgProfit: 0
    });

    const result: MonthComparison = {
      early: initPeriod(),
      mid: initPeriod(),
      late: initPeriod(),
      lastMonth: {
        early: initPeriod(),
        mid: initPeriod(),
        late: initPeriod(),
        total: initPeriod()
      }
    };

    const getPeriod = (day: number): 'early' | 'mid' | 'late' => {
      if (day <= 14) return 'early';
      if (day <= 24) return 'mid';
      return 'late';
    };

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      const day = tDate.getDate();
      const period = getPeriod(day);
      const amount = t.amount;

      // Current month
      if (tYear === year && tMonth === month) {
        if (t.type === 'income') {
          result[period].income += amount;
        } else {
          result[period].expense += amount;
        }
      }

      // Last month
      if (tYear === lastMonthYear && tMonth === lastMonth) {
        if (t.type === 'income') {
          result.lastMonth[period].income += amount;
          result.lastMonth.total.income += amount;
        } else {
          result.lastMonth[period].expense += amount;
          result.lastMonth.total.expense += amount;
        }
      }
    });

    // Calculate profits and averages
    const periods: ('early' | 'mid' | 'late')[] = ['early', 'mid', 'late'];
    const periodDays = { early: 14, mid: 10, late: daysInMonth - 24 };

    periods.forEach((p) => {
      result[p].profit = result[p].income - result[p].expense;
      result[p].days = periodDays[p];
      result[p].avgIncome = result[p].income / periodDays[p];
      result[p].avgProfit = result[p].profit / periodDays[p];

      result.lastMonth[p].profit = result.lastMonth[p].income - result.lastMonth[p].expense;
      result.lastMonth[p].days = periodDays[p];
      result.lastMonth[p].avgIncome = result.lastMonth[p].income / periodDays[p];
      result.lastMonth[p].avgProfit = result.lastMonth[p].profit / periodDays[p];
    });

    result.lastMonth.total.profit = result.lastMonth.total.income - result.lastMonth.total.expense;

    return result;
  }, [transactions]);

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) {
      if (current > 0) return { icon: <ArrowUp className="w-4 h-4" />, color: 'text-green-500', text: '+100%' };
      return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-400', text: '-' };
    }
    
    const change = ((current - previous) / previous) * 100;
    
    if (change > 0) {
      return {
        icon: <ArrowUp className="w-4 h-4" />,
        color: 'text-green-500',
        text: `+${change.toFixed(0)}%`
      };
    } else if (change < 0) {
      return {
        icon: <ArrowDown className="w-4 h-4" />,
        color: 'text-red-500',
        text: `${change.toFixed(0)}%`
      };
    }
    return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-400', text: '0%' };
  };

  const PeriodCard = ({ 
    title, 
    dateRange, 
    current, 
    previous 
  }: { 
    title: string; 
    dateRange: string; 
    current: PeriodData; 
    previous: PeriodData 
  }) => {
    const incomeChange = getChangeIndicator(current.avgIncome, previous.avgIncome);
    const profitChange = getChangeIndicator(current.avgProfit, previous.avgProfit);

    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-gray-800">{title}</div>
            <div className="text-xs text-gray-500">{dateRange}</div>
          </div>
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-3">
          {/* Average Income */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">รายรับเฉลี่ย/วัน</div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">
                ฿{Math.round(current.avgIncome).toLocaleString()}
              </span>
              <span className={`flex items-center gap-0.5 text-xs ${incomeChange.color}`}>
                {incomeChange.icon}
                {incomeChange.text}
              </span>
            </div>
          </div>

          {/* Average Profit */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">กำไรเฉลี่ย/วัน</div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${current.avgProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ฿{Math.round(current.avgProfit).toLocaleString()}
              </span>
              <span className={`flex items-center gap-0.5 text-xs ${profitChange.color}`}>
                {profitChange.icon}
                {profitChange.text}
              </span>
            </div>
          </div>

          {/* Total Profit */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">กำไรรวม</div>
              <span className={`font-bold ${current.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ฿{current.profit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const monthName = new Date().toLocaleDateString('th-TH', { month: 'short' });
  const lastMonthName = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toLocaleDateString('th-TH', { month: 'short' });

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Daily Flow Direction
        </h3>
        <div className="text-xs text-gray-500">
          เทียบกับ {lastMonthName}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PeriodCard
          title="ต้นเดือน"
          dateRange={`1-14 ${monthName}`}
          current={comparison.early}
          previous={comparison.lastMonth.early}
        />
        <PeriodCard
          title="กลางเดือน"
          dateRange={`15-24 ${monthName}`}
          current={comparison.mid}
          previous={comparison.lastMonth.mid}
        />
        <PeriodCard
          title="ปลายเดือน"
          dateRange={`25-สิ้นเดือน`}
          current={comparison.late}
          previous={comparison.lastMonth.late}
        />
      </div>

      {/* Summary comparison */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700 font-medium">
            เทียบทั้งเดือนกับ {lastMonthName}
          </span>
          {(() => {
            const currentTotal = comparison.early.profit + comparison.mid.profit + comparison.late.profit;
            const change = getChangeIndicator(currentTotal, comparison.lastMonth.total.profit);
            return (
              <span className={`flex items-center gap-1 font-medium ${change.color}`}>
                {change.icon}
                {change.text}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
