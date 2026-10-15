import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { GlobalSetupContext } from 'vitest/node';
import { startTempPostgres } from './pg';

declare module 'vitest' {
  export interface ProvidedContext {
    pgUrl: string;
    /** Scratch dir for uploads / fake web builds; removed after the run. */
    tmpRoot: string;
  }
}

/** One PostgreSQL cluster for the whole run; each test file creates its own database in it (see helpers.ts). */
export default async function setup({ provide }: GlobalSetupContext) {
  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'shift-api-test-'));
  provide('tmpRoot', tmpRoot);
  const cleanTmp = () => rmSync(tmpRoot, { recursive: true, force: true });
  // Allow pointing the tests at an existing server instead (e.g. CI service container).
  if (process.env.TEST_DATABASE_URL) {
    provide('pgUrl', process.env.TEST_DATABASE_URL);
    return cleanTmp;
  }
  const pg = await startTempPostgres();
  provide('pgUrl', pg.url);
  return async () => {
    await pg.stop();
    cleanTmp();
  };
}
