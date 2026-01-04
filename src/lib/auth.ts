// Auth System - supports both Supabase and Local fallback
import { supabase, isSupabaseConfigured } from './supabase';

export type UserRole = 'owner' | 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ========================================
// Local Users Fallback (ใช้เมื่อไม่มี Supabase)
// ========================================
const LOCAL_USERS: { [username: string]: { password: string; user: User } } = {
  'owner': {
    password: 'quarion2024',
    user: { id: '1', name: 'Owner', email: 'owner@quarion.com', role: 'owner' }
  },
  'skillfi99': {
    password: 'skillfi99',
    user: { id: '6', name: 'Skillfi99', email: 'skillfi99@quarion.com', role: 'owner' }
  },
  'admin': {
    password: 'admin2024',
    user: { id: '2', name: 'Admin', email: 'admin@quarion.com', role: 'admin' }
  },
  'viewer': {
    password: 'viewer2024',
    user: { id: '3', name: 'Viewer', email: 'viewer@quarion.com', role: 'viewer' }
  },
  'admin01': {
    password: 'admin01',
    user: { id: '4', name: 'Pukan', email: 'admin01@quarion.com', role: 'admin' }
  },
  'admin02': {
    password: 'admin02',
    user: { id: '5', name: 'Gift', email: 'admin02@quarion.com', role: 'admin' }
  },
  'convertcake': {
    password: 'convertcake',
    user: { id: '7', name: 'Convertcake', email: 'convertcake@quarion.com', role: 'viewer' }
  }
};

// ========================================
// Auth Functions
// ========================================

// Authenticate from Supabase
async function authenticateFromSupabase(username: string, password: string): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, password, name, email, role')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole
    };
  } catch (error) {
    console.error('Supabase auth error:', error);
    return null;
  }
}

// Authenticate from Local
function authenticateFromLocal(username: string, password: string): User | null {
  const userEntry = LOCAL_USERS[username.toLowerCase()];
  if (userEntry && userEntry.password === password) {
    return userEntry.user;
  }
  return null;
}

// Main authenticate function - tries Supabase first, then Local
export async function authenticate(username: string, password: string): Promise<User | null> {
  // Try Supabase first
  const supabaseUser = await authenticateFromSupabase(username, password);
  if (supabaseUser) {
    return supabaseUser;
  }
  
  // Fallback to local
  return authenticateFromLocal(username, password);
}

// Sync version for backward compatibility
export function authenticateSync(username: string, password: string): User | null {
  return authenticateFromLocal(username, password);
}

// Get all users from Supabase
export async function getAllUsers(): Promise<User[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return Object.values(LOCAL_USERS).map(entry => entry.user);
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return Object.values(LOCAL_USERS).map(entry => entry.user);
    }

    return data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as UserRole
    }));
  } catch {
    return Object.values(LOCAL_USERS).map(entry => entry.user);
  }
}

// ========================================
// Role Permissions
// ========================================

export const PERMISSIONS = {
  pages: {
    dashboard: ['owner', 'admin', 'viewer'] as UserRole[],
    transactions: ['owner', 'admin', 'viewer'] as UserRole[],
    upload: ['owner', 'admin'] as UserRole[],
    reports: ['owner', 'admin'] as UserRole[],
    calendar: ['owner'] as UserRole[],
    analytics: ['owner'] as UserRole[],
    settings: ['owner'] as UserRole[],
    users: ['owner'] as UserRole[]
  },
  actions: {
    viewDashboard: ['owner', 'admin', 'viewer'] as UserRole[],
    viewTransactions: ['owner', 'admin', 'viewer'] as UserRole[],
    addTransaction: ['owner', 'admin'] as UserRole[],
    editTransaction: ['owner', 'admin'] as UserRole[],
    deleteTransaction: ['owner'] as UserRole[],
    uploadSlip: ['owner', 'admin'] as UserRole[],
    exportReports: ['owner', 'admin'] as UserRole[],
    manageUsers: ['owner'] as UserRole[],
    manageSettings: ['owner'] as UserRole[],
    viewAnalytics: ['owner'] as UserRole[]
  }
};

export function canAccessPage(role: UserRole, page: keyof typeof PERMISSIONS.pages): boolean {
  return PERMISSIONS.pages[page].includes(role);
}

export function canPerformAction(role: UserRole, action: keyof typeof PERMISSIONS.actions): boolean {
  return PERMISSIONS.actions[action].includes(role);
}

// ========================================
// Owner Guard Helpers
// ========================================

export function isOwner(user: User | null): boolean {
  return user?.role === 'owner';
}

export function requireOwner(user: User | null): void {
  if (!isOwner(user)) {
    throw new Error('Unauthorized: Owner access required');
  }
}

// Role labels ภาษาไทย
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'เจ้าของ',
  admin: 'ผู้ดูแล',
  viewer: 'ผู้ชม'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'เข้าถึงได้ทุกอย่าง, จัดการผู้ใช้, export reports',
  admin: 'เพิ่ม/แก้ไข transactions, upload slips',
  viewer: 'ดู dashboard อย่างเดียว'
};
