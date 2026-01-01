'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types/database';
import { isOwner, User } from '@/lib/auth';
import { Target, TrendingUp, Calendar } from 'lucide-react';

interface MonthlyProgressTrackerProps {
  transactions: Transaction[];
  user: User | null;
}

interface GoalSettings {
  monthlyGoal: number;
  lastUpdated: string;
}

export default function MonthlyProgressTracker({ transactions, user }: MonthlyProgressTrackerProps) {
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    monthlyGoal: 50000,
    lastUpdated: new Date().toISOString()
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  // Load saved goal
  useEffect(() => {
    const saved = localStorage.getItem('owner-monthly-goal');
    if (saved) {
      setGoalSettings(JSON.parse(saved));
    }
  }, []);

  // Calculate current month profit
  const { currentProfit, daysRemaining, dailyNeeded } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const remaining = daysInMonth - today;

    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        if (t.type === 'income') {
          income += t.amount;
        } else {
          expense += t.amount;
        }
      }
    });

    const profit = income - expense;
    const needed = remaining > 0 
      ? Math.max(0, (goalSettings.monthlyGoal - profit) / remaining)
      : 0;

    return {
      currentProfit: profit,
      daysRemaining: remaining,
      dailyNeeded: needed
    };
  }, [transactions, goalSettings.monthlyGoal]);

  const progress = Math.min((currentProfit / goalSettings.monthlyGoal) * 100, 100);
  const progressClamped = Math.max(0, progress);

  const saveGoal = () => {
    const goal = parseFloat(newGoal);
    if (goal > 0) {
      const settings = {
        monthlyGoal: goal,
        lastUpdated: new Date().toISOString()
      };
      setGoalSettings(settings);
      localStorage.setItem('owner-monthly-goal', JSON.stringify(settings));
      setIsEditing(false);
    }
  };

  // Progress ring calculations
  const radius = 60;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressClamped / 100) * circumference;

  const getStatusMessage = () => {
    if (progress >= 100) return { text: '🎉 ยินดีด้วย! ถึงเป้าแล้ว!', color: 'text-green-600' };
    if (progress >= 80) return { text: '🔥 ใกล้ถึงเป้าแล้ว!', color: 'text-green-500' };
    if (progress >= 50) return { text: '💪 กำลังไปได้ดี', color: 'text-blue-500' };
    if (progress >= 25) return { text: '📈 ยังมีเวลา', color: 'text-orange-500' };
    return { text: '🚀 เริ่มต้นกันเลย!', color: 'text-gray-500' };
  };

  const status = getStatusMessage();

  // Owner guard - after hooks
  if (!isOwner(user)) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          เป้าหมายกำไรเดือนนี้
        </h3>
        <button
          onClick={() => {
            setNewGoal(goalSettings.monthlyGoal.toString());
            setIsEditing(true);
          }}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          แก้ไขเป้า
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">เป้าหมายกำไร (บาท)</label>
            <input
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="50000"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveGoal}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
            >
              บันทึก
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Ring */}
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <svg height={radius * 2} width={radius * 2}>
                {/* Background circle */}
                <circle
                  stroke="#e5e7eb"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Progress circle */}
                <circle
                  stroke={progress >= 100 ? '#22c55e' : progress >= 50 ? '#8b5cf6' : '#f59e0b'}
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  transform={`rotate(-90 ${radius} ${radius})`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {Math.round(progressClamped)}%
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">กำไรสะสม</span>
              <span className={`font-bold ${currentProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ฿{currentProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">เป้าหมาย</span>
              <span className="font-bold text-gray-800">
                ฿{goalSettings.monthlyGoal.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                เหลืออีก
              </span>
              <span className="font-medium text-gray-800">{daysRemaining} วัน</span>
            </div>
            {daysRemaining > 0 && currentProfit < goalSettings.monthlyGoal && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  ต้องทำกำไร/วัน
                </span>
                <span className="font-medium text-orange-600">
                  ฿{Math.ceil(dailyNeeded).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Status message */}
          <div className={`mt-4 text-center font-medium ${status.color}`}>
            {status.text}
          </div>
        </>
      )}
    </div>
  );
}
