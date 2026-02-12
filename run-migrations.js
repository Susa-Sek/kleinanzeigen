#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  try {
    // Use Supabase's RPC to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If the RPC function doesn't exist, we need to create it first
      console.log('⚠️  exec_sql function not found, trying alternative method...');

      // Try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const migrationFiles = [
    '20260212000001_initial_schema.sql',
    '20260212000002_enable_realtime.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${file}`);
      continue;
    }

    console.log(`📄 Running migration: ${file}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);

        // Execute via fetch to Supabase REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ query: statement })
        });

        // Note: Supabase REST API doesn't support arbitrary SQL execution for security
        // We need to use the SQL Editor in the dashboard or CLI
      }

      console.log(`✅ Migration completed: ${file}\n`);
    } catch (error) {
      console.error(`❌ Error in migration ${file}:`, error.message);
      console.error('   Please run this migration manually in Supabase SQL Editor\n');
    }
  }
}

// Alternative: Use Supabase CLI
async function runViaCli() {
  const { execSync } = require('child_process');

  try {
    console.log('🔄 Attempting to run migrations via Supabase CLI...\n');

    // Check if supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' });
    } catch {
      console.log('⚠️  Supabase CLI not found. Installing...\n');
      console.log('   Run: npm install -g supabase\n');
      return false;
    }

    // Run migrations
    const result = execSync('supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.uyfogthmpmenivnyiioe.supabase.co:5432/postgres"', {
      cwd: __dirname,
      encoding: 'utf8'
    });

    console.log(result);
    return true;
  } catch (error) {
    console.error('❌ CLI migration failed:', error.message);
    return false;
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         Supabase Migration Helper                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('⚠️  IMPORTANT: Supabase does not allow executing arbitrary SQL via REST API for security reasons.\n');
console.log('📋 Please run migrations manually using one of these methods:\n');

console.log('METHOD 1: Supabase Dashboard (Recommended)');
console.log('─────────────────────────────────────────────────────────────');
console.log('1. Open: https://supabase.com/dashboard/project/uyfogthmpmenivnyiioe');
console.log('2. Click "SQL Editor" in the left sidebar');
console.log('3. Click "New query"');
console.log('4. Copy the content of: supabase/migrations/20260212000001_initial_schema.sql');
console.log('5. Paste into SQL Editor');
console.log('6. Click "Run" (bottom right)');
console.log('7. Wait for success ✓');
console.log('8. Repeat with: supabase/migrations/20260212000002_enable_realtime.sql\n');

console.log('METHOD 2: Supabase CLI');
console.log('─────────────────────────────────────────────────────────────');
console.log('1. Install: npm install -g supabase');
console.log('2. Login: supabase login');
console.log('3. Link project: supabase link --project-ref uyfogthmpmenivnyiioe');
console.log('4. Push migrations: supabase db push\n');

console.log('✅ Migration files are located at:');
console.log('   - supabase/migrations/20260212000001_initial_schema.sql');
console.log('   - supabase/migrations/20260212000002_enable_realtime.sql\n');

process.exit(0);
