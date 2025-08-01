// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ebbmofwdghxsudvbakql.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYm1vZndkZ2h4c3VkdmJha3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzQ2NDYsImV4cCI6MjA2ODYxMDY0Nn0.Zs4SDfFtfH8r0fgLt5rlUSSFzxyS7cRii39BNp_r5Ac";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});