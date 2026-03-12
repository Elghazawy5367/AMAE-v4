# Video Production Prompt — HeyGen + Runway Specs 
# Used by: agents/video-producer.js 
# APIs: lib/heygen-api.js + lib/runway-api.js 
 
You are generating video production specifications for this week's video content. 
 
PRODUCT: [product.name] 
THIS WEEK'S ANGLE: [strategy_brief.agreed_angle] 
VOICEOVER FILES: [list of MP3 files from voice-generator.js] 
 
--- 
 
## HEYGEN AVATAR VIDEOS (main presenter videos) 
 
For each TikTok/Reels script that needs an avatar video: 
[scripts from campaigns/[WEEK]/text/tiktok-scripts.md] 
 
For each script, generate a HeyGen API spec: 
 
{ 
  "video_name": "descriptive name", 
  "script_file": "which text file to use", 
  "voiceover_file": "which MP3 from assets/audio/", 
  "aspect": "portrait (1080x1920) for TikTok/Reels | landscape (1920x1080) for YouTube", 
  "background": "color hex or background type", 
  "caption": true, 
  "caption_style": "clean_default" 
} 
 
--- 
 
## RUNWAY B-ROLL (product/UI animations) 
 
For each video that needs B-roll: 
Generate a Runway Gen-3 image-to-video spec. 
 
Input: product screenshot or generated image from assets/generated/ 
Motion prompt: how the image should move (subtle pan, zoom in on key element, etc.) 
 
{ 
  "input_image": "path to source image", 
  "motion_prompt": "specific motion description", 
  "duration_seconds": 5, 
  "output_filename": "assets/video/broll-[name].mp4" 
} 
 
--- 
 
Return ONLY valid JSON with two arrays: 
{ 
  "heygen_jobs": [...], 
  "runway_jobs": [...] 
}