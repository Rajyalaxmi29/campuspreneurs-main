import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  console.log('Using', url)
  try {
    const { data: page_content, error: e1 } = await supabase.from('page_content').select('*').limit(10)
    console.log('page_content error:', e1)
    console.log('page_content count:', page_content?.length ?? 0)

    const { data: resources, error: e2 } = await supabase.from('resources').select('*').limit(10)
    console.log('resources error:', e2)
    console.log('resources count:', resources?.length ?? 0)

    // Try an authenticated-only table (problem_statements) — will likely require sign-in
    const { data: problems, error: e3 } = await supabase.from('problem_statements').select('*').limit(5)
    console.log('problem_statements error:', e3)
    console.log('problem_statements count:', problems?.length ?? 0)
  } catch (err) {
    console.error('Unexpected error', err)
  }
}

run()
