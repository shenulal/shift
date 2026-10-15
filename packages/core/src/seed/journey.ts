import type { BlueprintTemplate, ClientJourneyStage, LeadSource, Letter, PipelineStage } from '../types';

export const journeyStages: Record<string, ClientJourneyStage> = {
  attract: {
    number: 1, name: 'Attract', short: 'ATTRACT', subtitle: 'Awareness', timing: 'Before someone books', tagline: 'Be seen. Create interest.',
    assets: [
      { title: 'Brand Brochure', description: 'Who you are, the SHIFT method, packages, outcomes', icon: 'doc' },
      { title: 'Instagram / Website / Link in Bio', description: 'Your public content and booking pathway', icon: 'laptop' },
      { title: 'Discovery Session CTA', description: 'Invite them to book a free call', icon: 'people' },
    ],
    ruleLabel: 'Where it lives', ruleText: 'Public-facing', icon: 'leaf', image: 'leaves',
  },
  enquiry: {
    number: 2, name: 'Enquiry', short: 'ENQUIRY', subtitle: 'First Connection', timing: 'When someone shows interest', tagline: 'Curiosity turns into conversation.',
    assets: [
      { title: 'Discovery / Enquiry Form', description: 'Name, contact details, what they want help with, why now', icon: 'doc' },
      { title: 'Booking Link', description: 'Lets them schedule their discovery session', icon: 'calendar' },
    ],
    ruleLabel: 'Send', ruleText: 'As the first step', icon: 'mail', image: 'mountains',
  },
  discover: {
    number: 3, name: 'Discover', short: 'DISCOVER', subtitle: 'Free Call', timing: 'During the free consultation', tagline: 'Listen. Explore. Find the fit.',
    assets: [
      { title: 'Discovery Call', description: 'Explore goals, needs, readiness and fit', icon: 'phone' },
      { title: 'Call Notes', description: 'Internal notes for you only', icon: 'doc' },
    ],
    ruleLabel: 'Your role', ruleText: 'Clarify the right package', icon: 'chat', image: 'chair',
  },
  enrol: {
    number: 4, name: 'Enrol', short: 'ENROL', subtitle: 'Become a Client', timing: 'Once they say yes', tagline: 'Make it official.',
    assets: [
      { title: 'Package / Services Guide', description: 'What is included, number of sessions, support level', icon: 'doc' },
      { title: 'Payment & Package Confirmation', description: 'Chosen package, price, payment status', icon: 'card' },
    ],
    ruleLabel: 'Send', ruleText: 'Immediately after they commit', icon: 'card', image: 'stones-words',
  },
  onboard: {
    number: 5, name: 'Onboard', short: 'ONBOARD', subtitle: 'Forms & Agreement', timing: 'Before the first paid session', tagline: 'Lay the foundation for success.',
    assets: [
      { title: 'Coaching Intake Form', description: 'Background, goals, Wheel of Life, challenges, expectations', icon: 'doc' },
      { title: 'Coaching Agreement', description: 'Scope, boundaries, fees, cancellation, confidentiality', icon: 'doc' },
      { title: 'Privacy Notice / Consent', description: 'How you collect, store and use their information', icon: 'shield' },
      { title: 'Digital Signature', description: 'Signed together with the agreement', icon: 'sign' },
    ],
    ruleLabel: 'Best option', ruleText: 'One digital onboarding form', icon: 'clipboard', image: 'leaves',
  },
  coach: {
    number: 6, name: 'Coach', short: 'COACH', subtitle: 'The Journey', timing: 'Throughout the client journey', tagline: 'Support. Empower. Create change.',
    assets: [
      { title: 'Session Notes Template', description: 'Key insight, actions, next steps', icon: 'doc' },
      { title: 'Weekly / Monthly Check-In', description: 'Track progress and accountability', icon: 'people' },
      { title: 'Resource Library', description: 'SHIFT tools, videos, reflections, worksheets', icon: 'leaf' },
      { title: 'Progress Tracker', description: 'Goals, habits, wins and milestones', icon: 'chart' },
    ],
    ruleLabel: 'Use', ruleText: 'During every session/package', icon: 'chart', image: 'mountains',
  },
  complete: {
    number: 7, name: 'Complete', short: 'COMPLETE', subtitle: 'Celebrate & Grow', timing: 'At the end of the package', tagline: "Reflect. Celebrate. What's next?",
    assets: [
      { title: 'Completion / Reflection Form', description: 'What changed, what they learned, next focus', icon: 'doc' },
      { title: 'Feedback / Testimonial Request', description: 'Optional review and permission', icon: 'star' },
      { title: 'Next Step Offer', description: 'Renew, continue, or move to a new package', icon: 'arrow' },
    ],
    ruleLabel: 'Send', ruleText: 'At package close', icon: 'star', image: 'sunrise',
  },
};

