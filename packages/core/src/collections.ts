import type * as T from './types';

export type CollectionKind = 'master' | 'dynamic';

/** Maps every collection name to its record type. */
export interface CollectionMap {
  // master
  branding: T.Branding;
  settings: T.Settings;
  plans: T.Plan;
  products: T.Product;
  toolkits: T.Toolkit;
  stages: T.Stage;
  lessons: T.Lesson;
  checkpoints: T.Checkpoint;
  wheelAreas: T.WheelArea;
  freeTool: T.FreeTool;
  freeQuestions: T.FreeQuestion;
  quiz: T.QuizQuestion;
  forms: T.FormDef;
  emails: T.EmailTemplate;
  pages: T.Page;
  faqs: T.Faq;
  journeyStages: T.ClientJourneyStage;
  pipelineStages: T.PipelineStage;
  leadSources: T.LeadSource;
  letters: T.Letter;
  blueprint: T.BlueprintTemplate;
  // dynamic
  users: T.User;
  enrollments: T.Enrollment;
  work: T.Work;
  wheelScores: T.WheelScore;
  habits: T.Habit;
  habitChecks: T.HabitCheck;
  goals: T.Goal;
  cards: T.FutureSelfCard;
  leads: T.Lead;
  bookings: T.Booking;
  purchases: T.Purchase;
  submissions: T.FormSubmission;
  notes: T.Note;
  outbox: T.OutboxEmail;
  freeToolSubmissions: T.FreeToolSubmission;
  analytics: T.AnalyticsSnapshot;
  events: T.AnalyticsEvent;
}
export type CollectionName = keyof CollectionMap;
export type RecOf<C extends CollectionName> = T.Rec<CollectionMap[C]>;

export interface CollectionInfo {
  name: CollectionName;
  kind: CollectionKind;
  label: string;
  singleton?: boolean;
  /** Dynamic collections whose records belong to one user (clients only see their own). */
  ownerScoped?: boolean;
  /** Field used as the record title in admin lists. */
  titleField: string;
  /** Publicly readable without login (active records only). */
  publicRead?: boolean;
  /** Visitors may create records (e.g. enquiries) through actions only. */
}

const m = (name: CollectionName, label: string, titleField: string, extra: Partial<CollectionInfo> = {}): CollectionInfo => ({ name, kind: 'master', label, titleField, publicRead: true, ...extra });
const d = (name: CollectionName, label: string, titleField: string, extra: Partial<CollectionInfo> = {}): CollectionInfo => ({ name, kind: 'dynamic', label, titleField, ...extra });

export const COLLECTIONS: Record<CollectionName, CollectionInfo> = {
  branding: m('branding', 'Branding', 'wordmark', { singleton: true }),
  settings: m('settings', 'Settings', 'siteName', { singleton: true }),
  plans: m('plans', 'Plans & Packages', 'name'),
  products: m('products', 'Products', 'name'),
  toolkits: m('toolkits', 'Toolkits', 'name'),
  stages: m('stages', 'Journey Stages', 'name'),
  lessons: m('lessons', 'Lessons', 'title'),
  checkpoints: m('checkpoints', 'Session Checkpoints', 'title'),
  wheelAreas: m('wheelAreas', 'Wheel of Life Areas', 'name'),
  freeTool: m('freeTool', 'Discover SHIFT (free tool)', 'intro', { singleton: true }),
  freeQuestions: m('freeQuestions', 'Free-tool Questions', 'question'),
  quiz: m('quiz', 'Find Your SHIFT Quiz', 'question'),
  forms: m('forms', 'Forms', 'name'),
  emails: m('emails', 'Email Templates', 'name'),
  pages: m('pages', 'Content Pages', 'title'),
  faqs: m('faqs', 'FAQ', 'question'),
  journeyStages: m('journeyStages', 'Client Journey Stages', 'name'),
  pipelineStages: m('pipelineStages', 'Pipeline Stages', 'name', { publicRead: false }),
  leadSources: m('leadSources', 'Lead Sources', 'name'),
  letters: m('letters', 'Weekly SHIFT Letters', 'title', { publicRead: false }),
  blueprint: m('blueprint', 'Blueprint PDF Template', 'title', { singleton: true }),

  users: d('users', 'Users', 'name'),
  enrollments: d('enrollments', 'Enrolments', 'planId', { ownerScoped: true }),
  work: d('work', 'Lesson work', 'context', { ownerScoped: true }),
  wheelScores: d('wheelScores', 'Wheel scores', 'context', { ownerScoped: true }),
  habits: d('habits', 'Habits', 'name', { ownerScoped: true }),
  habitChecks: d('habitChecks', 'Habit check-ins', 'date', { ownerScoped: true }),
  goals: d('goals', 'Goals', 'statement', { ownerScoped: true }),
  cards: d('cards', 'Future Self cards', 'statement', { ownerScoped: true }),
  leads: d('leads', 'Leads', 'name'),
  bookings: d('bookings', 'Bookings', 'title', { ownerScoped: true }),
  purchases: d('purchases', 'Purchases', 'label', { ownerScoped: true }),
  submissions: d('submissions', 'Form submissions', 'formKey', { ownerScoped: true }),
  notes: d('notes', 'Notes', 'title', { ownerScoped: true }),
  outbox: d('outbox', 'Email outbox', 'subject'),
  freeToolSubmissions: d('freeToolSubmissions', 'Free-tool submissions', 'email'),
  analytics: d('analytics', 'Analytics snapshots', 'monthLabel'),
  events: d('events', 'Analytics events', 'type'),
};

export const MASTER_COLLECTIONS = (Object.keys(COLLECTIONS) as CollectionName[]).filter((c) => COLLECTIONS[c].kind === 'master');
export const DYNAMIC_COLLECTIONS = (Object.keys(COLLECTIONS) as CollectionName[]).filter((c) => COLLECTIONS[c].kind === 'dynamic');

/** Which dynamic field on a collection identifies the owning user. */
export const OWNER_FIELD: Partial<Record<CollectionName, string>> = {
  enrollments: 'userId', work: 'userId', wheelScores: 'userId', habits: 'userId', habitChecks: 'userId', goals: 'userId',
  cards: 'userId', bookings: 'userId', purchases: 'userId', submissions: 'userId', notes: 'userId',
};
