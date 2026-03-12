# AMAE Setup Guide
## Get from zero to first campaign PR in under 2 hours

---

## Prerequisites Checklist

Before you start, confirm you have:
- [ ] A GitHub account (free)
- [ ] An OpenRouter account (free) → [openrouter.ai](https://openrouter.ai)
- [ ] Your product concept clear in your head (you'll need to fill product-dna.json)

That's it. Everything else is optional and added as you go.

---

## Step 1 — Fork or Upload This Repo

1. Create a new **private** GitHub repo (free)
2. Upload the contents of this ZIP to that repo
3. Make sure the repo root contains `package.json` — that's your root

---

## Step 2 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets in order of priority:

### Required to run at all
| Secret | Where to get it | Notes |
|--------|-----------------|-------|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | Free tier is enough |

### Required for PR creation (auto-provided)
| Secret | Notes |
|--------|-------|
| `GITHUB_TOKEN` | GitHub injects this automatically — do NOT add manually |

### Add when ready for distribution (Phase 4)
| Secret | Where to get it |
|--------|-----------------|
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn Developer App |
| `LINKEDIN_PERSON_URN` | Format: `urn:li:person:XXXXXXXXX` |
| `TWITTER_API_KEY` | developer.twitter.com |
| `TWITTER_API_SECRET` | developer.twitter.com |
| `TWITTER_ACCESS_TOKEN` | developer.twitter.com |
| `TWITTER_ACCESS_SECRET` | developer.twitter.com |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free |
| `BEEHIIV_API_KEY` | Beehiiv Settings → API |
| `BEEHIIV_PUBLICATION_ID` | Beehiiv Settings → Publication |

### Optional (media generation — Phase 4+)
| Secret | Where to get it |
|--------|-----------------|
| `IDEOGRAM_API_KEY` | ideogram.ai |
| `ELEVENLABS_API_KEY` | elevenlabs.io |
| `HEYGEN_API_KEY` | heygen.com |
| `HEYGEN_VOICE_ID` | HeyGen dashboard → Voices |

---

## Step 3 — Fill In product-dna.json

This is **the only file you need to fill in**. Everything else is config.

Open `config/product-dna.json` and fill in:

```
"name"      → Your product name (e.g. "Notion", "ConvertKit")
"tagline"   → Who it's for + what they get + how fast (under 15 words)
"one_line"  → One sentence for GitHub bios and short intros
```

**The Critical Section — spend 2 hours here:**

```
"the_desire" → This is where your marketing lives or dies.
```

Fill in `the_desire` by answering these 4 questions about one real person in your audience:

1. What is their day like? What did they try before?
2. What do they feel at 2am that they'd never say professionally?
3. Who do they want to BECOME (not just what they want to do)?
4. What have they tried that failed, and why?

Your answers go directly into `what_they_secretly_want`, `what_they_fear_most`, `what_they_are_frustrated_by`, and `who_they_want_to_become`.

**Do not use AI to generate this section.** These answers must come from lived knowledge of your audience.

---

## Step 4 — Choose Your 2 Starting Platforms

Edit `config/product-dna.json` → `"platforms"` array.

Start with exactly 2 platforms. Options:
- `"linkedin"` — if your ICP is professionals or B2B
- `"twitter_x"` — if your ICP is builders, founders, developers  
- `"reddit"` — if your ICP has a strong subreddit community

**Platform selection is your decision, not AI's.** Pick where your real ICP spends time.

---

## Step 5 — Configure Subreddits

Edit `config/intelligence-config.json` → `"reddit"` → `"subreddits"` array.

Add the 3-5 subreddits where your ICP complains, asks for recommendations, and vents.

---

## Step 6 — Test the System Locally (Optional but Recommended)