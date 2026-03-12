# Image Generation Prompt — Ideogram API Specs 
# Used by: agents/image-generator.js 
# API: Ideogram v3 via lib/ideogram-api.js 
 
You are writing Ideogram API prompts for all 14 marketing images this week. 
 
PRODUCT: [product.name] 
BRAND VOICE: [brand_voice.sounds_like] 
THIS WEEK'S HOOK: "[verbatim_hook]" 
THIS WEEK'S ANGLE: [strategy_brief.agreed_angle] 
 
--- 
 
## 14 IMAGES NEEDED 
 
For each image, provide: 
- FILENAME: where to save it 
- ASPECT_RATIO: Ideogram constant 
- PROMPT: the Ideogram generation prompt 
- NEGATIVE_PROMPT: what to avoid 
- STYLE_TYPE: DESIGN | REALISTIC | RENDER_3D | ANIME 
 
### Image specs: 
 
1. LinkedIn carousel slide 1 (title slide) — ASPECT_1_1 
2. LinkedIn carousel slide 2 (key insight) — ASPECT_1_1 
3. LinkedIn carousel slide 3 (how it works) — ASPECT_1_1 
4. LinkedIn carousel slide 4 (CTA) — ASPECT_1_1 
5. Instagram carousel slide 1 — ASPECT_1_1 
6. Instagram carousel slide 2 — ASPECT_1_1 
7. Instagram carousel slide 3 — ASPECT_1_1 
8. Pinterest pin 1 (how-to) — ASPECT_2_3 
9. Pinterest pin 2 (checklist) — ASPECT_2_3 
10. Pinterest pin 3 (framework) — ASPECT_2_3 
11. YouTube thumbnail — ASPECT_16_9 
12. AEO blog OG image — ASPECT_16_9 
13. Twitter/X thread image 1 — ASPECT_16_9 
14. Twitter/X thread image 2 — ASPECT_16_9 
 
--- 
 
## IDEOGRAM PROMPT FORMULA 
 
[Style descriptor: "clean minimal design", "professional infographic", "bold typography"] 
[Color scheme: consistent with brand] 
[Main text on image: exact text, in quotes] 
[Visual element: what's shown beyond text] 
[Mood: modern / authoritative / approachable] 
[Negative: "no people, no faces, no watermark, no blurry text"] 
 
--- 
 
Return ONLY valid JSON array of 14 image spec objects: 
[ 
  { 
    "filename": "assets/generated/linkedin-carousel-1.png", 
    "aspect_ratio": "ASPECT_1_1", 
    "prompt": "complete Ideogram prompt", 
    "negative_prompt": "what to avoid", 
    "style_type": "DESIGN" 
  } 
]