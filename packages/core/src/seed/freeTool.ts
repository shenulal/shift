import type { FreeQuestion, FreeTool, QuizQuestion } from '../types';

export const freeTool: FreeTool = {
  intro: {
    kicker: 'Discover SHIFT · Free tools',
    title: 'See where you are.\nDiscover what matters.\nChoose your first shift.',
    body: "A short, guided exercise to help you gain clarity, understand what's important and take one intentional step towards a brighter you.",
    cta: "Let's Begin",
    quote: 'Small steps. Big change.',
  },
  wheel: {
    title: 'Wheel of Life',
    subtitle: 'Your life right now',
    instructions: 'Score each area from 1–10.\n1 = not satisfied, 10 = very satisfied.',
    caption: 'Take a moment to look at your wheel. What stands out to you?',
  },
  results: {
    title: 'Your First Shift',
    subtitle: 'From reflection to action',
    intro: 'Here is a summary of your answers. Use this to create your personal First SHIFT and keep it as a reminder.',
    planTitle: 'Turn insight into a plan',
    planFields: ['I will do it by:', 'If this gets in my way:', 'Then I will:'],
  },
  emailCapture: {
    title: 'Keep your First SHIFT',
    body: "Enter your email and I'll send you your First SHIFT summary, plus the weekly SHIFT Letter.",
    cta: 'Email me my First SHIFT',
    consent: 'You can unsubscribe at any time.',
  },
  next: {
    title: "What's Next?",
    subtitle: 'Choose the support that fits where you are.',
    intro: "Now that you've completed your First SHIFT, explore the Guided SHIFT Toolkit that can help you go deeper.",
    quote: 'Your next chapter starts here.',
  },
  landing: {
    label: 'Free reflective tool',
    title: 'Discover SHIFT.',
    subtitle: 'Six powerful questions. One meaningful step.',
    body: 'A free, guided exercise to help you reflect, gain clarity and create your First SHIFT — using the Wheel of Life and six powerful questions.',
    bullets: [
      { text: 'See where you are now', icon: 'eye' },
      { text: 'Gain clarity on what matters', icon: 'bulb' },
      { text: 'Create a small, intentional shift', icon: 'target' },
    ],
    cta: 'Get Your Free Tools',
  },
};

export const freeQuestions: Record<string, FreeQuestion> = {
  q1: {
    number: 1, label: 'Question One', theme: 'Awareness',
    question: 'What stands out to you when you look at your Wheel of Life?',
    helper: 'What surprised you? What feels good? Which areas need more attention?',
    caption: "This helps you notice what's working and where you might want to focus.",
    captionIcon: 'bulb', summaryLabel: 'What matters to me', image: 'notebook-mug', photoNote: 'Clarity starts with awareness.',
    fieldType: 'textarea', options: [], color: 'blush',
  },
  q2: {
    number: 2, label: 'Question Two', theme: 'Focus',
    question: 'Which area would make the biggest difference to your life if it improved?',
    helper: 'Not necessarily the lowest score — the area that matters most to you.',
    caption: 'This helps you choose a clear focus for your next step.',
    captionIcon: 'target', summaryLabel: 'My focus area', image: 'signpost', photoNote: 'Health · Career · Relationships · Freedom · Growth',
    fieldType: 'textarea', options: [], color: 'rose',
  },
  q3: {
    number: 3, label: 'Question Three', theme: 'Direction',
    question: 'What would you like to be different in this area?',
    helper: 'How would you like to feel, think, behave or experience it differently?',
    caption: 'This helps you connect with your desired outcome.',
    captionIcon: 'sprout', summaryLabel: 'What I want', image: 'notebook', photoNote: 'A clearer, brighter version of me.',
    fieldType: 'textarea', options: [], color: 'beige',
  },
  q4: {
    number: 4, label: 'Question Four', theme: 'Barriers',
    question: "What's getting in the way?",
    helper: "A thought? A fear? Stress? A habit? Lack of confidence? Other people's expectations? Time?",
    caption: 'This helps you recognise your patterns and challenges.',
    captionIcon: 'head', summaryLabel: "What's getting in my way", image: 'stones-words', photoNote: 'Thoughts · Habits · Fear · Expectations',
    fieldType: 'textarea', options: [], color: 'sage',
  },
  q5: {
    number: 5, label: 'Question Five', theme: 'Possibility',
    question: 'If nothing were holding you back, what would you choose?',
    helper: 'Imagine you had no limits — no fear, no self-doubt and no external pressure. What would you like your life to look like?',
    caption: "This helps you expand your thinking and explore what's truly possible.",
    captionIcon: 'star', summaryLabel: 'What I would choose', image: 'coast-woman', photoNote: '',
    fieldType: 'textarea', options: [], color: 'blue',
  },
  q6: {
    number: 6, label: 'Question Six', theme: 'Action',
    question: 'What is one small shift you could make today?',
    helper: "Think about one realistic action you could take in the next few days to move you in the right direction. It doesn't have to be big — small steps create big change.",
    caption: 'This turns insight into action and creates your first SHIFT.',
    captionIcon: 'bolt', summaryLabel: 'My first shift', image: 'notebook-mug', photoNote: 'One small shift today can create a brighter tomorrow.',
    fieldType: 'textarea', options: [], color: 'green',
  },
};

/** DRAFT — the "Find Your SHIFT" quiz isn't in the designs. */
export const quiz: Record<string, QuizQuestion> = {
  qz1: {
    question: 'What would help you most right now?',
    options: [
      { label: 'A little clarity on where I am', path: 'discover' },
      { label: 'Practical help with one specific area', path: 'tools' },
      { label: 'A complete step-by-step programme I can do at my own pace', path: 'journey' },
      { label: 'Personal support from a coach', path: 'coaching' },
    ],
  },
  qz2: {
    question: 'How much time can you give this each week?',
    options: [
      { label: 'About 15 minutes', path: 'discover' },
      { label: '30–60 minutes, when it suits me', path: 'tools' },
      { label: 'A couple of hours, self-paced', path: 'journey' },
      { label: 'A regular 1:1 session plus practice', path: 'coaching' },
    ],
  },
  qz3: {
    question: 'How would you describe where you are?',
    options: [
      { label: "Curious — I'm just starting to explore", path: 'discover' },
      { label: 'Stuck on something specific (overthinking, stress, confidence…)', path: 'tools' },
      { label: 'Ready to build lasting change across my life', path: 'journey' },
      { label: 'Going through a big change and want guidance', path: 'coaching' },
    ],
  },
};
