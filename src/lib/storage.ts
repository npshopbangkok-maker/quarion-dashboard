// Local Storage utilities for data persistence
import { Transaction, User, Category } from '@/types/database';

const STORAGE_KEYS = {
  TRANSACTIONS: 'quarion_transactions',
  USER: 'quarion_user',
  CATEGORIES: 'quarion_categories',
};

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Transaction Storage
export function getTransactions(): Transaction[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
}

export function addTransaction(transaction: Transaction): Transaction[] {
  const transactions = getTransactions();
  const newTransactions = [transaction, ...transactions];
  saveTransactions(newTransactions);
  return newTransactions;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction[] {
  const transactions = getTransactions();
  const newTransactions = transactions.map(t => 
    t.id === id ? { ...t, ...updates } : t
  );
  saveTransactions(newTransactions);
  return newTransactions;
}

export function deleteTransaction(id: string): Transaction[] {
  const transactions = getTransactions();
  const newTransactions = transactions.filter(t => t.id !== id);
  saveTransactions(newTransactions);
  return newTransactions;
}

// User Storage
export function getUser(): User | null {
  if (!isBrowser) return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

// Categories Storage
export function getCategories(): Category[] {
  if (!isBrowser) return getDefaultCategories();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : getDefaultCategories();
  } catch {
    return getDefaultCategories();
  }
}

export function saveCategories(categories: Category[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}

// Default categories
export function getDefaultCategories(): Category[] {
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

// Default user
export function getDefaultUser(): User {
  return {
    id: '1',
    name: 'ผู้ใช้งาน',
    email: 'user@demo.com',
    role: 'owner',
  };
}

// Initialize user if not exists
export function initializeUser(): User {
  let user = getUser();
  if (!user) {
    user = getDefaultUser();
    saveUser(user);
  }
  return user;
}

// Calculate dashboard summary from transactions
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
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    currentMonthIncome,
    currentMonthExpense,
    netProfit: currentMonthIncome - currentMonthExpense,
    totalTransactions: transactions.length,
  };
}

// Calculate monthly data for charts
export function calculateMonthlyData(transactions: Transaction[]) {
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Get last 6 months
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
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyData.push({
      month: monthNames[month],
      income,
      expense,
    });
  }

  return monthlyData;
}

// Calculate category data for pie chart
export function calculateCategoryData(transactions: Transaction[]) {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
  
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const categoryMap = new Map<string, number>();
  expenseTransactions.forEach(t => {
    const current = categoryMap.get(t.category) || 0;
    categoryMap.set(t.category, current + t.amount);
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

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
