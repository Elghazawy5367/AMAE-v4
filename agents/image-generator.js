// === FILE: agents/image-generator.js === 
// Job: Generate all 14 marketing images using Ideogram API 
// Reads: campaigns/[WEEK]/text/ for content context, image-generation.prompt.md 
// Writes: campaigns/[WEEK]/assets/images/*.png 
// Called by: .github/workflows/weekly-campaign.yml 
 
import { callModel, MODELS, parseJSON } from '../lib/openrouter.js'; 
import { generateAllImages }             from '../lib/ideogram-api.js'; 
import { readJSON, readText, ensureDir } from '../lib/file-utils.js'; 
import { getCurrentWeek }                from '../lib/week-utils.js'; 
 
async function main() { 
  const apiKey = process.env.IDEOGRAM_API_KEY; 
  if (!apiKey) { 
    console.log('[image-generator.js] IDEOGRAM_API_KEY not set. Skipping image 
generation.'); 
    console.log('[image-generator.js] Add IDEOGRAM_API_KEY secret to enable actual 
image generation.'); 
    return; 
  } 
 
  console.log('[image-generator.js] Starting image generation...'); 
 
  const week        = getCurrentWeek(); 
  const outputDir   = `campaigns/${week}/assets/images`; 
  const dna         = readJSON('config/product-dna.json'); 
  const product     = dna.products[dna.active_product]; 
  const stratBrief  = readText(`campaigns/${week}/strategy-brief.md`) ?? ''; 
  const promptSpec  = readText('.github/prompts/image-generation.prompt.md') ?? ''; 
  const synthBrief  = readText('intelligence/weekly/synthesis-brief.md') ?? ''; 
 
  const hookMatch     = synthBrief.match(/VERBATIM HOOK:?\s*[""]?(.+?)[""]?\n/i); 
  const verbatimHook  = hookMatch?.[1] ?? product.tagline ?? ''; 
 
  const generationPrompt = promptSpec 
    .replace('[product.name]',                  product.name) 
    .replace('[brand_voice.sounds_like]',       product.brand_voice?.sounds_like ?? '') 
    .replace('"[verbatim_hook]"',               `"${verbatimHook}"`) 
    .replace('[strategy_brief.agreed_angle]',   stratBrief.slice(0, 200)); 
 
  console.log('[image-generator.js] Generating image specs with AI...'); 
  const raw   = await callModel([{ role: 'user', content: generationPrompt }], MODELS.FAST, 
3000, 0.6); 
  const specs = parseJSON(raw); 
 
  if (!Array.isArray(specs)) { 
    console.error('[image-generator.js] Invalid specs returned from AI. Expected array.'); 
    process.exit(1); 
  } 
 
  // Override output paths to correct week folder 
  const finalSpecs = specs.map(spec => ({ 
    ...spec, 
    filename: spec.filename.replace('assets/generated/', `${outputDir}/`), 
  })); 
 
  ensureDir(outputDir); 
 
  console.log(`[image-generator.js] Generating ${finalSpecs.length} images...`); 
  const results = await generateAllImages(finalSpecs); 
 
  const succeeded = results.filter(r => r.success).length; 
  const failed    = results.filter(r => !r.success).length; 
 
  console.log(`[image-generator.js] Done. ${succeeded} succeeded, ${failed} failed.`); 
  if (failed > 0) console.log('[image-generator.js] Failed images:', results.filter(r => 
!r.success).map(r => r.filename)); 
} 
 
main();