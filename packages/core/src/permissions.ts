import { COLLECTIONS, OWNER_FIELD, type CollectionName } from './collections';
import type { Rec, User } from './types';

export type Actor = Rec<User> | null;

const ADMIN_ONLY_DYNAMIC: CollectionName[] = ['leads', 'outbox', 'analytics', 'events', 'freeToolSubmissions'];

export const isAdmin = (a: Actor) => a?.role === 'admin';

/** Can the actor list/read records in this collection? */
export function canRead(actor: Actor, col: CollectionName): boolean {
  const info = COLLECTIONS[col];
  if (info.kind === 'master') return info.publicRead !== false || isAdmin(actor);
  if (isAdmin(actor)) return true;
  if (!actor) return false;
  if (ADMIN_ONLY_DYNAMIC.includes(col)) return false;
  return true; // owner-scoped; results are filtered with ownerFilter()
}

/** Extra filter applied to reads/writes for non-admin clients. */
export function ownerFilter(actor: Actor, col: CollectionName): Record<string, unknown> | undefined {
  if (isAdmin(actor) || !actor) return undefined;
  if (col === 'users') return { id: actor.id };
  const f = OWNER_FIELD[col];
  return f ? { [f]: actor.id } : undefined;
}

/** Inactive master items are hidden from everyone except the admin. */
export function includeInactive(actor: Actor) {
  return isAdmin(actor);
}

/** Can the actor create / update / delete this record directly (not via an action)? */
export function canWrite(actor: Actor, col: CollectionName, record?: Record<string, unknown>): boolean {
  if (isAdmin(actor)) return true;
  if (!actor) return false;
  const info = COLLECTIONS[col];
  if (info.kind === 'master') return false;
  if (ADMIN_ONLY_DYNAMIC.includes(col)) return false;
  if (col === 'users' || col === 'enrollments' || col === 'purchases' || col === 'bookings' || col === 'notes') return false;
  const f = OWNER_FIELD[col];
  if (!f) return false;
  return !record || record[f] === actor.id;
}

/** Strip secrets before sending a user record anywhere. */
export function publicUser<U extends Partial<User>>(u: U): Omit<U, 'passwordHash'> {
  const { passwordHash: _p, ...rest } = u;
  return rest;
}
