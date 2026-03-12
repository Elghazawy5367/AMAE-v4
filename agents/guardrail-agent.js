// === FILE: agents/guardrail-agent.js === 
// Job: Quality gate — removes AI-tell phrases, fixes platform rule violations, rewrites if 
needed 
// Reads: campaigns/[WEEK]/text/*.md, config/product-dna.json, config/platforms.json 
// Writes: campaigns/[WEEK]/text/*.md (in-place rewrites), 
campaigns/[WEEK]/guardrail-log.md 
// Called by: .github/workflows/weekly-campaign.yml (after content-factory) 
 
import { callModel, MODELS } from '../lib/openrouter.js'; 
import { readJSON, readText, writeText, listFiles } from '../lib/file-utils.js'; 
import { getCampaignFolder, getTodayString }        from '../lib/week-utils.js'; 
 
// Phrases that trigger a rewrite when found 
const AI_TELL_PHRASES = [ 
  // Common AI openers 
  'dive into', 'delve', 'let\'s explore', 'in this post i will', 
  // Filler transitions 
  'it is worth noting', 'it\'s important to note', 'furthermore', 'moreover', 
  'additionally', 'in conclusion', 'to summarize', 'to recap', 
  // AI-sounding openers 
  'certainly', 'absolutely', 'of course', 'great question', 
  // Marketing buzzwords that AMAE never says 
  'game-changing', 'revolutionary', 'groundbreaking', 'cutting-edge', 
  'transformative', 'paradigm shift', 'disruptive', 'innovative solution', 
  'unlock', 'leverage', 'synergy', 'seamlessly', 'robust', 'empower', 
  'holistic', 'scalable solution', 'next-level', 
  // AI meta-commentary 
  'as an ai', 'i cannot', 'i\'m an ai', 'as a language model', 
]; 
 
// Platform-specific rule violations 
const PLATFORM_RULES = { 
  'linkedin-post.md': [ 
    { 
      name:    'linkedin_no_links', 
      test:    (text) => /https?:\/\//i.test(text), 
      fix:     'Remove ALL URLs from this LinkedIn post. LinkedIn penalizes reach by 68% 
when links appear. Remove the URL completely — do not replace it with "link in bio".', 
    }, 
    { 
      name:    'linkedin_no_i_opener', 
      test:    (text) => /^I /m.test(text.trimStart()), 
      fix:     'The post opens with "I". Restructure the opening sentence so it does not start with 
"I". The hook should be the claim or the number, not the author.', 
    }, 
  ], 
  'twitter-thread.md': [ 
    { 
      name:    'twitter_link_in_first_tweet', 
      test:    (text) => { 
        const firstTweet = text.split(/Tweet [2-9]|^\d\/\n/m)[0]; 
        return /https?:\/\//i.test(firstTweet); 
      }, 
      fix:     'There is a URL in the first tweet of this thread. Move it to the last tweet only. The 
first tweet must have no links to maximize reach.', 
    }, 
  ], 
}; 
 
const MAX_REWRITES = 2; // Never loop more than twice per file 
 
async function rewriteFile(content, issues, filePath) { 
  const issueList = issues.map(i => `- ${i.name}: ${i.fix}`).join('\n'); 
 
  const prompt = `You are a quality editor for marketing content. 
 
ISSUES TO FIX: 
${issueList} 
 
CONTENT TO FIX: 
${content.slice(0, 3000)} 
 
INSTRUCTIONS: 
1. Fix ONLY the flagged issues. Do not rewrite anything else. 
2. If the issue is an AI-tell phrase: rewrite that sentence in plain human language that 
preserves the meaning. 
3. If the issue is a LinkedIn URL: remove it completely. 
4. If the issue is a "I" opener: restructure that sentence only. 
5. Do not add commentary, explanation, or preamble. 
6. Output ONLY the corrected content.`; 
 
  return callModel([{ role: 'user', content: prompt }], MODELS.CLASSIFIER, 2000, 0.3); 
} 
 
