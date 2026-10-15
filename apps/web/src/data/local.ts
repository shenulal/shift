import {
  ActionError, DEMO_TODAY, MemoryStore, createRecord, deleteRecord, fullSeed, getRecord, listRecords, publicUser, reorderRecords, runAction, setToday, updateRecord,
  type ActionName, type ActionPayload, type ActionResult, type CollectionName, type Rec, type StoreData, type User,
} from '@shift/core';
import { ClientError, type DataClient } from './client';

const DATA_KEY = 'shift-demo-data-v1';
const USER_KEY = 'shift-demo-user-v1';

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* storage unavailable — demo keeps working in memory */
  }
};

/**
 * In-browser demo backend: the same core CRUD + actions the API runs, over a seeded MemoryStore
 * persisted to localStorage. Lets reviewers use the full app (admin edits included) with no server.
 */
export class LocalClient implements DataClient {
  readonly mode = 'local' as const;
  private store: MemoryStore;
  private userId: string | null;
  private timer: number | undefined;

  constructor() {
    setToday(DEMO_TODAY);
    let data: StoreData = fullSeed();
    const saved = safeGet(DATA_KEY);
    if (saved) {
      try {
        data = { ...data, ...JSON.parse(saved) };
      } catch {
        /* ignore corrupt saves */
      }
    }
    this.store = new MemoryStore(data, (d) => {
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => safeSet(DATA_KEY, JSON.stringify(d)), 150);
    });
    this.userId = safeGet(USER_KEY);
  }

  private async actor(): Promise<Rec<User> | null> {
    return this.userId ? await this.store.get('users', this.userId) : null;
  }
  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ActionError) throw new ClientError(e.message, e.status);
      throw e;
    }
  }
  private async ctx() {
    return { store: this.store, actor: await this.actor() };
  }

  async me() {
    const a = await this.actor();
    return a ? (publicUser(a) as Rec<User>) : null;
  }
  async login(email: string, _password: string) {
    const [u] = await this.store.list('users', { where: { email: email.trim().toLowerCase() } });
    if (!u) throw new ClientError('No account with that email', 401);
    return this.loginAs(u.id);
  }
  async loginAs(userId: string) {
    const u = await this.store.get('users', userId);
    if (!u) throw new ClientError('Unknown user', 404);
    this.userId = u.id;
    safeSet(USER_KEY, u.id);
    return publicUser(u) as Rec<User>;
  }
  async logout() {
    this.userId = null;
    safeSet(USER_KEY, null);
  }
  async list<C extends CollectionName>(col: C, where?: Record<string, unknown>) {
    return this.run(async () => listRecords(await this.ctx(), col, where));
  }
  async get<C extends CollectionName>(col: C, id: string) {
    return this.run(async () => getRecord(await this.ctx(), col, id));
  }
  async create<C extends CollectionName>(col: C, data: Record<string, unknown>) {
    return this.run(async () => createRecord(await this.ctx(), col, data as never));
  }
  async update<C extends CollectionName>(col: C, id: string, patch: Record<string, unknown>) {
    return this.run(async () => updateRecord(await this.ctx(), col, id, patch as never));
  }
  async remove(col: CollectionName, id: string) {
    return this.run(async () => deleteRecord(await this.ctx(), col, id));
  }
  async reorder(col: CollectionName, ids: string[]) {
    return this.run(async () => reorderRecords(await this.ctx(), col, ids));
  }
  async action<N extends ActionName>(name: N, payload: ActionPayload<N>): Promise<ActionResult<N>> {
    return this.run(async () => (await runAction(name, await this.ctx(), payload)) as unknown as ActionResult<N>);
  }
  upload(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > 1_500_000) return reject(new ClientError('In the demo, images must be under 1.5 MB'));
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new ClientError('Could not read file'));
      r.readAsDataURL(file);
    });
  }
  async reset() {
    safeSet(DATA_KEY, null);
    this.store.data = fullSeed();
  }
}
