/**
 * SHIFT Coaching domain model.
 *
 * MASTER collections are admin-managed (full CRUD, reorder, duplicate, active toggle).
 * DYNAMIC collections are created at runtime by visitors / clients (and the coach).
 * Every stored record carries the shared `Meta` fields.
 */

export interface Meta {
  id: string;
  sort: number;
  active: boolean;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
}
export type Rec<T> = T & Meta;

export type ColorKey = 'sage' | 'taupe' | 'beige' | 'blush' | 'peach' | 'blue' | 'rose' | 'tan' | 'green' | 'lavender' | 'deep' | 'charcoal';

/** Name of a placeholder art scene (see web/ui/Art) or an uploaded image URL. */
export type ImageRef = string;

// ────────────────────────────────────────────────────────── MASTER ──

export interface Branding {
  logoUrl: string | null;
  wordmark: string; // SHIFT
  subMark: string; // COACHING
  colors: Record<'sage' | 'taupe' | 'beige' | 'blush' | 'white' | 'charcoal' | 'deep' | 'ground' | 'peach' | 'blue' | 'rose', string>;
  fonts: { heading: string; body: string; script: string };
  taglines: { primary: string; secondary: string; tertiary: string; small: string; trio: string; pillars: string };
  images: Record<string, ImageRef>;
}

export interface StepLabel { key: 'learn' | 'reflect' | 'apply' | 'next'; label: string; sub: string }

export interface Settings {
  siteName: string;
  coachName: string;
  coachTitle: string;
  currency: string;
  contactEmail: string;
  website: string;
  social: { instagram: string; linkedin: string; tiktok: string; youtube: string };
  discoveryCall: { durationMin: number; platformText: string; bookingUrl: string; title: string };
  session: { lengthMin: number; validityMonths: number; rescheduleHours: number };
  paymentOptions: { key: string; label: string; icon: string; enabled: boolean }[];
  availability: { days: string[]; times: string[] };
  journeySteps: StepLabel[];
  wheel: { min: number; max: number; lowLabel: string; highLabel: string };
  qualityScale: { min: number; max: number; lowLabel: string; highLabel: string };
  adminAccount: { name: string; email: string };
}

export interface Plan {
  packageLabel: string; // "Package 1"
  name: string; // Foundation
  subtitle: string; // Start Your SHIFT
  displayAlias: string; // SHIFT Start
  aliasTagline: string; // Clarity for what's next
  description: string;
  brandCardCopy: string;
  brandCardCta: string;
  sessions: number;
  sessionLengthMin: number;
  durationLabel: string; // 6–8 weeks
  supportLabel: string; // Focused support
  price: number | null;
  badge: string; // MOST POPULAR
  color: ColorKey;
  image: ImageRef;
  coverage: Record<string, string[]>; // stageId -> lessonIds
  coverageNotes: Record<string, string>; // stageId -> optional short note shown under lesson (Foundation)
  bonus: { title: string; description: string };
  leaveWith: string[];
  features: string[];
  scriptLine: string; // "A fresh start."
}

export type ProductKind = 'free' | 'bundle' | 'journey';
export interface Product {
  kind: ProductKind;
  name: string;
  tag: string; // FREE / COMPLETE PROGRAMME
  price: number | null;
  description: string;
  bullets: string[];
  ctaLabel: string;
  href: string;
  note: string;
}

export interface ToolkitTool { id: string; name: string; description: string; icon: string; content: string; active: boolean }
export interface Toolkit {
  name: string;
  tagline: string;
  shortTagline: string;
  description: string;
  color: ColorKey;
  icon: string;
  image: ImageRef;
  imageNote: string;
  price: number;
  ctaLabel: string;
  tools: ToolkitTool[];
}

export interface Question { id: string; prompt: string; helper?: string; placeholder?: string }

export interface Stage {
  letter: string;
  name: string;
  tagline: string; // "Regulate before you react."
  methodDescription: string;
  journeyDescription: string;
  brochureDescription: string;
  coachingVerb: string;
  coachingDescription: string;
  coachingBullets: string[];
  sessionsLabel: string;
  intro: string;
  meta: string[];
  quote: string;
  sideQuote: string;
  color: ColorKey;
  icon: string;
  image: ImageRef;
  portalWeeks: string;
  reflection: { title: string; description: string; questions: Question[]; draft: boolean };
}

export type FieldType = 'text' | 'textarea' | 'select' | 'checkboxes' | 'email' | 'phone' | 'date' | 'signature' | 'consent' | 'heading' | 'paragraph' | 'wheel' | 'number';
export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  helper?: string;
  placeholder?: string;
  options?: string[];
  allowOther?: boolean;
  required?: boolean;
  letter?: string; // for lettered tools (STOP / SMART)
  icon?: string;
  color?: ColorKey;
}

