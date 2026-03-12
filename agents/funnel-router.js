// === FILE: agents/funnel-router.js === 
// Job: Tag each generated content piece with TOFU/MOFU/BOFU and check distribution 
balance 
// Reads: campaigns/[WEEK]/text/*.md, config/posting-schedule.json 
// Writes: campaigns/[WEEK]/funnel-map.json 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { readJSON, writeJSON, listFiles, readText } from '../lib/file-utils.js'; 
import { getCampaignFolder, getTodayString }        from '../lib/week-utils.js'; 
 
// Platform-to-funnel mappings based on 2026 platform behavior 
const PLATFORM_FUNNEL_MAP = { 
  'linkedin-post.md':       { stage: 'MOFU', goal: 'credibility_and_depth',    humanRequired: 
false }, 
  'twitter-thread.md':      { stage: 'TOFU', goal: 'awareness_and_reach',      humanRequired: 
false }, 
  'tiktok-script.md':       { stage: 'TOFU', goal: 'awareness_and_discovery',  humanRequired: 
false }, 
  'instagram-reel.md':      { stage: 'TOFU', goal: 'awareness_and_discovery',  
humanRequired: false }, 
  'youtube-short.md':       { stage: 'TOFU', goal: 'discovery_and_retention',  humanRequired: 
false }, 
  'youtube-long.md':        { stage: 'MOFU', goal: 'authority_and_depth',      humanRequired: 
false }, 
  'reddit-post.md':         { stage: 'TOFU', goal: 'community_trust',          humanRequired: true  
}, 
  'quora-answer.md':        { stage: 'MOFU', goal: 'aeo_and_authority',        humanRequired: 
true  }, 
  'newsletter.md':          { stage: 'MOFU', goal: 'nurture_and_conversion',   humanRequired: 
true  }, 
  'aeo-article.md':         { stage: 'MOFU', goal: 'search_and_ai_citation',   humanRequired: 
false }, 
  'email-sequence.md':      { stage: 'BOFU', goal: 'conversion',               humanRequired: false 
}, 
  'pinterest-pins.md':      { stage: 'TOFU', goal: 'evergreen_discovery',      humanRequired: 
false }, 
  'threads-posts.md':       { stage: 'TOFU', goal: 'awareness',                humanRequired: false 
}, 
  'community-seeds.md':     { stage: 'TOFU', goal: 'dark_social_seeding',      humanRequired: 
true  }, 
}; 
 
async function main() { 
  console.log('[funnel-router] Tagging campaign content...'); 
 
  const campaignDir  = getCampaignFolder(); 
  const schedule     = readJSON('config/posting-schedule.json') ?? {}; 
  const targets      = schedule.funnel_targets ?? { TOFU_minimum_pct: 40, 
MOFU_target_pct: 35 }; 
 
  const files    = listFiles(`${campaignDir}/text`, '.md'); 
  const funnelMap = { 
    generated:    getTodayString(), 
    campaign_dir: campaignDir, 
    pieces:       [], 
    distribution: { TOFU: 0, MOFU: 0, BOFU: 0 }, 
    warnings:     [], 
    human_required: [], 
  }; 
 
  for (const filename of files) { 
    const rule       = PLATFORM_FUNNEL_MAP[filename] ?? { stage: 'TOFU', goal: 
'awareness', humanRequired: false }; 
    const wordCount  = readText(`${campaignDir}/text/${filename}`).trim().split(/\s+/).length; 
 
    funnelMap.pieces.push({ 
      file:          filename, 
      stage:         rule.stage, 
      goal:          rule.goal, 
      word_count:    wordCount, 
      human_required: rule.humanRequired, 
    }); 
 
    funnelMap.distribution[rule.stage]++; 
 
    if (rule.humanRequired) { 
      funnelMap.human_required.push(filename); 
    } 
  } 
 
  // Check funnel balance 
  const total = funnelMap.pieces.length; 
  if (total > 0) { 
    const tofuPct = (funnelMap.distribution.TOFU / total) * 100; 
    const bofuCount = funnelMap.distribution.BOFU; 
    const tofuCount = funnelMap.distribution.TOFU; 
 
    if (tofuPct < targets.TOFU_minimum_pct) { 
      funnelMap.warnings.push(`TOFU only ${Math.round(tofuPct)}% — below 
${targets.TOFU_minimum_pct}% minimum. Organic growth will stall.`); 
    } 
    if (bofuCount > tofuCount) { 
      funnelMap.warnings.push('More BOFU than TOFU content — flip the ratio. You cannot 
convert an audience you have not built.'); 
    } 
    if (funnelMap.distribution.MOFU === 0) { 
      funnelMap.warnings.push('No MOFU content this week — add at least one credibility 
piece (LinkedIn depth post, Quora answer, or AEO article).'); 
    } 
  } 
 
  writeJSON(`${campaignDir}/funnel-map.json`, funnelMap); 
  console.log(`[funnel-router] Done. TOFU:${funnelMap.distribution.TOFU} 
MOFU:${funnelMap.distribution.MOFU} BOFU:${funnelMap.distribution.BOFU}. Warnings: 
${funnelMap.warnings.length}`); 
 
  if (funnelMap.warnings.length > 0) { 
    console.log('[funnel-router] Funnel warnings:'); 
    funnelMap.warnings.forEach(w => console.log(`  - ${w}`)); 
  } 
} 
 
main();