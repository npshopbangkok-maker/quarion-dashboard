'use client';

import { useMemo } from 'react';
import { Transaction, User } from '@/types/database';
import { isOwner, getAllUsers } from '@/lib/auth';
import { 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock,
  Receipt,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface RecentAdminActivityProps {
  transactions: Transaction[];
  user: User | null;
}

interface ActivityItem {
  transaction: Transaction;
  userName: string;
  userRole: string;
}

export default function RecentAdminActivity({ transactions, user }: RecentAdminActivityProps) {
  const { recentActivities, stats } = useMemo(() => {
    // Get all users for lookup
    const allUsers = getAllUsers();
    
    // Get activities from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities: ActivityItem[] = [];
    const statsData = {
      totalByAdmin: 0,
      incomeByAdmin: 0,
      expenseByAdmin: 0,
      adminCounts: {} as Record<string, { name: string; count: number; income: number; expense: number }>
    };

    transactions.forEach((t) => {
      const tDate = new Date(t.created_at);
      
      // Find user who created this transaction
      const creator = allUsers.find(u => u.id === t.created_by);
      if (!creator) return;

      // Only show admin activities (not owner's own)
      if (creator.role === 'admin') {
        statsData.totalByAdmin++;
        
        if (t.type === 'income') {
          statsData.incomeByAdmin += t.amount;
        } else {
          statsData.expenseByAdmin += t.amount;
        }

        if (!statsData.adminCounts[creator.id]) {
          statsData.adminCounts[creator.id] = { 
            name: creator.name, 
            count: 0, 
            income: 0, 
            expense: 0 
          };
        }
        statsData.adminCounts[creator.id].count++;
        if (t.type === 'income') {
          statsData.adminCounts[creator.id].income += t.amount;
        } else {
          statsData.adminCounts[creator.id].expense += t.amount;
        }

        // Only show recent activities (last 7 days) in the list
        if (tDate >= sevenDaysAgo) {
          activities.push({
            transaction: t,
            userName: creator.name,
            userRole: creator.role
          });
        }
      }
    });

    // Sort by created_at descending
    activities.sort((a, b) => 
      new Date(b.transaction.created_at).getTime() - new Date(a.transaction.created_at).getTime()
    );

    return { 
      recentActivities: activities.slice(0, 10), // Last 10 activities
      stats: statsData 
    };
  }, [transactions]);

  // Owner guard
  if (!isOwner(user)) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} นาทีที่แล้ว`;
    } else if (diffHours < 24) {
      return `${diffHours} ชั่วโมงที่แล้ว`;
    } else if (diffDays < 7) {
      return `${diffDays} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }
  };

  const adminList = Object.values(stats.adminCounts);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-800">กิจกรรมจากแอดมิน</h3>
      </div>

      {/* Admin Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-indigo-700">{stats.totalByAdmin}</div>
          <div className="text-xs text-indigo-600">รายการทั้งหมด</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">฿{stats.incomeByAdmin.toLocaleString()}</div>
          <div className="text-xs text-green-600">รายรับ</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-700">฿{stats.expenseByAdmin.toLocaleString()}</div>
          <div className="text-xs text-red-600">รายจ่าย</div>
        </div>
        <div className={`${stats.incomeByAdmin - stats.expenseByAdmin >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-3 text-center`}>
          <div className={`text-xl font-bold ${stats.incomeByAdmin - stats.expenseByAdmin >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {stats.incomeByAdmin - stats.expenseByAdmin >= 0 ? '+' : ''}฿{(stats.incomeByAdmin - stats.expenseByAdmin).toLocaleString()}
          </div>
          <div className={`text-xs ${stats.incomeByAdmin - stats.expenseByAdmin >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>กำไรสุทธิ</div>
        </div>
      </div>

      {/* Admin Performance */}
      {adminList.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-600 mb-2">ผลงานแต่ละแอดมิน</div>
          <div className="space-y-2">
            {adminList.map((admin) => (
              <div key={admin.name} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-700">
                      {admin.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{admin.name}</div>
                    <div className="text-xs text-gray-500">{admin.count} รายการ</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ฿{admin.income.toLocaleString()}
                    </span>
                    <span className="text-red-500 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      ฿{admin.expense.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities List */}
      <div className="text-sm font-medium text-gray-600 mb-2">กิจกรรมล่าสุด (7 วัน)</div>
      {recentActivities.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">ไม่มีกิจกรรมจากแอดมินในช่วง 7 วันที่ผ่านมา</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recentActivities.map((activity) => (
            <div 
              key={activity.transaction.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.transaction.type === 'income' 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {activity.transaction.type === 'income' ? (
                  <ArrowUpCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4 text-red-500" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 truncate">
                    {activity.transaction.category}
                  </span>
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    {activity.userName}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {activity.transaction.description || '-'}
                </div>
              </div>

              {/* Amount & Time */}
              <div className="text-right">
                <div className={`font-semibold ${
                  activity.transaction.type === 'income' 
                    ? 'text-green-600' 
                    : 'text-red-500'
                }`}>
                  {activity.transaction.type === 'income' ? '+' : '-'}฿{activity.transaction.amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(activity.transaction.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
