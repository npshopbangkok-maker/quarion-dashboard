import { supabase } from './supabase';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types/database';

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;

  // Fetch user profile from database
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error || !userProfile) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return userProfile as User;
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    const user = await getCurrentUser();
    return { user, error: null };
  }

  return { user: null, error: 'Unknown error occurred' };
}

// Sign out
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  await supabase.auth.signOut();
}

// Check if user has specific permission
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

// Re-export for convenience
export type { User };
