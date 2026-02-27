// test.js
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const { data, error } = await supabase.storage
      .from('resources')
      .list('', { limit: 1 });

    console.log("DATA:", data);
    console.log("ERROR:", error);
  } catch (e) {
    console.error("CRASH:", e);
  }
})();