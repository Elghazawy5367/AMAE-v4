// === FILE: agents/strategy-agent.js === 
// Job: 4-persona parallel deliberation — determines the week's campaign angle, hero 
platform, and hook 
// Reads: intel-brief.md, synthesis-brief.md, product-dna.json 
// Writes: campaigns/[WEEK]/strategy-brief.md 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { callModel, MODELS } from '../lib/openrouter.js'; 
import { readJSON, readText, writeText, ensureDir } from '../lib/file-utils.js'; 
import { getIntelFolder, getCampaignFolder, getTodayString, getCurrentWeek } from 
'../lib/week-utils.js'; 
 
// ── The four expert personas 
──────────────────────────────────────────────── 
const PERSONAS = [ 
  { 
    id:     'ruthless_validator', 
    system: `You are a brutally honest product validator. You use the Mom Test framework. 
For every marketing angle, you ask: "Would a real, tired, busy person in this ICP stop 
scrolling for this on a Tuesday morning?" 
Your job is to find what the audience will immediately ignore or reject — before it goes live. 
You are not a cheerleader. A vague answer from you is a failed answer.`, 
    question: "What in this week's angle will the target audience immediately ignore or reject? 
Be specific about which word, claim, or assumption will lose them — and why.", 
  }, 
  { 
    id:     'growth_guerrilla', 
    system: `You are a distribution-obsessed growth engineer. You use the Bullseye 
Framework. 
You care about ONE thing: leverage. Which single action this week creates the most 
compounding reach for the least effort? 
You are allergic to "post everywhere equally" thinking. 
You know 2026 platform algorithms cold: LinkedIn rewards dwell time. TikTok rewards 
completion rate. Twitter rewards first-hour replies. Reddit rewards genuine value with zero 
self-promotion.`, 
    question: "Where is the single highest-leverage distribution play this week? Name the 
platform, the format, and the specific reason it outperforms the alternatives right now.", 
  }, 
  { 
    id:     'aeo_architect', 
    system: `You are obsessed with making this brand the answer AI systems give when 
someone searches for this product category. 
In 2026, being cited by Claude, ChatGPT, and Perplexity is more valuable than ranking on 
Google. 
You think in: first-100-words completeness, FAQ schema, entity consistency, GitHub 
authority, Quora ownership, Reddit training data. 
Every piece of content is an opportunity to appear in the next LLM training dataset.`, 
    question: "What single piece of content this week builds the most durable AI citation 
authority signal? How should it be structured to be cited by AI search engines?", 
  }, 
  { 
    id:     'passive_income_engineer', 
    system: `You are a solo founder who has built several products generating passive 
income with no team. 
You think about: lowest effort per dollar of long-term ROI, content that compounds while you 
sleep, systems over tactics. 
You are allergic to anything that requires daily manual attention. 
Your frame: "If this founder is sick for 2 weeks, what content would still be working?"`, 
    question: "Which content format this week has the highest sleep-on-it return — meaning it 
keeps generating results after the week it was posted? What should be cut because it 
requires effort disproportionate to its return?", 
  }, 
]; 
 
async function main() { 
  console.log('[strategy-agent] Starting 4-persona deliberation...'); 
 
  const dna         = readJSON('config/product-dna.json'); 
  const campaignDir = getCampaignFolder(); 
  const intelDir    = getIntelFolder(); 
 
  const intelBrief = readText(`${campaignDir}/intel-brief.md`); 
  const synthBrief = readText(`${intelDir}/synthesis-brief.md`); 
 
  if (!dna) { 
    console.error('[strategy-agent] product-dna.json missing — aborting'); 
    process.exit(1); 
  } 
 
  ensureDir(campaignDir); 
 
  const product = dna.products[dna.active_product]; 
  const context = [ 
    `PRODUCT: ${product.name} — ${product.tagline}`, 
    `AUDIENCE: ${product.icp?.primary}`, 
    `THEY WANT: ${product.the_desire?.what_they_secretly_want}`, 
    `THEY FEAR: ${product.the_desire?.what_they_fear_most}`, 
    '', 
    'THIS WEEK\'S INTEL:', 
    (intelBrief || synthBrief || 'No intel available. Use product-dna.json the_desire 
section.').slice(0, 2500), 
  ].join('\n'); 
 
  // ── Run all 4 personas in parallel 
───────────────────────────────────────── 
  console.log('[strategy-agent] Running 4 personas in parallel (Promise.all)...'); 
 
  const personaResults = await Promise.all( 
    PERSONAS.map(async persona => { 
      console.log(`[strategy-agent] Calling: ${persona.id}`); 
      try { 
        const response = await callModel( 
          [ 
            { role: 'system', content: persona.system }, 
            { role: 'user',   content: `${context}\n\nYour question: ${persona.question}\n\nAnswer 
in 150 words max. Be specific. No generic advice.` }, 
          ], 
          MODELS.FAST, 
          600, 
          0.7 
        ); 
        return { id: persona.id, response: response.trim(), success: true }; 
      } catch (err) { 
        console.error(`[strategy-agent] Persona ${persona.id} failed:`, err.message); 
        return { id: persona.id, response: 'Failed to respond.', success: false }; 
      } 
    }) 
  ); 
 
  const successfulPersonas = personaResults.filter(r => r.success); 
  console.log(`[strategy-agent] ${successfulPersonas.length}/4 personas completed. Running 
synthesis...`); 
 
  // ── Synthesis: Ruthless Judge pass 
───────────────────────────────────────── 
  const allOpinions = personaResults 
    .map(r => `### ${r.id.replace(/_/g, ' ').toUpperCase()}\n${r.response}`) 
    .join('\n\n'); 
 
  const synthPrompt = `Four expert personas evaluated this week's marketing strategy. 
 
${allOpinions} 
 
PRODUCT CONTEXT: 
${context.slice(0, 800)} 
 
Your job — Ruthless Judge Pass: 
1. Find where 2 or more personas AGREE — that is the high-confidence action. 
2. Resolve conflicts by picking the most evidence-backed position. 
3. Output a unified strategy brief in this exact format: 
 
**AGREED ANGLE:** (one sentence — the core message this week) 
**HERO PLATFORM:** (one platform — where to put the most energy) 
**HERO FORMAT:** (the specific content format for that platform) 
**VERBATIM HOOK:** (the exact opening line — use real audience language from the intel 
brief) 
**OBJECTION TO PREEMPT:** (one sentence — what the skeptic will say) 
**CUT THIS WEEK:** (one thing to deprioritize — lowest effort:return ratio) 
**FUNNEL PRIORITY:** (TOFU / MOFU / BOFU — one word + one sentence why) 
**CONFIDENCE:** (high / medium / low — how aligned were the personas?) 
 
Under 250 words. Specific, not generic.`; 
 
  const synthesis = await callModel( 
    [{ role: 'user', content: synthPrompt }], 
    MODELS.REASONING, 
    1200, 
    0.4 
  ); 
 
  // ── Write output 
─────────────────────────────────────────────────────────
─── 
  const output = [ 
    `# Strategy Brief — ${getCurrentWeek()}`, 
    `_Generated: ${getTodayString()}_`, 
    `_Personas: ${successfulPersonas.length}/4 completed_`, 
    '', 
    '## UNIFIED STRATEGY', 
    synthesis, 
    '', 
    '---', 
    '', 
    '## RAW PERSONA OUTPUTS', 
    allOpinions, 
  ].join('\n'); 
 
  writeText(`${campaignDir}/strategy-brief.md`, output); 
  console.log('[strategy-agent] Done. strategy-brief.md written.'); 
} 
 
main();