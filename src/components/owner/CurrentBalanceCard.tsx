'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction, User } from '@/types/database';
import { isOwner } from '@/lib/auth';
import { 
  Wallet, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface CurrentBalanceCardProps {
  transactions: Transaction[];
  user: User | null;
}

const BANK_BALANCE_KEY = 'quarion_bank_balance';

interface BankBalanceData {
  amount: number;
  lastUpdated: string; // ISO date - transactions after this date will be added/subtracted
}

export default function CurrentBalanceCard({ transactions, user }: CurrentBalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [bankBalance, setBankBalance] = useState<BankBalanceData | null>(null);

  // Load bank balance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(BANK_BALANCE_KEY);
    if (saved) {
      try {
        setBankBalance(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse bank balance data');
      }
    }
  }, []);

  // Calculate transactions AFTER the balance was set
  const { transactionsAfter, totalIncome, totalExpense } = useMemo(() => {
    if (!bankBalance) {
      // If no balance set, calculate from all transactions
      let income = 0;
      let expense = 0;
      transactions.forEach((t) => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      });
      return { transactionsAfter: 0, totalIncome: income, totalExpense: expense };
    }

    const balanceDate = new Date(bankBalance.lastUpdated);
    let income = 0;
    let expense = 0;
    let count = 0;
    
    transactions.forEach((t) => {
      const txDate = new Date(t.created_at || t.date);
      // Include transactions created AFTER the balance was set
      if (txDate > balanceDate) {
        count++;
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    });
    
    return { transactionsAfter: count, totalIncome: income, totalExpense: expense };
  }, [transactions, bankBalance]);

  // Current balance = Last synced + new transactions
  const currentBalance = useMemo(() => {
    if (!bankBalance) return totalIncome - totalExpense;
    return bankBalance.amount + totalIncome - totalExpense;
  }, [bankBalance, totalIncome, totalExpense]);

  // Net change since last sync
  const netChange = totalIncome - totalExpense;

  // Owner guard
  if (!isOwner(user)) return null;

  const handleSave = () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount)) {
      alert('กรุณากรอกตัวเลขที่ถูกต้อง');
      return;
    }

    const data: BankBalanceData = {
      amount,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(BANK_BALANCE_KEY, JSON.stringify(data));
    setBankBalance(data);
    setIsEditing(false);
    setInputValue('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const startEdit = () => {
    setInputValue(currentBalance.toString());
    setIsEditing(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 lg:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm lg:text-base font-semibold text-gray-800">ยอดเงินในบัญชี</h3>
        </div>
        {!isEditing && (
          <button
            onClick={startEdit}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="อัพเดทยอดเงิน"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bank Balance Input */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ยอดเงินจริงในธนาคาร (บาท)
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
              ดูยอดจาก Mobile Banking แล้วกรอก
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
          {/* Current Balance (Auto-updated) */}
          <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            {bankBalance ? (
              <>
                <div className="text-xs text-blue-600 mb-1">ยอดเงินปัจจุบัน</div>
                <div className={`text-2xl lg:text-3xl font-bold ${currentBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  ฿{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                {transactionsAfter > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    +{transactionsAfter} รายการใหม่ตั้งแต่ {formatDate(bankBalance.lastUpdated)}
                  </div>
                )}
              </>
            ) : (
              <div className="py-2">
                <Wallet className="w-8 h-8 mx-auto text-gray-300 mb-2" />
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

          {/* Transaction Changes Since Last Sync */}
          {bankBalance && (
            <div className="space-y-2 text-sm">
              {/* Last Synced Balance */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500">ยอด Sync ล่าสุด</span>
                <span className="font-medium text-gray-700">
                  ฿{bankBalance.amount.toLocaleString()}
                </span>
              </div>

              {/* Net Change */}
              {netChange !== 0 && (
                <div className={`flex items-center justify-between p-2 rounded-lg ${
                  netChange >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <span className={netChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    เปลี่ยนแปลง ({transactionsAfter} รายการ)
                  </span>
                  <span className={`font-medium ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {netChange >= 0 ? '+' : ''}฿{netChange.toLocaleString()}
                  </span>
                </div>
              )}

              {transactionsAfter === 0 && (
                <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg text-gray-500">
                  <Check className="w-4 h-4 mr-1" />
                  ยังไม่มีรายการใหม่
                </div>
              )}

              {/* Quick Stats */}
              {transactionsAfter > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      รับ
                    </span>
                    <span className="font-medium text-green-700">
                      +฿{totalIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      จ่าย
                    </span>
                    <span className="font-medium text-red-700">
                      -฿{totalExpense.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Sync hint */}
              <div className="text-xs text-gray-400 text-center pt-1">
                กด 🔄 เพื่อ Sync ยอดใหม่จากธนาคาร
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
