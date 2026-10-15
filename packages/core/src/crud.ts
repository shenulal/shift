import { COLLECTIONS, type CollectionName, type RecOf } from './collections';
import { ActionError, type Ctx } from './actions';
import { canRead, canWrite, includeInactive, ownerFilter, publicUser } from './permissions';
import type { Draft, Patch } from './store';

/**
 * Permission-checked CRUD over any collection. Used by the REST API and by the in-browser demo client,
 * so both enforce exactly the same rules.
 */
const clean = <C extends CollectionName>(col: C, r: RecOf<C>): RecOf<C> => (col === 'users' ? (publicUser(r as never) as unknown as RecOf<C>) : r);

export async function listRecords<C extends CollectionName>(ctx: Ctx, col: C, where?: Record<string, unknown>, opts: { all?: boolean } = {}): Promise<RecOf<C>[]> {
  if (!COLLECTIONS[col]) throw new ActionError(`Unknown collection ${col}`, 404);
  if (!canRead(ctx.actor, col)) throw new ActionError('Not allowed', ctx.actor ? 403 : 401);
  const inc = COLLECTIONS[col].kind === 'dynamic' ? true : includeInactive(ctx.actor) && opts.all !== false;
  const rows = await ctx.store.list(col, { where: { ...(where ?? {}), ...(ownerFilter(ctx.actor, col) ?? {}) } as never, includeInactive: inc });
  return rows.map((r) => clean(col, r));
}

export async function getRecord<C extends CollectionName>(ctx: Ctx, col: C, id: string): Promise<RecOf<C>> {
  if (!canRead(ctx.actor, col)) throw new ActionError('Not allowed', ctx.actor ? 403 : 401);
  const r = await ctx.store.get(col, id);
  const f = ownerFilter(ctx.actor, col);
  if (!r || (COLLECTIONS[col].kind === 'master' && !r.active && !includeInactive(ctx.actor)) || (f && Object.entries(f).some(([k, v]) => (r as unknown as Record<string, unknown>)[k] !== v))) throw new ActionError('Not found', 404);
  return clean(col, r);
}

export async function createRecord<C extends CollectionName>(ctx: Ctx, col: C, data: Draft<C>): Promise<RecOf<C>> {
  if (!canWrite(ctx.actor, col, data as unknown as Record<string, unknown>)) throw new ActionError('Not allowed', 403);
  const tf = COLLECTIONS[col].titleField;
  if (COLLECTIONS[col].kind === 'master' && (data as unknown as Record<string, unknown>)[tf] === undefined) throw new ActionError(`${tf} is required`);
  if (COLLECTIONS[col].singleton && (await ctx.store.list(col)).length) throw new ActionError(`${COLLECTIONS[col].label} already exists`, 409);
  return clean(col, await ctx.store.insert(col, data));
}

export async function updateRecord<C extends CollectionName>(ctx: Ctx, col: C, id: string, patch: Patch<C>): Promise<RecOf<C>> {
  const existing = await ctx.store.get(col, id);
  if (!existing) throw new ActionError('Not found', 404);
  if (!canWrite(ctx.actor, col, existing as unknown as Record<string, unknown>)) throw new ActionError('Not allowed', 403);
  // Re-check against the merged record so a client can't re-assign ownership via a patch.
  if (!canWrite(ctx.actor, col, { ...(existing as unknown as Record<string, unknown>), ...(patch as Record<string, unknown>) })) throw new ActionError('Not allowed', 403);
  return clean(col, await ctx.store.update(col, id, patch));
}

export async function deleteRecord(ctx: Ctx, col: CollectionName, id: string): Promise<void> {
  const existing = await ctx.store.get(col, id);
  if (!existing) throw new ActionError('Not found', 404);
  if (!canWrite(ctx.actor, col, existing as unknown as Record<string, unknown>)) throw new ActionError('Not allowed', 403);
  if (COLLECTIONS[col].singleton) throw new ActionError('This item cannot be deleted', 409);
  await ctx.store.remove(col, id);
}

export async function reorderRecords(ctx: Ctx, col: CollectionName, ids: string[]): Promise<void> {
  if (!canWrite(ctx.actor, col)) throw new ActionError('Not allowed', 403);
  await ctx.store.reorder(col, ids);
}
