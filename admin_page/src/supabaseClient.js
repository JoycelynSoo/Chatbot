import { createClient } from '@supabase/supabase-js';

// Use the correct environment variable names
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase URL or Key. Please check your environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);