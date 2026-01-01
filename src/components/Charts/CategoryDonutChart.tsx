'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CategoryData } from '@/types/database';

interface CategoryDonutChartProps {
  data: CategoryData[];
  isLoading?: boolean;
}

// Default colors for categories
const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

// Format currency for tooltip
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value);
}

// Custom Tooltip Component
function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: CategoryData; value: number }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
      </div>
    );
  }
  return null;
}

// Custom Legend Component
function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  
  return (
    <ul className="flex flex-wrap justify-center gap-2 mt-2">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1">
          <span 
            className="w-2 h-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600 truncate max-w-[60px] lg:max-w-none">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CategoryDonutChart({ data, isLoading = false }: CategoryDonutChartProps) {
  // Add colors to data if not present
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div className="card h-80 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="flex justify-center items-center h-full">
          <div className="w-48 h-48 rounded-full bg-gray-100"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card h-80">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          หมวดหมู่ค่าใช้จ่าย
        </h3>
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-400">ไม่มีข้อมูล</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">
        หมวดหมู่ค่าใช้จ่าย
      </h3>
      
      <div className="h-48 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {/* Center Text */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-800"
            >
              <tspan x="50%" dy="-0.5em" fontSize="12" fill="#6b7280">รวม</tspan>
              <tspan x="50%" dy="1.5em" fontSize="16" fontWeight="bold">
                {formatCurrency(total)}
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
