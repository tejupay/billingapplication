import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mogxxfeyxbwfboyppows.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ3h4ZmV5eGJ3ZmJveXBwb3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzE3NzEsImV4cCI6MjA1NTc0Nzc3MX0.47H2jO1tPfgKzQv_c0xV_f52VfC7yT55zQyv4qg9GZk';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;
