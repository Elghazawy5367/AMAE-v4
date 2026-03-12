// === FILE: lib/scoring-algorithms.js === 
// Job: All scoring algorithms — buying intent, urgency, quote extractability, trend velocity 
// Reads: nothing (pure functions) 
// Writes: nothing 
// Called by: copy-excavator.js, timing-scout.js, intelligence-synthesizer.js 
 
// ── BUYING INTENT SCORER 
───────────────────────────────────────────────────── 
// Scores 0–10 based on explicit and implicit buying signals in text 
 
const BUYING_INTENT_TIERS = [ 
  { 
    weight: 3.0, 
    label:  'explicit', 
    patterns: [ 
      'looking for', 'willing to pay', 'need a tool', 'recommend something', 
      'what do you use for', 'what software do', 'trying to find', 'anyone built', 
      'hire someone', 'is there a service', 'switched to', 'moved to', 
      'just bought', 'just started using', 'best way to', 'alternative to', 
    ], 
  }, 
  { 
    weight: 2.0, 
    label:  'implicit', 
    patterns: [ 
      'how do you', 'how does anyone', 'wish there was', 'frustrated that', 
      'manual process', 'takes forever', 'hours every week', 'spending too much time', 
      'workaround for', 'is there a way to', 'automate this', 'why cant i', 
      'how to automate', 'any tips on', 'struggling with', 
    ], 
  }, 
  { 
    weight: 1.0, 
    label:  'pain', 
    patterns: [ 
      'broken', 'useless', 'gave up', 'nightmare', 'impossible', 'hate this', 
      'why is it so hard', 'nobody solves', 'still in 2026', 'annoying that', 
      'drives me crazy', 'so painful', 'such a pain', 
    ], 
  }, 
]; 
 
/** 
 * Score a Reddit post or comment body for buying intent (0–10 scale). 
 * Higher = stronger signal that this person is in market to buy a solution. 
 * @param {string} text 
 * @returns {number} 0–10 
 */ 
export function scoreBuyingIntent(text) { 
  if (!text) return 0; 
  const lower = text.toLowerCase(); 
  let score = 0; 
 
  for (const tier of BUYING_INTENT_TIERS) { 
    for (const pattern of tier.patterns) { 
      if (lower.includes(pattern)) { 
        score += tier.weight; 
        break; // One match per tier per post — prevents stacking on similar phrases 
      } 
    } 
  } 
 
  return Math.min(Math.round(score * 10) / 10, 10); 
} 
 
// ── URGENCY SCORER 
─────────────────────────────────────────────────────────
─── 
// Scores 0–100 based on time pressure signals and post freshness 
 
const URGENCY_SIGNALS = [ 
  { weight: 30, patterns: ['urgent', 'asap', 'today', 'deadline', 'need now', 'immediately', 'critical'] 
}, 
  { weight: 20, patterns: ['this week', 'shipping soon', 'launching', 'by friday', 'end of week', 
'tomorrow'] }, 
  { weight: 15, patterns: ['always', 'constantly', 'every single time', 'for months', 'for years', 
'every week', 'chronic'] }, 
  { weight: 10, patterns: ['again', 'still', 'yet again', 'once more'] }, 
]; 
 
/** 
 * Score urgency of a post (0–100 scale). 
 * @param {string} text 
 * @param {number} ageHours - how old the post is 
 * @returns {number} 0–100 
 */ 
export function scoreUrgency(text, ageHours = 999) { 
  if (!text) return 0; 
  const lower = text.toLowerCase(); 
  let score = 0; 
 
  for (const signal of URGENCY_SIGNALS) { 
    for (const pattern of signal.patterns) { 
      if (lower.includes(pattern)) { score += signal.weight; break; } 
    } 
  } 
 
  // Fresh post bonus — recency is a strong signal 
  if (ageHours < 6)  score += 30; 
  else if (ageHours < 24) score += 20; 
  else if (ageHours < 48) score += 10; 
 
  return Math.min(score, 100); 
} 
 
// ── QUOTE EXTRACTABILITY SCORER 
─────────────────────────────────────────────── 
// Determines if a sentence is good enough to use verbatim as marketing copy 
 
const EMOTION_WORDS = [ 
  'frustrated', 'annoyed', 'hate', 'love', 'wish', 'finally', 'exhausted', 
  'desperate', 'excited', 'afraid', 'terrified', 'relieved', 'angry', 'tired', 
  'sick of', 'fed up', 'losing my mind', 'losing sleep', 'keep me up', 
]; 
 
