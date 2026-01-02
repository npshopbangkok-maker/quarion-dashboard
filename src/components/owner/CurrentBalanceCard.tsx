'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction, User } from '@/types/database';
import { isOwner } from '@/lib/auth';
import { 
  Wallet, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  Banknote
} from 'lucide-react';

interface CurrentBalanceCardProps {
  transactions: Transaction[];
  user: User | null;
}

const STORAGE_KEY = 'quarion_initial_balance';

interface InitialBalanceData {
  amount: number;
  setDate: string;
}

export default function CurrentBalanceCard({ transactions, user }: CurrentBalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [initialBalance, setInitialBalance] = useState<InitialBalanceData | null>(null);

  // Load initial balance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setInitialBalance(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse initial balance data');
      }
    }
  }, []);

  // Calculate total income and expense from ALL transactions
  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });
    
    return { totalIncome: income, totalExpense: expense };
  }, [transactions]);

  // Current balance = Initial + Income - Expense
  const currentBalance = useMemo(() => {
    const initial = initialBalance?.amount || 0;
    return initial + totalIncome - totalExpense;
  }, [initialBalance, totalIncome, totalExpense]);

  // Net profit (just from transactions)
  const netProfit = totalIncome - totalExpense;

  // Owner guard
  if (!isOwner(user)) return null;

  const handleSave = () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount)) {
      alert('กรุณากรอกตัวเลขที่ถูกต้อง');
      return;
    }

    const data: InitialBalanceData = {
      amount,
      setDate: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setInitialBalance(data);
    setIsEditing(false);
    setInputValue('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const startEdit = () => {
    setInputValue(initialBalance?.amount.toString() || '');
    setIsEditing(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 lg:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm lg:text-base font-semibold text-gray-800">ยอดเงินปัจจุบัน</h3>
        </div>
        {!isEditing && initialBalance && (
          <button
            onClick={startEdit}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="แก้ไขยอดเริ่มต้น"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Initial Balance Input */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ยอดเงินเริ่มต้น (บาท)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-blue-300 
                         rounded-xl focus:outline-none focus:border-blue-500 bg-blue-50"
            />
            <p className="text-xs text-gray-400 mt-1 text-center">
              กรอกยอดเงินที่มีก่อนเริ่มใช้ระบบ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium
                         hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              บันทึก
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium
                         hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Current Balance (Auto-calculated) */}
          <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            {initialBalance ? (
              <>
                <div className={`text-2xl lg:text-3xl font-bold ${currentBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  ฿{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  คำนวณอัตโนมัติ
                </div>
              </>
            ) : (
              <div className="py-2">
                <Banknote className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">ยังไม่ได้ตั้งยอดเริ่มต้น</p>
                <button
                  onClick={startEdit}
                  className="mt-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 
                             rounded-lg transition-colors"
                >
                  + ตั้งยอดเริ่มต้น
                </button>
              </div>
            )}
          </div>

          {/* Breakdown */}
          {initialBalance && (
            <div className="space-y-2 text-sm">
              {/* Initial Balance */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500">ยอดเริ่มต้น</span>
                <span className="font-medium text-gray-700">
                  ฿{initialBalance.amount.toLocaleString()}
                </span>
              </div>
              
              {/* Total Income */}
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  รายรับทั้งหมด
                </span>
                <span className="font-medium text-green-700">
                  +฿{totalIncome.toLocaleString()}
                </span>
              </div>
              
              {/* Total Expense */}
              <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  รายจ่ายทั้งหมด
                </span>
                <span className="font-medium text-red-700">
                  -฿{totalExpense.toLocaleString()}
                </span>
              </div>

              {/* Net Profit/Loss */}
              <div className={`flex items-center justify-between p-2 rounded-lg ${
                netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}>
                <span className={netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                  กำไร/ขาดทุนสุทธิ
                </span>
                <span className={`font-medium ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {netProfit >= 0 ? '+' : ''}฿{netProfit.toLocaleString()}
                </span>
              </div>

              {/* Set date info */}
              <div className="text-xs text-gray-400 text-center pt-1">
                ตั้งยอดเริ่มต้นเมื่อ {formatDate(initialBalance.setDate)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
