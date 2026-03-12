// === FILE: agents/star-velocity-agent.js === 
// Job: Coordinate GitHub star velocity for trending push 
// Reads: memory/performance.json, config/product-dna.json 
// Writes: campaigns/[WEEK]/text/star-velocity-campaign.md 
// Called by: .github/workflows/monthly-growth.yml (or manually on launch) 
 
import { callModel, MODELS }                  from '../lib/openrouter.js'; 
import { readJSON, writeFile, ensureDir }      from '../lib/file-utils.js'; 
import { getCurrentWeek, getTodayString }      from '../lib/week-utils.js'; 
 
async function generateStarVelocityCampaign(product) { 
  const prompt = `Write a "GitHub star velocity" campaign for a solo founder's open-source 
project. 
 
Product: ${product.name} 
Tagline: ${product.tagline} 
ICP: ${product.icp?.primary ?? ''} 
 
The goal: get enough GitHub stars in 48 hours to appear on GitHub Trending in the relevant 
topic. 
This isn't about gaming — it's about reaching people who would genuinely find this useful. 
 
Generate: 
1. DEVELOPER COMMUNITY POSTS — for dev.to, HN, r/programming, Twitter/X dev 
community 
   (Frame as: "I built this, here's what it does, star it if useful") 
 
2. ICP COMMUNITY POSTS — for the target audience communities 
   (Frame as: useful tool announcement with GitHub link) 
 
3. EMAIL CTA — for newsletter 
   (One paragraph: what it is, GitHub link, "star if useful") 
 
4. TRENDING THRESHOLD GUIDE — for this product category, what star count/velocity to 
aim for 
 
Each piece: honest, specific, zero hype. "Star if useful" not "we need your support". 
 
Output ONLY the four sections. No preamble.`; 
 
  return callModel([{ role: 'user', content: prompt }], MODELS.FAST, 2000, 0.6); 
} 
 
async function main() { 
  console.log('[star-velocity-agent.js] Generating star velocity campaign...'); 
 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna?.products?.[dna?.active_product]; 
 
  if (!product) { 
    console.log('[star-velocity-agent.js] No product config. Skipping.'); 
    return; 
  } 
 
  const week    = getCurrentWeek(); 
  const content = await generateStarVelocityCampaign(product); 
 
  ensureDir(`campaigns/${week}/text`); 
  writeFile(`campaigns/${week}/text/star-velocity-campaign.md`, 
    `# GitHub Star Velocity Campaign — ${week}\nGenerated: 
${getTodayString()}\n\n${content}`); 
 
  console.log(`[star-velocity-agent.js] Campaign written to 
campaigns/${week}/text/star-velocity-campaign.md`); 
} 
 
main();