const MARKETING_TELLS = [ 
  'leverage', 'synergy', 'seamlessly', 'scalable', 'robust', 'empower', 
  'game-changing', 'revolutionary', 'disrupting', 'unlock', 'delve', 
  'paradigm', 'holistic', 'transformative', 'cutting-edge', 'innovative', 
]; 
 
const NUMBER_PATTERN = /\d+/; 
 
/** 
 * Score a single sentence for verbatim use as marketing copy (0–10). 
 * 8–10: use as hook directly 
 * 5–7:  adapt lightly — preserve the core language 
 * <5:   discard 
 * @param {string} sentence 
 * @returns {number} 0–10 
 */ 
export function scoreVerbatimQuote(sentence) { 
  if (!sentence || sentence.length < 15) return 0; 
  const lower = sentence.toLowerCase(); 
  const wordCount = sentence.trim().split(/\s+/).length; 
  let score = 0; 
 
  // Brevity: under 25 words is ideal for a hook 
  if (wordCount <= 15) score += 2; 
  else if (wordCount <= 25) score += 1; 
 
  // Contains a specific number — adds credibility and specificity 
  if (NUMBER_PATTERN.test(sentence)) score += 2; 
 
  // Emotional language — makes it relatable 
  if (EMOTION_WORDS.some(e => lower.includes(e))) score += 2; 
 
  // First-person voice — feels authentic, not like marketing 
  if (/^(i |i've|i'm|i was|i keep|i spent|i feel)/i.test(sentence.trim())) score += 2; 
 
  // Not marketing language — ensures it sounds human 
  if (!MARKETING_TELLS.some(t => lower.includes(t))) score += 2; 
 
  return Math.min(score, 10); 
} 
 
/** 
 * Extract and score all quotable sentences from a body of text. 
 * Returns sorted array (highest score first), capped at topN. 
 * @param {string} text 
 * @param {number} topN 
 * @returns {Array<{sentence: string, score: number}>} 
 */ 
export function extractBestQuotes(text, topN = 5) { 
  if (!text) return []; 
 
  const sentences = text 
    .replace(/\n+/g, ' ') 
    .split(/(?<=[.!?])\s+/) 
    .map(s => s.trim()) 
    .filter(s => s.length > 20 && s.length < 250); 
 
  return sentences 
    .map(s => ({ sentence: s, score: scoreVerbatimQuote(s) })) 
    .filter(q => q.score >= 3) // Only return quotes worth considering 
    .sort((a, b) => b.score - a.score) 
    .slice(0, topN); 
} 
 
// ── TREND VELOCITY SCORER 
────────────────────────────────────────────────────── 
 
/** 
 * Score trend velocity of an HN/GitHub/Reddit item. 
 * Multiplier decays as item ages — rewards early detection. 
 * @param {number} score    - points, stars, or upvotes 
 * @param {number} ageHours - how old the item is 
 * @returns {number} adjusted velocity score (higher = more trending now) 
 */ 
export function scoreTrendVelocity(score, ageHours) { 
  const rawVelocity = score / Math.max(ageHours, 0.5); // Avoid division by very small 
numbers 
  const multiplier  = 
    ageHours < 6  ? 2.0 : 
    ageHours < 24 ? 1.5 : 
    ageHours < 48 ? 1.0 : 
    ageHours < 96 ? 0.5 : 0.1; 
 
  return Math.round(rawVelocity * multiplier * 100) / 100; 
} 
 
/** 
 * Classify a velocity score into an action bucket. 
 * @param {number} velocityScore 
 * @returns {'publish_now'|'prepare_next_week'|'monitor'|'peaked_avoid'} 
 */ 
export function classifyTrend(velocityScore) { 
  if (velocityScore > 80)  return 'publish_now'; 
  if (velocityScore > 40)  return 'prepare_next_week'; 
  if (velocityScore > 10)  return 'monitor'; 
  return 'peaked_avoid'; 
} 
 
/** 
 * Score relevance of a piece of text to a set of keywords. 
 * Returns 0–1 (percentage of keywords matched). 
 * @param {string}   text 
 * @param {string[]} keywords 
 * @returns {number} 0–1 
 */ 
export function scoreRelevance(text, keywords) { 
  if (!text || !keywords?.length) return 0; 
  const lower   = text.toLowerCase(); 
  const matched = keywords.filter(k => lower.includes(k.toLowerCase())).length; 
  return matched / keywords.length; 
}