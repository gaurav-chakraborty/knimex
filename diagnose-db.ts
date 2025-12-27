/**
 * Detailed Database Diagnostics
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(status: 'success' | 'error' | 'info' | 'warning', message: string) {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
  }[status];
  console.log(`${prefix} ${message}`);
}

async function diagnose() {
  console.log(`\n${colors.cyan}=== Database Connection Diagnostics ===${colors.reset}\n`);

  // 1. Check environment variables
  console.log(`${colors.cyan}1. Environment Variables:${colors.reset}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`   SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET'}`);

  // 2. Test Supabase REST API
  console.log(`\n${colors.cyan}2. Testing Supabase REST API:${colors.reset}`);
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.from('user').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        log('success', 'Supabase connection OK (table empty)');
      } else {
        log('error', `Supabase error: ${error.message} (code: ${error.code})`);
        console.log('   Full error:', JSON.stringify(error, null, 2));
      }
    } else {
      log('success', `Supabase connection OK (${data?.length || 0} rows returned)`);
    }
  } catch (err: any) {
    log('error', `Supabase connection failed: ${err.message}`);
    console.log('   Error details:', err);
  }

  // 3. Test Direct PostgreSQL Connection
  console.log(`\n${colors.cyan}3. Testing Direct PostgreSQL Connection:${colors.reset}`);
  try {
    console.log(`   Connection string: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);

    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: 'require',
      onnotice: () => {}, // Suppress notices
    });

    console.log(`   Attempting to connect...`);
    const result = await client`SELECT version()`;
    log('success', 'PostgreSQL connection successful');
    console.log(`   PostgreSQL version: ${result[0]?.version}`);

    // Test if tables exist
    console.log(`\n${colors.cyan}4. Checking Database Tables:${colors.reset}`);
    const tables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length > 0) {
      log('success', `Found ${tables.length} tables:`);
      for (const table of tables) {
        console.log(`     - ${table.table_name}`);
      }
    } else {
      log('warning', 'No tables found in the public schema');
      log('info', 'You may need to run database migrations');
    }

    // Check for specific tables we need
    console.log(`\n${colors.cyan}5. Checking Required Tables:${colors.reset}`);
    const requiredTables = ['user', 'session', 'account', 'verification', 'analytics_events', 'feedback_submissions'];

    for (const tableName of requiredTables) {
      const exists = tables.find(t => t.table_name === tableName);
      if (exists) {
        const count = await client`SELECT COUNT(*) as count FROM ${client(tableName)}`;
        log('success', `Table '${tableName}' exists (${count[0]?.count || 0} rows)`);
      } else {
        log('error', `Table '${tableName}' NOT FOUND`);
      }
    }

    await client.end();

  } catch (err: any) {
    log('error', `PostgreSQL connection failed: ${err.message}`);
    console.log('   Error code:', err.code);
    console.log('   Error details:', err);

    if (err.code === 'ECONNREFUSED') {
      log('info', 'Connection refused - check if database is accessible');
    } else if (err.code === 'ENOTFOUND') {
      log('info', 'Host not found - check DATABASE_URL');
    } else if (err.code === 'ETIMEDOUT') {
      log('info', 'Connection timeout - check network/firewall');
    }
  }

  console.log(`\n${colors.cyan}=== End of Diagnostics ===${colors.reset}\n`);
}

diagnose().catch(console.error);
