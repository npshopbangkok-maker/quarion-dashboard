'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { PiggyBank, Target, Percent, TrendingUp } from 'lucide-react';

interface SavingGoalCardProps {
  transactions: Transaction[];
  user: User | null;
}

interface SavingSettings {
  goalAmount: number;
  savingRate: number; // percentage of profit to save
  totalSaved: number;
  lastUpdated: string;
}

export default function SavingGoalCard({ transactions, user }: SavingGoalCardProps) {
  const [settings, setSettings] = useState<SavingSettings>({
    goalAmount: 100000,
    savingRate: 20,
    totalSaved: 0,
    lastUpdated: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newRate, setNewRate] = useState('');

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('owner-saving-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Calculate savings from transactions
  const { todayProfit, todaySaving, accumulatedSaving } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    let todayIncome = 0;
    let todayExpense = 0;
    let monthlyProfit = 0;

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const amount = t.type === 'income' ? t.amount : -t.amount;
        monthlyProfit += amount;
        
        if (tDate.getDate() === today) {
          if (t.type === 'income') {
            todayIncome += t.amount;
          } else {
            todayExpense += t.amount;
          }
        }
      }
    });

    const tProfit = todayIncome - todayExpense;
    const tSaving = tProfit > 0 ? tProfit * (settings.savingRate / 100) : 0;
    const accSaving = monthlyProfit > 0 ? monthlyProfit * (settings.savingRate / 100) : 0;

    return {
      todayProfit: tProfit,
      todaySaving: tSaving,
      accumulatedSaving: accSaving + settings.totalSaved
    };
  }, [transactions, settings.savingRate, settings.totalSaved]);

  const progress = Math.min((accumulatedSaving / settings.goalAmount) * 100, 100);

  const saveSettings = () => {
    const goal = parseFloat(newGoal) || settings.goalAmount;
    const rate = parseFloat(newRate) || settings.savingRate;
    
    const newSettings = {
      ...settings,
      goalAmount: goal,
      savingRate: Math.min(100, Math.max(0, rate)),
      lastUpdated: new Date().toISOString()
    };
    
    setSettings(newSettings);
    localStorage.setItem('owner-saving-settings', JSON.stringify(newSettings));
    setIsEditing(false);
  };

  const getProgressColor = () => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-sm p-3 lg:p-6 text-white overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base lg:text-lg font-bold flex items-center gap-2">
          <PiggyBank className="w-5 h-5" />
          <span className="hidden sm:inline">ออมจากกำไร</span>
          <span className="sm:hidden">ออมเงิน</span>
        </h3>
        <button
          onClick={() => {
            setNewGoal(settings.goalAmount.toString());
            setNewRate(settings.savingRate.toString());
            setIsEditing(true);
          }}
          className="text-sm text-white/80 hover:text-white"
        >
          ตั้งค่า
        </button>
      </div>

      {isEditing ? (
        <div className="bg-white/20 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-sm text-white/80">เป้าหมายเงินออม (บาท)</label>
            <input
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 text-gray-800"
              placeholder="100000"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">% ออมจากกำไร</label>
            <input
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/90 text-gray-800"
              placeholder="20"
              min="0"
              max="100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveSettings}
              className="flex-1 bg-white text-purple-600 py-2 rounded-lg font-medium hover:bg-white/90"
            >
              บันทึก
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-white/20 py-2 rounded-lg hover:bg-white/30"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main amount */}
          <div className="text-center py-4">
            <div className="text-3xl font-bold">
              ฿{Math.round(accumulatedSaving).toLocaleString()}
            </div>
            <div className="text-sm text-white/80 mt-1">
              เงินออมสะสม
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>ความคืบหน้า</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getProgressColor()} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>฿0</span>
              <span>฿{settings.goalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/80 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">เป้าหมาย</span>
              </div>
              <div className="font-bold">
                ฿{settings.goalAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/80 mb-1">
                <Percent className="w-4 h-4" />
                <span className="text-xs">อัตราออม</span>
              </div>
              <div className="font-bold">
                {settings.savingRate}%
              </div>
            </div>
          </div>

          {/* Today's saving */}
          {todayProfit > 0 && (
            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">ออมวันนี้</span>
                </div>
                <span className="font-bold text-green-300">
                  +฿{Math.round(todaySaving).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Remaining */}
          <div className="mt-4 text-center text-sm text-white/80">
            เหลืออีก ฿{Math.max(0, Math.round(settings.goalAmount - accumulatedSaving)).toLocaleString()} ถึงเป้าหมาย
          </div>
        </>
      )}
    </div>
  );
}
