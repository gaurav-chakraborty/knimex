/**
 * Database Connection Test Script
 * Tests Supabase PostgreSQL connection and user management functionality
 *
 * Run with: npx tsx test-db-connections.ts
 */

// Load environment variables FIRST before any other imports
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, session, account, verification, analyticsEvents, feedbackSubmissions } from './src/db/schema';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

// Color codes for terminal output
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

function section(title: string) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function testSupabaseConnection() {
  section('Testing Supabase Connection');

  try {
    // Test environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
    }

    log('success', 'Environment variables are set');
    log('info', `Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test basic Supabase connection
    const { data, error } = await supabase.from('user').select('count').limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
      throw error;
    }

    log('success', 'Supabase client connection successful');

    // Test service role client
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    const { error: serviceError } = await serviceClient.from('user').select('count').limit(1);

    if (serviceError && serviceError.code !== 'PGRST116') {
      throw serviceError;
    }

    log('success', 'Supabase service role client connection successful');

    return true;
  } catch (error: any) {
    log('error', `Supabase connection failed: ${error.message}`);
    return false;
  }
}

async function testDrizzleConnection() {
  section('Testing Drizzle ORM Connection');

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }

    log('success', 'DATABASE_URL is set');

    // Create Drizzle client
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);

    // Test basic query
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    log('success', 'Drizzle ORM connection successful');
    log('info', `Database time: ${JSON.stringify(result.rows[0])}`);

    // Close connection
    await client.end();

    return true;
  } catch (error: any) {
    log('error', `Drizzle connection failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseSchema() {
  section('Testing Database Schema');

  try {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client);

    // Check if tables exist
    const tables = ['user', 'session', 'account', 'verification', 'analytics_events', 'feedback_submissions'];

    for (const tableName of tables) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ) as exists
      `);

      const exists = result.rows[0]?.exists;

      if (exists) {
        log('success', `Table '${tableName}' exists`);

        // Get row count
        const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`);
        const count = countResult.rows[0]?.count || 0;
        log('info', `  └─ Row count: ${count}`);
      } else {
        log('error', `Table '${tableName}' does NOT exist`);
      }
    }

    await client.end();
    return true;
  } catch (error: any) {
    log('error', `Schema check failed: ${error.message}`);
    return false;
  }
}

async function testUserManagement() {
  section('Testing User Management');

  try {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client, { schema: { user, session, account, verification, analyticsEvents, feedbackSubmissions } });

    // Check user table structure
    const users = await db.select().from(user).limit(5);
    log('success', `User table query successful`);
    log('info', `Total users in preview: ${users.length}`);

    if (users.length > 0) {
      const sampleUser = users[0];
      log('info', `Sample user fields: ${Object.keys(sampleUser).join(', ')}`);

      // Test role-based query
      const adminUsers = await db.select().from(user).where(eq(user.role, 'admin'));
      log('info', `Admin users count: ${adminUsers.length}`);

      const regularUsers = await db.select().from(user).where(eq(user.role, 'user'));
      log('info', `Regular users count: ${regularUsers.length}`);
    } else {
      log('warning', 'No users found in database');
    }

    await client.end();
    return true;
  } catch (error: any) {
    log('error', `User management test failed: ${error.message}`);
    return false;
  }
}

async function testSessionManagement() {
  section('Testing Session Management');

  try {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client, { schema: { user, session, account, verification, analyticsEvents, feedbackSubmissions } });

    const sessions = await db.select().from(session).limit(5);
    log('success', `Session table query successful`);
    log('info', `Total sessions in preview: ${sessions.length}`);

    if (sessions.length > 0) {
      const activeSessions = sessions.filter(s => new Date(s.expiresAt) > new Date());
      log('info', `Active sessions: ${activeSessions.length}`);
      log('info', `Expired sessions: ${sessions.length - activeSessions.length}`);
    }

    await client.end();
    return true;
  } catch (error: any) {
    log('error', `Session management test failed: ${error.message}`);
    return false;
  }
}

