export type TraitName =
  | "Authoritative"
  | "Witty"
  | "Direct"
  | "Inspiring"
  | "Warm"
  | "Inclusive"
  | "Optimistic"
  | "Passionate"
  | "Playful"
  | "Supportive"
  | "Sophisticated"
  | "Thoughtful"

interface VoiceTrait {
  definition: string
  do: string[]
  dont: string[]
  example: { before: string; after: string }
}

export const TRAITS: Record<TraitName, VoiceTrait> = {
  Authoritative: {
    definition: "Confident expertise that educates and guides without being condescending or pushy",
    do: [
      "State facts clearly and back claims with evidence",
      "Use decisive language that shows expertise",
      "Lead conversations rather than follow trends",
    ],
    dont: [
      "Be condescending or pushy",
      "Make claims without evidence",
      "Follow every trend blindly",
    ],
    example: {
      before: "We think this might possibly help in some cases",
      after: "Here's exactly why this approach works better",
    },
  },
  Witty: {
    definition: "Clever, sharp humor that shows intelligence without being silly or inappropriate",
    do: [
      "Use clever wordplay and unexpected connections that make people smile",
      "Reference cultural moments or shared experiences your audience knows",
      "Time humor appropriately to enhance rather than distract from your message",
    ],
    dont: [
      "Use humor that could offend or exclude part of your audience",
      "Be silly when serious communication is needed",
      "Force jokes that don't naturally fit the context",
    ],
    example: {
      before: "Our system is currently unavailable due to technical issues",
      after: "Our servers decided to take an unscheduled coffee break. Back in 5 minutes!",
    },
  },
  Direct: {
    definition: "Clear and straightforward communication that gets to the point without unnecessary fluff",
    do: [
      "State your main message upfront without beating around the bush",
      "Use simple, clear language that leaves no room for confusion",
      "Focus on what matters most to your audience",
    ],
    dont: [
      "Bury the main point in unnecessary details",
      "Use complex jargon when simple words work",
      "Add fluff that doesn't serve the message",
    ],
    example: {
      before: "We're excited to introduce an innovative solution that may potentially help optimize your workflow efficiency",
      after: "This feature saves you 2 hours per week. Here's how.",
    },
  },
  Inspiring: {
    definition: "Motivating and uplifting communication that encourages people to take action and reach their potential",
    do: [
      "Focus on possibilities and what people can achieve",
      "Use encouraging language that builds confidence and momentum",
      "Share stories and examples that motivate positive change",
    ],
    dont: [
      "Focus on limitations or what can't be done",
      "Use discouraging or negative language",
      "Promise unrealistic outcomes",
    ],
    example: {
      before: "This process can be challenging and may not work for everyone",
      after: "You're already closer to success than you think—here's your next step",
    },
  },
  Warm: {
    definition: "Genuine human connection that feels personal and caring without being overly emotional",
    do: [
      "Use personal pronouns and inclusive language that brings people closer",
      "Acknowledge individual experiences and show you care about outcomes",
      "Express genuine appreciation and recognition when appropriate",
    ],
    dont: [
      "Sound distant or transactional in important moments",
      "Use overly emotional language that feels manipulative",
      "Fake warmth or use generic pleasantries without meaning",
    ],
    example: {
      before: "User account has been successfully created. Proceed to next step.",
      after: "Welcome! We're excited to have you here and can't wait to see what you create.",
    },
  },
  Inclusive: {
    definition: "Welcoming communication that makes everyone feel seen, valued, and able to participate",
    do: [
      "Use language that welcomes all backgrounds and abilities",
      "Avoid assumptions about knowledge, experience, or circumstances",
      "Create content that works for diverse audiences",
    ],
    dont: [
      "Make assumptions about your audience's background",
      "Use exclusionary language or references",
      "Ignore accessibility and diverse needs",
    ],
    example: {
      before: "Every professional knows that networking is essential",
      after: "Whether you're starting out or switching careers...",
    },
  },
  Optimistic: {
    definition: "Positive and hopeful communication that focuses on possibilities and favorable outcomes",
    do: [
      "Frame challenges as opportunities for growth",
      "Highlight potential benefits and positive aspects",
      "Use encouraging language that builds confidence",
    ],
    dont: [
      "Dwell on problems without offering solutions",
      "Use negative or pessimistic language",
      "Ignore real challenges completely",
    ],
    example: {
      before: "Unfortunately, this problem will be difficult to solve",
      after: "This setback is actually opening up a better path forward",
    },
  },
  Passionate: {
    definition: "Enthusiastic and energetic communication that shows genuine excitement and commitment",
    do: [
      "Express genuine enthusiasm for your work and mission",
      "Use vivid language that conveys energy and excitement",
      "Show personal investment in outcomes and results",
    ],
    dont: [
      "Sound detached or indifferent",
      "Use bland, corporate language",
      "Hide your genuine excitement and care",
    ],
    example: {
      before: "Our services may be able to assist with your requirements",
      after: "We're absolutely thrilled to help you transform your business",
    },
  },
  Playful: {
    definition: "Light-hearted and fun communication that brings joy while staying professional and on-brand",
    do: [
      "Use humor, wordplay, and creative metaphors appropriately",
      "Add personality through unexpected but relevant references",
      "Keep things interesting with varied sentence structure",
    ],
    dont: [
      "Use humor that could offend or exclude",
      "Be silly when serious communication is needed",
      "Let playfulness overshadow the main message",
    ],
    example: {
      before: "We are currently experiencing technical difficulties",
      after: "Our servers are having a coffee break—back in 5 minutes!",
    },
  },
  Supportive: {
    definition: "Understanding and encouraging communication that acknowledges challenges while offering helpful guidance",
    do: [
      "Acknowledge difficulties people face before offering solutions",
      "Use 'we're in this together' language that builds trust",
      "Provide reassurance while maintaining realistic expectations",
    ],
    dont: [
      "Dismiss or minimize real challenges",
      "Sound patronizing or condescending",
      "Promise solutions you can't deliver",
    ],
    example: {
      before: "This is simple and straightforward for most users",
      after: "We know this feels overwhelming—let's break it into manageable steps",
    },
  },
  Sophisticated: {
    definition: "Refined and intelligent communication that respects your audience's intellect and expertise",
    do: [
      "Use precise language and nuanced explanations",
      "Reference relevant cultural, industry, or intellectual contexts",
      "Maintain elegance without being pretentious",
    ],
    dont: [
      "Talk down to your audience",
      "Use unnecessarily complex language to sound smart",
      "Be pretentious or show-offy",
    ],
    example: {
      before: "Our super easy tool makes hard stuff simple for anyone!",
      after: "We've distilled complexity into clarity—just as you would",
    },
  },
  Thoughtful: {
    definition: "Considered and reflective communication that shows depth and careful consideration of ideas",
    do: [
      "Present multiple perspectives before drawing conclusions",
      "Show you've considered implications and consequences",
      "Take time to explain the 'why' behind recommendations",
    ],
    dont: [
      "Rush to quick judgments or solutions",
      "Ignore complexity or nuance",
      "Present only one viewpoint",
    ],
    example: {
      before: "This is obviously the right choice for everyone",
      after: "After weighing the trade-offs, this approach offers the best balance",
    },
  },
} 