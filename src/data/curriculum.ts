/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  type: 'collocation-match' | 'sentence-unscramble' | 'fill-in-blank' | 'error-spotting' | 'shadowing';
  prompt: string;
  context?: string;
  bandTip: string;
  pairs?: Array<{ left: string; right: string }>;
  words?: string[];
  correctSentence?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  audioPromptText?: string;
  targetAccent?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  xpReward: number;
  gemReward: number;
  questions: Question[];
}

export interface Unit {
  id: string;
  unitNumber: number;
  sectionNumber: number;
  sectionTitle: string;
  title: string;
  description: string;
  accentColor: string;
  badgeText: string;
  lessons: Lesson[];
  hasChest?: boolean;
  chestClaimed?: boolean;
}

export interface SectionInfo {
  sectionNumber: number;
  title: string;
  startUnit: number;
  endUnit: number;
  color: string;
  description: string;
}

export const IELTS_SECTIONS: SectionInfo[] = [
  { sectionNumber: 1, title: 'Speaking Part 1 Foundations', startUnit: 1, endUnit: 10, color: 'emerald', description: 'Hometown, Work, Studies, Leisure, Routine & Habits' },
  { sectionNumber: 2, title: 'High-Frequency Lexical Resource', startUnit: 11, endUnit: 20, color: 'sky', description: 'Travel, Health, Climate, Arts, Media & Digital Habits' },
  { sectionNumber: 3, title: 'Part 2 Cue Card Monologue Mastery', startUnit: 21, endUnit: 30, color: 'purple', description: 'Story arcs, chronological transitions & sensory details' },
  { sectionNumber: 4, title: 'Narrative Arcs & Descriptive Lexis', startUnit: 31, endUnit: 40, color: 'indigo', description: 'Memories, people, places, pivotal milestones & dilemmas' },
  { sectionNumber: 5, title: 'Part 3 Abstract Debate & Hedging', startUnit: 41, endUnit: 50, color: 'amber', description: 'Hypothetical speculation, critical analysis & nuance' },
  { sectionNumber: 6, title: 'Global Issues & Socio-Economic Analysis', startUnit: 51, endUnit: 60, color: 'rose', description: 'Automation, climate policies, urban planning & ethics' },
  { sectionNumber: 7, title: 'Advanced Grammar & Inversions', startUnit: 61, endUnit: 70, color: 'teal', description: 'Fronted adverbials, conditional inversions & clefts' },
  { sectionNumber: 8, title: 'Band 8+ Collocations & Idioms', startUnit: 71, endUnit: 80, color: 'emerald', description: 'Natural native phrasing without forced clichés' },
  { sectionNumber: 9, title: 'Connected Speech & Intonation', startUnit: 81, endUnit: 90, color: 'sky', description: 'Linking sounds, thought groups, pauses & pitch control' },
  { sectionNumber: 10, title: 'Band 9.0 Examiner Board Simulation', startUnit: 91, endUnit: 100, color: 'purple', description: 'Full mock interviews, curveballs & fluent repairs' },
];