export type ToolKind =
  | 'form' // generic field-based worksheet
  | 'values' // Values Compass
  | 'wheel-priorities' // Life Wheel re-rate + choose priorities
  | 'habit-builder' // 5-step habit builder + weekly planner
  | 'habit-progress' // momentum progress rings
  | 'journey-review' // Look how far you've come
  | 'future-self-rerate'
  | 'blueprint';

export interface ToolDef {
  kind: ToolKind;
  title: string; // "The STOP Tool"
  subtitle: string;
  description: string;
  badge: string; // PRACTICAL TOOL / WORKSHEET
  fields: FieldDef[];
  /** Kind-specific configuration (e.g. values list, steps text). */
  config: Record<string, unknown>;
  worksheet: { title: string; intro: string; fields: FieldDef[] } | null;
  worksheetUrl: string;
  saveLabel: string;
  confirmation: { title: string; body: string; cta: string } | null;
}

export interface Lesson {
  stageId: string;
  order: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  intro: string;
  about: string;
  videoUrl: string;
  videoTitle: string;
  videoDuration: string; // 5:12
  durationLabel: string; // 5 min video
  videoOverlay: string; // handwritten line on the thumbnail
  videoCaption: string;
  heroQuote: string;
  sideQuote: string;
  image: ImageRef;
  learnLabel: string;
  learn: string[];
  learnCards: { title: string; text: string; icon?: string }[];
  takeawaysLabel: string;
  takeaways: { title?: string; text: string; icon?: string }[];
  reflectionTitle: string;
  reflectionIntro: string;
  reflections: Question[];
  reflectionReminder: string;
  tool: ToolDef;
  nextStep: { prompt: string; helper: string; placeholder: string; shift: string; remember: string[]; image: ImageRef; imageQuote: string; checklist: string[] };
  portalBlurb: string;
  portalMinutes: number;
  celebrate: { title: string; text: string; icon: string }[];
  reminders: { title: string; text: string; icon: string }[];
  completeLabel: string;
}

export interface Checkpoint {
  afterStageId: string;
  sessionNumber: number;
  kind: 'note' | 'wheel' | 'marker';
  title: string;
  description: string;
  ctaLabel: string;
  icon: string;
  color: ColorKey;
}

export interface WheelArea { name: string; short: string; icon: string; color: ColorKey }

export interface FreeQuestion {
  number: number;
  label: string; // Question One
  theme: string; // Awareness
  question: string;
  helper: string;
  caption: string;
  captionIcon: string;
  summaryLabel: string; // What matters to me
  image: ImageRef;
  photoNote: string;
  fieldType: 'textarea' | 'checkboxes';
  options: string[];
  color: ColorKey;
}

export interface FreeTool {
  intro: { kicker: string; title: string; body: string; cta: string; quote: string };
  wheel: { title: string; subtitle: string; instructions: string; caption: string };
  results: { title: string; subtitle: string; intro: string; planTitle: string; planFields: string[] };
  emailCapture: { title: string; body: string; cta: string; consent: string };
  next: { title: string; subtitle: string; intro: string; quote: string };
  landing: { title: string; subtitle: string; body: string; bullets: { text: string; icon: string }[]; cta: string; label: string };
}

export interface QuizQuestion { question: string; options: { label: string; path: 'discover' | 'tools' | 'journey' | 'coaching' }[] }

export type FormKey = 'enquiry' | 'intake' | 'agreement' | 'privacy' | 'completion' | 'feedback' | 'checkin' | 'session-notes' | 'call-notes';
export interface FormDef {
  key: FormKey;
  name: string;
  title: string;
  intro: string;
  submitLabel: string;
  footnote: string;
  audience: 'public' | 'client' | 'coach';
  fields: FieldDef[];
  draft: boolean;
}

export interface EmailTemplate {
  key: string;
  name: string;
  trigger: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  preheader: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  draft: boolean;
}

export interface Page { slug: string; title: string; navLabel: string; content: Record<string, unknown> }

export interface Faq { context: 'discovery' | 'general'; question: string; answer: string; draft: boolean }

export interface ClientJourneyStage {
  number: number;
  name: string;
  short: string; // ATTRACT
  subtitle: string; // Awareness
  timing: string; // Before someone books
  tagline: string;
  assets: { title: string; description: string; icon: string }[];
  ruleLabel: string;
  ruleText: string;
  icon: string;
  image: ImageRef;
}

export interface PipelineStage { name: string; journeyStageId: string; defaultNextStep: string; emailKey: string }
export interface LeadSource { name: string; color: ColorKey }
export interface Letter { title: string; scheduledFor: string; status: 'draft' | 'scheduled' | 'sent'; subscribers: number; body: string }

