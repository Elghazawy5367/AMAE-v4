// === FILE: lib/github-api.js === 
// Job: GitHub API wrapper for issue mining, repo reading, content publishing 
// Requires: GITHUB_TOKEN (available automatically in GitHub Actions) 
// Rate limit: 5,000 requests/hour with token 
 
const BASE = 'https://api.github.com'; 
 
function headers() { 
  const token = process.env.GITHUB_TOKEN; 
  const h = { 
    'Accept':     'application/vnd.github.v3+json', 
    'User-Agent': 'AMAE/1.0', 
  }; 
  if (token) h['Authorization'] = `Bearer ${token}`; 
  return h; 
} 
 
async function ghFetch(path, options = {}) { 
  const url     = path.startsWith('http') ? path : `${BASE}${path}`; 
  const response = await fetch(url, { headers: headers(), ...options }); 
 
  if (response.status === 403) { 
    const remaining = response.headers.get('x-ratelimit-remaining'); 
    if (remaining === '0') { 
      const reset = response.headers.get('x-ratelimit-reset'); 
      console.log(`[github-api.js] Rate limit hit. Resets: ${new Date(Number(reset) * 
1000).toISOString()}`); 
      return null; 
    } 
  } 
  if (!response.ok) return null; 
  return response.json(); 
} 
 
// ── Repo Search 
──────────────────────────────────────────────── 
 
export async function searchRepos(query, sort = 'updated', perPage = 20) { 
  const url = 
`/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_pa
ge=${perPage}`; 
  const data = await ghFetch(url); 
  return data?.items ?? []; 
} 
 
export async function getRepoContents(fullName, path = '') { 
  return ghFetch(`/repos/${fullName}/contents/${path}`); 
} 
 
export async function getRepoCommits(fullName, perPage = 20) { 
  const data = await ghFetch(`/repos/${fullName}/commits?per_page=${perPage}`); 
  return data ?? []; 
} 
 
// ── Issue Mining (competitor research) ──────────────────────── 
 
export async function getRepoIssues(fullName, state = 'open', perPage = 50, label = '') { 
  const labelParam = label ? `&labels=${encodeURIComponent(label)}` : ''; 
  const data = await 
ghFetch(`/repos/${fullName}/issues?state=${state}&per_page=${perPage}${labelParam}`); 
  return Array.isArray(data) ? data : []; 
} 
 
export async function getIssueComments(fullName, issueNumber) { 
  const data = await 
ghFetch(`/repos/${fullName}/issues/${issueNumber}/comments?per_page=50`); 
  return Array.isArray(data) ? data : []; 
} 
 
// ── Discussions (AEO seeding) ───────────────────────────────── 
 
export async function createDiscussion(repoId, categoryId, title, body) { 
  // GraphQL required for Discussions API 
  const token = process.env.GITHUB_TOKEN; 
  if (!token) throw new Error('[github-api.js] GITHUB_TOKEN required for Discussions'); 
 
  const mutation = ` 
    mutation { 
      createDiscussion(input: { 
        repositoryId: "${repoId}", 
        categoryId: "${categoryId}", 
        title: ${JSON.stringify(title)}, 
        body: ${JSON.stringify(body)} 
      }) { 
        discussion { url } 
      } 
    } 
  `; 
 
  const response = await fetch('https://api.github.com/graphql', { 
    method:  'POST', 
    headers: { ...headers(), 'Content-Type': 'application/json' }, 
    body:    JSON.stringify({ query: mutation }), 
  }); 
  return response.json(); 
} 
 
// ── Profile README 
───────────────────────────────────────────── 
 
export async function updateFileContent(owner, repo, path, content, message, sha = null) { 
  const token = process.env.GITHUB_TOKEN; 
  if (!token) throw new Error('[github-api.js] GITHUB_TOKEN required for file updates'); 
 
  const body = { 
    message, 
    content: Buffer.from(content).toString('base64'), 
  }; 
  if (sha) body.sha = sha; 
 
  const response = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, { 
    method:  'PUT', 
    headers: { ...headers(), 'Content-Type': 'application/json' }, 
    body:    JSON.stringify(body), 
  }); 
  return response.json(); 
} 
 
export async function getFileContent(owner, repo, path) { 
  const data = await ghFetch(`/repos/${owner}/${repo}/contents/${path}`); 
  if (!data?.content) return null; 
  return { 
    content: Buffer.from(data.content, 'base64').toString('utf8'), 
    sha:     data.sha, 
  }; 
} 
 
// ── Release Publishing ───────────────────────────────────────── 
 
export async function createRelease(owner, repo, tag, name, body, draft = false) { 
  const token = process.env.GITHUB_TOKEN; 
  const response = await fetch(`${BASE}/repos/${owner}/${repo}/releases`, { 
    method:  'POST', 
    headers: { ...headers(), 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ tag_name: tag, name, body, draft }), 
  }); 
  return response.json(); 
} 
 
// ── Trending / Star Velocity ──────────────────────────────────── 
 
export async function getStargazers(fullName, page = 1) { 
  const response = await 
fetch(`${BASE}/repos/${fullName}/stargazers?per_page=30&page=${page}`, { 
    headers: { ...headers(), 'Accept': 'application/vnd.github.star+json' }, 
  }); 
  if (!response.ok) return []; 
  return response.json(); 
}