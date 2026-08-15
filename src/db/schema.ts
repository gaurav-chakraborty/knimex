import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Auth tables for Better Auth (Postgres).
export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    role: text('role').notNull().default('user'),
    plan: text('plan').notNull().default('free'),
    subscriptionStatus: text('subscription_status').notNull().default('inactive'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    currentPeriodEnd: timestamp('current_period_end'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('user_role_idx').on(table.role),
    index('user_plan_idx').on(table.plan),
    index('user_subscription_status_idx').on(table.subscriptionStatus),
    index('user_created_at_idx').on(table.createdAt),
    index('user_stripe_customer_idx').on(table.stripeCustomerId),
    check('user_role_check', sql`${table.role} in ('user', 'admin')`),
    check('user_plan_check', sql`${table.plan} in ('free', 'pro', 'enterprise')`),
    check(
      'user_subscription_status_check',
      sql`${table.subscriptionStatus} in ('inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid')`,
    ),
    check('user_name_non_empty_check', sql`length(trim(${table.name})) > 0`),
    check('user_email_non_empty_check', sql`length(trim(${table.email})) > 3`),
  ],
);

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('session_user_id_idx').on(table.userId),
    index('session_expires_at_idx').on(table.expiresAt),
  ],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    uniqueIndex('account_provider_account_idx').on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('verification_identifier_idx').on(table.identifier),
    index('verification_expires_at_idx').on(table.expiresAt),
  ],
);

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    eventType: text('event_type').notNull(),
    eventData: jsonb('event_data'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('analytics_events_user_id_idx').on(table.userId),
    index('analytics_events_event_type_idx').on(table.eventType),
    index('analytics_events_created_at_idx').on(table.createdAt),
    index('analytics_events_event_type_created_at_idx').on(table.eventType, table.createdAt),
    check('analytics_event_type_non_empty_check', sql`length(trim(${table.eventType})) > 0`),
  ],
);

export const feedbackSubmissions = pgTable(
  'feedback_submissions',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    rating: integer('rating'),
    category: text('category'),
    status: text('status').notNull().default('new'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('feedback_submissions_user_id_idx').on(table.userId),
    index('feedback_submissions_status_idx').on(table.status),
    index('feedback_submissions_created_at_idx').on(table.createdAt),
    check('feedback_email_non_empty_check', sql`length(trim(${table.email})) > 3`),
    check('feedback_subject_non_empty_check', sql`length(trim(${table.subject})) > 0`),
    check('feedback_message_non_empty_check', sql`length(trim(${table.message})) > 0`),
    check('feedback_rating_check', sql`${table.rating} is null or ${table.rating} between 1 and 5`),
    check('feedback_status_check', sql`${table.status} in ('new', 'reviewed', 'resolved')`),
  ],
);

export const usageRecords = pgTable(
  'usage_records',
  {
    id: serial('id').primaryKey(),
    identifier: text('identifier').notNull(),
    usageDate: text('usage_date').notNull(),
    filesProcessed: integer('files_processed').notNull().default(0),
    limitNotifiedAt: timestamp('limit_notified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('usage_records_identifier_date_idx').on(table.identifier, table.usageDate),
    index('usage_records_updated_at_idx').on(table.updatedAt),
    check('usage_identifier_non_empty_check', sql`length(trim(${table.identifier})) > 0`),
    check('usage_date_format_check', sql`${table.usageDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`),
    check('usage_files_processed_non_negative_check', sql`${table.filesProcessed} >= 0`),
  ],
);
