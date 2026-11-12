/** Static, self-guided resource library — short reads/exercises/breathing
 * patterns, authored once rather than generated per-click. `tags` match the
 * same theme/activity strings journal entries carry, so ResourcesPanel can
 * surface "for this week" picks from what someone has actually been writing. */

export const RESOURCE_TYPES = ['Read', 'Exercise', 'Breathing'];

export const RESOURCES = [
  {
    id: 'mind-replays',
    type: 'Read',
    minutes: 4,
    title: 'When your mind replays a moment',
    description: 'Why rumination happens and three ways to step out of the loop.',
    tags: ['rumination', 'replaying', 'overthinking', 'anxiety', 'work stress'],
    body: [
      'Going over a conversation again and again is your mind trying to solve something. The trouble is that replaying rarely brings new answers. It mostly brings the feeling back.',
      'It helps to notice the loop without arguing with it. "I’m replaying the dinner again" is enough. Naming it creates a little distance between you and the thought.',
    ],
    exercise: {
      minutes: 3,
      steps: [
        'Write the moment down in one sentence, exactly as it happened.',
        'Underneath, write what you wish you had said.',
        'Then one line: what would you like to do about it tomorrow, if anything?',
      ],
    },
  },
  {
    id: 'shoulder-drop',
    type: 'Exercise',
    minutes: 3,
    title: 'The two-minute shoulder drop',
    description: 'A tiny body reset for after hard calls.',
    tags: ['work stress', 'tension', 'frustration'],
    body: [
      'Stress collects in the shoulders and jaw long before it reaches the rest of the body. A short, physical reset can interrupt that build-up faster than trying to think your way out of it.',
    ],
    exercise: {
      minutes: 2,
      steps: [
        'Raise both shoulders up toward your ears and hold for 5 seconds.',
        'Let them drop heavily and exhale through your mouth.',
        'Roll your neck slowly to each side once.',
        'Repeat twice more.',
      ],
    },
  },
  {
    id: 'slow-exhale-sleep',
    type: 'Breathing',
    minutes: 2,
    title: 'Slow exhale for sleep',
    description: 'Longer out-breaths to help your body wind down.',
    tags: ['sleep trouble', 'tiredness', 'restless'],
    body: [
      'A longer exhale than inhale nudges your nervous system toward rest. It works best lying down, lights off, a few minutes before you mean to sleep.',
    ],
    exercise: {
      minutes: 2,
      steps: ['Breathe in through your nose for 4 counts.', 'Breathe out slowly through your mouth for 8 counts.', 'Repeat for 2 minutes.'],
    },
  },
  {
    id: 'lifting-low-mood',
    type: 'Read',
    minutes: 5,
    title: 'Lifting a low mood',
    description: 'Small, doable steps for days when everything feels flat.',
    tags: ['low mood', 'sadness', 'loneliness'],
    body: [
      'On flat days, the instinct is often to wait until motivation returns before doing anything. In practice it tends to work the other way: a small action first, the lift in mood after.',
      'The goal isn’t to fix the whole day. It’s one small, doable thing.',
    ],
    exercise: {
      minutes: 5,
      steps: [
        'Pick one small task that takes under 5 minutes (make the bed, step outside, text one person).',
        'Do just that one thing.',
        'Notice, without judging it, whether anything shifted.',
      ],
    },
  },
  {
    id: 'anger-without-harm',
    type: 'Read',
    minutes: 4,
    title: 'Handling anger without harm',
    description: 'Notice it, name it, and choose what to do with it.',
    tags: ['anger', 'frustration', 'tension'],
    body: [
      'Anger is information before it’s a problem — it usually means a boundary mattered. Trouble comes from acting on it unfiltered, not from feeling it.',
    ],
    exercise: {
      minutes: 3,
      steps: [
        'Name what triggered it in one sentence.',
        'Name the boundary or need underneath it.',
        'Decide: does this need to be said to someone, or just acknowledged to yourself?',
      ],
    },
  },
  {
    id: 'saying-the-thing',
    type: 'Exercise',
    minutes: 6,
    title: 'Saying the thing you didn’t say',
    description: 'A guided writing exercise for conversations that stay with you.',
    tags: ['family conflict', 'relationships', 'hurt'],
    body: [
      'Some conversations keep replaying because something true in them went unsaid. Writing it down, even if you never send it, often loosens the grip.',
    ],
    exercise: {
      minutes: 6,
      steps: [
        'Write what you actually wanted to say, without softening it.',
        'Write what you were afraid would happen if you said it.',
        'Write one sentence you could say instead, next time.',
      ],
    },
  },
  {
    id: 'box-breathing',
    type: 'Breathing',
    minutes: 3,
    title: 'Box breathing before a meeting',
    description: 'Four counts in, hold, out, hold.',
    tags: ['anxious', 'work stress', 'anxiety'],
    body: ['A steady, even pattern that’s easy to do discreetly right before something that makes you nervous.'],
    exercise: {
      minutes: 2,
      steps: ['Breathe in for 4 counts.', 'Hold for 4 counts.', 'Breathe out for 4 counts.', 'Hold for 4 counts. Repeat 4 times.'],
    },
  },
  {
    id: 'general-wellness',
    type: 'Read',
    minutes: 3,
    title: 'General wellness check-in',
    description: 'A few honest questions worth asking yourself this week.',
    tags: [],
    body: [
      'Not every low day needs a technique. Sometimes it helps just to check in plainly: sleep, food, movement, connection — which of these has slipped recently?',
    ],
    exercise: {
      minutes: 3,
      steps: [
        'Rate your sleep, food, movement, and connection this week, 1–5 each.',
        'Pick the lowest one.',
        'Choose one small, specific thing to do about it tomorrow.',
      ],
    },
  },
];

export function getResourceById(id) {
  return RESOURCES.find((r) => r.id === id) || null;
}
