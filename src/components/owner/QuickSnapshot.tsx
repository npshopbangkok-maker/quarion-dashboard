'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { TrendingUp, TrendingDown, Clock, DollarSign, Receipt, Wallet } from 'lucide-react';

interface QuickSnapshotProps {
  transactions: Transaction[];
  user: User | null;
}

export default function QuickSnapshot({ transactions, user }: QuickSnapshotProps) {
  const snapshot = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const yesterday = today - 1;

    let todayIncome = 0, todayExpense = 0;
    let yesterdayIncome = 0, yesterdayExpense = 0;
    let lastTransactionDate = '';

    // Sort transactions by date to find latest
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedTransactions.length > 0) {
      lastTransactionDate = sortedTransactions[0].date;
    }

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const day = tDate.getDate();
        
        if (day === today) {
          if (t.type === 'income') {
            todayIncome += t.amount;
          } else {
            todayExpense += t.amount;
          }
        } else if (day === yesterday) {
          if (t.type === 'income') {
            yesterdayIncome += t.amount;
          } else {
            yesterdayExpense += t.amount;
          }
        }
      }
    });

    const todayProfit = todayIncome - todayExpense;
    const yesterdayProfit = yesterdayIncome - yesterdayExpense;
    
    // Calculate percentage change
    let profitChange = 0;
    if (yesterdayProfit !== 0) {
      profitChange = ((todayProfit - yesterdayProfit) / Math.abs(yesterdayProfit)) * 100;
    } else if (todayProfit > 0) {
      profitChange = 100;
    }

    let incomeChange = 0;
    if (yesterdayIncome !== 0) {
      incomeChange = ((todayIncome - yesterdayIncome) / yesterdayIncome) * 100;
    } else if (todayIncome > 0) {
      incomeChange = 100;
    }

    return {
      lastUpdate: lastTransactionDate,
      todayIncome,
      todayExpense,
      todayProfit,
      profitChange,
      incomeChange,
      hasData: todayIncome > 0 || todayExpense > 0
    };
  }, [transactions]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'ไม่มีข้อมูล';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-gray-400 text-sm">-</span>;
    
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
      </div>
    );
  };

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 lg:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base lg:text-lg font-bold text-gray-800">
          ⚡ Snapshot
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{formatDate(snapshot.lastUpdate)}</span>
        </div>
      </div>

      {!snapshot.hasData ? (
        <div className="text-center py-8 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีข้อมูลวันนี้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Income */}
          <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">ยอดขาย</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-700">
                ฿{snapshot.todayIncome.toLocaleString()}
              </div>
              <ChangeIndicator value={snapshot.incomeChange} />
            </div>
          </div>

          {/* Expense */}
          <div className="bg-red-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <Receipt className="w-4 h-4" />
              <span className="text-sm font-medium">รายจ่าย</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-700">
                ฿{snapshot.todayExpense.toLocaleString()}
              </div>
              <span className="text-gray-400 text-xs">-</span>
            </div>
          </div>

          {/* Profit */}
          <div className={`rounded-xl p-3 flex items-center justify-between ${snapshot.todayProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className={`flex items-center gap-2 ${snapshot.todayProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">กำไร</span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${snapshot.todayProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {snapshot.todayProfit >= 0 ? '+' : ''}฿{snapshot.todayProfit.toLocaleString()}
              </div>
              <ChangeIndicator value={snapshot.profitChange} />
            </div>
          </div>
        </div>
      )}

      {/* Compare with yesterday */}
      {snapshot.hasData && (
        <div className="mt-4 text-center text-sm text-gray-500">
          เปรียบเทียบกับเมื่อวาน
        </div>
      )}
    </div>
  );
}
