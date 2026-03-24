const { createClient } = require('@supabase/supabase-js');

/* ============================================================================
   SUPABASE SERVICE
   Lazy-initialized singleton — the client is only created on first use,
   by which point dotenv.config() has already run in server/index.js.

   If we called createClient() at the top level here, Node would execute it
   immediately during the require() chain — before dotenv has loaded the .env
   file — resulting in createClient(undefined, undefined) and every Supabase
   call silently failing with "fetch failed".
============================================================================ */

let client = null;

const getSupabase = () => {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Supabase env vars missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env'
      );
    }

    client = createClient(url, key);
  }

  return client;
};

module.exports = getSupabase;