import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getBusinessmanById } from '../models/businessman.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, '../form/render_form.py');

async function fetchPhotoBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer()).toString('base64');
  } catch {
    return null;
  }
}

/** Generate the member's filled registration form as a PDF (via the Python/PIL renderer). */
export const businessmanFormPdf = asyncHandler(async (req, res) => {
  const b = await getBusinessmanById(req.params.id);
  if (!b) throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'BUSINESSMAN_NOT_FOUND');

  const photo_b64 = await fetchPhotoBase64(b.profile_photo_url);
  const payload = JSON.stringify({ ...b, photo_b64 });

  const pdf = await new Promise((resolve, reject) => {
    const py = spawn('python3', [SCRIPT]);
    const out = [];
    const err = [];
    py.stdout.on('data', (d) => out.push(d));
    py.stderr.on('data', (d) => err.push(d));
    py.on('error', reject); // e.g. python3 not installed
    py.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(out));
      else reject(new Error(`renderer exited ${code}: ${Buffer.concat(err).toString().slice(0, 500)}`));
    });
    py.stdin.on('error', () => {});
    py.stdin.write(payload);
    py.stdin.end();
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="registration-form-${b.unique_id}.pdf"`);
  res.send(pdf);
});
