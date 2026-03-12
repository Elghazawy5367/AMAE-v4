// === FILE: agents/marketplace-agent.js === 
// Job: Generate/refresh marketplace listings for PH, G2, Capterra, AppSumo, IH 
// Reads: config/product-dna.json, config/marketplace-profiles.json 
// Writes: campaigns/[WEEK]/marketplace/ OR analytics/marketplace-stats.json 
// Called by: .github/workflows/weekly-campaign.yml and marketplace-refresh.yml 
 
import { callModel, MODELS }            from '../lib/openrouter.js'; 
import { readJSON, readText, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getCurrentWeek }               from '../lib/week-utils.js'; 
 
async function main() { 
  const mode = process.argv.includes('--mode=refresh') ? 'refresh' : 'weekly'; 
  console.log(`[marketplace-agent.js] Running in ${mode} mode...`); 
 
  const week      = getCurrentWeek(); 
  const outputDir = mode === 'weekly' ? `campaigns/${week}/marketplace` : 
'campaigns/marketplace-refresh'; 
  ensureDir(outputDir); 
 
  const dna        = readJSON('config/product-dna.json'); 
  const product    = dna.products[dna.active_product]; 
  const profiles   = readJSON('config/marketplace-profiles.json') ?? {}; 
  const listPrompt = readText('.github/prompts/marketplace-listing.prompt.md') ?? ''; 
 
  const prompt = listPrompt 
    .replace('[product.name]',       product.name) 
    .replace('[product.tagline]',    product.tagline ?? '') 
    .replace('[solution.proof_point]', product.solution?.proof_point ?? '') 
    .replace('[solution.unique_angle]', product.solution?.unique_angle ?? '') 
    .replace(JSON.stringify('[pricing]'), JSON.stringify(product.pricing ?? {})) 
    .replace('[icp.primary]',        product.icp?.primary ?? ''); 
 
  console.log('[marketplace-agent.js] Generating marketplace listings...'); 
  const response = await callModel([{ role: 'user', content: prompt }], MODELS.REASONING, 
3000, 0.6); 
 
  writeFile(`${outputDir}/all-listings.md`, `# Marketplace Listings — ${week}\n\n${response}`); 
 
  // Parse sections if possible 
  const phMatch = response.match(/PRODUCT 
HUNT[\s\S]*?(?=G2|CAPTERRA|INDIE|$)/i)?.[0]; 
  const g2Match = response.match(/G2 \/ CAPTERRA[\s\S]*?(?=INDIE|$)/i)?.[0]; 
  const ihMatch = response.match(/INDIE HACKERS[\s\S]*$/i)?.[0]; 
 
  if (phMatch) writeFile(`${outputDir}/producthunt-listing.md`, phMatch.trim()); 
  if (g2Match) writeFile(`${outputDir}/g2-capterra-listing.md`, g2Match.trim()); 
  if (ihMatch) writeFile(`${outputDir}/indiehackers-post.md`, ihMatch.trim()); 
 
  console.log('[marketplace-agent.js] Done. Marketplace listings written.'); 
} 
 
main();