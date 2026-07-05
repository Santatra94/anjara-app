import { createClient } from '@supabase/supabase-js';

// Ce client a des privilèges élevés pour gérer les utilisateurs Auth (create user)
// À utiliser UNIQUEMENT dans les Server Actions ou API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
