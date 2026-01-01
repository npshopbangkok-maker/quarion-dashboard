'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import ProtectedPage from '@/components/ProtectedPage';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Calendar as CalendarIcon,
  Repeat,
  Bell,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';

// Types
interface ScheduledTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: number; // day of month (1-31)
  isRecurring: boolean;
  recurringType: 'monthly' | 'weekly' | 'yearly' | 'once';
  description?: string;
  createdAt: string;
}

// Categories
const EXPENSE_CATEGORIES = [
  'ค่าเช่า', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าโทรศัพท์', 'ค่าอินเทอร์เน็ต',
  'ค่าประกัน', 'ค่าผ่อนรถ', 'ค่าผ่อนบ้าน', 'เงินเดือนพนักงาน',
  'ค่าวัตถุดิบ', 'ค่าขนส่ง', 'อื่นๆ'
];

const INCOME_CATEGORIES = [
  'รายได้ประจำ', 'เงินเดือน', 'ค่าเช่า', 'ดอกเบี้ย', 'อื่นๆ'
];

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function CalendarPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calendar state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  
  // Transactions state
  const [scheduledTransactions, setScheduledTransactions] = useState<ScheduledTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ScheduledTransaction | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: 1,
    isRecurring: true,
    recurringType: 'monthly' as 'monthly' | 'weekly' | 'yearly' | 'once',
    description: '',
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quarion_scheduled_transactions');
    if (saved) {
      setScheduledTransactions(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('quarion_scheduled_transactions', JSON.stringify(scheduledTransactions));
  }, [scheduledTransactions]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Get transactions for a specific day
  const getTransactionsForDay = (day: number): ScheduledTransaction[] => {
    return scheduledTransactions.filter(t => {
      if (t.recurringType === 'monthly' || t.recurringType === 'once') {
        return t.date === day;
      }
      return false;
    });
  };

  // Calculate totals for the month
  const monthlyTotals = scheduledTransactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // Get upcoming transactions (next 7 days)
  const getUpcomingTransactions = (): ScheduledTransaction[] => {
    const todayDate = today.getDate();
    return scheduledTransactions
      .filter(t => {
        const diff = t.date - todayDate;
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => a.date - b.date);
  };

  // Form handlers
  const openAddModal = (day?: number) => {
    setEditingTransaction(null);
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: '',
      date: day || 1,
      isRecurring: true,
      recurringType: 'monthly',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (transaction: ScheduledTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      isRecurring: transaction.isRecurring,
      recurringType: transaction.recurringType,
      description: transaction.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transaction: ScheduledTransaction = {
      id: editingTransaction?.id || Date.now().toString(),
      title: formData.title,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      isRecurring: formData.isRecurring,
      recurringType: formData.recurringType,
      description: formData.description,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
    };

    if (editingTransaction) {
      setScheduledTransactions(prev =>
        prev.map(t => t.id === editingTransaction.id ? transaction : t)
      );
    } else {
      setScheduledTransactions(prev => [...prev, transaction]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('ต้องการลบรายการนี้?')) {
      setScheduledTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 lg:h-32 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const transactions = getTransactionsForDay(day);
      const isToday = day === today.getDate() && 
                      currentMonth === today.getMonth() && 
                      currentYear === today.getFullYear();
      const hasExpense = transactions.some(t => t.type === 'expense');
      const hasIncome = transactions.some(t => t.type === 'income');

      days.push(
        <div 
          key={day}
          onClick={() => {
            setSelectedDate(day);
            if (transactions.length === 0) {
              openAddModal(day);
            }
          }}
          className={`
            h-24 lg:h-32 p-1 lg:p-2 border border-gray-100 cursor-pointer 
            hover:bg-gray-50 transition-colors relative
            ${isToday ? 'bg-purple-50 border-purple-300' : 'bg-white'}
          `}
        >
          <div className={`
            text-sm font-medium mb-1
            ${isToday ? 'text-purple-600' : 'text-gray-700'}
          `}>
            {day}
          </div>
          
          {/* Transaction indicators */}
          <div className="space-y-1">
            {transactions.slice(0, 2).map(t => (
              <div 
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(t);
                }}
                className={`
                  text-xs p-1 rounded truncate
                  ${t.type === 'expense' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'}
                `}
              >
                {t.title}
              </div>
            ))}
            {transactions.length > 2 && (
              <div className="text-xs text-gray-500">
                +{transactions.length - 2} รายการ
              </div>
            )}
          </div>

          {/* Dot indicators for mobile */}
          {transactions.length > 0 && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 lg:hidden">
              {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
              {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const upcomingTransactions = getUpcomingTransactions();

  return (
    <ProtectedPage requiredPage="calendar">
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <MobileNav user={user} onLogout={handleLogout} />

      <main className="lg:ml-64 min-h-screen transition-all duration-300 mobile-content-pt">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">📅 ปฏิทินการเงิน</h1>
              <p className="text-sm lg:text-base text-gray-500">วางแผนรายรับ-รายจ่ายล่วงหน้า</p>
            </div>
            <button
              onClick={() => openAddModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 
                         text-white rounded-xl shadow-lg hover:shadow-purple-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มรายการ</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Upcoming Alert */}
            {upcomingTransactions.length > 0 && (
              <div className="sm:col-span-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">แจ้งเตือน: มี {upcomingTransactions.length} รายการใน 7 วันข้างหน้า</p>
                    <p className="text-sm opacity-90">
                      {upcomingTransactions.map(t => `${t.title} (วันที่ ${t.date})`).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Income */}
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">รายรับต่อเดือน</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyTotals.income)}</p>
            </div>

            {/* Monthly Expense */}
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">รายจ่ายต่อเดือน</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyTotals.expense)}</p>
            </div>

            {/* Net */}
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">คงเหลือ</p>
              <p className={`text-2xl font-bold ${monthlyTotals.income - monthlyTotals.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyTotals.income - monthlyTotals.expense)}
              </p>
            </div>
          </div>

          {/* Calendar */}
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800">
                  {MONTH_NAMES[currentMonth]} {currentYear + 543}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-sm text-purple-500 hover:underline"
                >
                  กลับวันนี้
                </button>
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map((day, i) => (
                <div 
                  key={day} 
                  className={`text-center text-sm font-medium py-2 
                    ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
                <span>รายจ่าย</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                <span>รายรับ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
                <span>วันนี้</span>
              </div>
            </div>
          </div>

          {/* Scheduled Transactions List */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📋 รายการทั้งหมด</h3>
            
            {scheduledTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>ยังไม่มีรายการ</p>
                <p className="text-sm">คลิก "เพิ่มรายการ" หรือคลิกที่วันในปฏิทิน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledTransactions
                  .sort((a, b) => a.date - b.date)
                  .map(t => (
                  <div 
                    key={t.id}
                    className={`
                      flex items-center justify-between p-4 rounded-xl
                      ${t.type === 'expense' ? 'bg-red-50' : 'bg-green-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center font-bold
                        ${t.type === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}
                      `}>
                        {t.date}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{t.title}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{t.category}</span>
                          {t.isRecurring && (
                            <span className="flex items-center gap-1 text-purple-500">
                              <Repeat className="w-3 h-3" />
                              ทุกเดือน
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>

    {/* Add/Edit Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.type === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  รายจ่าย
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.type === 'income'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  รายรับ
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อรายการ</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น ค่าเช่าร้าน"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเงิน</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {(formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ในเดือน</label>
                <select
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>วันที่ {d}</option>
                  ))}
                </select>
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="recurring" className="flex items-center gap-2 text-gray-700">
                  <Repeat className="w-4 h-4" />
                  ซ้ำทุกเดือน
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-purple-500/40 transition-all"
                >
                  {editingTransaction ? 'บันทึก' : 'เพิ่มรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </ProtectedPage>
  );
}
