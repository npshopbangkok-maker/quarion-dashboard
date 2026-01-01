'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

interface MonthlyInsightChartProps {
  transactions: Transaction[];
  user: User | null;
}

interface DailyData {
  day: number;
  date: string;
  income: number;
  expense: number;
  profit: number;
}

export default function MonthlyInsightChart({ transactions, user }: MonthlyInsightChartProps) {
  const { chartData, bestDay, worstDay } = useMemo((): { chartData: DailyData[]; bestDay: DailyData | null; worstDay: DailyData | null } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Initialize daily data
    const dailyMap: { [day: number]: DailyData } = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap[i] = {
        day: i,
        date: `${i}/${month + 1}`,
        income: 0,
        expense: 0,
        profit: 0
      };
    }

    // Aggregate transactions
    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const day = tDate.getDate();
        if (dailyMap[day]) {
          if (t.type === 'income') {
            dailyMap[day].income += t.amount;
          } else {
            dailyMap[day].expense += t.amount;
          }
          dailyMap[day].profit = dailyMap[day].income - dailyMap[day].expense;
        }
      }
    });

    const data = Object.values(dailyMap);
    
    // Find best and worst days (only days with data)
    const daysWithData = data.filter(d => d.income > 0 || d.expense > 0);
    let best: DailyData | null = null;
    let worst: DailyData | null = null;

    daysWithData.forEach(d => {
      if (!best || d.profit > best.profit) best = d;
      if (!worst || d.profit < worst.profit) worst = d;
    });

    return { chartData: data, bestDay: best, worstDay: worst };
  }, [transactions]);

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyData;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-800 mb-2">วันที่ {data.day}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              รายรับ: ฿{data.income.toLocaleString()}
            </p>
            <p className="text-red-500">
              รายจ่าย: ฿{data.expense.toLocaleString()}
            </p>
            <p className={`font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              กำไร: {data.profit >= 0 ? '+' : ''}฿{data.profit.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 lg:p-6 overflow-hidden">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📈 Monthly Insight
      </h3>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => val % 5 === 0 ? val : ''}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="รายรับ"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="รายจ่าย"
            />
            {bestDay && (
              <ReferenceDot
                x={bestDay.day}
                y={bestDay.profit}
                r={6}
                fill="#22c55e"
                stroke="#fff"
                strokeWidth={2}
              />
            )}
            {worstDay && worstDay.profit < 0 && (
              <ReferenceDot
                x={worstDay.day}
                y={worstDay.expense}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-600">รายรับ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-gray-600">รายจ่าย</span>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {bestDay && (bestDay.income > 0 || bestDay.expense > 0) && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">วันดีที่สุด</span>
            </div>
            <div className="text-lg font-bold text-green-700">
              วันที่ {bestDay.day}
            </div>
            <div className="text-sm text-green-600">
              +฿{bestDay.profit.toLocaleString()}
            </div>
          </div>
        )}
        {worstDay && worstDay.profit < 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">วันแย่ที่สุด</span>
            </div>
            <div className="text-lg font-bold text-red-700">
              วันที่ {worstDay.day}
            </div>
            <div className="text-sm text-red-600">
              ฿{worstDay.profit.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
