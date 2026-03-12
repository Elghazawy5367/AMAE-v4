// === FILE: lib/anthropic.js === 
// Job: Claude API wrapper for tasks requiring Sonnet/Haiku 
// Used when: extended thinking needed, or when OpenRouter free models are rate-limited 
// Requires: ANTHROPIC_API_KEY secret 
 
const CLAUDE_API = 'https://api.anthropic.com/v1/messages'; 
 
export const CLAUDE_MODELS = { 
  SONNET:  'claude-sonnet-4-20250514',   // Synthesis, strategy, complex analysis 
  HAIKU:   'claude-haiku-4-5-20251001',  // Fast parallel calls (4-persona strategy) 
}; 
 
async function callClaude(messages, model = CLAUDE_MODELS.HAIKU, maxTokens = 
1000, temperature = 0.7) { 
  const apiKey = process.env.ANTHROPIC_API_KEY; 
  if (!apiKey) throw new Error('[anthropic.js] ANTHROPIC_API_KEY not set in environment'); 
 
  let attempt = 0; 
  const maxAttempts = 3; 
 
  while (attempt < maxAttempts) { 
    try { 
      const body = { model, max_tokens: maxTokens, temperature, messages }; 
      const response = await fetch(CLAUDE_API, { 
        method:  'POST', 
        headers: { 
          'Content-Type':      'application/json', 
          'anthropic-version': '2023-06-01', 
          'x-api-key':         apiKey, 
        }, 
        body: JSON.stringify(body), 
      }); 
 
      if (response.status === 529) { 
        const wait = Math.pow(2, attempt) * 1000; 
        console.log(`[anthropic.js] Overloaded — retry ${attempt + 1} in ${wait}ms`); 
        await new Promise(r => setTimeout(r, wait)); 
        attempt++; 
        continue; 
      } 
 
      if (!response.ok) { 
        const err = await response.text(); 
        throw new Error(`[anthropic.js] API error ${response.status}: ${err.slice(0, 200)}`); 
      } 
 
      const data = await response.json(); 
      return data.content?.[0]?.text ?? ''; 
    } catch (err) { 
      if (attempt === maxAttempts - 1) throw err; 
      attempt++; 
      await new Promise(r => setTimeout(r, 1500)); 
    } 
  } 
} 
 
export async function callSonnet(messages, maxTokens = 2000, temperature = 0.7) { 
  return callClaude(messages, CLAUDE_MODELS.SONNET, maxTokens, temperature); 
} 
 
export async function callHaiku(messages, maxTokens = 1000, temperature = 0.7) { 
  return callClaude(messages, CLAUDE_MODELS.HAIKU, maxTokens, temperature); 
} 
 
// Extended thinking — for synthesis and evolution decisions 
export async function callSonnetWithThinking(userPrompt, thinkingBudget = 5000) { 
  const apiKey = process.env.ANTHROPIC_API_KEY; 
  if (!apiKey) throw new Error('[anthropic.js] ANTHROPIC_API_KEY not set'); 
 
  const response = await fetch(CLAUDE_API, { 
    method:  'POST', 
    headers: { 
      'Content-Type':      'application/json', 
      'anthropic-version': '2023-06-01', 
      'x-api-key':         apiKey, 
    }, 
    body: JSON.stringify({ 
      model:      CLAUDE_MODELS.SONNET, 
      max_tokens: thinkingBudget + 2000, 
      thinking:   { type: 'enabled', budget_tokens: thinkingBudget }, 
      messages:   [{ role: 'user', content: userPrompt }], 
    }), 
  }); 
 
  if (!response.ok) { 
    const err = await response.text(); 
    throw new Error(`[anthropic.js] Extended thinking error ${response.status}: ${err.slice(0, 
200)}`); 
  } 
 
  const data = await response.json(); 
  return data.content.map(b => b.text || '').filter(Boolean).join('\n'); 
}