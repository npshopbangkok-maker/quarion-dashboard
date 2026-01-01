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
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface CurrentBalanceCardProps {
  transactions: Transaction[];
  user: User | null;
}

const STORAGE_KEY = 'quarion_current_balance';

interface BalanceData {
  amount: number;
  lastUpdated: string;
}

export default function CurrentBalanceCard({ transactions, user }: CurrentBalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBalanceData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse balance data');
      }
    }
  }, []);

  // Calculate balance from transactions
  const calculatedBalance = useMemo(() => {
    let total = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') {
        total += t.amount;
      } else {
        total -= t.amount;
      }
    });
    return total;
  }, [transactions]);

  // Calculate difference
  const difference = balanceData ? balanceData.amount - calculatedBalance : 0;

  // Owner guard
  if (!isOwner(user)) return null;

  const handleSave = () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount)) {
      alert('กรุณากรอกตัวเลขที่ถูกต้อง');
      return;
    }

    const data: BalanceData = {
      amount,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setBalanceData(data);
    setIsEditing(false);
    setInputValue('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const startEdit = () => {
    setInputValue(balanceData?.amount.toString() || '');
    setIsEditing(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 lg:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">ยอดเงินในบัญชี</h3>
        </div>
        {!isEditing && (
          <button
            onClick={startEdit}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Current Balance Input/Display */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              กรอกยอดเงินในบัญชีปัจจุบัน (บาท)
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
        <div className="space-y-4">
          {/* Actual Balance */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            {balanceData ? (
              <>
                <div className="text-sm text-blue-600 mb-1">ยอดเงินจริงในบัญชี</div>
                <div className={`text-3xl font-bold ${balanceData.amount >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  ฿{balanceData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  อัปเดตล่าสุด: {formatDate(balanceData.lastUpdated)}
                </div>
              </>
            ) : (
              <div className="py-4">
                <Wallet className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">ยังไม่ได้กรอกยอดเงินในบัญชี</p>
                <button
                  onClick={startEdit}
                  className="mt-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 
                             rounded-lg transition-colors"
                >
                  + กรอกยอดเงิน
                </button>
              </div>
            )}
          </div>

          {/* Calculated vs Actual Comparison */}
          {balanceData && (
            <div className="space-y-3">
              {/* Calculated Balance */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">ยอดจากระบบ (รายรับ-รายจ่าย)</div>
                <div className={`font-semibold ${calculatedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Difference */}
              {difference !== 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  Math.abs(difference) > 1000 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-gray-50'
                }`}>
                  {Math.abs(difference) > 1000 && (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">ส่วนต่าง</div>
                    <div className="text-xs text-gray-400">
                      {difference > 0 
                        ? '(มีเงินจริงมากกว่าที่บันทึก)' 
                        : '(มีเงินจริงน้อยกว่าที่บันทึก)'}
                    </div>
                  </div>
                  <div className={`font-semibold flex items-center gap-1 ${
                    difference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {difference > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {difference > 0 ? '+' : ''}฿{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}

              {/* Sync Button */}
              <button
                onClick={startEdit}
                className="w-full py-2 text-sm text-gray-500 hover:text-blue-600 
                           hover:bg-blue-50 rounded-lg transition-colors
                           flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                อัปเดตยอดเงิน
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
