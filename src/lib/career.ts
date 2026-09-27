/** Career module: resume bullet enhancement, interview banks, cover letters. */

const VERB_UPGRADES: [RegExp, string][] = [
  [/^worked on\b/i, 'Engineered'], [/^worked with\b/i, 'Collaborated with'],
  [/^helped( to)?\b/i, 'Drove'], [/^made\b/i, 'Developed'], [/^did\b/i, 'Executed'],
  [/^used\b/i, 'Leveraged'], [/^was responsible for\b/i, 'Owned'],
  [/^responsible for\b/i, 'Owned'], [/^fixed\b/i, 'Resolved'], [/^improved\b/i, 'Optimized'],
  [/^created\b/i, 'Designed and built'], [/^built\b/i, 'Architected'],
  [/^handled\b/i, 'Managed'], [/^participated in\b/i, 'Contributed to'],
  [/^learned\b/i, 'Mastered'], [/^wrote\b/i, 'Authored'], [/^tested\b/i, 'Validated'],
]

export interface BulletReview {
  improved: string
  tips: string[]
}

export function improveBullet(raw: string): BulletReview {
  let b = raw.trim().replace(/^[-*•]\s*/, '')
  const tips: string[] = []
  if (!b) return { improved: '', tips: [] }

  let upgraded = false
  for (const [re, rep] of VERB_UPGRADES) {
    if (re.test(b)) {
      b = b.replace(re, rep)
      upgraded = true
      tips.push(`Swapped a weak opener for the action verb “${rep}”.`)
      break
    }
  }
  if (!upgraded && /^(i|we)\b/i.test(b)) {
    b = b.replace(/^(i|we)\s+/i, '')
    tips.push('Removed first-person pronoun — bullets should start with a verb.')
  }
  b = b[0].toUpperCase() + b.slice(1)
  if (!/\d/.test(b)) {
    tips.push('Add a measurable outcome — e.g. “…reducing load time by 40%” or “…for 2,000+ users”. Metrics triple a bullet’s impact.')
  }
  if (b.split(/\s+/).length > 28) {
    tips.push('Trim to one line (≤ ~20 words). Recruiters scan, they don’t read.')
  }
  if (!/(by|resulting in|leading to|which)/i.test(b) && /\d/.test(b)) {
    tips.push('Link the action to its result: “did X **by** Y, **resulting in** Z”.')
  }
  if (!tips.length) tips.push('Strong bullet — action verb, metric and outcome all present. 🐾')
  return { improved: b, tips }
}

export interface InterviewQ {
  q: string
  guide: string
}

