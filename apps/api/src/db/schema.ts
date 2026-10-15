/**
 * Drizzle schema. One table per core collection (`c_<snake_name>`), all with the same shape:
 *   id · sort · active · owner_id · data (jsonb, the domain fields) · created_at · updated_at
 * plus the `sessions` table for cookie auth.
 *
 * Tables are listed explicitly (not generated in a loop) so drizzle-kit can discover them as module exports;
 * `TABLES` is typed against core's CollectionName so adding a collection in core without a table here fails typecheck,
 * and test/schema.test.ts asserts the list matches COLLECTIONS at runtime.
 */
import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import type { CollectionName } from '@shift/core';

export const tableName = (col: string) => `c_${col.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)}`;

function collectionTable<N extends string>(name: N, extra?: 'users') {
  return pgTable(
    name,
    {
      id: text('id').primaryKey(),
      sort: integer('sort').notNull().default(0),
      active: boolean('active').notNull().default(true),
      ownerId: text('owner_id'),
      data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
      createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
      updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    },
    (t) => {
      const base = [
        index(`${name}_owner_idx`).on(t.ownerId),
        index(`${name}_sort_idx`).on(t.sort, t.createdAt),
        index(`${name}_data_gin`).using('gin', t.data),
      ];
      // Users are looked up by email on every login: keep emails unique (case-insensitive).
      if (extra === 'users') base.push(uniqueIndex(`${name}_email_uq`).on(sql`lower(${t.data} ->> 'email')`) as never);
      return base;
    },
  );
}

export type CollectionTable = ReturnType<typeof collectionTable>;

// master
export const c_branding = collectionTable('c_branding');
export const c_settings = collectionTable('c_settings');
export const c_plans = collectionTable('c_plans');
export const c_products = collectionTable('c_products');
export const c_toolkits = collectionTable('c_toolkits');
export const c_stages = collectionTable('c_stages');
export const c_lessons = collectionTable('c_lessons');
export const c_checkpoints = collectionTable('c_checkpoints');
export const c_wheel_areas = collectionTable('c_wheel_areas');
export const c_free_tool = collectionTable('c_free_tool');
export const c_free_questions = collectionTable('c_free_questions');
export const c_quiz = collectionTable('c_quiz');
export const c_forms = collectionTable('c_forms');
export const c_emails = collectionTable('c_emails');
export const c_pages = collectionTable('c_pages');
export const c_faqs = collectionTable('c_faqs');
export const c_journey_stages = collectionTable('c_journey_stages');
export const c_pipeline_stages = collectionTable('c_pipeline_stages');
export const c_lead_sources = collectionTable('c_lead_sources');
export const c_letters = collectionTable('c_letters');
export const c_blueprint = collectionTable('c_blueprint');
// dynamic
export const c_users = collectionTable('c_users', 'users');
export const c_enrollments = collectionTable('c_enrollments');
export const c_work = collectionTable('c_work');
export const c_wheel_scores = collectionTable('c_wheel_scores');
export const c_habits = collectionTable('c_habits');
export const c_habit_checks = collectionTable('c_habit_checks');
export const c_goals = collectionTable('c_goals');
export const c_cards = collectionTable('c_cards');
export const c_leads = collectionTable('c_leads');
export const c_bookings = collectionTable('c_bookings');
export const c_purchases = collectionTable('c_purchases');
export const c_submissions = collectionTable('c_submissions');
export const c_notes = collectionTable('c_notes');
export const c_outbox = collectionTable('c_outbox');
export const c_free_tool_submissions = collectionTable('c_free_tool_submissions');
export const c_analytics = collectionTable('c_analytics');
export const c_events = collectionTable('c_events');

/** Collection name → table. */
export const TABLES: Record<CollectionName, CollectionTable> = {
  branding: c_branding, settings: c_settings, plans: c_plans, products: c_products, toolkits: c_toolkits, stages: c_stages,
  lessons: c_lessons, checkpoints: c_checkpoints, wheelAreas: c_wheel_areas, freeTool: c_free_tool, freeQuestions: c_free_questions,
  quiz: c_quiz, forms: c_forms, emails: c_emails, pages: c_pages, faqs: c_faqs, journeyStages: c_journey_stages,
  pipelineStages: c_pipeline_stages, leadSources: c_lead_sources, letters: c_letters, blueprint: c_blueprint,
  users: c_users as unknown as CollectionTable, enrollments: c_enrollments, work: c_work, wheelScores: c_wheel_scores, habits: c_habits,
  habitChecks: c_habit_checks, goals: c_goals, cards: c_cards, leads: c_leads, bookings: c_bookings, purchases: c_purchases,
  submissions: c_submissions, notes: c_notes, outbox: c_outbox, freeToolSubmissions: c_free_tool_submissions,
  analytics: c_analytics, events: c_events,
};

/** Login sessions. `id` is sha256(token) — the raw token only ever lives in the user's httpOnly cookie. */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    userAgent: text('user_agent'),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
);
