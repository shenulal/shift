import type { ActionName, ActionPayload, ActionResult, CollectionName, Rec, RecOf, User } from '@shift/core';
import { ClientError, type DataClient } from './client';

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    credentials: 'include',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ClientError(data.error ?? res.statusText, res.status);
  return data as T;
}

export class HttpClient implements DataClient {
  readonly mode = 'http' as const;
  me() {
    return req<{ user: Rec<User> | null }>('GET', '/auth/me').then((r) => r.user);
  }
  login(email: string, password: string) {
    return req<{ user: Rec<User> }>('POST', '/auth/login', { email, password }).then((r) => r.user);
  }
  async logout() {
    await req('POST', '/auth/logout');
  }
  list<C extends CollectionName>(col: C, where?: Record<string, unknown>) {
    const q = where && Object.keys(where).length ? `?where=${encodeURIComponent(JSON.stringify(where))}` : '';
    return req<RecOf<C>[]>('GET', `/c/${col}${q}`);
  }
  get<C extends CollectionName>(col: C, id: string) {
    return req<RecOf<C>>('GET', `/c/${col}/${encodeURIComponent(id)}`);
  }
  create<C extends CollectionName>(col: C, data: Record<string, unknown>) {
    return req<RecOf<C>>('POST', `/c/${col}`, data);
  }
  update<C extends CollectionName>(col: C, id: string, patch: Record<string, unknown>) {
    return req<RecOf<C>>('PATCH', `/c/${col}/${encodeURIComponent(id)}`, patch);
  }
  async remove(col: CollectionName, id: string) {
    await req('DELETE', `/c/${col}/${encodeURIComponent(id)}`);
  }
  async reorder(col: CollectionName, ids: string[]) {
    await req('POST', `/c/${col}/reorder`, { ids });
  }
  action<N extends ActionName>(name: N, payload: ActionPayload<N>) {
    return req<ActionResult<N>>('POST', `/actions/${name}`, payload ?? {});
  }
  async upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await req<{ url: string }>('POST', '/uploads', fd);
    return r.url;
  }
}
