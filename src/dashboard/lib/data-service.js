// === FILE: src/dashboard/lib/data-service.js ===
// Reads AMAE output files and exposes them to dashboard components
// GAP-011 FIX: File was missing — dashboard failed to load

export async function loadCampaignStatus() {
  try {
    const res = await fetch('/campaigns/current/status.json');
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export async function loadIntelligenceBrief() {
  try {
    const res = await fetch('/intelligence/weekly/synthesis-brief.md');
    return res.ok ? res.text() : '';
  } catch { return ''; }
}

export async function loadResonanceData() {
  try {
    const res = await fetch('/memory/performance.json');
    return res.ok ? res.json() : {};
  } catch { return {}; }
}

export async function loadFunnelMetrics() {
  try {
    const res = await fetch('/analytics/funnel-metrics.json');
    return res.ok ? res.json() : {};
  } catch { return {}; }
}
