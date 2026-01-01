import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client only if credentials are provided
// This allows the app to run in demo mode without Supabase
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Helper function to upload file to Supabase Storage
export async function uploadSlip(file: File, transactionId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${transactionId}-${Date.now()}.${fileExt}`;
  const filePath = `slips/${fileName}`;

  const { error } = await supabase.storage
    .from('transaction-slips')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading slip:', error);
    return null;
  }

  // Get public URL
  const { data } = supabase.storage
    .from('transaction-slips')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Helper function to delete file from Supabase Storage
export async function deleteSlip(slipUrl: string): Promise<boolean> {
  // Extract file path from URL
  const urlParts = slipUrl.split('/');
  const filePath = `slips/${urlParts[urlParts.length - 1]}`;

  const { error } = await supabase.storage
    .from('transaction-slips')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting slip:', error);
    return false;
  }

  return true;
}
