'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, User } from '@/types/database';
import { isOwner } from '@/lib/auth';
import { getTransactions } from '@/lib/storage';
import { 
  Wallet, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface CurrentBalanceCardProps {
  user: User | null;
}

const BANK_BALANCE_KEY = 'quarion_bank_balance';

interface BankBalanceData {
  amount: number;
  lastUpdated: string; // ISO date - transactions after this date will be added/subtracted
}

export default function CurrentBalanceCard({ user }: CurrentBalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [bankBalance, setBankBalance] = useState<BankBalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from localStorage
  const loadTransactions = useCallback(() => {
    const txns = getTransactions();
    setTransactions(txns);
  }, []);

  // Load bank balance and transactions from localStorage
  useEffect(() => {
    // Load bank balance
    const saved = localStorage.getItem(BANK_BALANCE_KEY);
    if (saved) {
      try {
        setBankBalance(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse bank balance data');
      }
    }

    // Load transactions
    loadTransactions();

    // Listen for custom event when transactions are updated (same tab)
    const handleTransactionsUpdated = () => {
      loadTransactions();
    };
    window.addEventListener('transactions-updated', handleTransactionsUpdated);

    // Poll localStorage every 2 seconds for cross-page updates
    const pollInterval = setInterval(() => {
      loadTransactions();
    }, 2000);

    // Listen for storage event (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'quarion_transactions') {
        loadTransactions();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('transactions-updated', handleTransactionsUpdated);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [loadTransactions]);

  // Calculate total income and expense from ALL transactions
  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense };
  }, [transactions]);

  // Calculated balance from transactions
  const calculatedBalance = totalIncome - totalExpense;

  // Current balance = Bank balance if set, otherwise calculated
  const currentBalance = useMemo(() => {
    if (!bankBalance) return calculatedBalance;
    return bankBalance.amount;
  }, [bankBalance, calculatedBalance]);

  // Difference between bank and calculated
  const difference = bankBalance ? bankBalance.amount - calculatedBalance : 0;

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
          {/* Calculated Balance from Transactions */}
          <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-xs text-blue-600 mb-1">ยอดจาก Transactions</div>
            <div className={`text-2xl lg:text-3xl font-bold ${calculatedBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              ฿{calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              รายรับ - รายจ่าย ({transactions.length} รายการ)
            </div>
          </div>

          {/* Income / Expense Summary */}
          <div className="grid grid-cols-2 gap-2">
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

          {/* Bank Balance (if set) */}
          {bankBalance && (
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-500">ยอดในธนาคาร</span>
                <span className="font-medium text-gray-700">
                  ฿{bankBalance.amount.toLocaleString()}
                </span>
              </div>

              {/* Difference */}
              {difference !== 0 && (
                <div className={`flex items-center justify-between p-2 rounded-lg ${
                  difference >= 0 ? 'bg-yellow-50' : 'bg-orange-50'
                }`}>
                  <span className="text-gray-600">
                    {difference > 0 ? 'ยังไม่ได้บันทึก' : 'บันทึกเกิน'}
                  </span>
                  <span className={`font-medium ${difference >= 0 ? 'text-yellow-700' : 'text-orange-700'}`}>
                    {difference >= 0 ? '+' : ''}฿{difference.toLocaleString()}
                  </span>
                </div>
              )}

              {difference === 0 && (
                <div className="flex items-center justify-center p-2 bg-green-50 rounded-lg text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  ยอดตรงกัน!
                </div>
              )}

              <div className="text-xs text-gray-400 text-center">
                อัพเดต: {formatDate(bankBalance.lastUpdated)}
              </div>
            </div>
          )}

          {/* Set bank balance button */}
          {!bankBalance && (
            <button
              onClick={startEdit}
              className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 
                         rounded-lg transition-colors border border-blue-200"
            >
              + ตั้งยอดเงินในธนาคาร
            </button>
          )}
        </div>
      )}
    </div>
  );
}