export const pipelineStages: Record<string, PipelineStage> = {
  'ps-free': { name: 'Downloaded free tools', journeyStageId: 'attract', defaultNextStep: 'Weekly letter', emailKey: 'weekly-letter' },
  'ps-enquiry': { name: 'Enquiry received', journeyStageId: 'enquiry', defaultNextStep: 'Book discovery call', emailKey: 'enquiry-confirmation' },
  'ps-call': { name: 'Discovery call booked', journeyStageId: 'discover', defaultNextStep: 'Call', emailKey: 'discovery-confirmation' },
  'ps-toolkit': { name: 'Toolkit buyer → Journey', journeyStageId: 'attract', defaultNextStep: 'Journey week 3 email', emailKey: 'journey-week-3' },
  'ps-enrolled': { name: 'Enrolled', journeyStageId: 'enrol', defaultNextStep: 'Send onboarding forms', emailKey: 'payment-confirmation' },
  'ps-intake': { name: 'Intake started', journeyStageId: 'onboard', defaultNextStep: 'Nudge email', emailKey: 'nudge' },
  'ps-client': { name: 'Active client', journeyStageId: 'coach', defaultNextStep: 'Next session', emailKey: 'session-confirmation' },
};

export const leadSources: Record<string, LeadSource> = {
  instagram: { name: 'Instagram', color: 'rose' },
  tiktok: { name: 'TikTok', color: 'tan' },
  youtube: { name: 'YouTube', color: 'beige' },
  linkedin: { name: 'LinkedIn', color: 'deep' },
  direct: { name: 'Direct / other', color: 'taupe' },
};

export const letters: Record<string, Letter> = {
  'pause-before-yes': {
    title: 'The pause-before-yes',
    scheduledFor: '2026-10-04T08:00:00.000Z',
    status: 'scheduled',
    subscribers: 1284,
    body: '[DRAFT] How often do you say yes before you have even checked in with yourself? This week, try a two-breath pause before every yes.',
  },
};

export const blueprint: BlueprintTemplate = {
  title: 'My Personal Blueprint',
  subtitle: 'A guide to a healthier, more intentional and fulfilling me.',
  pages: [
    {
      key: 'p1', label: 'Page 1 — Who I am & what matters', title: 'My Personal Blueprint', subtitle: 'A guide to a healthier, more intentional and fulfilling me.',
      sections: [
        { key: 'futureSelf', title: 'My Future Self', subtitle: '' },
        { key: 'qualities', title: 'My Chosen Qualities', subtitle: '' },
        { key: 'values', title: 'My Core Values', subtitle: '' },
        { key: 'priorities', title: 'My Top 3 Priority Areas', subtitle: '' },
      ],
    },
    {
      key: 'p2', label: 'Page 2 — My SHIFT learnings', title: 'My Key Learnings', subtitle: "A summary of what I've learned from each module.",
      sections: [
        { key: 's', title: 'Self-Awareness', subtitle: "What I've learned about myself." },
        { key: 'h', title: 'Harmony', subtitle: 'What helps me regulate and return to balance.' },
        { key: 'i', title: 'Intention', subtitle: 'What matters to me and where I want to go.' },
        { key: 'f', title: 'Focused Action', subtitle: 'The habits, routines and actions that work for me.' },
        { key: 't', title: 'Transform', subtitle: 'My progress and what I want to keep building.' },
      ],
    },
    {
      key: 'p3', label: 'Page 3 — My progress', title: 'My Progress', subtitle: "A snapshot of how far I've come.",
      sections: [
        { key: 'goal', title: 'Goal Progress', subtitle: "You're {goal}% towards your goal." },
        { key: 'habits', title: 'Habit Consistency', subtitle: "You've completed {habits}% of your planned habit days." },
        { key: 'alignment', title: 'Future Self Alignment', subtitle: "You're close to your future self." },
        { key: 'wheel', title: 'Wheel of Life Progress', subtitle: 'See how your life looks now compared to when you started.' },
      ],
    },
    {
      key: 'p4', label: "Page 4 — What works for me & what's next", title: 'My Tools, Habits & Strategies', subtitle: 'The key tools, habits and strategies from across SHIFT that work for me.',
      sections: [
        { key: 'mindset', title: 'Mindset & Awareness', subtitle: '' },
        { key: 'regulation', title: 'Regulation & Balance', subtitle: '' },
        { key: 'habitsRoutine', title: 'Habits & Routine', subtitle: '' },
        { key: 'planning', title: 'Planning & Focus', subtitle: '' },
        { key: 'commitment', title: 'My Commitment', subtitle: '' },
      ],
    },
  ],
  footerScript: 'Small shifts. A brighter tomorrow.',
  footerNote: 'This is a snapshot of where I am today. My blueprint can grow with me.',
  commitmentDefault: 'Going forward, I will keep showing up for myself, stay consistent with what works, and continue to choose a healthier, more intentional and fulfilling life.',
  toolSuggestions: {
    mindset: ['Pause and notice my thoughts', 'Reframe unhelpful thinking', 'Focus on what I can control', 'Use values to guide my decisions'],
    regulation: ['Breathwork (STOP)', 'Movement in nature', 'Good sleep routine', 'Take breaks and protect my energy'],
    habitsRoutine: ['Walking daily', 'Drinking more water', 'Weekly planning', 'Small, consistent actions', 'Routines that support me'],
    planning: ['Keep my goal visible', 'Use the SMART framework', 'Choose one area to focus on', 'Celebrate progress', 'Review and adjust as needed'],
  },
};
