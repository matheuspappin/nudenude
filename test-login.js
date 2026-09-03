const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log("Testing Login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'vendaslachef@gmail.com',
    password: 'Wanrltwaezakmi171?'
  });
  
  if (error) {
    console.error("Login failed:", error.message);
  } else {
    console.log("Login success! User ID:", data.user.id);
  }
}

testLogin();
