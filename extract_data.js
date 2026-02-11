import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function extractAllData() {
  console.log('Extracting all data from Supabase database...\n');

  try {
    // Test connection
    console.log('Testing connection...');
    const { data: testData, error: testError } = await supabase.from('profiles').select('count').limit(1);
    if (testError) {
      console.error('Connection test failed:', testError);
      return;
    }
    console.log('Connection successful!\n');

    // Check current user
    console.log('=== CURRENT USER ===');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('No authenticated user');
    } else if (user) {
      console.log('Current user:', JSON.stringify(user, null, 2));
    } else {
      console.log('No user logged in');
    }

    // Extract from problem_statements
    console.log('\n=== PROBLEM_STATEMENTS ===');
    const { data: problems, error: problemsError } = await supabase
      .from('problem_statements')
      .select('*');
    if (problemsError) {
      console.error('Error fetching problem_statements:', problemsError);
    } else {
      console.log(`Found ${problems.length} records`);
      console.log(JSON.stringify(problems, null, 2));
    }

    // Extract from profiles
    console.log('\n=== PROFILES ===');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log(`Found ${profiles.length} records`);
      console.log(JSON.stringify(profiles, null, 2));
    }

    // Extract from user_roles
    console.log('\n=== USER_ROLES ===');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');
    if (userRolesError) {
      console.error('Error fetching user_roles:', userRolesError);
    } else {
      console.log(`Found ${userRoles.length} records`);
      console.log(JSON.stringify(userRoles, null, 2));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

extractAllData();
