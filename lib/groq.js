// === FILE: lib/groq.js === 
// Job: Groq free tier wrapper — fastest inference for quick classification tasks 
// Free: 14,400 requests/day on Llama 3.3 70B 
// Use for: guardrail checks, quick classifications, community content 
// Requires: GROQ_API_KEY secret 
 
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'; 
 
export const GROQ_MODELS = { 
  LLAMA:   'llama-3.3-70b-versatile',   // Default — fast, high quality 
  LLAMA_SMALL: 'llama-3.1-8b-instant',  // Fastest — for simple tasks only 
}; 
 
export async function callGroq(messages, model = GROQ_MODELS.LLAMA, maxTokens = 
1000, temperature = 0.7) { 
  const apiKey = process.env.GROQ_API_KEY; 
  if (!apiKey) throw new Error('[groq.js] GROQ_API_KEY not set in environment'); 
 
  let attempt = 0; 
  const maxAttempts = 3; 
 
  while (attempt < maxAttempts) { 
    try { 
      const response = await fetch(GROQ_API, { 
        method:  'POST', 
        headers: { 
          'Content-Type':  'application/json', 
          'Authorization': `Bearer ${apiKey}`, 
        }, 
        body: JSON.stringify({ model, max_tokens: maxTokens, temperature, messages }), 
      }); 
 
      if (response.status === 429) { 
        const retryAfter = response.headers.get('retry-after') ?? '5'; 
        console.log(`[groq.js] Rate limited — waiting ${retryAfter}s`); 
        await new Promise(r => setTimeout(r, Number(retryAfter) * 1000)); 
        attempt++; 
        continue; 
      } 
 
      if (!response.ok) { 
        const err = await response.text(); 
        throw new Error(`[groq.js] API error ${response.status}: ${err.slice(0, 200)}`); 
      } 
 
      const data = await response.json(); 
      return data.choices?.[0]?.message?.content ?? ''; 
    } catch (err) { 
      if (attempt === maxAttempts - 1) throw err; 
      attempt++; 
      await new Promise(r => setTimeout(r, 1000)); 
    } 
  } 
} 
 
// Convenience: fast guardrail check (Llama-small for speed) 
export async function quickClassify(prompt) { 
  return callGroq([{ role: 'user', content: prompt }], GROQ_MODELS.LLAMA_SMALL, 500, 
0.1); 
}