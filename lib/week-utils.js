// === FILE: lib/week-utils.js === 
// Job: ISO week string utilities — consistent folder naming across all agents 
// Reads: nothing (pure utility) 
// Writes: nothing 
// Called by: all agents that write to campaigns/ or intelligence/weekly/ 
 
/** 
 * Returns ISO week number for a date (1–53) 
 * Uses ISO 8601: week starts Monday, week 1 = week containing first Thursday 
 */ 
export function getISOWeek(date = new Date()) { 
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); 
  const dayNum = d.getUTCDay() || 7; // Sunday=7 in ISO 
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday 
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); 
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7); 
} 
 
/** 
 * Returns current ISO week string: "2026-W14" 
 */ 
export function getCurrentWeek() { 
  const now  = new Date(); 
  const year = now.getFullYear(); 
  const week = getISOWeek(now); 
  return `${year}-W${String(week).padStart(2, '0')}`; 
} 
 
/** 
 * Returns campaign output folder: "campaigns/2026-W14" 
 */ 
export function getCampaignFolder() { 
  return `campaigns/${getCurrentWeek()}`; 
} 
 
/** 
 * Returns intelligence weekly folder 
 */ 
export function getIntelFolder() { 
  return 'intelligence/weekly'; 
} 
 
/** 
 * Returns YYYY-MM-DD string for today 
 */ 
export function getTodayString() { 
  return new Date().toISOString().split('T')[0]; 
} 
 
/** 
 * Returns Unix timestamp in seconds 
 */ 
export function nowSeconds() { 
  return Math.floor(Date.now() / 1000); 
}