// Topic catalog for the 100 units
const UNIT_TOPIC_SPECS = [
  // Section 1: Units 1-10
  { title: 'Hometown & Urban Living', desc: 'Master urban descriptors, local landmarks and historical architecture.', icon: 'building', badge: 'Band 7.5' },
  { title: 'Work, Career & Professional Ambition', desc: 'Phrasal verbs and collocations for career trajectories and workplace dynamics.', icon: 'briefcase', badge: 'Band 7.5' },
  { title: 'Technology, AI & Digital Living', desc: 'Expressing balanced perspectives on tech convenience vs digital fatigue.', icon: 'cpu', badge: 'Band 8.0' },
  { title: 'Leisure, Fitness & Recreation', desc: 'Discussing athletic pursuits, work-life equilibrium and downtime.', icon: 'compass', badge: 'Band 7.5' },
  { title: 'Family Dynamics & Interpersonal Bonds', desc: 'Nuanced vocabulary for kindred relationships and generational shifts.', icon: 'user-check', badge: 'Band 7.5' },
  { title: 'Culinary Traditions & Gastronomy', desc: 'Sensory adjectives for regional delicacies and dietary trends.', icon: 'sparkles', badge: 'Band 8.0' },
  { title: 'Weather Patterns & Meteorological Impacts', desc: 'Vivid descriptions of seasonal fluctuations and climate resilience.', icon: 'compass', badge: 'Band 7.5' },
  { title: 'Music, Performing Arts & Entertainment', desc: 'Acoustic terminology, emotional resonance and cultural heritage.', icon: 'sparkles', badge: 'Band 8.0' },
  { title: 'Daily Routines, Productivity & Punctuality', desc: 'Temporal sequencing, habit formation and time management strategies.', icon: 'briefcase', badge: 'Band 7.5' },
  { title: 'Retail, Consumerism & Fashion Trends', desc: 'Discussing sustainable consumption, ethical apparel and impulse shopping.', icon: 'building', badge: 'Band 8.0' },

  // Section 2: Units 11-20
  { title: 'Global Tourism & Remote Exploration', desc: 'Overcoming mass tourism clichés with authentic geographical lexis.', icon: 'compass', badge: 'Band 8.0' },
  { title: 'Historical Monuments & Architecture', desc: 'Structural aesthetics, heritage preservation and architectural styles.', icon: 'building', badge: 'Band 8.0' },
  { title: 'Higher Education & Academic Pedagogy', desc: 'Tertiary education curricula, vocational training and student autonomy.', icon: 'briefcase', badge: 'Band 8.0' },
  { title: 'Mental Wellbeing & Holistic Healthcare', desc: 'Psychological resilience, stress mitigation and wellness paradigms.', icon: 'user-check', badge: 'Band 8.5' },
  { title: 'Public Celebrations & National Festivals', desc: 'Commemorative rituals, national unity and folkloric traditions.', icon: 'sparkles', badge: 'Band 8.0' },
  { title: 'Ecosystems, Wildlife & Biodiversity', desc: 'Flora, fauna, habitat restoration and endangered species protection.', icon: 'compass', badge: 'Band 8.5' },
  { title: 'Mass Rapid Transit & Sustainable Commutes', desc: 'Urban rail grids, congestion abatement and decarbonized mobility.', icon: 'building', badge: 'Band 8.0' },
  { title: 'Literature, Independent Bookstores & Authors', desc: 'Literary genres, evocative prose and the revival of print media.', icon: 'briefcase', badge: 'Band 8.0' },
  { title: 'Virtual Communities & Social Algorithms', desc: 'Echo chambers, information dissemination and digital identity.', icon: 'cpu', badge: 'Band 8.5' },
  { title: 'Ocean Conservation & Marine Ecosystems', desc: 'Coral reef degradation, maritime ecology and microplastic pollution.', icon: 'compass', badge: 'Band 8.5' },

  // Section 3: Units 21-30 (Part 2 Cue Cards)
  { title: 'Cue Card: An Unforgettable Coastal Voyage', desc: 'Chronological progression from embarking to climax and reflection.', icon: 'compass', badge: 'Cue Card' },
  { title: 'Cue Card: A Person Who Inspired Your Ambitions', desc: 'Emotive character adjectives and transformative mentorship.', icon: 'user-check', badge: 'Cue Card' },
  { title: 'Cue Card: An Invaluable Piece of Modern Equipment', desc: 'Functionality, daily utility and how life would stall without it.', icon: 'cpu', badge: 'Cue Card' },
  { title: 'Cue Card: A Formidable Challenge You Overcame', desc: 'Rising action, overcoming adversity and newfound emotional fortitude.', icon: 'scale', badge: 'Cue Card' },
  { title: 'Cue Card: A Tranquil Nature Haven You Cherish', desc: 'Atmospheric depth, acoustic serenity and sensory escapism.', icon: 'compass', badge: 'Cue Card' },
  { title: 'Cue Card: A Crucial Dilemma Requiring Decisive Action', desc: 'Weighing trade-offs, internal conflict and long-term repercussions.', icon: 'scale', badge: 'Cue Card' },
  { title: 'Cue Card: A Traditional Cultural Gala You Attended', desc: 'Vibrant pageantry, culinary banquets and communal solidarity.', icon: 'sparkles', badge: 'Cue Card' },
  { title: 'Cue Card: An App That Streamlined Your Productivity', desc: 'Interface ergonomics, workflow acceleration and digital efficiency.', icon: 'cpu', badge: 'Cue Card' },
  { title: 'Cue Card: A Historical Relic That Captivated You', desc: 'Archaeological intrigue, provenance and historical gravitas.', icon: 'building', badge: 'Cue Card' },
  { title: 'Cue Card: An Exquisite Meal in an Unusual Setting', desc: 'Gastronomic nuance, convivial atmosphere and lasting impression.', icon: 'sparkles', badge: 'Cue Card' },

  // Section 4: Units 31-40
  { title: 'The Story Arc: Climax & Turning Points', desc: 'Creating narrative tension and pacing in IELTS 2-minute long turns.', icon: 'compass', badge: 'Story Arc' },
  { title: 'Sensory Detail: Acoustic & Olfactory Imagery', desc: 'Painting evocative imagery for examiners without hesitation.', icon: 'sparkles', badge: 'Band 8.5' },
  { title: 'Describing Conflict & Emotional Resolution', desc: 'Nuanced expressions for interpersonal friction and reconciled harmony.', icon: 'user-check', badge: 'Band 8.5' },
  { title: 'Childhood Nostalgia & Formative Memories', desc: 'Temporal retrospective markers: "In retrospect", "Looking back".', icon: 'compass', badge: 'Band 8.0' },
  { title: 'Acts of Altruism & Philanthropic Deeds', desc: 'Civic duty, selflessness and community enrichment.', icon: 'user-check', badge: 'Band 8.5' },
  { title: 'Pivotal Career Milestones & Promotions', desc: 'Professional breakthroughs, meritocracy and entrepreneurial spirit.', icon: 'briefcase', badge: 'Band 8.5' },
  { title: 'Crafting the 15-Second Hook Opening', desc: 'Captivating examiner attention in the opening sentence of Part 2.', icon: 'sparkles', badge: 'Band 9.0' },
  { title: 'The 30-Second Reflective Epilogue', desc: 'Concluding monologues with philosophical maturity and moral takeaway.', icon: 'scale', badge: 'Band 9.0' },
  { title: 'Seamless Transition from Part 2 into Part 3', desc: 'Bridging personal narrative into broad sociological analysis.', icon: 'briefcase', badge: 'Band 9.0' },
  { title: 'Monologue Timing: The Exact 120-Second Pacing', desc: 'Managing the cue card without running short or being cut mid-thought.', icon: 'compass', badge: 'Timing Pro' },

  // Section 5: Units 41-50 (Part 3 Abstract Debate)
  { title: 'The Art of Academic Hedging', desc: 'Qualifying bold statements: "broadly speaking", "tends to suggest".', icon: 'scale', badge: 'Part 3' },
  { title: 'Hypothetical & Counterfactual Speculation', desc: 'Third conditionals and mixed unreal conditions in philosophical debate.', icon: 'scale', badge: 'GRA Band 9' },
  { title: 'Nuanced Concession & Balanced Rebuttal', desc: 'Structuring "While it is undeniably true that..., one cannot discount...".', icon: 'scale', badge: 'Band 8.5' },
  { title: 'Artificial Intelligence & Algorithmic Ethics', desc: 'Autonomous decision-making, bias mitigation and existential risk.', icon: 'cpu', badge: 'Band 8.5' },
  { title: 'Metropolitan Gentrification & Spatial Equity', desc: 'Urban displacement, affordable housing and neighborhood identity.', icon: 'building', badge: 'Band 8.5' },
  { title: 'Globalization vs Indigenous Cultural Autonomy', desc: 'Homogenization of culture vs pride in linguistic diversity.', icon: 'compass', badge: 'Band 8.5' },
  { title: 'Ecological Legislation & Corporate Accountability', desc: 'Carbon tax schemes, greenwashing and enforceable mandates.', icon: 'scale', badge: 'Band 8.5' },
  { title: 'Universal Healthcare vs Private Privatization', desc: 'Public funding constraints, patient triage and medical equity.', icon: 'user-check', badge: 'Band 8.5' },
  { title: 'Standardized Standard Testing in Schools', desc: 'Rote memorization versus holistic creative problem solving.', icon: 'briefcase', badge: 'Band 8.5' },
  { title: 'Consumer Psychology & Neuromarketing', desc: 'Subconscious branding, planned obsolescence and ethical advertising.', icon: 'building', badge: 'Band 8.5' },

  // Section 6: Units 51-60
  { title: 'Renewable Microgrids & Decarbonization', desc: 'Geothermal, solar photovoltaic arrays and grid reliability.', icon: 'cpu', badge: 'Band 8.5' },
  { title: 'Remote Work Paradigms & Asynchronous Labor', desc: 'Digital nomadism, labor fragmentation and cross-border teams.', icon: 'briefcase', badge: 'Band 8.5' },
  { title: 'Universal Basic Income & Automation Welfare', desc: 'Socio-economic safety nets, tax redistribution and work incentives.', icon: 'scale', badge: 'Band 9.0' },
  { title: 'Space Exploration vs Terrestrial Funding', desc: 'Planetary science versus acute immediate humanitarian needs.', icon: 'compass', badge: 'Band 9.0' },
  { title: 'Media Literacy & Combating Disinformation', desc: 'Algorithmic curation, deepfakes and democratic integrity.', icon: 'cpu', badge: 'Band 9.0' },
  { title: 'Aging Demographics & Pension Sustainability', desc: 'Dependency ratios, elderly care infrastructure and silver economies.', icon: 'user-check', badge: 'Band 8.5' },
  { title: 'Circular Economies & Waste Minimization', desc: 'Cradle-to-cradle lifecycle engineering and closed-loop manufacturing.', icon: 'building', badge: 'Band 8.5' },
  { title: 'Linguistic Heritage & Endangered Dialects', desc: 'Linguistic preservation, indigenous identity and oral traditions.', icon: 'sparkles', badge: 'Band 9.0' },
  { title: 'Architectural Biophilia & Green Cities', desc: 'Vertical forests, rooftop solar and climate-resilient civil design.', icon: 'building', badge: 'Band 9.0' },
  { title: 'Ethics of Genetic Engineering & CRISPR', desc: 'Bioethics, therapeutic interventions and gene editing controversies.', icon: 'cpu', badge: 'Band 9.0' },

  // Section 7: Units 61-70 (Advanced Grammar & Inversions)
  { title: 'Negative Inversions: "Rarely have I witnessed..."', desc: 'Mastering "Seldom", "Hardly", "On no account" for Band 9 GRA.', icon: 'scale', badge: 'Grammar' },
  { title: 'Conditional Inversion: "Were I to...", "Had I known..."', desc: 'Omitting "if" for formal, articulate Cambridge responses.', icon: 'scale', badge: 'Grammar' },
  { title: 'Fronted Prepositional & Adverbial Phrases', desc: 'Shifting spatial and temporal modifiers to sentence lead position.', icon: 'scale', badge: 'Grammar' },
  { title: 'Cleft Sentences: "What strikes me most is..."', desc: 'Focusing emphasis on core nouns using pseudo-cleft structures.', icon: 'scale', badge: 'Grammar' },
  { title: 'Participial Adverbial Clauses', desc: 'Using "-ing" and "-ed" clauses to compress ideas elegantly.', icon: 'scale', badge: 'Grammar' },
  { title: 'Impersonal Passive Stems: "It is widely contended that"', desc: 'Academic neutrality and third-person analytical objectivity.', icon: 'scale', badge: 'Grammar' },
  { title: 'Parallel Syntactic Structures & Cadence', desc: 'Balancing multi-clause sentences for rhythmic, memorable delivery.', icon: 'scale', badge: 'Grammar' },
  { title: 'Compound Inversion with "Not only... but also..."', desc: 'Dual-clause inversions that showcase command of English syntax.', icon: 'scale', badge: 'Grammar' },
  { title: 'Modal Verbs of High Deductive Probability', desc: 'Nuances between "must have been", "could conceivably", "would likely".', icon: 'scale', badge: 'Grammar' },
  { title: 'Subjunctive Mood in Formal British Speech', desc: 'Using "be that as it may", "it is imperative that society adopt".', icon: 'scale', badge: 'Grammar' },

  // Section 8: Units 71-80 (Band 8+ Collocations & Idioms)
  { title: 'Collocations: Academic Precision Verbs', desc: 'Replacing "make" and "do" with "foster", "engender", "facilitate".', icon: 'sparkles', badge: 'Lexicon' },
  { title: 'Collocations: Sophisticated Adjectives', desc: 'Unpacking "profound", "formidable", "invaluable", "indispensable".', icon: 'sparkles', badge: 'Lexicon' },
  { title: 'Idiomatic Language: Avoiding Overused Clichés', desc: 'Rejecting "rain cats and dogs"; using authentic native idiom.', icon: 'sparkles', badge: 'Lexicon' },
  { title: 'Nuanced Evaluative Adverbs', desc: 'Using "undeniably", "paradoxically", "inadvertently", "ostensibly".', icon: 'sparkles', badge: 'Lexicon' },
  { title: 'Idioms of Uncertainty & Contemplation', desc: 'Mastering "off the top of my head", "at the end of the day".', icon: 'sparkles', badge: 'Lexicon' },
  { title: 'High-Level Business & Economics Lexicon', desc: 'Fiscal prudence, market saturation, supply chain volatility.', icon: 'briefcase', badge: 'Lexicon' },
  { title: 'Societal & Cultural Collocations', desc: 'Cultural tapestry, social cohesion, intergenerational disparity.', icon: 'building', badge: 'Lexicon' },
  { title: 'Scientific & Technological Phrasing', desc: 'Cutting-edge breakthroughs, empirical evidence, paradigm shifts.', icon: 'cpu', badge: 'Lexicon' },
  { title: 'Concessive Signpost Expressions', desc: 'Notwithstanding, albeit, be that as it may, having said that.', icon: 'scale', badge: 'Lexicon' },
  { title: 'Idioms of Achievement & Resolution', desc: 'Weather the storm, hit the ground running, leave no stone unturned.', icon: 'sparkles', badge: 'Lexicon' },

  // Section 9: Units 81-90 (Connected Speech & Intonation)
  { title: 'The Intonation Arc: Rising vs Falling Pitch', desc: 'Using falling pitch for certainty; rising pitch for lists and inquiry.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Consonant-to-Vowel Linking in Fast Speech', desc: 'Sounding fluid without sounding slurred or indistinct.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Intrusive /r/, /w/, and /j/ Glides', desc: 'Native British linking phenomena that eliminate staccato speech.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Weak Forms & The Schwa /ə/ Paradigm', desc: 'De-stressing auxiliary verbs (can, was, to, at) for natural cadence.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Sentence Stress: Contrastive Focus', desc: 'Using tonic stress to emphasize your thesis statement.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Thought Groups & Strategic Pauses', desc: 'Pausing at meaningful grammatical junctures rather than mid-word.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Vocal Variety: Banishing Monotone Delivery', desc: 'Engaging the examiner with dynamic melodic contours.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Elision & Assimilation in Connected Speech', desc: 'Natural omission and blending of dental consonants (/t/, /d/).', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Rhythm: Stress-Timed vs Syllable-Timed', desc: 'Mastering the heartbeat tempo of natural British English.', icon: 'sparkles', badge: 'Pronunciation' },
  { title: 'Pronunciation Diagnostics & Accent Clarity', desc: 'Ensuring 100% effortless listener comprehension throughout.', icon: 'sparkles', badge: 'Pronunciation' },

  // Section 10: Units 91-100 (Band 9 Board Simulation)
  { title: 'Handling Unfamiliar & Bizarre Topics', desc: 'Tactics for when the examiner asks about mirrors, shoes, or robots.', icon: 'compass', badge: 'Band 9 Board' },
  { title: 'Instant Speech Repair without Disruption', desc: 'Gracefully self-correcting grammar without breaking fluency flow.', icon: 'scale', badge: 'Band 9 Board' },
  { title: 'Examiner Curveball: Agreeing Disagreeably', desc: 'Politely deconstructing the premise of a loaded examiner question.', icon: 'scale', badge: 'Band 9 Board' },
  { title: 'Eliminating Fillers (Uh, Um, You Know)', desc: 'Substituting silent pauses and high-band stalling phrases.', icon: 'sparkles', badge: 'Band 9 Board' },
  { title: 'Full Mock Interview: Academic Science & Society', desc: 'A continuous 15-minute simulated test with Dr. Arthur James.', icon: 'briefcase', badge: 'Full Mock' },
  { title: 'Full Mock Interview: Heritage, Arts & Urban Spaces', desc: 'High-speed Part 1, 2, and 3 board assessment.', icon: 'building', badge: 'Full Mock' },
  { title: 'Full Mock Interview: Technology, Ethics & Future', desc: 'Probing philosophical questions under Cambridge exam conditions.', icon: 'cpu', badge: 'Full Mock' },
  { title: 'Part 2 Cue Card Marathon (3 Rapid Monologues)', desc: 'Back-to-back 2-minute long turns to test stamina and vocabulary.', icon: 'compass', badge: 'Band 9 Board' },
  { title: 'The Band 9 Final Audit: Lexical & Grammatical Review', desc: 'Last-minute polish on idiomatic connectors and syntax variety.', icon: 'scale', badge: 'Band 9 Board' },
  { title: 'IELTS HERO Grand Master Certification', desc: 'The ultimate Band 9 Speaking exam. Earn the Diamond Laurels.', icon: 'sparkles', badge: 'Grand Master' },
];

/**
 * Builds the complete 100 IELTS units dataset
 */
export function build100Units(): Unit[] {
  return UNIT_TOPIC_SPECS.map((spec, index) => {
    const unitNumber = index + 1;
    const sectionIndex = Math.floor(index / 10);
    const section = IELTS_SECTIONS[sectionIndex] || IELTS_SECTIONS[0];
    
    // Color rotates by section
    const accentColor = section.color;

    // Build 2 lessons per unit
    const lessons: Lesson[] = [
      {
        id: `u${unitNumber}-l1`,
        title: `${spec.title.split(':')[0]} Practice`,
        subtitle: 'Core Collocations & Accuracy',
        icon: spec.icon,
        xpReward: 20 + (Math.floor(unitNumber / 10) * 5),
        gemReward: 10 + (Math.floor(unitNumber / 20) * 2),
        questions: [
          {
            id: `u${unitNumber}-q1`,
            type: 'collocation-match',
            prompt: `Match the Band 8+ academic pairings for ${spec.title.toLowerCase()}:`,
            bandTip: 'Natural collocations show effortless vocabulary mastery to examiners.',
            pairs: [
              { left: 'profound', right: 'ramifications' },
              { left: 'foster', right: 'creative innovation' },
              { left: 'marked', right: 'disparity' },
              { left: 'ubiquitous', right: 'presence' },
            ],
          },
          {
            id: `u${unitNumber}-q2`,
            type: 'fill-in-blank',
            prompt: 'Select the optimal cohesive connector:',
            context: `"${spec.desc.split('.')[0]}; ________, nuanced analysis is essential."`,
            options: ['nonetheless', 'because', 'such as', 'at first'],
            correctAnswer: 'nonetheless',
            explanation: '"Nonetheless" indicates sophisticated concession and contrasts opposing viewpoints.',
            bandTip: 'Concessive connectors elevate both Fluency and Coherence.',
          },
          {
            id: `u${unitNumber}-q3`,
            type: 'sentence-unscramble',
            prompt: 'Assemble the Band 8.5 inverted structure:',
            bandTip: 'Inversions signal top-tier Grammatical Range (Band 8.5+).',
            words: ['What', 'strikes', 'me', 'most', 'is', 'the', 'sheer', 'resilience', 'of', 'the', 'community.'],
            correctSentence: 'What strikes me most is the sheer resilience of the community.',
          },
        ],
      },
      {
        id: `u${unitNumber}-l2`,
        title: `${spec.title.split(':')[0]} Mastery`,
        subtitle: 'Examiner Shadowing & Inversions',
        icon: 'sparkles',
        xpReward: 25 + (Math.floor(unitNumber / 10) * 5),
        gemReward: 12 + (Math.floor(unitNumber / 20) * 2),
        questions: [
          {
            id: `u${unitNumber}-q4`,
            type: 'error-spotting',
            prompt: 'Select the grammatically accurate Band 8+ statement:',
            context: 'Spot the natural native alternative to simplistic phrasing:',
            options: [
              'From my vantage point, the long-term benefits significantly outweigh the costs.',
              'According to me, benefits are much more than the costs.',
              'In my opinion benefits having more importance than costs.',
              'To my point of view, benefits is bigger than costs.',
            ],
            correctAnswer: 'From my vantage point, the long-term benefits significantly outweigh the costs.',
            explanation: '"From my vantage point" is an authentic formal idiom, paired with "significantly outweigh".',
            bandTip: 'Avoid "According to me"—use "From my vantage point" or "In my view".',
          },
          {
            id: `u${unitNumber}-q5`,
            type: 'shadowing',
            prompt: 'Shadow and repeat with natural British intonation:',
            audioPromptText: 'Were we to prioritize sustainable infrastructure, the ecological dividends would prove monumental.',
            bandTip: 'Notice the crisp pronunciation of "dividends would prove monumental".',
          },
        ],
      },
    ];

    return {
      id: `unit-${unitNumber}`,
      unitNumber,
      sectionNumber: section.sectionNumber,
      sectionTitle: section.title,
      title: spec.title,
      description: spec.desc,
      accentColor,
      badgeText: spec.badge,
      hasChest: unitNumber % 2 === 0, // Chest every 2 units
      lessons,
    };
  });
}

export const IELTS_CURRICULUM: Unit[] = build100Units();

export const CUE_CARDS_BANK = [
  {
    id: 'cue-1',
    category: 'Travel & Journey',
    title: 'Describe a memorable journey you took by public transport',
    promptText: 'You should say:\n• Where you went and what transport you took\n• Who accompanied you on this journey\n• What occurred during the trip\n• And explain why this journey left a lasting impression on you.',
    prepTimeSeconds: 60,
    speakTimeSeconds: 120,
    vocabulary: [
      { phrase: 'picturesque landscape', meaning: 'visually attractive scenery like a picture' },
      { phrase: 'delayed indefinitely', meaning: 'postponed with no clear resumption time' },
      { phrase: 'striking up a conversation', meaning: 'initiating dialogue with someone new' },
      { phrase: 'in retrospect', meaning: 'thinking back upon a past event' },
    ],
    part3Questions: [
      'How has public transportation evolved in your country over the last two decades?',
      'Do you believe governments should subsidise rail transit to reduce carbon emissions?',
      'Will autonomous electric vehicles eventually replace traditional mass transit systems?',
    ],
  },
  {
    id: 'cue-2',
    category: 'Technology & Innovation',
    title: 'Describe a piece of technology you find indispensable in daily life',
    promptText: 'You should say:\n• What the technological device or application is\n• How frequently and for what purposes you utilise it\n• How you acquired or learned to navigate it\n• And explain how your routine would be altered without it.',
    prepTimeSeconds: 60,
    speakTimeSeconds: 120,
    vocabulary: [
      { phrase: 'streamline productivity', meaning: 'make workflows faster and more efficient' },
      { phrase: 'ubiquitous presence', meaning: 'found or existing everywhere' },
      { phrase: 'steep learning curve', meaning: 'requiring intense effort initially' },
      { phrase: 'integral component', meaning: 'essential and indispensable element' },
    ],
    part3Questions: [
      'To what extent are older generations adapting to digital payment systems?',
      'Are smartphones diminishing our capacity for sustained deep focus?',
      'What ethical implications arise with generative AI in academic assessments?',
    ],
  },
  {
    id: 'cue-3',
    category: 'Environment & Nature',
    title: 'Describe an environmental law or initiative you think is effective',
    promptText: 'You should say:\n• What the policy or initiative entails\n• Where and when it was implemented\n• How the public responded to this measure\n• And explain why you consider it effective.',
    prepTimeSeconds: 60,
    speakTimeSeconds: 120,
    vocabulary: [
      { phrase: 'curb greenhouse gas emissions', meaning: 'restrict or limit climate pollution' },
      { phrase: 'single-use plastics ban', meaning: 'prohibition of disposable plastic items' },
      { phrase: 'ecological consciousness', meaning: 'awareness of environmental preservation' },
      { phrase: 'stringent enforcement', meaning: 'rigorous application of rules' },
    ],
    part3Questions: [
      'Is individual consumer action sufficient without corporate accountability?',
      'Should high-polluting industries bear the primary financial burden of environmental restoration?',
      'How can schools effectively instil eco-friendly habits in young learners?',
    ],
  },
];
