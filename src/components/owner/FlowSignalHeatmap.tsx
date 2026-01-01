'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface FlowSignalHeatmapProps {
  transactions: Transaction[];
  user: User | null;
}

interface DayData {
  date: number;
  income: number;
  expense: number;
  profit: number;
}

export default function FlowSignalHeatmap({ transactions, user }: FlowSignalHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Calculate daily data
  const dailyData = useMemo(() => {
    const data: { [day: number]: DayData } = {};

    // Initialize all days
    for (let i = 1; i <= daysInMonth; i++) {
      data[i] = { date: i, income: 0, expense: 0, profit: 0 };
    }

    // Process transactions for current month
    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const day = tDate.getDate();
        if (data[day]) {
          if (t.type === 'income') {
            data[day].income += t.amount;
          } else {
            data[day].expense += t.amount;
          }
          data[day].profit = data[day].income - data[day].expense;
        }
      }
    });

    return data;
  }, [transactions, year, month, daysInMonth]);

  // Find max absolute profit for color scaling
  const maxAbsProfit = useMemo(() => {
    let max = 0;
    Object.values(dailyData).forEach((d) => {
      const abs = Math.abs(d.profit);
      if (abs > max) max = abs;
    });
    return max || 1;
  }, [dailyData]);

  // Get color based on profit
  const getColor = (profit: number): string => {
    if (profit === 0) return 'bg-gray-100';
    
    const intensity = Math.min(Math.abs(profit) / maxAbsProfit, 1);
    
    if (profit > 0) {
      if (intensity > 0.7) return 'bg-green-600';
      if (intensity > 0.4) return 'bg-green-400';
      return 'bg-green-200';
    } else {
      if (intensity > 0.7) return 'bg-red-600';
      if (intensity > 0.4) return 'bg-red-400';
      return 'bg-red-200';
    }
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const monthName = currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  // Calculate empty cells for first week
  const emptyCells = Array(firstDayOfMonth).fill(null);
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">📊 Flow Signal</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthName}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-600 rounded" />
          <span>ขาดทุนมาก</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded border" />
          <span>ไม่มีข้อมูล</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded" />
          <span>กำไรมาก</span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {dayCells.map((day) => {
          const data = dailyData[day];
          const color = getColor(data.profit);
          const textColor = data.profit > maxAbsProfit * 0.4 || data.profit < -maxAbsProfit * 0.4
            ? 'text-white'
            : 'text-gray-700';

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg ${color} flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-md relative`}
              onMouseEnter={() => setHoveredDay(data)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <span className={`text-xs font-medium ${textColor}`}>{day}</span>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredDay && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            วันที่ {hoveredDay.date}
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-bold">
                ฿{hoveredDay.income.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">รายรับ</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-bold">
                ฿{hoveredDay.expense.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">รายจ่าย</div>
            </div>
            <div className="text-center">
              <div className={`font-bold ${hoveredDay.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {hoveredDay.profit >= 0 ? '+' : ''}฿{hoveredDay.profit.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">กำไร</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">วันกำไร:</span>
          <span className="font-bold text-green-600">
            {Object.values(dailyData).filter((d) => d.profit > 0).length} วัน
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <span className="text-gray-600">วันขาดทุน:</span>
          <span className="font-bold text-red-500">
            {Object.values(dailyData).filter((d) => d.profit < 0).length} วัน
          </span>
        </div>
      </div>
    </div>
  );
}
