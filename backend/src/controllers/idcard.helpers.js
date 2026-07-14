import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import { env } from '../config/env.js';

/** Fetch an image URL and return its base64 (browser UA so hosts like pravatar don't 403). */
export async function fetchPhotoBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer()).toString('base64');
  } catch {
    return null;
  }
}

/** Generate a QR code PNG (base64) encoding the given text. */
export async function makeQrBase64(text) {
  const buf = await QRCode.toBuffer(text, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
  });
  return buf.toString('base64');
}

/** Public URL a member's ID-card QR points to (their form page, keyed by the random token). */
export function memberFormUrl(token) {
  return `${env.PUBLIC_SITE_URL}/members/${token}`;
}

/** Spawn a python3 renderer, write JSON to stdin, resolve the stdout buffer (PDF/PNG bytes). */
export function runPython(scriptPath, payloadObj) {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [scriptPath]);
    const out = [];
    const err = [];
    py.stdout.on('data', (d) => out.push(d));
    py.stderr.on('data', (d) => err.push(d));
    py.on('error', reject); // python3 missing
    py.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(out));
      else reject(new Error(`renderer exited ${code}: ${Buffer.concat(err).toString().slice(0, 800)}`));
    });
    py.stdin.on('error', () => {});
    py.stdin.write(JSON.stringify(payloadObj));
    py.stdin.end();
  });
}

/** Run `fn` over items with a fixed concurrency; failures become null (never reject the batch). */
export async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        results[idx] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, worker));
  return results;
}
