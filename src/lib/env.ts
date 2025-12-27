// Environment variable validation
// This file validates required environment variables at startup

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'BETTER_AUTH_URL',
] as const;

const optionalEnvVars = [
  'CRON_SECRET',
] as const;

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Optional env var ${envVar} is not set`);
    }
  }

  // Validate URL formats
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    warnings.push('DATABASE_URL does not appear to be a valid PostgreSQL connection string');
  }

  const isValid = missing.length === 0;

  return {
    isValid,
    missing,
    warnings,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Auto-validate on import in development
if (process.env.NODE_ENV !== 'production') {
  const result = validateEnv();

  if (!result.isValid) {
    console.error('❌ Missing required environment variables:');
    result.missing.forEach(v => console.error(`  - ${v}`));
    throw new Error('Missing required environment variables. Check .env file.');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(w => console.warn(`  - ${w}`));
  }
}
