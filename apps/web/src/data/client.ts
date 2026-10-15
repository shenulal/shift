import type { ActionName, ActionPayload, ActionResult, CollectionName, Rec, RecOf, User } from '@shift/core';

/** The single data port the UI talks to. Two implementations: HttpClient (API) and LocalClient (in-browser demo). */
export interface DataClient {
  readonly mode: 'http' | 'local';
  me(): Promise<Rec<User> | null>;
  login(email: string, password: string): Promise<Rec<User>>;
  /** Demo only: sign in as a seeded user without a password. */
  loginAs?(userId: string): Promise<Rec<User>>;
  logout(): Promise<void>;
  list<C extends CollectionName>(col: C, where?: Record<string, unknown>): Promise<RecOf<C>[]>;
  get<C extends CollectionName>(col: C, id: string): Promise<RecOf<C>>;
  create<C extends CollectionName>(col: C, data: Record<string, unknown>): Promise<RecOf<C>>;
  update<C extends CollectionName>(col: C, id: string, patch: Record<string, unknown>): Promise<RecOf<C>>;
  remove(col: CollectionName, id: string): Promise<void>;
  reorder(col: CollectionName, ids: string[]): Promise<void>;
  action<N extends ActionName>(name: N, payload: ActionPayload<N>): Promise<ActionResult<N>>;
  /** Upload an image/file; returns a URL usable in <img src>. */
  upload(file: File): Promise<string>;
  /** Demo only: wipe local changes and restore the seed. */
  reset?(): Promise<void>;
}

export class ClientError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
