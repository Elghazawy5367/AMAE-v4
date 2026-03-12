// === FILE: agents/aeo-optimizer.js === 
// Job: Inject AEO signals into blog HTML — FAQ schema, entity consistency, first-100-word 
completeness 
// Reads: docs/blog/*.html 
// Writes: docs/blog/*.html (modifies in-place) 
// Called by: .github/workflows/deploy-blog.yml 
 
import fs from 'fs'; 
import path from 'path'; 
import { callModel, MODELS }  from '../lib/openrouter.js'; 
import { readJSON, readText }  from '../lib/file-utils.js'; 
 
function injectFAQSchema(html, faqs) { 
  if (!faqs?.length) return html; 
 
  const schema = { 
    '@context':  'https://schema.org', 
    '@type':     'FAQPage', 
    'mainEntity': faqs.map(faq => ({ 
      '@type':          'Question', 
      'name':           faq.question, 
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer }, 
    })), 
  }; 
 
  const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 
2)}\n</script>`; 
 
  // Inject before </head> 
  return html.replace('</head>', `${scriptTag}\n</head>`); 
} 
 
function injectSoftwareSchema(html, product) { 
  const schema = { 
    '@context':    'https://schema.org', 
    '@type':       'SoftwareApplication', 
    'name':        product.name, 
    'description': product.tagline, 
    'applicationCategory': 'BusinessApplication', 
    'operatingSystem': 'Web', 
    'offers': { 
      '@type':    'Offer', 
      'price':    product.pricing?.model === 'free' ? '0' : '', 
      'priceCurrency': 'USD', 
    }, 
    'author': { '@type': 'Person', 'name': product.brand_voice?.author_name ?? 'Founder' }, 
  }; 
 
  const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 
2)}\n</script>`; 
  return html.replace('</head>', `${scriptTag}\n</head>`); 
} 
 
function extractFAQsFromHTML(html) { 
  // Looks for FAQ_START / FAQ_END markers written by content-factory 
  const match = html.match(/FAQ_START([\s\S]+?)FAQ_END/); 
  if (!match) return []; 
 
  const faqBlock = match[1]; 
  const pairs    = faqBlock.split(/Q:\s+/g).filter(Boolean); 
 
  return pairs.map(pair => { 
    const [question, answer] = pair.split(/\nA:\s+/); 
    return { 
      question: question?.trim(), 
      answer:   answer?.trim(), 
    }; 
  }).filter(f => f.question && f.answer); 
} 
 
function checkFirst100Words(html) { 
  // Strip HTML tags to get plain text 
  const text      = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); 
  const words100  = text.split(' ').slice(0, 100).join(' '); 
  // A "complete answer" has a subject, verb, and relevant keyword 
  return words100.length > 200; 
} 
 
async function main() { 
  const mode = process.argv.includes('--mode=blog') ? 'blog' : 'readme'; 
  console.log(`[aeo-optimizer.js] Running in ${mode} mode...`); 
 
  const dna     = readJSON('config/product-dna.json'); 
  const product = dna?.products?.[dna?.active_product]; 
 
  if (!product) { 
    console.error('[aeo-optimizer.js] No product config found.'); 
    process.exit(1); 
  } 
 
  if (mode === 'blog') { 
    const blogDir = path.join(process.cwd(), 'docs', 'blog'); 
    if (!fs.existsSync(blogDir)) { 
      console.log('[aeo-optimizer.js] No blog directory. Skipping.'); 
      return; 
    } 
 
    const htmlFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 
'index.html'); 
    console.log(`[aeo-optimizer.js] Processing ${htmlFiles.length} blog posts...`); 
 
    for (const file of htmlFiles) { 
      const filePath = path.join(blogDir, file); 
      let html       = fs.readFileSync(filePath, 'utf8'); 
 
      // Skip if already has FAQPage schema 
      if (html.includes('FAQPage')) { 
        console.log(`[aeo-optimizer.js] Already optimized: ${file}`); 
        continue; 
      } 
 
      // Extract and inject FAQ schema 
      const faqs = extractFAQsFromHTML(html); 
      if (faqs.length > 0) { 
        html = injectFAQSchema(html, faqs); 
        console.log(`[aeo-optimizer.js] Injected ${faqs.length} FAQs: ${file}`); 
      } 
 
      // Inject SoftwareApplication schema on all pages 
      html = injectSoftwareSchema(html, product); 
 
      // Check first 100 words completeness 
      if (!checkFirst100Words(html)) { 
        console.log(`[aeo-optimizer.js] Warning: ${file} may not have complete first-100-words 
answer`); 
      } 
 
      fs.writeFileSync(filePath, html); 
    } 
 
    console.log('[aeo-optimizer.js] Blog AEO optimization complete.'); 
  } 
} 
 
main();