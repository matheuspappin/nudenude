const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNiches() {
  console.log("Testing RPC get_active_niches...");
  const { data, error } = await supabase.rpc('get_active_niches', { threshold: 5 });
  if (error) {
     console.error("Error details:", JSON.stringify(error, null, 2));
  } else {
     console.log("Data length:", data?.length);
     console.log("Data:", data);
  }
}

testNiches();
