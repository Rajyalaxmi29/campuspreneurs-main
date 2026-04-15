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
  try {
    const result = await supabase.from('user_roles').select('*').limit(5);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  }
})();
