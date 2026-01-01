// Simple Internal Auth System
// กำหนด users และ passwords ได้เอง

export type UserRole = 'owner' | 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ========================================
// กำหนด Users ที่นี่! แก้ไขได้ตามต้องการ
// ========================================
const USERS: { [username: string]: { password: string; user: User } } = {
  // Owner - เข้าถึงได้ทุกอย่าง, จัดการผู้ใช้, export reports
  'owner': {
    password: 'quarion2024',
    user: {
      id: '1',
      name: 'Owner',
      email: 'owner@quarion.com',
      role: 'owner'
    }
  },
  // Owner - skillfi99
  'skillfi99': {
    password: 'skillfi99',
    user: {
      id: '6',
      name: 'Skillfi99',
      email: 'skillfi99@quarion.com',
      role: 'owner'
    }
  },
  // Admin - เพิ่ม/แก้ไข transactions, upload slips
  'admin': {
    password: 'admin2024',
    user: {
      id: '2',
      name: 'Admin',
      email: 'admin@quarion.com',
      role: 'admin'
    }
  },
  // Viewer - ดู dashboard อย่างเดียว
  'viewer': {
    password: 'viewer2024',
    user: {
      id: '3',
      name: 'Viewer',
      email: 'viewer@quarion.com',
      role: 'viewer'
    }
  },
  // Admin01
  'admin01': {
    password: 'admin01',
    user: {
      id: '4',
      name: 'Pukan',
      email: 'admin01@quarion.com',
      role: 'admin'
    }
  },
  // Admin02
  'admin02': {
    password: 'admin02',
    user: {
      id: '5',
      name: 'Gift',
      email: 'admin02@quarion.com',
      role: 'admin'
    }
  }
};

// ========================================
// Auth Functions
// ========================================

export function authenticate(username: string, password: string): User | null {
  const userEntry = USERS[username.toLowerCase()];
  if (userEntry && userEntry.password === password) {
    return userEntry.user;
  }
  return null;
}

export function getAllUsers(): User[] {
  return Object.values(USERS).map(entry => entry.user);
}

// ========================================
// Role Permissions
// ========================================

export const PERMISSIONS = {
  // หน้าที่แต่ละ role เข้าได้
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
  // actions ที่แต่ละ role ทำได้
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
