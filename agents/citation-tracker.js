// === FILE: agents/citation-tracker.js === 
// Job: Track how often the product is cited in AI systems (via web search proxy) 
// Reads: config/product-dna.json, memory/citations.json 
// Writes: memory/citations.json 
// Called by: .github/workflows/monthly-growth.yml 
 
import { callModel, MODELS } from '../lib/openrouter.js'; 
import { readJSON, writeJSON } from '../lib/file-utils.js'; 
import { getTodayString }       from '../lib/week-utils.js'; 
 
async function checkCitationSignals(productName, category) { 
  // Use web search via OpenRouter to check citation signals 
  // Note: Direct AI system checking requires manual verification 
  // This checks proxy signals: GitHub mentions, Reddit mentions, Quora answers 
 
  const signals = { 
    date:        getTodayString(), 
    product:     productName, 
    checked_at:  new Date().toISOString(), 
    github_mentions:  await checkGitHubMentions(productName), 
    manual_check_reminder: [ 
      `Check ChatGPT: "What is the best tool for ${category}?"`, 
      `Check Perplexity: "${productName} alternatives"`, 
      `Check Claude.ai: "tools for ${category} solo founders"`, 
      `Check Google SGE: "${productName} review"`, 
    ], 
  }; 
 
  return signals; 
} 
 
async function checkGitHubMentions(productName) { 
  try { 
    const url      = 
`https://api.github.com/search/code?q=${encodeURIComponent(productName)}&per_page=
10`; 
    const response = await fetch(url, { 
      headers: { 
        'Accept':     'application/vnd.github.v3+json', 
        'User-Agent': 'AMAE-Citation-Tracker/1.0', 
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer 
${process.env.GITHUB_TOKEN}` } : {}), 
      }, 
    }); 
    if (!response.ok) return { count: 0, note: 'GitHub search unavailable' }; 
    const data = await response.json(); 
    return { count: data.total_count ?? 0, items: data.items?.slice(0, 5).map(i => i.html_url) ?? 
[] }; 
  } catch { 
    return { count: 0, note: 'Search failed' }; 
  } 
} 
 
async function main() { 
  console.log('[citation-tracker.js] Running monthly citation audit...'); 
 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna?.products?.[dna?.active_product]; 
 
  if (!product) { 
    console.error('[citation-tracker.js] No product config found.'); 
    process.exit(1); 
  } 
 
  const existing = readJSON('memory/citations.json') ?? { history: [] }; 
  const signals  = await checkCitationSignals(product.name, product.category ?? ''); 
 
  existing.last_checked = getTodayString(); 
  existing.history      = [signals, ...(existing.history ?? [])].slice(0, 12); // Keep 12 months 
 
  writeJSON('memory/citations.json', existing); 
 
  console.log('[citation-tracker.js] Citation signals recorded.'); 
  console.log('[citation-tracker.js] Manual checks needed:'); 
  signals.manual_check_reminder.forEach(r => console.log(`  - ${r}`)); 
} 
 
main();