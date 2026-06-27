import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwhsiikwzwrghhuvijhs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3aHNpaWt3endyZ2hodXZpamhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzQzNDQsImV4cCI6MjA5Nzc1MDM0NH0.CWu37UPavMOOIhp_O-NyFocVjUpiGXr9ptCN-L3aVlg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
