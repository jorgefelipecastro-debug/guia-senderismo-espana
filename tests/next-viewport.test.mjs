import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const layout = await readFile(new URL('../app/layout.js', import.meta.url), 'utf8');

test('themeColor se declara solo en viewport y no en metadata', () => {
  const metadataBlock = layout.match(/export const metadata = \{([\s\S]*?)\n\};/);
  const viewportBlock = layout.match(/export const viewport = \{([\s\S]*?)\n\};/);

  assert.ok(metadataBlock, 'Debe existir metadata');
  assert.ok(viewportBlock, 'Debe existir viewport');
  assert.doesNotMatch(metadataBlock[1], /themeColor\s*:/);
  assert.match(viewportBlock[1], /themeColor\s*:\s*['\"]#0b4a38['\"]/);
});
