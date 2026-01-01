// Supabase Database Operations
import { supabase, isSupabaseConfigured } from './supabase';
import { Transaction, Category } from '@/types/database';

// ============ TRANSACTIONS ============

export async function fetchTransactions(): Promise<Transaction[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('Supabase not configured, using localStorage');
    return [];
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      slip_url: transaction.slip_url,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }

  return data;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      type: updates.type,
      amount: updates.amount,
      category: updates.category,
      description: updates.description,
      date: updates.date,
      slip_url: updates.slip_url,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    return null;
  }

  return data;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }

  return true;
}

// ============ CATEGORIES ============

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('Supabase not configured, using defaults');
    return getDefaultCategories();
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return getDefaultCategories();
  }

  return data || getDefaultCategories();
}

function getDefaultCategories(): Category[] {
  return [
    { id: '1', name: 'ขายสินค้า', type: 'income' },
    { id: '2', name: 'บริการ', type: 'income' },
    { id: '3', name: 'รายได้อื่นๆ', type: 'income' },
    { id: '4', name: 'ค่าเช่า', type: 'expense' },
    { id: '5', name: 'ค่าน้ำค่าไฟ', type: 'expense' },
    { id: '6', name: 'เงินเดือน', type: 'expense' },
    { id: '7', name: 'อุปกรณ์สำนักงาน', type: 'expense' },
    { id: '8', name: 'การตลาด', type: 'expense' },
    { id: '9', name: 'ค่าใช้จ่ายอื่นๆ', type: 'expense' },
  ];
}

// ============ DASHBOARD CALCULATIONS ============

export function calculateSummary(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentMonthExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    currentMonthIncome,
    currentMonthExpense,
    netProfit: currentMonthIncome - currentMonthExpense,
    totalTransactions: transactions.length,
  };
}

export function calculateMonthlyData(transactions: Transaction[]) {
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(currentYear, now.getMonth() - i, 1);
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    monthlyData.push({
      month: monthNames[month],
      income,
      expense,
    });
  }

  return monthlyData;
}

export function calculateCategoryData(transactions: Transaction[]) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
  
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const categoryMap = new Map<string, number>();
  expenseTransactions.forEach(t => {
    const current = categoryMap.get(t.category) || 0;
    categoryMap.set(t.category, current + Number(t.amount));
  });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return categoryData;
}
