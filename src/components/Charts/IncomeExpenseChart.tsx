'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyData } from '@/types/database';

interface IncomeExpenseChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

// Format currency for tooltip
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value);
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'income' ? 'รายรับ' : 'รายจ่าย'}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function IncomeExpenseChart({ data, isLoading = false }: IncomeExpenseChartProps) {
  if (isLoading) {
    return (
      <div className="card h-80 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-full bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">
        รายรับ vs รายจ่าย (รายเดือน)
      </h3>
      
      {data.length === 0 ? (
        <div className="h-48 lg:h-80 flex items-center justify-center">
          <p className="text-gray-400 text-sm">ยังไม่มีข้อมูล</p>
        </div>
      ) : (
        <div className="h-48 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-gray-600 text-xs lg:text-sm">
                    {value === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </span>
                )}
              />
            <Line
              type="monotone"
              dataKey="income"
              stroke="url(#incomeGradient)"
              strokeWidth={3}
              dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#a855f7' }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="url(#expenseGradient)"
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ef4444' }}
            />
            
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