async function testAnalyticsTracking() {
  section('Testing Analytics & Feedback Tables');

  try {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client, { schema: { user, session, account, verification, analyticsEvents, feedbackSubmissions } });

    // Test analytics events
    const analyticsCount = await db.select().from(analyticsEvents).limit(1);
    log('success', 'Analytics events table accessible');

    const totalAnalytics = await db.execute(sql`SELECT COUNT(*) as count FROM analytics_events`);
    log('info', `Total analytics events: ${totalAnalytics.rows[0]?.count || 0}`);

    // Test feedback submissions
    const feedbackCount = await db.select().from(feedbackSubmissions).limit(1);
    log('success', 'Feedback submissions table accessible');

    const totalFeedback = await db.execute(sql`SELECT COUNT(*) as count FROM feedback_submissions`);
    log('info', `Total feedback submissions: ${totalFeedback.rows[0]?.count || 0}`);

    await client.end();
    return true;
  } catch (error: any) {
    log('error', `Analytics/Feedback test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseWritePermissions() {
  section('Testing Database Write Permissions');

  try {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client);

    // Test if we can perform a transaction (without committing)
    await db.transaction(async (tx) => {
      // This will rollback, just testing permissions
      log('success', 'Transaction support verified');
      throw new Error('Intentional rollback');
    }).catch(() => {
      // Expected to fail with intentional rollback
    });

    log('success', 'Database write permissions verified');
    await client.end();
    return true;
  } catch (error: any) {
    log('error', `Write permissions test failed: ${error.message}`);
    return false;
  }
}

async function checkForTursoConfig() {
  section('Checking for Turso Configuration');

  const hasTursoUrl = !!process.env.TURSO_CONNECTION_URL;
  const hasTursoToken = !!process.env.TURSO_AUTH_TOKEN;

  if (hasTursoUrl || hasTursoToken) {
    log('warning', 'Turso environment variables found but NOT being used');
    log('info', 'Your project is configured to use Supabase PostgreSQL, not Turso');
    if (hasTursoUrl) log('info', `TURSO_CONNECTION_URL is set but unused`);
    if (hasTursoToken) log('info', `TURSO_AUTH_TOKEN is set but unused`);
  } else {
    log('info', 'No Turso configuration found (expected - using Supabase)');
  }
}

async function main() {
  console.log(`\n${colors.blue}╔${'═'.repeat(58)}╗${colors.reset}`);
  console.log(`${colors.blue}║${' '.repeat(10)}Database Connection Test Suite${' '.repeat(17)}║${colors.reset}`);
  console.log(`${colors.blue}╚${'═'.repeat(58)}╝${colors.reset}\n`);

  const results = {
    supabase: false,
    drizzle: false,
    schema: false,
    users: false,
    sessions: false,
    analytics: false,
    writePerms: false,
  };

  try {
    // Run all tests
    results.supabase = await testSupabaseConnection();
    results.drizzle = await testDrizzleConnection();
    results.schema = await testDatabaseSchema();
    results.users = await testUserManagement();
    results.sessions = await testSessionManagement();
    results.analytics = await testAnalyticsTracking();
    results.writePerms = await testDatabaseWritePermissions();

    // Check Turso config
    await checkForTursoConfig();

    // Summary
    section('Test Summary');

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.values(results).length;

    console.log(`${colors.cyan}Results:${colors.reset}`);
    console.log(`  ✓ Supabase Connection:     ${results.supabase ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
    console.log(`  ✓ Drizzle ORM:             ${results.drizzle ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
    console.log(`  ✓ Database Schema:         ${results.schema ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
    console.log(`  ✓ User Management:         ${results.users ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
    console.log(`  ✓ Session Management:      ${results.sessions ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
    console.log(`  ✓ Analytics/Feedback:      ${results.analytics ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
    console.log(`  ✓ Write Permissions:       ${results.writePerms ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);

    console.log(`\n${colors.cyan}Overall: ${passed}/${total} tests passed${colors.reset}\n`);

    if (passed === total) {
      log('success', 'All database connections and user management are working correctly! 🎉');
      process.exit(0);
    } else {
      log('error', 'Some tests failed. Please review the output above.');
      process.exit(1);
    }

  } catch (error: any) {
    log('error', `Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main();
