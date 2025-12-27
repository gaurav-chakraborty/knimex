import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ltnyquqksxinxkbzdtzs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnlxdXFrc3hpbnhrYnpkdHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTM5MzEsImV4cCI6MjA4MDk4OTkzMX0.bwj_6Sw77ufvUeig2g94QXBlWtao1fTjHR7_tYo5wrw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
