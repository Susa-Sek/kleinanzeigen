#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function executeMigrationViaApi(sql, migrationName) {
  console.log(`\n📄 Executing: ${migrationName}`);

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    const statementPreview = statement.substring(0, 50).replace(/\n/g, ' ') + '...';
    process.stdout.write(`   [${i + 1}/${statements.length}] ${statementPreview} `);

    try {
      // Use Supabase's query endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: statement })
      });

      if (response.ok) {
        console.log('✅');
        successCount++;
      } else {
        const error = await response.text();
        // If it's just "function does not exist", we need to use direct SQL execution
        console.log('⚠️');
        console.log(`      (${error.substring(0, 80)}...)`);
        errorCount++;
      }
    } catch (error) {
      console.log('❌');
      console.log(`      Error: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n   Summary: ${successCount} succeeded, ${errorCount} failed/skipped\n`);
  return errorCount === 0;
}

async function runMigrations() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        Auto Migration Script for Supabase                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`🔗 Connecting to: ${supabaseUrl}\n`);

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const migrationFiles = [
    '20260212000001_initial_schema.sql',
    '20260212000002_enable_realtime.sql'
  ];

  let allSuccess = true;

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const success = await executeMigrationViaApi(sql, file);

    if (!success) {
      allSuccess = false;
    }
  }

  if (!allSuccess) {
    console.log('\n⚠️  Some migrations had errors. This is expected because Supabase');
    console.log('   REST API doesn\'t support arbitrary SQL execution.\n');
    console.log('📋 Please run migrations manually:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/uyfogthmpmenivnyiioe/sql');
    console.log('   2. Copy & paste each migration file');
    console.log('   3. Click "Run"\n');
  } else {
    console.log('\n✅ All migrations completed successfully!\n');
  }
}

runMigrations().catch(console.error);
