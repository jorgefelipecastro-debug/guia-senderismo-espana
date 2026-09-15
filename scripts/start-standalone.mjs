import { cp, mkdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');
const standaloneNext = path.join(standalone, '.next');
const staticSource = path.join(root, '.next', 'static');
const staticTarget = path.join(standaloneNext, 'static');
const publicSource = path.join(root, 'public');
const publicTarget = path.join(standalone, 'public');

await mkdir(standaloneNext, { recursive: true });
if (await exists(staticSource)) await cp(staticSource, staticTarget, { recursive: true, force: true });
if (await exists(publicSource)) await cp(publicSource, publicTarget, { recursive: true, force: true });

const child = spawn(process.execPath, [path.join(standalone, 'server.js')], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', code => process.exit(code ?? 0));
child.on('error', error => {
  console.error(error);
  process.exit(1);
});