async function main() { 
  console.log('[guardrail-agent] Starting quality gate...'); 
 
  const campaignDir = getCampaignFolder(); 
  const dna         = readJSON('config/product-dna.json'); 
  const neverSay    = dna?.brand_voice?.never_say ?? []; 
 
  // Combine built-in AI tells with product-specific never_say words 
  const allBanned = [ 
    ...AI_TELL_PHRASES, 
    ...neverSay.map(w => w.toLowerCase()), 
  ]; 
 
  const files  = listFiles(`${campaignDir}/text`, '.md'); 
  const log    = [`# Guardrail Log — ${getTodayString()}`, '']; 
  let totalRewrites = 0; 
  let totalPassed   = 0; 
 
  for (const filename of files) { 
    const filePath = `${campaignDir}/text/${filename}`; 
    let content    = readText(filePath); 
    const lower    = content.toLowerCase(); 
    const issues   = []; 
 
    // Check AI tells 
    for (const phrase of allBanned) { 
      if (lower.includes(phrase.toLowerCase())) { 
        issues.push({ 
          name: `ai_tell`, 
          fix:  `Remove the phrase "${phrase}" and rewrite that sentence in plain human 
language.`, 
          phrase, 
        }); 
      } 
    } 
 
    // Check platform-specific rules 
    const platformRules = PLATFORM_RULES[filename] ?? []; 
    for (const rule of platformRules) { 
      if (rule.test(content)) { 
        issues.push({ name: rule.name, fix: rule.fix }); 
      } 
    } 
 
    if (issues.length === 0) { 
      log.push(`**PASS** ${filename} — no issues found`); 
      totalPassed++; 
      continue; 
    } 
 
    const issueNames = issues.map(i => i.phrase ? `"${i.phrase}"` : i.name).join(', '); 
    log.push(`**REWRITE** ${filename} — issues: ${issueNames}`); 
 
    // Attempt rewrites (max 2 passes) 
    let currentContent = content; 
    for (let pass = 1; pass <= MAX_REWRITES; pass++) { 
      console.log(`[guardrail-agent] Rewriting ${filename} (pass 
${pass}/${MAX_REWRITES})...`); 
      try { 
        const fixed = await rewriteFile(currentContent, issues, filePath); 
 
        // Verify the fix actually worked 
        const fixedLower  = fixed.toLowerCase(); 
        const stillBroken = allBanned.filter(p => fixedLower.includes(p)); 
 
        if (stillBroken.length === 0 && platformRules.every(r => !r.test(fixed))) { 
          currentContent = fixed; 
          log.push(`  Pass ${pass}: FIXED`); 
          break; 
        } else { 
          currentContent = fixed; 
          log.push(`  Pass ${pass}: Partial fix — still has: ${stillBroken.slice(0, 3).join(', ')}`); 
          if (pass === MAX_REWRITES) { 
            log.push(`  After ${MAX_REWRITES} passes: Flagged for human review`); 
          } 
        } 
      } catch (err) { 
        log.push(`  Pass ${pass}: Rewrite failed — ${err.message}`); 
        break; 
      } 
    } 
 
    writeText(filePath, currentContent); 
    totalRewrites++; 
  } 
 
  log.push(''); 
  log.push('---'); 
  log.push('## Summary'); 
  log.push(`| Metric | Value |`); 
  log.push(`| --- | --- |`); 
  log.push(`| Files checked | ${files.length} |`); 
  log.push(`| Passed (no issues) | ${totalPassed} |`); 
  log.push(`| Rewrites applied | ${totalRewrites} |`); 
 
  writeText(`${campaignDir}/guardrail-log.md`, log.join('\n')); 
  console.log(`[guardrail-agent] Done. ${totalPassed} passed, ${totalRewrites} rewritten.`); 
} 
 
main();