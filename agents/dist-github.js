// === FILE: agents/dist-github.js === 
// Job: Deploy AEO blog to GitHub Pages + update Discussions if configured 
// Reads: campaigns/[WEEK]/text/aeo-article-cluster.md 
// Calls: lib/blog-deployer.js 
// Called by: agents/distributor.js on PR merge 
 
import { execSync } from 'child_process'; 
import { readText, writeFile } from '../lib/file-utils.js'; 
import { getCurrentWeek }       from '../lib/week-utils.js'; 
 
async function main() { 
  console.log('[dist-github.js] Deploying blog content to docs/...'); 
 
  try { 
    // blog-deployer.js handles the docs/ copy 
    execSync('node lib/blog-deployer.js', { stdio: 'inherit' }); 
    console.log('[dist-github.js] Blog content deployed to docs/blog/'); 
  } catch (err) { 
    console.error('[dist-github.js] Blog deploy failed:', err.message); 
    process.exit(1); 
  } 
} 
 
main();