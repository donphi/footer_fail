import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if we have the required env vars
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null as any;

export type Site = {
  id: string;
  url: string;
  slug: string;
  company?: string;
  industry?: string;
  country?: string;
  detected_years: number[];
  current_year: number;
  status: 'ok' | 'stale' | 'inconclusive' | 'future';
  first_incorrect_at?: string;
  last_incorrect_at?: string;
  last_correct_at?: string;
  corrected_at?: string;
  verified_at?: string;
  last_checked_at?: string;
  proof_internet_archive?: string;
  proof_archive_today?: string;
  screenshot_url?: string;
  screenshot_hash?: string;
  brand_weight: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  site_id: string;
  site_slug: string;
  author: string;
  content: string;
  timestamp: string;
};