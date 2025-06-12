export type TraitName =
  | "Bold"
  | "Human"
  | "Playful"
  | "Expert"
  | "Dry-humour"
  | "Warm"
  | "Minimal"
  | "Quirky"
  | "Inspirational"
  | "Rebellious"
  | "Analytical"
  | "Wholesome"

interface VoiceTrait {
  definition: string
  do: string[]
  dont: string[]
  example: { before: string; after: string }
}

export const TRAITS: Record<TraitName, VoiceTrait> = {
  Bold: {
    definition: "Direct, confident, and assertive communication",
    do: [
      "Use strong action verbs",
      "Take clear stands",
      "Write with confidence",
    ],
    dont: [
      "SHOUT in all caps",
      "Bully or belittle",
      "Brag about yourself",
    ],
    example: {
      before: "We think this might help you.",
      after: "This will transform your results.",
    },
  },
  Human: {
    definition: "Authentic, relatable, and conversational tone",
    do: [
      "Use contractions",
      "Tell brief personal stories",
      "Admit mistakes",
    ],
    dont: [
      "Use slang",
      "Overshare private details",
      "Self-deprecate nonstop",
    ],
    example: {
      before: "Our organization facilitates solutions.",
      after: "We help people like you.",
    },
  },
  Playful: {
    definition: "Fun, lighthearted, and engaging approach",
    do: [
      "Add light jokes",
      "Use playful metaphors",
      "Surprise readers",
    ],
    dont: [
      "Offend or mock",
      "Stack jokes endlessly",
      "Derail the message",
    ],
    example: {
      before: "Our product is efficient.",
      after: "We make boring tasks disappear like magic.",
    },
  },
  Expert: {
    definition: "Knowledgeable, authoritative, and credible voice",
    do: [
      "Cite data",
      "Use precise terms",
      "Share insights",
    ],
    dont: [
      "Drown in stats",
      "Fill copy with jargon",
      "Lecture or preach",
    ],
    example: {
      before: "This works well.",
      after: "Studies show 73% improvement.",
    },
  },
  "Dry-humour": {
    definition: "Subtle, witty, and understated comedic approach",
    do: [
      "Use subtle irony",
      "Add sly observations",
      "Keep it understated",
    ],
    dont: [
      "Explain the joke",
      "Turn cruel or snarky",
      "Pile on sarcasm",
    ],
    example: {
      before: "This is amazing!",
      after: "It's almost suspiciously good.",
    },
  },
  Warm: {
    definition: "Friendly, caring, and emotionally supportive tone",
    do: [
      "Use caring words",
      "Show empathy",
      "Build rapport",
    ],
    dont: [
      "Be overly sweet or clingy",
      "Guilt-trip",
      "Cross personal boundaries",
    ],
    example: {
      before: "Contact support.",
      after: "We're here whenever you need us.",
    },
  },
  Minimal: {
    definition: "Clean, concise, and purposeful communication",
    do: [
      "Trim extra words",
      "Write short sentences",
      "Stay on point",
    ],
    dont: [
      "Cut until cryptic",
      "Use only fragments",
      "Erase all voice",
    ],
    example: {
      before: "We would like to help you achieve your goals.",
      after: "We help you succeed.",
    },
  },
  Quirky: {
    definition: "Unique, unconventional, and memorable character",
    do: [
      "Add odd analogies",
      "Bend a rule or two",
      "Stay memorable",
    ],
    dont: [
      "Get random or confusing",
      "Break every rule",
      "Chase shock value",
    ],
    example: {
      before: "Our software is user-friendly.",
      after: "Our software speaks fluent human.",
    },
  },
  Inspirational: {
    definition: "Motivating, uplifting, and empowering messaging",
    do: [
      "Paint big possibilities",
      "Use upbeat words",
      "Celebrate wins",
    ],
    dont: [
      "Promise the impossible",
      "Preach clichés",
      "Ignore real struggles",
    ],
    example: {
      before: "This tool helps with tasks.",
      after: "Unlock your potential.",
    },
  },
  Rebellious: {
    definition: "Challenging norms and questioning the status quo",
    do: [
      "Question norms",
      "Speak boldly",
      "Offer new paths",
    ],
    dont: [
      "Trash everything old",
      "Attack the audience",
      "Rebel without a point",
    ],
    example: {
      before: "Follow best practices.",
      after: "Best practices are yesterday's news.",
    },
  },
  Analytical: {
    definition: "Data-driven, logical, and methodical approach",
    do: [
      "Present clear data",
      "Use logic",
      "Break ideas down",
    ],
    dont: [
      "Bury readers in numbers",
      "Dismiss feelings",
      "Over-explain every step",
    ],
    example: {
      before: "This is good.",
      after: "Data shows 3x better outcomes.",
    },
  },
  Wholesome: {
    definition: "Pure, genuine, and family-friendly communication",
    do: [
      "Promote good values",
      "Use clean language",
      "Encourage kindness",
    ],
    dont: [
      "Moralize or judge",
      "Slip into childish tone",
      "Gloss over hard truths",
    ],
    example: {
      before: "Buy our product.",
      after: "Join our community of good people doing good things.",
    },
  },
} 