// === FILE: agents/awesome-list-agent.js === 
// Job: Find relevant awesome lists on GitHub + draft PRs to add product 
// Reads: config/product-dna.json 
// Writes: campaigns/awesome-list-prs/ (PR drafts for manual submission) 
// Called by: .github/workflows/monthly-growth.yml 
 
import { searchRepos, getFileContent } from '../lib/github-api.js'; 
import { callModel, MODELS }           from '../lib/openrouter.js'; 
import { readJSON, writeFile, ensureDir } from '../lib/file-utils.js'; 
import { getTodayString, getCurrentWeek } from '../lib/week-utils.js'; 
 
async function findRelevantAwesomeLists(category, keywords) { 
  const queries = [ 
    `awesome ${category} list`, 
    `awesome ${keywords[0]} resources`, 
    `awesome marketing tools`, 
  ]; 
 
  const lists = []; 
  for (const query of queries) { 
    try { 
      const repos = await searchRepos(query, 'stars', 10); 
      const filtered = repos.filter(r => 
        r.name.startsWith('awesome') && 
        r.stargazers_count > 200 && 
        !r.archived && 
        r.pushed_at > new Date(Date.now() - 365 * 24 * 3600000).toISOString() 
      ); 
      lists.push(...filtered); 
      await new Promise(r => setTimeout(r, 1000)); 
    } catch (err) { 
      console.log(`[awesome-list-agent.js] Search failed for "${query}": ${err.message}`); 
    } 
  } 
 
  // Deduplicate by full_name 
  return [...new Map(lists.map(r => [r.full_name, r])).values()].slice(0, 5); 
} 
 
async function draftPRContent(product, repo) { 
  const prompt = `Write a one-line entry to add to a GitHub awesome list for this product. 
 
Product: ${product.name} 
Tagline: ${product.tagline} 
Category: ${product.category} 
Repo URL: github.com/[your-username]/amae (placeholder) 
Awesome list repo: ${repo.full_name} 
Awesome list description: ${repo.description} 
 
Rules for awesome list entries: 
- Format: [Product Name](URL) — One sentence description 
- Description: what it does, not why it's good 
- Under 120 characters total 
- No hype words (revolutionary, amazing, powerful, best) 
- Specific: "Generates weekly marketing campaigns from Reddit audience data" 
 
Output ONLY the one-line entry. No preamble.`; 
 
  return callModel([{ role: 'user', content: prompt }], MODELS.FAST, 200, 0.5); 
} 
 
async function main() { 
  console.log('[awesome-list-agent.js] Finding relevant awesome lists...'); 
 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna?.products?.[dna?.active_product]; 
 
  if (!product) { 
    console.log('[awesome-list-agent.js] No product config. Skipping.'); 
    return; 
  } 
 
  const category = product.category ?? 'marketing'; 
  const keywords = product.icp?.vocabulary_they_use ?? ['marketing', 'saas']; 
 
  const lists = await findRelevantAwesomeLists(category, keywords); 
  console.log(`[awesome-list-agent.js] Found ${lists.length} relevant awesome lists`); 
 
  const outputDir = `campaigns/awesome-list-prs/${getCurrentWeek()}`; 
  ensureDir(outputDir); 
 
  for (const repo of lists) { 
    const entry = await draftPRContent(product, repo); 
 
    const draft = `# Awesome List PR Draft 
List: ${repo.full_name} (${repo.stargazers_count} ⭐) 
URL: https://github.com/${repo.full_name} 
 
## Entry to add: 
${entry.trim()} 
 
## How to submit: 
1. Fork the repo: https://github.com/${repo.full_name} 
2. Find the appropriate section for your product category 
3. Add the entry line above in alphabetical order 
4. Submit PR with title: "Add ${product.name}" 
5. PR description: brief explanation of what the product does 
 
## Notes: 
- Some awesome list maintainers are responsive, some aren't 
- Don't spam multiple lists at once — one per week 
- If your PR isn't merged in 2 weeks, move on 
`; 
 
    const filename = repo.full_name.replace('/', '-') + '.md'; 
    writeFile(`${outputDir}/${filename}`, draft); 
    console.log(`[awesome-list-agent.js] Draft created for: ${repo.full_name}`); 
  } 
 
  console.log(`[awesome-list-agent.js] Done. ${lists.length} PR drafts in ${outputDir}`); 
} 
 
main();