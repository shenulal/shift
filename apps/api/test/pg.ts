/**
 * Throwaway PostgreSQL cluster for tests: initdb into a temp dir, start on a free port, stop + delete afterwards.
 * Uses the PostgreSQL 16 binaries (PG_BIN, default /usr/lib/postgresql/16/bin). Postgres refuses to run as root, so when
 * the tests run as root the cluster is owned by and run as the `postgres` OS user (via runuser).
 */
import { execFileSync } from 'node:child_process';
import { chownSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const PG_BIN = process.env.PG_BIN ?? '/usr/lib/postgresql/16/bin';

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

function osUser(name: string): { uid: number; gid: number } | null {
  try {
    const uid = Number(execFileSync('id', ['-u', name]).toString().trim());
    const gid = Number(execFileSync('id', ['-g', name]).toString().trim());
    return { uid, gid };
  } catch {
    return null;
  }
}

export interface TempPostgres {
  url: string;
  port: number;
  dir: string;
  stop(): Promise<void>;
}

export async function startTempPostgres(): Promise<TempPostgres> {
  if (!existsSync(path.join(PG_BIN, 'initdb'))) throw new Error(`PostgreSQL binaries not found in ${PG_BIN} (set PG_BIN)`);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shift-pg-'));
  const data = path.join(dir, 'data');
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  const pgUser = isRoot ? osUser('postgres') : null;
  if (isRoot && !pgUser) throw new Error('Running as root but there is no `postgres` OS user to run PostgreSQL as');
  if (pgUser) chownSync(dir, pgUser.uid, pgUser.gid);

  const run = (bin: string, args: string[]) => {
    const exe = path.join(PG_BIN, bin);
    const [cmd, argv] = pgUser ? ['runuser', ['-u', 'postgres', '--', exe, ...args]] : [exe, args];
    return execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  };

  run('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--no-sync', '--locale=C']);
  const port = await freePort();
  const opts = `-p ${port} -k ${dir} -c listen_addresses=127.0.0.1 -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c max_connections=200`;
  run('pg_ctl', ['-D', data, '-o', opts, '-l', path.join(dir, 'postgres.log'), '-w', '-t', '60', 'start']);

  return {
    url: `postgres://postgres@127.0.0.1:${port}/postgres`,
    port,
    dir,
    async stop() {
      try {
        run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop']);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
}
