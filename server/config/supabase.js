// server/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service key for server use
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
