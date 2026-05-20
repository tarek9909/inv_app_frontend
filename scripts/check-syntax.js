import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const collectJs = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return collectJs(path);
  return entry.name.endsWith('.js') ? [path] : [];
});

const files = collectJs(root);
const failures = files.filter((file) => spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' }).status !== 0);

if (failures.length > 0) {
  process.exitCode = 1;
}
