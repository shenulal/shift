import type { CollectionMap, CollectionName, RecOf } from '../collections';
import type { StoreData } from '../store';
import { branding, settings } from './brand';
import { plans, products } from './plans';
import { toolkits } from './toolkits';
import { stages, checkpoints, wheelAreas } from './stages';
import { lessons } from './lessons';
import { freeTool, freeQuestions, quiz } from './freeTool';
import { forms, emails, faqs } from './forms';
import { pages } from './pages';
import { journeyStages, pipelineStages, leadSources, letters, blueprint } from './journey';
import * as demo from './demo';

export { DEMO_TODAY } from './demo';

const SEED_TIME = '2026-09-01T00:00:00.000Z';

function recs<C extends CollectionName>(map: Record<string, CollectionMap[C]>, ownerField?: string): RecOf<C>[] {
  return Object.entries(map).map(([id, data], i) => ({
    ...structuredClone(data),
    id,
    sort: i + 1,
    active: true,
    ownerId: ownerField ? ((data as unknown as Record<string, unknown>)[ownerField] as string | null) ?? null : null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  })) as RecOf<C>[];
}

/** Master (admin-configurable) seed content — exactly as shown in the designs. */
export function masterSeed(): StoreData {
  return {
    branding: recs<'branding'>({ branding }),
    settings: recs<'settings'>({ settings }),
    plans: recs<'plans'>(plans),
    products: recs<'products'>(products),
    toolkits: recs<'toolkits'>(toolkits),
    stages: recs<'stages'>(stages),
    lessons: recs<'lessons'>(lessons),
    checkpoints: recs<'checkpoints'>(checkpoints),
    wheelAreas: recs<'wheelAreas'>(wheelAreas),
    freeTool: recs<'freeTool'>({ freeTool }),
    freeQuestions: recs<'freeQuestions'>(freeQuestions),
    quiz: recs<'quiz'>(quiz),
    forms: recs<'forms'>(forms),
    emails: recs<'emails'>(emails),
    pages: recs<'pages'>(pages),
    faqs: recs<'faqs'>(faqs),
    journeyStages: recs<'journeyStages'>(journeyStages),
    pipelineStages: recs<'pipelineStages'>(pipelineStages),
    leadSources: recs<'leadSources'>(leadSources),
    letters: recs<'letters'>(letters),
    blueprint: recs<'blueprint'>({ blueprint }),
  };
}

/** Sample dynamic data (clients, leads, schedule, analytics, a member's journey). */
export function demoSeed(): StoreData {
  return {
    users: recs<'users'>(demo.users),
    enrollments: recs<'enrollments'>(demo.enrollments, 'userId'),
    leads: recs<'leads'>(demo.leads),
    bookings: recs<'bookings'>(demo.bookings, 'userId'),
    purchases: recs<'purchases'>(demo.purchases, 'userId'),
    submissions: recs<'submissions'>(demo.submissions, 'userId'),
    outbox: recs<'outbox'>(demo.outbox),
    notes: recs<'notes'>(demo.notes, 'userId'),
    freeToolSubmissions: recs<'freeToolSubmissions'>(demo.freeToolSubmissions),
    wheelScores: recs<'wheelScores'>(demo.wheelScores, 'userId'),
    habits: recs<'habits'>(demo.habits, 'userId'),
    habitChecks: recs<'habitChecks'>(demo.habitChecks, 'userId'),
    goals: recs<'goals'>(demo.goals, 'userId'),
    cards: recs<'cards'>(demo.cards, 'userId'),
    work: recs<'work'>(demo.work, 'userId'),
    analytics: recs<'analytics'>(demo.analytics),
    events: [],
  };
}

export function fullSeed(): StoreData {
  return { ...masterSeed(), ...demoSeed() };
}
