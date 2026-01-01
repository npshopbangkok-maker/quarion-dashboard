// Database Types for Quarion Dashboard

export type UserRole = 'owner' | 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_by: string;
  slip_url: string | null;
  created_at: string;
  // Joined fields
  user?: User;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

// Dashboard Summary Types
export interface DashboardSummary {
  currentMonthIncome: number;
  currentMonthExpense: number;
  netProfit: number;
  totalTransactions: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

// Role Permissions
export const ROLE_PERMISSIONS = {
  owner: {
    canViewDashboard: true,
    canManageTransactions: true,
    canUploadSlip: true,
    canManageUsers: true,
    canExportReports: true,
    canViewReports: true,
  },
  admin: {
    canViewDashboard: true,
    canManageTransactions: true,
    canUploadSlip: true,
    canManageUsers: false,
    canExportReports: false,
    canViewReports: true,
  },
  viewer: {
    canViewDashboard: true,
    canManageTransactions: false,
    canUploadSlip: false,
    canManageUsers: false,
    canExportReports: false,
    canViewReports: false,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];
