const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8')
  .split(/\r?\n/)
  .reduce((acc, line) => {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m) {
      acc[m[1]] = m[2].replace(/^"|"$/g, '');
    }
    return acc;
  }, {});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

(async () => {
  const email = '23r11a0515@gcet.edu.in';
  const ilikeSearch = `%${email}%`;
  const query = `email.eq.${email},name.ilike.${ilikeSearch},email.ilike.${ilikeSearch}`;
  console.log('Query string:', query);
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email')
    .or(query)
    .order('created_at', { ascending: false })
    .limit(50);
  console.log('error:', error);
  console.log('data:', data);
})();
