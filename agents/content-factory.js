// === FILE: agents/content-factory.js === 
// Job: Generate all platform content in parallel from strategy + synthesis briefs 
// Reads: strategy-brief.md, intel-brief.md, synthesis-brief.md, product-dna.json, 
platforms.json 
// Writes: campaigns/[WEEK]/text/*.md 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { callModel, MODELS } from '../lib/openrouter.js'; 
import { readJSON, readText, writeText, ensureDir } from '../lib/file-utils.js'; 
import { getIntelFolder, getCampaignFolder, getTodayString, getCurrentWeek } from 
'../lib/week-utils.js'; 
 
// Platform definitions — each maps to a content file and has generation rules 
const PLATFORMS = [ 
  { 
    id:           'linkedin', 
    file:         'linkedin-post.md', 
    humanRequired: false, 
    maxTokens:    1200, 
    model:        MODELS.FAST, 
  }, 
  { 
    id:           'twitter', 
    file:         'twitter-thread.md', 
    humanRequired: false, 
    maxTokens:    1500, 
    model:        MODELS.FAST, 
  }, 
  { 
    id:           'reddit', 
    file:         'reddit-post.md', 
    humanRequired: true, 
    humanFlag:    'HUMAN REVIEW REQUIRED — AMAE writes, founder posts manually. 
Reddit bans bots permanently.', 
    maxTokens:    2000, 
    model:        MODELS.REASONING, // Better quality for long-form value post 
  }, 
  { 
    id:           'quora', 
    file:         'quora-answer.md', 
    humanRequired: true, 
    humanFlag:    'HUMAN REVIEW REQUIRED — Post manually after reading. No 
marketing language.', 
    maxTokens:    1500, 
    model:        MODELS.REASONING, 
  }, 
  { 
    id:           'newsletter', 
    file:         'newsletter.md', 
    humanRequired: true, 
    humanFlag:    'HUMAN REVIEWS AND SENDS — Never auto-send. Review in Beehiiv 
before sending.', 
    maxTokens:    2000, 
    model:        MODELS.REASONING, 
  }, 
  { 
    id:           'aeo_article', 
    file:         'aeo-article.md', 
    humanRequired: false, 
    maxTokens:    3000, 
    model:        MODELS.REASONING, // AEO articles need depth and structure 
  }, 
]; 
 
// Platform-specific prompt rules 
const PLATFORM_RULES = { 
  linkedin: `LINKEDIN 2026 RULES (non-negotiable — enforce every rule): 
- Optimal length: 900–1200 characters 
- NO external links anywhere in the post body 
- NO external links in the first comment 
- Never start with "I", "We", "Our", "Today", or "In this post" 
- Hook = bold claim OR specific number OR contrarian statement. Never a question. 
- Single blank line between every 1–2 sentences (white space = reach signal) 
- No hashtags unless genuinely niche-specific (max 2–3 if used) 
- One clear CTA at the end — specific action, not "what do you think?" 
- Algorithm rewards: dwell time, saves, substantive comments. Write for depth.`, 
 
  twitter: `TWITTER/X 2026 RULES (non-negotiable): 
- Thread length: 7–9 tweets total 
- Tweet 1 (HOOK): The verbatim hook. No link. Creates an open loop. Under 200 characters. 
- Tweets 2–6: numbered value points (1/ 2/ 3/ format). One idea per tweet. Under 260 chars 
each. 
- Tweet 7 (SUMMARY): "TL;DR:" + single most valuable takeaway 
- Tweet 8 (CTA): The ONLY tweet with a link. Specific action. 
- Links only in the final tweet — never in tweet 1 
- Algorithm: reply volume in first 60 minutes is the primary reach signal 
- Write something people agree with loudly OR disagree with specifically`, 
 
  reddit: `REDDIT 2026 RULES (non-negotiable): 
- Long-form value post — minimum 400 words 
- Title: specific result or question that would make this subreddit click 
- Zero promotional language in the first 3 paragraphs 
- Story format: situation → problem → what they tried → what worked 
- Product can appear once, at the end, as "one tool that helped" — never as the focus 
- Write as if you are a member of this community, not a marketer 
- Include specific numbers, timelines, and honest failures 
- End with an open question to invite genuine discussion`, 
 
  quora: `QUORA 2026 RULES (AEO-optimized): 
- Structure: Direct answer first (2 sentences) → personal experience → specific data → 
product mention (optional, at end only) 
- First 2 sentences must completely answer the question — AI systems extract these 
- Use "I" and first-person throughout — experience-based answers outperform generic ones 
- Include at least one specific number or timeframe 
- Zero marketing language — if it sounds like an ad, rewrite it 
- Length: 300–500 words optimal 
- End with a genuine insight, not a CTA`, 
 
  newsletter: `NEWSLETTER 2026 RULES (Beehiiv draft): 
- Subject line: [Specific number or outcome]: [what they get inside] 
- Preheader: One sentence that expands the subject line 
- Body structure: 1 insight (150 words) + 1 resource (50 words) + 1 action step (50 words) + 
1 question (25 words) 
- Total body: 400–600 words 
- Opening: Do not start with "Hi [first name]" or "Welcome to this week's newsletter" 
- Use the verbatim hook from copy-ammunition.md as the opening line 
- One link maximum in the entire email body 
- End with a genuine question that invites reply`, 
 
  aeo_article: `AEO ARTICLE 2026 RULES (structured for AI citation): 
- Title: the exact question your audience would type into an AI search engine 
- First 100 words: complete answer to the title question — AI systems extract this paragraph 
- Structure: H1 title → intro (complete answer) → H2 sections (2–3) → FAQ section (5 Q&A) 
- FAQ structure: each answer must be complete in 2–3 sentences — no "see above" 
references 
- Include specific numbers, dates, and named examples throughout 
- Schema hint: write FAQ answers as if JSON-LD FAQPage will wrap them 
- Length: 800–1200 words 
- End with: "Last updated: [date]" for freshness signal`, 
}; 
 
