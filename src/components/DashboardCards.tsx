'use client';

import { TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';
import { DashboardSummary } from '@/types/database';

interface DashboardCardsProps {
  summary: DashboardSummary;
  isLoading?: boolean;
}

// Format number to Thai Baht currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with abbreviation (K, M)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function DashboardCards({ summary, isLoading = false }: DashboardCardsProps) {
  const cards = [
    {
      title: 'รายรับเดือนนี้',
      value: summary.currentMonthIncome,
      icon: TrendingUp,
      gradient: 'from-pink-500 to-purple-500',
      bgGradient: 'from-pink-500/10 to-purple-500/10',
      textColor: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-pink-500 to-purple-500',
    },
    {
      title: 'รายจ่ายเดือนนี้',
      value: summary.currentMonthExpense,
      icon: TrendingDown,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      textColor: 'text-red-600',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
    },
    {
      title: 'กำไรสุทธิ',
      value: summary.netProfit,
      icon: DollarSign,
      gradient: summary.netProfit >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500',
      bgGradient: summary.netProfit >= 0 ? 'from-emerald-500/10 to-teal-500/10' : 'from-red-500/10 to-rose-500/10',
      textColor: summary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
      iconBg: summary.netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-red-500 to-rose-500',
    },
    {
      title: 'จำนวนรายการ',
      value: summary.totalTransactions,
      icon: Receipt,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      textColor: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      isCurrency: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-3 lg:h-4 bg-gray-200 rounded w-16 lg:w-24"></div>
                <div className="h-6 lg:h-8 bg-gray-200 rounded w-20 lg:w-32"></div>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isCurrency = card.isCurrency !== false;

        return (
          <div
            key={card.title}
            className={`
              card relative overflow-hidden animate-fade-in
              hover:shadow-lg hover:scale-[1.02] transition-all duration-300
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`}></div>
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="order-2 sm:order-1">
                <p className="text-xs lg:text-sm text-gray-500 font-medium mb-0.5 lg:mb-1">{card.title}</p>
                <p className={`text-lg lg:text-2xl font-bold ${card.textColor}`}>
                  {isCurrency ? formatCurrency(card.value) : formatNumber(card.value)}
                </p>
              </div>
              
              {/* Icon */}
              <div className={`${card.iconBg} p-2 lg:p-3 rounded-lg lg:rounded-xl shadow-lg order-1 sm:order-2 self-start sm:self-auto`}>
                <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