export const INTERVIEW_BANK: Record<string, InterviewQ[]> = {
  'Software Engineer': [
    { q: 'Walk me through a project you’re most proud of.', guide: 'Use STAR: Situation → Task → Action → Result. Lead with the measurable result, then the hardest technical decision you made and why.' },
    { q: 'How do you decide between a SQL and NoSQL database?', guide: 'Discuss data shape (relational vs document), consistency needs (ACID vs eventual), query patterns, and scale. Name concrete engines: PostgreSQL vs MongoDB/DynamoDB.' },
    { q: 'Explain how an HTTP request becomes a rendered page.', guide: 'DNS → TCP/TLS → request → server/CDN → HTML parse → CSSOM → JS execution → layout → paint. Bonus: mention caching layers and hydration for SPAs.' },
    { q: 'Describe a production bug you debugged. What was the root cause?', guide: 'Show a systematic process: reproduce → isolate → hypothesise → verify with logs/bisection → fix → add regression test. Never say “it just started working”.' },
    { q: 'How would you design a URL shortener?', guide: 'Requirements → API → ID generation (base62, collision strategy) → storage & cache (Redis) → redirects (301 vs 302) → analytics → scale estimates.' },
    { q: 'What does code quality mean to you?', guide: 'Readability > cleverness, tests as documentation, small PRs, meaningful names, boy-scout rule. Tie each principle to a real habit you practice.' },
  ],
  'ML Engineer': [
    { q: 'How do you detect and handle overfitting?', guide: 'Val/train loss divergence, learning curves. Remedies: more data, augmentation, regularisation (L2/dropout), early stopping, simpler architecture, cross-validation.' },
    { q: 'Explain the bias-variance tradeoff with an example.', guide: 'Linear model on curved data = high bias; deep tree memorising noise = high variance. Show you know total error decomposes and ensembles/regularisation navigate it.' },
    { q: 'How would you deploy a model to production?', guide: 'Serialise → containerise → serve (FastAPI/Triton) → monitor drift + latency → shadow deploy / A-B test → retraining pipeline. Mention feature-store consistency.' },
    { q: 'Transformer vs RNN — when and why?', guide: 'Transformers: parallel training, long-range attention, scale. RNNs: streaming, tiny-compute edge cases. Explain quadratic attention cost and context windows.' },
    { q: 'Your model performs great offline but fails in production. Why?', guide: 'Train/serve skew, data drift, leakage in training features, feedback loops, latency-driven truncation. Show a debugging playbook.' },
    { q: 'How do you evaluate a classifier on imbalanced data?', guide: 'Never accuracy. Precision/recall, F1, PR-AUC, confusion matrix at business-chosen thresholds; stratified CV; possibly cost-sensitive metrics.' },
  ],
  'Data Scientist': [
    { q: 'How do you handle missing data?', guide: 'First diagnose the mechanism (MCAR/MAR/MNAR). Then: drop, impute (mean/median/model-based), or add missingness indicators. Justify by impact on downstream bias.' },
    { q: 'Explain p-values to a non-technical stakeholder.', guide: '“If there were truly no effect, how surprising is this data?” Avoid saying “probability the hypothesis is true”. Bonus: mention practical vs statistical significance.' },
    { q: 'Design an A/B test for a new checkout flow.', guide: 'Metric choice (conversion, not clicks), power analysis for sample size, randomisation unit, guardrail metrics, runtime, novelty effects, and a pre-registered decision rule.' },
    { q: 'A metric dropped 10% overnight. Walk me through your investigation.', guide: 'Segment (platform, geo, browser), check instrumentation/logging changes, deploys, seasonality, then data pipeline. Quantify before theorising.' },
    { q: 'When would you choose a simpler model over a complex one?', guide: 'Interpretability requirements, small data, latency budgets, maintenance cost. “A logistic regression you can explain beats a black box you can’t defend.”' },
    { q: 'How do you communicate uncertainty in your findings?', guide: 'Confidence intervals over point estimates, scenario ranges, visual error bands, and explicit assumptions. Tailor depth to the audience.' },
  ],
  'Frontend Developer': [
    { q: 'What happens when a React component re-renders?', guide: 'State/props change → render → virtual DOM diff → minimal commits. Discuss memo, useMemo/useCallback, keys in lists, and when optimisation is premature.' },
    { q: 'How do you make a page fast?', guide: 'Measure first (Lighthouse, Web Vitals). Then: code-splitting, image optimisation, caching/CDN, minimising main-thread JS, prefetching, skeleton UIs.' },
    { q: 'Explain CSS specificity and the cascade.', guide: 'Inline > id > class/attr > element; later rules win at equal specificity; !important as last resort. Mention how utility-first CSS sidesteps specificity wars.' },
    { q: 'How do you approach accessibility?', guide: 'Semantic HTML first, keyboard navigation, focus management, ARIA only when needed, colour contrast, screen-reader testing. Cite WCAG AA.' },
    { q: 'Describe state management options in React.', guide: 'Local state → lifted state → context → external stores (Zustand/Redux) → server state (React Query). Match tool to state type; avoid one global blob.' },
    { q: 'How do you handle errors in a SPA?', guide: 'Error boundaries for render errors, try/catch + toast for async, retry with backoff, fallback UIs, and reporting (Sentry). Never a white screen.' },
  ],
  'Product Manager': [
    { q: 'How do you prioritise a backlog?', guide: 'Framework (RICE/ICE) + judgement. Tie every item to a metric and a user problem. Explain what you deliberately did NOT build.' },
    { q: 'Tell me about a product decision you got wrong.', guide: 'Pick a real one. Show the flawed assumption, how you detected it (data/user feedback), how fast you reversed, and the process change that followed.' },
    { q: 'How would you improve our product?', guide: 'Structure: user segments → jobs-to-be-done → friction points → 2-3 concrete bets → how you’d validate cheaply. Research the actual product beforehand.' },
    { q: 'Engineers say a feature will take 3× longer than you hoped. What now?', guide: 'Understand why (scope? debt? unknowns?), cut scope to the riskiest assumption, ship a slice, never negotiate estimates down by pressure.' },
    { q: 'How do you measure product success?', guide: 'North-star metric + input metrics, counter-metrics to catch gaming, cohort retention over vanity counts. Define success *before* launch.' },
    { q: 'How do you say no to a loud stakeholder?', guide: 'Acknowledge the goal, show the tradeoff transparently against agreed priorities, offer the earliest honest slot, and document the decision.' },
  ],
}

export interface CoverLetterInput {
  name: string
  role: string
  company: string
  skills: string
  highlight: string
}

export function generateCoverLetter(i: CoverLetterInput): string {
  const skills = i.skills.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
  const skillLine = skills.length > 1 ? `${skills.slice(0, -1).join(', ')} and ${skills[skills.length - 1]}` : skills[0] ?? 'modern engineering practices'
  return [
    `Dear ${i.company} Hiring Team,`,
    ``,
    `I'm writing to apply for the ${i.role} position at ${i.company}. What draws me to this role is the chance to apply my experience with ${skillLine} to problems that ship to real users — and ${i.company}'s work is exactly the kind I want to contribute to.`,
    ``,
    `A highlight that best represents how I work: ${i.highlight.trim().replace(/\.$/, '')}. I approach every project the same way — understand the user problem first, design for maintainability, measure the outcome, and iterate.`,
    ``,
    `Beyond technical skills, I bring the habits that make teams faster: clear written communication, small reviewable changes, and documentation people actually read. I'd welcome the opportunity to discuss how I can contribute to ${i.company}'s goals.`,
    ``,
    `Thank you for your time and consideration.`,
    ``,
    `Sincerely,`,
    `${i.name}`,
  ].join('\n')
}