// Extract verbatim hook from strategy brief or synthesis brief 
function extractVerbatimHook(stratBrief, synthBrief) { 
  const combined = `${stratBrief}\n${synthBrief}`; 
 
  // Try to find explicit [HOOK] markers 
  const hookPatterns = [ 
    /\*\*VERBATIM HOOK:\*\*\s*(.+)/i, 
    /\[HOOK\]:\s*(.+)/i, 
    /verbatim hook[:\s]+(.+)/i, 
  ]; 
 
  for (const pattern of hookPatterns) { 
    const match = combined.match(pattern); 
    if (match?.[1]?.trim()) return match[1].trim(); 
  } 
 
  // Fallback: find first quoted string 
  const quoted = combined.match(/"([^"]{20,120})"/); 
  if (quoted?.[1]) return quoted[1]; 
 
  return null; 
} 
 
async function generatePlatformContent(platform, context) { 
  const { product, desire, voice, stratBrief, synthBrief, verbatimHook, week } = context; 
 
  const rules = PLATFORM_RULES[platform.id] ?? `Write appropriate content for 
${platform.id}.`; 
 
  const hookInstruction = verbatimHook 
    ? `VERBATIM HOOK (from real audience language — start with this, adapted 
minimally):\n"${verbatimHook}"` 
    : `No verbatim hook available. Use the most emotionally resonant phrase from the desire 
section below as your opening.`; 
 
  const prompt = `You are writing ${platform.id} content for a solo founder. Week: ${week} 
 
PRODUCT: ${product.name} — ${product.tagline} 
 
THE DESIRE YOU ARE CHANNELING: 
They secretly want: ${desire.what_they_secretly_want} 
They fear most: ${desire.what_they_fear_most} 
They are frustrated by: ${desire.what_they_are_frustrated_by} 
Who they want to become: ${desire.who_they_want_to_become} 
 
THIS WEEK'S STRATEGY (follow the agreed angle and hero format): 
${stratBrief.slice(0, 600)} 
 
${hookInstruction} 
 
${rules} 
 
VOICE: ${voice.sounds_like ?? 'direct, plain language, no buzzwords, first person'} 
NEVER SAY: ${(voice.never_say ?? []).join(', ')} 
 
Write the content now. 
${verbatimHook ? 'Start with the verbatim hook above, adapted minimally.' : ''} 
Output ONLY the ${platform.id} content. No preamble. No commentary. No "here is your 
post:".`; 
 
  return callModel([{ role: 'user', content: prompt }], platform.model, platform.maxTokens, 
0.8); 
} 
 
