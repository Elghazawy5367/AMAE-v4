// === FILE: lib/ideogram-api.js === 
// Job: Ideogram v3 image generation + download + save 
// Free tier: 25 generations/day 
// Requires: IDEOGRAM_API_KEY secret 
 
import fs from 'fs'; 
import path from 'path'; 
import { ensureDir } from './file-utils.js'; 
 
const IDEOGRAM_API = 'https://api.ideogram.ai/generate'; 
 
export async function generateImage(prompt, options = {}) { 
  const apiKey = process.env.IDEOGRAM_API_KEY; 
  if (!apiKey) throw new Error('[ideogram-api.js] IDEOGRAM_API_KEY not set'); 
 
  console.log(`[ideogram-api.js] Generating: ${prompt.slice(0, 60)}...`); 
 
  const response = await fetch(IDEOGRAM_API, { 
    method:  'POST', 
    headers: { 
      'Api-Key':      apiKey, 
      'Content-Type': 'application/json', 
    }, 
    body: JSON.stringify({ 
      image_request: { 
        prompt:          prompt, 
        negative_prompt: options.negative_prompt ?? 'blurry, low quality, watermark, text 
errors, distorted text', 
        aspect_ratio:    options.aspect_ratio ?? 'ASPECT_1_1', 
        model:           'V_2_TURBO', 
        style_type:      options.style_type ?? 'DESIGN', 
        color_palette:   options.color_palette ?? null, 
        seed:            options.seed ?? null, 
      }, 
    }), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[ideogram-api.js] API error ${response.status}: ${err.slice(0, 200)}`); 
  } 
 
  const data     = await response.json(); 
  const imageUrl = data?.data?.[0]?.url; 
  if (!imageUrl) throw new Error('[ideogram-api.js] No image URL in response'); 
 
  // Download the image 
  if (options.outputPath) { 
    await downloadImage(imageUrl, options.outputPath); 
    console.log(`[ideogram-api.js] Saved: ${options.outputPath}`); 
    return options.outputPath; 
  } 
 
  return imageUrl; 
} 
 
async function downloadImage(url, outputPath) { 
  const response = await fetch(url); 
  if (!response.ok) throw new Error(`[ideogram-api.js] Download failed: ${response.status}`); 
 
  const buffer = await response.arrayBuffer(); 
  ensureDir(path.dirname(outputPath)); 
  fs.writeFileSync(outputPath, Buffer.from(buffer)); 
} 
 
// Generate all 14 images from a spec array 
export async function generateAllImages(specs) { 
  const results = []; 
 
  for (const spec of specs) { 
    try { 
      const result = await generateImage(spec.prompt, { 
        aspect_ratio:    spec.aspect_ratio, 
        style_type:      spec.style_type, 
        negative_prompt: spec.negative_prompt, 
        outputPath:      spec.filename, 
      }); 
      results.push({ filename: spec.filename, success: true, result }); 
 
      // Rate limit: max 10 requests/minute on free tier 
      await new Promise(r => setTimeout(r, 6500)); 
    } catch (err) { 
      console.error(`[ideogram-api.js] Failed: ${spec.filename}:`, err.message); 
      results.push({ filename: spec.filename, success: false, error: err.message }); 
    } 
  } 
 
  return results; 
}