export interface BlueprintTemplate {
  title: string;
  subtitle: string;
  pages: { key: string; label: string; title: string; subtitle: string; sections: { key: string; title: string; subtitle: string }[] }[];
  footerScript: string;
  footerNote: string;
  commitmentDefault: string;
  toolSuggestions: Record<string, string[]>;
}

// ───────────────────────────────────────────────────────── DYNAMIC ──

export type Role = 'admin' | 'client';
export interface User {
  name: string;
  email: string;
  role: Role;
  passwordHash?: string;
  initials: string;
  avatarColor: ColorKey;
  phone?: string;
  location?: string;
  journeyAccess: boolean; // bought the self-paced Journey
  toolkitIds: string[];
}

export interface Enrollment {
  userId: string;
  planId: string;
  status: 'pending' | 'active' | 'completed';
  startDate: string;
  sessionsCompleted: number;
  nextSession: string | null;
  focusAreas: { label: string; score: number | null }[];
  forms: { intake: boolean; signed: boolean };
  emailMasked: string;
}

/** All of a user's work inside one context (a lesson, stage reflection or checkpoint). */
export interface Work {
  userId: string;
  context: string; // lesson:s2 | stage:h | checkpoint:<id>
  step: number; // 1..4 reached
  completed: boolean;
  completedAt: string | null;
  videoSeconds: number;
  reflections: Record<string, string>;
  tool: Record<string, unknown>;
  nextStep: { text: string; checklist?: Record<string, boolean> };
}

export interface WheelScore { userId: string | null; leadId: string | null; context: string; date: string; scores: Record<string, number> }

export interface Habit {
  userId: string;
  name: string;
  detail: string;
  frequency: string;
  days: number[]; // 0 = Monday
  trigger: string;
  makeEasy: string;
  reward: string;
  icon: string;
  color: ColorKey;
}
export interface HabitCheck { userId: string; habitId: string; date: string; status: 'done' | 'missed' }

export interface Goal {
  userId: string;
  intention: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  statement: string;
  why: string;
  values: string[];
  futureSelf: string;
  timeline: string;
  firstStep: string;
  progress: number;
  setOn: string;
}

export interface FutureSelfCard {
  userId: string;
  statement: string;
  see: string;
  become: string;
  live: string;
  choose: string;
  today: string;
  commitments: string[];
  qualities: { name: string; description: string; icon: string; then: number; now: number; thenDate: string; nowDate: string }[];
}

export interface Lead {
  name: string;
  email: string;
  phone: string;
  location: string;
  source: string; // leadSource id
  stageId: string; // pipelineStage id
  intake: 'received' | 'in-progress' | null;
  wheel: 'done' | null;
  agreement: 'signed' | null;
  nextStep: string;
  supportAreas: string[];
  goal: string;
  userId: string | null;
}

export interface Booking { when: string; allDay: boolean; title: string; whoLabel: string; userId: string | null; leadId: string | null; kind: 'session' | 'discovery' | 'letter'; status: 'confirmed' | 'intake-pending' | 'scheduled' | 'completed' | 'cancelled' }
export interface Purchase { userId: string | null; email: string; kind: 'toolkit' | 'bundle' | 'journey' | 'package'; refId: string; label: string; amount: number; currency: string; status: 'pending' | 'paid' | 'refunded'; method: string; date: string }
export interface FormSubmission { formKey: FormKey; userId: string | null; leadId: string | null; data: Record<string, unknown>; status: 'received' | 'in-progress' | 'reviewed'; submittedAt: string }
export interface Note { userId: string; kind: 'session' | 'call' | 'shift-note' | 'marker'; title: string; body: string; date: string }
export interface OutboxEmail { templateKey: string; to: string; subject: string; body: string; status: 'queued' | 'sent' | 'logged'; sentAt: string }
export interface FreeToolSubmission { leadId: string | null; email: string; answers: Record<string, string | string[]>; plan: Record<string, string>; scores: Record<string, number> }
export interface AnalyticsSnapshot {
  month: string;
  monthLabel: string;
  siteVisits: number;
  siteVisitsDelta: number;
  toolCompletions: number;
  toolCompletionsNote: string;
  emails: number;
  emailRate: number;
  calls: number;
  callsToClients: number;
  emailListThisMonth: number;
  emailListDelta: number;
  revenue: number;
  revenueNote: string;
  freeToolEmailRate: number;
  freeToolNote: string;
  sources: { name: string; visits: number; emailRate: number }[];
  funnel: { stage: string; people: number; conversion: string; best: string }[];
  insight: string;
}
export interface AnalyticsEvent { type: 'visit' | 'tool-start' | 'tool-complete' | 'email' | 'purchase' | 'call-booked' | 'client'; source: string; at: string }