async function main() { 
  console.log('[content-factory] Starting parallel content generation...'); 
 
  const dna         = readJSON('config/product-dna.json'); 
  const campaignDir = getCampaignFolder(); 
  const intelDir    = getIntelFolder(); 
 
  if (!dna) { 
    console.error('[content-factory] product-dna.json missing — aborting'); 
    process.exit(1); 
  } 
 
  const stratBrief = readText(`${campaignDir}/strategy-brief.md`); 
  const synthBrief = readText(`${intelDir}/synthesis-brief.md`); 
 
  const product = dna.products[dna.active_product]; 
  const desire  = product.the_desire; 
  const voice   = dna.brand_voice; 
 
  const verbatimHook = extractVerbatimHook(stratBrief, synthBrief); 
  if (verbatimHook) { 
    console.log(`[content-factory] Verbatim hook: "${verbatimHook.slice(0, 60)}..."`); 
  } else { 
    console.log('[content-factory] No verbatim hook found — using desire section as fallback'); 
  } 
 
  ensureDir(`${campaignDir}/text`); 
 
  const context = { product, desire, voice, stratBrief, synthBrief, verbatimHook, week: 
getCurrentWeek() }; 
 
  // ── Generate all platforms in parallel 
───────────────────────────────────── 
  console.log(`[content-factory] Generating ${PLATFORMS.length} platform files in 
parallel...`); 
 
  const results = await Promise.all( 
    PLATFORMS.map(async platform => { 
      console.log(`[content-factory] Starting: ${platform.id}`); 
      try { 
        const content   = await generatePlatformContent(platform, context); 
        const prefix    = platform.humanRequired ? `> **${platform.humanFlag}**\n\n---\n\n` : ''; 
        const final     = `${prefix}${content.trim()}`; 
        const filePath  = `${campaignDir}/text/${platform.file}`; 
        writeText(filePath, final); 
        console.log(`[content-factory] Completed: ${platform.id}`); 
        return { id: platform.id, success: true, words: content.split(/\s+/).length }; 
      } catch (err) { 
        console.error(`[content-factory] Failed: ${platform.id} — ${err.message}`); 
        return { id: platform.id, success: false, error: err.message }; 
      } 
    }) 
  ); 
 
  // ── Write schedule 
─────────────────────────────────────────────────────────
─ 
  const succeeded = results.filter(r => r.success); 
  const failed    = results.filter(r => !r.success); 
 
  const schedule = [ 
    `# Campaign Schedule — ${getCurrentWeek()}`, 
    `_Generated: ${getTodayString()}_`, 
    '', 
    '## Platforms Generated', 
    ...results.map(r => `- [${r.success ? 'x' : ' '}] ${r.id}${r.success ? ` (${r.words} words)` : ` — 
FAILED: ${r.error}`}`), 
    '', 
    '## Requires Human Action (AMAE writes, you act)', 
    '- [ ] `reddit-post.md` — read, then post manually to the subreddit', 
    '- [ ] `quora-answer.md` — read, then post manually to the Quora question', 
    '- [ ] `newsletter.md` — review in Beehiiv dashboard, then send manually', 
    '', 
    '## Auto-Posts on PR Merge', 
    '- LinkedIn (when dist-linkedin.js connected)', 
    '- Twitter/X (when dist-twitter-x.js connected)', 
    '', 
    '## PR Review Checklist', 
    '- [ ] LinkedIn post sounds like a human, not a marketer', 
    '- [ ] Twitter hook makes you want to read tweet 2', 
    '- [ ] Reddit post contains zero self-promotion in first 3 paragraphs', 
    '- [ ] Check guardrail-log.md for any rewrites', 
    '- [ ] Check funnel-map.json — TOFU should be 40%+ of pieces', 
    '', 
    `## Stats`, 
    `| Metric | Value |`, 
    `| --- | --- |`, 
    `| Platforms generated | ${succeeded.length}/${PLATFORMS.length} |`, 
    `| Failed | ${failed.length} |`, 
    `| Verbatim hook used | ${verbatimHook ? 'Yes' : 'No (fallback)'} |`, 
  ].join('\n'); 
 
  writeText(`${campaignDir}/schedule.md`, schedule); 
 
  console.log(`[content-factory] Complete. ${succeeded.length}/${PLATFORMS.length} 
platforms generated.`); 
  if (failed.length > 0) { 
    console.log(`[content-factory] Failed: ${failed.map(f => f.id).join(', ')}`); 
  } 
} 
 
main();