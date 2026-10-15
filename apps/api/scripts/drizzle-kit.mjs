// Runs drizzle-kit (dev-only: `npm run db:generate`).
// npm installs drizzle-kit at the repo root but nests drizzle-orm under apps/api, and drizzle-kit resolves drizzle-orm
// from its own location — so link the api's copy next to it first.
import { existsSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Find <node_modules>/<name> walking up from the api package (works without package.json exports). */
const find = (name) => {
  for (let d = apiRoot; ; d = path.dirname(d)) {
    const p = path.join(d, 'node_modules', name);
    if (existsSync(path.join(p, 'package.json'))) return p;
    if (d === path.dirname(d)) throw new Error(`${name} is not installed — run npm install`);
  }
};

const kitDir = find('drizzle-kit');
const ormDir = find('drizzle-orm');
const beside = path.join(path.dirname(kitDir), 'drizzle-orm');
if (!existsSync(beside)) symlinkSync(ormDir, beside, 'dir');
const r = spawnSync(process.execPath, [path.join(kitDir, 'bin.cjs'), ...process.argv.slice(2)], { stdio: 'inherit', cwd: apiRoot });
process.exit(r.status ?? 1);
