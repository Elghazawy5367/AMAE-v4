// === FILE: lib/blog-deployer.js === 
// Job: Copy latest AEO articles from campaigns/ to docs/blog/ for GitHub Pages deploy 
// Reads: campaigns/*/text/aeo-article-cluster.md 
// Writes: docs/blog/[slug].html (converted from markdown) 
// Called by: .github/workflows/deploy-blog.yml 
 
import fs from 'fs'; 
import path from 'path'; 
import { ensureDir, readText } from './file-utils.js'; 
import { getCurrentWeek } from './week-utils.js'; 
 
function markdownToHtml(markdown, meta = {}) { 
  // Minimal markdown → HTML conversion for blog posts 
  let html = markdown 
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>') 
    .replace(/^## (.+)$/gm,  '<h2>$2</h2>') 
    .replace(/^### (.+)$/gm, '<h3>$1</h3>') 
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') 
    .replace(/\*(.+?)\*/g,     '<em>$1</em>') 
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>') 
    .replace(/\n\n/g, '</p><p>') 
    .replace(/^([^<].+)$/gm, '<p>$1</p>'); 
 
  return `<!DOCTYPE html> 
<html lang="en"> 
<head> 
  <meta charset="UTF-8"> 
  <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
  <title>${meta.title ?? 'AMAE Blog'}</title> 
  <meta name="description" content="${meta.description ?? ''}"> 
  <link rel="stylesheet" href="/css/blog.css"> 
  <!-- AEO: FAQ schema injected by aeo-optimizer.js after generation --> 
</head> 
<body> 
  <header><a href="/">← Home</a></header> 
  <main> 
    <article> 
      ${html} 
    </article> 
  </main> 
  <footer><p>© ${new Date().getFullYear()} — Powered by AMAE</p></footer> 
</body> 
</html>`; 
} 
 
function extractMeta(markdown) { 
  const titleMatch = markdown.match(/^# (.+)$/m); 
  const descMatch  = markdown.match(/^> (.+)$/m); 
  return { 
    title:       titleMatch?.[1] ?? 'AMAE Blog Post', 
    description: descMatch?.[1]  ?? '', 
  }; 
} 
 
function slugify(title) { 
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); 
} 
 
async function main() { 
  console.log('[blog-deployer.js] Scanning for AEO articles to deploy...'); 
 
  const campaignsDir = path.join(process.cwd(), 'campaigns'); 
  const blogDir      = path.join(process.cwd(), 'docs', 'blog'); 
  ensureDir(blogDir); 
 
  if (!fs.existsSync(campaignsDir)) { 
    console.log('[blog-deployer.js] No campaigns/ directory yet. Skipping.'); 
    return; 
  } 
 
  const weeks = fs.readdirSync(campaignsDir) 
    .filter(d => fs.statSync(path.join(campaignsDir, d)).isDirectory()) 
    .sort() 
    .reverse(); 
 
  let deployed = 0; 
 
  for (const week of weeks.slice(0, 8)) { // Last 8 weeks of blog content 
    const articlePath = path.join(campaignsDir, week, 'text', 'aeo-article-cluster.md'); 
    if (!fs.existsSync(articlePath)) continue; 
 
    const markdown = fs.readFileSync(articlePath, 'utf8'); 
    const articles = markdown.split(/^---+$/m).filter(a => a.trim().length > 200); 
 
    for (let i = 0; i < articles.length; i++) { 
      const article = articles[i].trim(); 
      const meta    = extractMeta(article); 
      const slug    = slugify(meta.title); 
      const htmlPath = path.join(blogDir, `${slug}.html`); 
 
      // Skip if already deployed 
      if (fs.existsSync(htmlPath)) continue; 
 
      const html = markdownToHtml(article, meta); 
      fs.writeFileSync(htmlPath, html); 
      console.log(`[blog-deployer.js] Deployed: ${slug}.html`); 
      deployed++; 
    } 
  } 
 
  // Update blog index 
  const allPosts = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html'); 
  const indexHtml = `<!DOCTYPE html> 
<html lang="en"> 
<head> 
  <meta charset="UTF-8"> 
  <title>AMAE Blog — Marketing Intelligence</title> 
  <link rel="stylesheet" href="/css/blog.css"> 
</head> 
<body> 
  <main> 
    <h1>AMAE Marketing Intelligence</h1> 
    <ul> 
      ${allPosts.map(f => `<li><a href="/blog/${f}">${f.replace('.html', '').replace(/-/g, ' 
')}</a></li>`).join('\n      ')} 
    </ul> 
  </main> 
</body> 
</html>`; 
 
  fs.writeFileSync(path.join(blogDir, 'index.html'), indexHtml); 
  console.log(`[blog-deployer.js] Done. ${deployed} new articles deployed. Blog index 
updated.`); 
} 
 
main();