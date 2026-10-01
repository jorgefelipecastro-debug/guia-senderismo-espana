import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apkPath = path.join(process.cwd(), 'public', 'EncontrarMovil-v1.3.apk');
  const apk = await readFile(apkPath);

  return new Response(apk, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="EncontrarMovil-v1.3.apk"',
      'Content-Length': String(apk.byteLength),
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
