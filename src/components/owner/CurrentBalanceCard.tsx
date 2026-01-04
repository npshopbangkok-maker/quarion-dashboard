'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, User } from '@/types/database';
import { isOwner } from '@/lib/auth';
import { fetchTransactions, getGlobalSetting, setGlobalSetting } from '@/lib/database';
import { getTransactions } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { 
  Wallet, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Calendar,
  Loader2
} from 'lucide-react';

interface CurrentBalanceCardProps {
  user: User | null;
}

interface InitialBalanceData {
  amount: number;        // ยอดเริ่มต้นที่ตั้งไว้
  setDate: string;       // วันที่ตั้งยอด (ISO string) - transactions หลังจากนี้จะถูก +/-
}

export default function CurrentBalanceCard({ user }: CurrentBalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [initialBalance, setInitialBalance] = useState<InitialBalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from Supabase or localStorage
  const loadTransactions = useCallback(async () => {
    try {
      let txns: Transaction[] = [];
      
      if (isSupabaseConfigured()) {
        txns = await fetchTransactions();
      }
      
      // Fallback to localStorage
      if (txns.length === 0) {
        txns = getTransactions();
      }
      
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to localStorage on error
      setTransactions(getTransactions());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial balance from Supabase
  const loadInitialBalance = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const saved = await getGlobalSetting<InitialBalanceData>('initial_balance');
      if (saved) {
        setInitialBalance(saved);
        return;
      }
    }
    
    // Fallback: migrate from localStorage
    const localSaved = localStorage.getItem('quarion_initial_balance');
    if (localSaved) {
      try {
        const data = JSON.parse(localSaved);
        setInitialBalance(data);
        // Migrate to Supabase
        if (isSupabaseConfigured()) {
          await setGlobalSetting('initial_balance', data);
          localStorage.removeItem('quarion_initial_balance');
        }
      } catch (e) {
        console.error('Failed to parse initial balance data:', e);
      }
    }
  }, []);

  // Load initial balance and transactions
  useEffect(() => {
    let isMounted = true;
    
    const loadAll = async () => {
      if (!isMounted) return;
      await loadInitialBalance();
      await loadTransactions();
    };
    
    loadAll();

    // Listen for custom event when transactions are updated
    const handleTransactionsUpdated = () => {
      if (isMounted) loadTransactions();
    };
    window.addEventListener('transactions-updated', handleTransactionsUpdated);

    // Poll every 3 seconds for updates
    const pollInterval = setInterval(() => {
      if (isMounted) loadTransactions();
    }, 3000);

    return () => {
      isMounted = false;
      window.removeEventListener('transactions-updated', handleTransactionsUpdated);
      clearInterval(pollInterval);
    };
  }, [loadTransactions, loadInitialBalance]);

  // Calculate transactions AFTER the set date
  const { transactionsAfterSetDate, incomeAfter, expenseAfter } = useMemo(() => {
    if (!initialBalance) {
      return { transactionsAfterSetDate: 0, incomeAfter: 0, expenseAfter: 0 };
    }

    const setDate = new Date(initialBalance.setDate);
    let income = 0;
    let expense = 0;
    let count = 0;

    transactions.forEach((t) => {
      // Use created_at if available, otherwise use date
      const txDate = new Date(t.created_at || t.date);
      
      // Include transactions created AFTER the initial balance was set
      if (txDate > setDate) {
        count++;
        if (t.type === 'income') {
          income += t.amount;
        } else {
          expense += t.amount;
        }
      }
    });

    return { transactionsAfterSetDate: count, incomeAfter: income, expenseAfter: expense };
  }, [transactions, initialBalance]);

  // Current balance = Initial + Income - Expense (after set date)
  const currentBalance = useMemo(() => {
    if (!initialBalance) return 0;
    return initialBalance.amount + incomeAfter - expenseAfter;
  }, [initialBalance, incomeAfter, expenseAfter]);

  // Net change since initial balance was set
  const netChange = incomeAfter - expenseAfter;

  // Owner guard
  if (!isOwner(user)) return null;

  const handleSave = async () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount)) {
      alert('กรุณากรอกตัวเลขที่ถูกต้อง');
      return;
    }

    setIsSaving(true);

    const data: InitialBalanceData = {
      amount,
      setDate: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const success = await setGlobalSetting('initial_balance', data);
      if (!success) {
        alert('บันทึกไม่สำเร็จ');
        setIsSaving(false);
        return;
      }
    } else {
      localStorage.setItem('quarion_initial_balance', JSON.stringify(data));
    }
    
    setInitialBalance(data);
    setIsEditing(false);
    setInputValue('');
    setIsSaving(false);
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
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
            title="ตั้งยอดเริ่มต้นใหม่"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Initial Balance Input */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ยอดเงินปัจจุบันในธนาคาร (บาท)
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="500000"
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
          {initialBalance ? (
            <>
              {/* Current Balance (Auto-calculated) */}
              <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-xs text-blue-600 mb-1">ยอดเงินปัจจุบัน</div>
                <div className={`text-2xl lg:text-3xl font-bold ${currentBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  ฿{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                {isLoading && (
                  <div className="text-xs text-gray-400 mt-1">กำลังโหลด...</div>
                )}
              </div>

              {/* Net Change */}
              {transactionsAfterSetDate > 0 && (
                <div className={`flex items-center justify-between p-2 rounded-lg ${
                  netChange >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <span className={`text-sm ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    เปลี่ยนแปลง ({transactionsAfterSetDate} รายการ)
                  </span>
                  <span className={`font-bold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {netChange >= 0 ? '+' : ''}฿{netChange.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Income / Expense Breakdown */}
              {transactionsAfterSetDate > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-green-600 flex items-center gap-1 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      รายรับ
                    </span>
                    <span className="font-medium text-green-700 text-sm">
                      +฿{incomeAfter.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-red-600 flex items-center gap-1 text-xs">
                      <TrendingDown className="w-3 h-3" />
                      รายจ่าย
                    </span>
                    <span className="font-medium text-red-700 text-sm">
                      -฿{expenseAfter.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Initial Balance Info */}
              <div className="text-xs text-gray-400 border-t pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    ยอดเริ่มต้น
                  </span>
                  <span>฿{initialBalance.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ตั้งเมื่อ</span>
                  <span>{formatDate(initialBalance.setDate)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm mb-3">ยังไม่ได้ตั้งยอดเริ่มต้น</p>
              <button
                onClick={startEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
                           hover:bg-blue-600 transition-colors"
              >
                + ตั้งยอดเริ่มต้น
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
