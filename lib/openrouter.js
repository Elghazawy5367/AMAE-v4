// === FILE: lib/openrouter.js === 
// Job: OpenRouter API wrapper — the single AI call interface for all AMAE agents 
// Reads: process.env.OPENROUTER_API_KEY 
// Writes: nothing 
// Called by: every agent that makes AI calls 
// 
// Model selection guide (2026 free tier): 
//   deepseek/deepseek-r1:free          — best reasoning, slow, use for synthesis/strategy 
//   deepseek/deepseek-chat-v3-0324:free — fast, good quality, use for content generation 
//   meta-llama/llama-3.3-70b-instruct:free — fast, good for guardrail/classification 
//   google/gemini-2.0-flash-thinking-exp:free — good reasoning fallback 
 
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'; 
const MAX_RETRIES    = 3; 
const RETRY_DELAY_MS = 2500; 
 
// Default model — best free reasoning model as of 2026-Q1 
export const MODELS = { 
  REASONING:   'deepseek/deepseek-r1:free', 
  FAST:        'deepseek/deepseek-chat-v3-0324:free', 
  CLASSIFIER:  'meta-llama/llama-3.3-70b-instruct:free', 
  FALLBACK:    'google/gemini-2.0-flash-thinking-exp:free', 
}; 
 
/** 
 * Core API call function. All other exports are wrappers around this. 
 * 
 * @param {Array<{role: string, content: string}>} messages 
 * @param {string}  model       - OpenRouter model string 
 * @param {number}  maxTokens   - Max tokens in response 
 * @param {number}  temperature - 0.0–1.0 (default 0.7) 
 * @returns {Promise<string>} - Model response text 
 */ 
export async function callModel(messages, model = MODELS.REASONING, maxTokens = 
2000, temperature = 0.7) { 
  const apiKey = process.env.OPENROUTER_API_KEY; 
  if (!apiKey) { 
    console.error('[openrouter] OPENROUTER_API_KEY not set. Add it to GitHub Secrets or 
.env'); 
    process.exit(1); 
  } 
 
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) { 
    try { 
      console.log(`[openrouter] ${model} — attempt ${attempt}/${MAX_RETRIES}`); 
 
      const response = await fetch(OPENROUTER_URL, { 
        method:  'POST', 
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type':  'application/json', 
          'HTTP-Referer':  'https://github.com/amae', 
          'X-Title':       'AMAE', 
        }, 
        body: JSON.stringify({ 
          model, 
          max_tokens:  maxTokens, 
          temperature, 
          messages, 
        }), 
      }); 
 
      // Retryable server errors 
      if (response.status === 429 || response.status >= 500) { 
        const wait = RETRY_DELAY_MS * attempt; 
        console.log(`[openrouter] Status ${response.status} — waiting ${wait}ms before retry`); 
        await sleep(wait); 
        continue; 
      } 
 
      // Non-retryable client errors 
      if (!response.ok) { 
        const body = await response.text(); 
        console.error(`[openrouter] API error ${response.status}: ${body}`); 
        process.exit(1); 
      } 
 
      const data = await response.json(); 
 
      // Handle malformed response 
      if (!data?.choices?.[0]?.message?.content) { 
        console.error('[openrouter] Unexpected response shape:', JSON.stringify(data).slice(0, 
200)); 
        if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS); continue; } 
        process.exit(1); 
      } 
 
      return data.choices[0].message.content; 
 
    } catch (err) { 
      if (attempt === MAX_RETRIES) { 
        console.error(`[openrouter] All ${MAX_RETRIES} attempts failed:`, err.message); 
        process.exit(1); 
      } 
      console.log(`[openrouter] Network error (attempt ${attempt}): ${err.message} — 
retrying`); 
      await sleep(RETRY_DELAY_MS * attempt); 
    } 
  } 
} 
 
/** 
 * Single user message — simplest usage 
 * @param {string} prompt 
 * @param {string} model 
 * @param {number} maxTokens 
 */ 
export async function ask(prompt, model = MODELS.FAST, maxTokens = 2000) { 
  return callModel([{ role: 'user', content: prompt }], model, maxTokens); 
} 
 
/** 
 * System + user message 
 * @param {string} systemPrompt 
 * @param {string} userMessage 
 * @param {string} model 
 * @param {number} maxTokens 
 */ 
export async function chat(systemPrompt, userMessage, model = MODELS.FAST, 
maxTokens = 2000) { 
  return callModel( 
    [ 
      { role: 'system', content: systemPrompt }, 
      { role: 'user',   content: userMessage  }, 
    ], 
    model, 
    maxTokens 
  ); 
} 
 
/** 
 * Parse JSON from model response. Handles markdown code fences. 
 * Throws if parsing fails after stripping fences. 
 * @param {string} text - raw model response 
 */ 
export function parseJSON(text) { 
  const stripped = text 
    .replace(/```json\s*/gi, '') 
    .replace(/