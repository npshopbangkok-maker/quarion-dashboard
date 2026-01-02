'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import ProtectedPage from '@/components/ProtectedPage';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Filter, Download, Trash2, Edit2 } from 'lucide-react';
import { Transaction, TransactionType, Category } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchTransactions,
  createTransaction as dbCreateTransaction,
  updateTransaction as dbUpdateTransaction,
  deleteTransaction as dbDeleteTransaction,
} from '@/lib/database';
import {
  getTransactions,
  saveTransactions,
  getCategories,
  generateId,
} from '@/lib/storage';

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase or localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let loadedTransactions: Transaction[] = [];

        if (isSupabaseConfigured()) {
          // Try Supabase first for transactions
          loadedTransactions = await fetchTransactions();
        }

        // Fallback to localStorage if Supabase not configured or returns empty
        if (loadedTransactions.length === 0) {
          loadedTransactions = getTransactions();
        }

        // Always use localStorage for categories (user-managed)
        const loadedCategories = getCategories();

        setTransactions(loadedTransactions);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage on error
        setTransactions(getTransactions());
        setCategories(getCategories());
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    type: 'income' as TransactionType,
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Categories based on selected type
  const availableCategories = categories.filter(c => c.type === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const transactionData = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      created_by: user.id,
      slip_url: null,
    };

    try {
      if (isSupabaseConfigured()) {
        if (editingTransaction) {
          // Update existing transaction in Supabase
          const updated = await dbUpdateTransaction(editingTransaction.id, transactionData);
          if (updated) {
            const updatedList = transactions.map(t => 
              t.id === editingTransaction.id ? updated : t
            );
            setTransactions(updatedList);
            // Also save to localStorage for CurrentBalanceCard
            saveTransactions(updatedList);
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('transactions-updated'));
          }
        } else {
          // Create new transaction in Supabase
          const created = await dbCreateTransaction(transactionData);
          if (created) {
            const updatedList = [created, ...transactions];
            setTransactions(updatedList);
            // Also save to localStorage for CurrentBalanceCard
            saveTransactions(updatedList);
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('transactions-updated'));
          }
        }
      } else {
        // Fallback to localStorage
        const newTransaction: Transaction = {
          id: editingTransaction?.id || generateId(),
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          created_by: user.id,
          slip_url: null,
          created_at: editingTransaction?.created_at || new Date().toISOString(),
          user: user,
        };

        let updatedTransactions: Transaction[];
        if (editingTransaction) {
          updatedTransactions = transactions.map(t => 
            t.id === editingTransaction.id ? newTransaction : t
          );
        } else {
          updatedTransactions = [newTransaction, ...transactions];
        }

        setTransactions(updatedTransactions);
        saveTransactions(updatedTransactions);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('transactions-updated'));
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      try {
        if (isSupabaseConfigured()) {
          const success = await dbDeleteTransaction(id);
          if (success) {
            const updatedList = transactions.filter(t => t.id !== id);
            setTransactions(updatedList);
            // Also save to localStorage for CurrentBalanceCard
            saveTransactions(updatedList);
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('transactions-updated'));
          }
        } else {
          const updatedTransactions = transactions.filter(t => t.id !== id);
          setTransactions(updatedTransactions);
          saveTransactions(updatedTransactions);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('transactions-updated'));
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  return (
    <ProtectedPage requiredPage="transactions">
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <MobileNav user={user} onLogout={handleLogout} />

      <main className="lg:ml-64 min-h-screen transition-all duration-300 mobile-content-pt">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-3 lg:p-6 space-y-3 lg:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Transactions</h1>
              <p className="text-sm lg:text-base text-gray-500">จัดการรายรับ-รายจ่ายทั้งหมด</p>
            </div>
            <div className="flex gap-2 lg:gap-3">
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-gray-200 
                           rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm lg:text-base"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 
                           text-white rounded-xl shadow-lg shadow-purple-500/25 
                           hover:shadow-purple-500/40 transition-all text-sm lg:text-base"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรายการ</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex gap-2">
                {(['all', 'income', 'expense'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`
                      px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap
                      ${filterType === type
                        ? type === 'income'
                          ? 'bg-purple-100 text-purple-700'
                          : type === 'expense'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                        : 'text-gray-500 hover:bg-gray-100'
                      }
                    `}
                  >
                    {type === 'all' ? 'ทั้งหมด' : type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Transaction Cards */}
          <div className="lg:hidden space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">ไม่พบรายการ</div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${transaction.type === 'income' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(transaction.date)}</p>
                    </div>
                    <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-purple-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-800">{transaction.category}</p>
                  <p className="text-sm text-gray-500 truncate">{transaction.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">โดย {transaction.user?.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(transaction)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(transaction.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Transactions Table */}
          <div className="card hidden lg:block">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>ประเภท</th>
                    <th>หมวดหมู่</th>
                    <th>รายละเอียด</th>
                    <th>จำนวนเงิน</th>
                    <th>บันทึกโดย</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        ไม่พบรายการ
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="font-medium text-gray-700">
                          {formatDate(transaction.date)}
                        </td>
                        <td>
                          <span className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                            ${transaction.type === 'income'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-red-100 text-red-700'
                            }
                          `}>
                            {transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className="text-gray-600">{transaction.category}</td>
                        <td className="text-gray-500 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className={`font-semibold ${
                          transaction.type === 'income' ? 'text-purple-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="text-gray-500">{transaction.user?.name}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-2 text-gray-400 hover:text-blue-500 
                                         hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-2 text-gray-400 hover:text-red-500 
                                         hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="flex gap-2">
                {(['income', 'expense'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type, category: '' }))}
                    className={`
                      flex-1 py-3 rounded-xl font-medium transition-all
                      ${formData.type === type
                        ? type === 'income'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายละเอียด
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติม"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             focus:border-purple-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl 
                             hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 
                             text-white rounded-xl shadow-lg hover:shadow-purple-500/40 
                             transition-all"
                >
                  {editingTransaction ? 'บันทึก' : 'เพิ่มรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ProtectedPage>
  );
}
