// === FILE: lib/file-utils.js === 
// Job: Safe file read/write helpers — all agents use these instead of raw fs calls 
// Reads: any file on disk 
// Writes: any file on disk 
// Called by: all agents 
 
import fs   from 'fs'; 
import path from 'path'; 
 
/** 
 * Read JSON file safely. Returns null if file does not exist. 
 * @param {string} filePath - relative to process.cwd() 
 */ 
export function readJSON(filePath) { 
  try { 
    const abs     = path.join(process.cwd(), filePath); 
    const content = fs.readFileSync(abs, 'utf8'); 
    return JSON.parse(content); 
  } catch (err) { 
    if (err.code === 'ENOENT') return null; // Missing file = null, not an error 
    console.error(`[file-utils] readJSON failed: ${filePath} — ${err.message}`); 
    return null; 
  } 
} 
 
/** 
 * Write JSON file. Creates parent directories. Pretty-prints with 2-space indent. 
 * @param {string} filePath - relative to process.cwd() 
 * @param {object} data 
 */ 
export function writeJSON(filePath, data) { 
  try { 
    const abs = path.join(process.cwd(), filePath); 
    fs.mkdirSync(path.dirname(abs), { recursive: true }); 
    fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf8'); 
    console.log(`[file-utils] Wrote JSON: ${filePath}`); 
  } catch (err) { 
    console.error(`[file-utils] writeJSON failed: ${filePath} — ${err.message}`); 
    process.exit(1); 
  } 
} 
 
/** 
 * Read text/markdown file safely. Returns '' if file does not exist. 
 * @param {string} filePath - relative to process.cwd() 
 */ 
export function readText(filePath) { 
  try { 
    const abs = path.join(process.cwd(), filePath); 
    return fs.readFileSync(abs, 'utf8'); 
  } catch (err) { 
    if (err.code === 'ENOENT') return ''; 
    console.error(`[file-utils] readText failed: ${filePath} — ${err.message}`); 
    return ''; 
  } 
} 
 
/** 
 * Write text/markdown file. Creates parent directories. 
 * @param {string} filePath - relative to process.cwd() 
 * @param {string} content 
 */ 
export function writeText(filePath, content) { 
  try { 
    const abs = path.join(process.cwd(), filePath); 
    fs.mkdirSync(path.dirname(abs), { recursive: true }); 
    fs.writeFileSync(abs, content, 'utf8'); 
    console.log(`[file-utils] Wrote text: ${filePath}`); 
  } catch (err) { 
    console.error(`[file-utils] writeText failed: ${filePath} — ${err.message}`); 
    process.exit(1); 
  } 
} 
 
/** 
 * Ensure directory exists. Creates recursively. 
 */ 
export function ensureDir(dirPath) { 
  const abs = path.join(process.cwd(), dirPath); 
  fs.mkdirSync(abs, { recursive: true }); 
} 
 
/** 
 * List all files in a directory with a given extension. 
 * Returns [] if directory does not exist. 
 */ 
export function listFiles(dirPath, ext = '.md') { 
  try { 
    const abs = path.join(process.cwd(), dirPath); 
    if (!fs.existsSync(abs)) return []; 
    return fs.readdirSync(abs).filter(f => f.endsWith(ext)); 
  } catch { 
    return []; 
  } 
} 
 
/** 
 * Check if a file exists. 
 */ 
export function fileExists(filePath) { 
  return fs.existsSync(path.join(process.cwd(), filePath)); 
} 
 
// Alias: Tab 2 agents import writeFile — maps to writeText 
export const writeFile = writeText;