import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { COLLECTIONS, type CollectionName, type RecOf } from '@shift/core';
import { client, useCrud, useList, useQueryClient } from '@/data';
import { Button, Loading, Modal, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { MoveButtons, Switch, TonePill, move } from './controls';
import { RecordEditor, type EditorTab, type FieldSpec } from './RecordEditor';
import { errMsg } from './util';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Column<R> { label: string; render: (r: R) => ReactNode; className?: string }

export interface CrudTableProps<C extends CollectionName> {
  col: C;
  title?: ReactNode;
  description?: ReactNode;
  columns: Column<RecOf<C>>[];
  /** Editor schema (drawer). Omit both and pass onEdit for a custom editor. */
  tabs?: EditorTab[];
  fields?: FieldSpec[];
  blank: () => Record<string, any>;
  /** Only show part of the collection (e.g. FAQs for one context). Reordering keeps the rest in place. */
  filter?: (r: RecOf<C>) => boolean;
  searchText?: (r: RecOf<C>) => string;
  onEdit?: (r: RecOf<C> | null) => void;
  editorTitle?: (r: RecOf<C> | null) => ReactNode;
  preview?: (d: any) => ReactNode;
  wide?: boolean;
  addLabel?: string;
  noAdd?: boolean;
  noDelete?: boolean;
  noDuplicate?: boolean;
  noSearch?: boolean;
  extraActions?: (r: RecOf<C>) => ReactNode;
  headerExtra?: ReactNode;
  emptyText?: ReactNode;
  editorTop?: (r: RecOf<C> | null) => ReactNode;
}

interface DelState { id: string; name: string; usage: { count: number; label: string } | null; loading: boolean; busy: boolean }

/**
 * Generic list for a MASTER collection: search, drag-to-reorder (+ keyboard buttons), active toggle,
 * duplicate (inactive copy), edit (drawer) and delete with a "used by" warning.
 */
export function CrudTable<C extends CollectionName>(props: CrudTableProps<C>) {
  const { col, title, description, columns, tabs, fields, blank, filter, searchText, onEdit, editorTitle, preview, wide, addLabel, noAdd, noDelete, noDuplicate, noSearch, extraActions, headerExtra, emptyText, editorTop } = props;
  const info = COLLECTIONS[col];
  const q = useList(col);
  const crud = useCrud(col);
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ rec: RecOf<C> | null; n: number } | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [del, setDel] = useState<DelState | null>(null);

  const all = useMemo(() => (q.data ?? []) as RecOf<C>[], [q.data]);
  useEffect(() => setOrder(null), [q.data]);
  const subset = useMemo(() => {
    const rows = filter ? all.filter(filter) : all;
    if (!order) return rows;
    const idx = new Map(order.map((id, i) => [id, i]));
    return rows.slice().sort((a, b) => (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0));
  }, [all, filter, order]);
  const titleOf = (r: RecOf<C>) => String((r as any)[info.titleField] ?? (r as any).name ?? (r as any).title ?? r.id);
  const text = (r: RecOf<C>) => (searchText ? searchText(r) : titleOf(r)).toLowerCase();
  const visible = search.trim() ? subset.filter((r) => text(r).includes(search.trim().toLowerCase())) : subset;
  const canDrag = !search.trim() && subset.length > 1;

  const commitOrder = async (ids: string[]) => {
    // merge the reordered subset back into the full ordering
    const subsetIds = new Set(ids);
    const queue = ids.slice();
    const full = all.map((r) => (subsetIds.has(r.id) ? queue.shift()! : r.id));
    setOrder(full);
    try {
      await crud.reorder.mutateAsync(full);
      toast('Order saved');
    } catch (e) {
      setOrder(null);
      toast(errMsg(e), true);
    }
  };
  const moveRow = (from: number, to: number) => void commitOrder(move(subset.map((r) => r.id), from, to));

  const onDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const ids = subset.map((r) => r.id);
    void commitOrder(move(ids, ids.indexOf(dragId), ids.indexOf(targetId)));
    setDragId(null);
    setOverId(null);
  };

  const toggleActive = async (r: RecOf<C>) => {
    try {
      await crud.update.mutateAsync({ id: r.id, patch: { active: !r.active } });
      toast(r.active ? `"${titleOf(r)}" is now hidden from the site` : `"${titleOf(r)}" is live on the site`);
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  const duplicate = async (r: RecOf<C>) => {
    try {
      await client.action('duplicate', { col, id: r.id });
      await qc.invalidateQueries({ queryKey: ['c'] });
      toast('Duplicated — the copy is inactive until you switch it on');
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  const askDelete = async (r: RecOf<C>) => {
    setDel({ id: r.id, name: titleOf(r), usage: null, loading: true, busy: false });
    try {
      const usage = await client.action('usage', { col, id: r.id });
      setDel((d) => (d && d.id === r.id ? { ...d, usage, loading: false } : d));
    } catch {
      setDel((d) => (d ? { ...d, loading: false } : d));
    }
  };
  const doDelete = async () => {
    if (!del) return;
    setDel({ ...del, busy: true });
    try {
      await crud.remove.mutateAsync(del.id);
      toast(`Deleted "${del.name}"`);
      setDel(null);
    } catch (e) {
      toast(errMsg(e), true);
      setDel({ ...del, busy: false });
    }
  };
  const openEditor = (r: RecOf<C> | null) => (onEdit ? onEdit(r) : setEditing({ rec: r, n: Date.now() }));

  return (
    <div className="adm-crud">
      {(title || description || !noAdd || !noSearch) && (
        <div className="adm-section-head">
          <div className="stack gap-4" style={{ minWidth: 0 }}>
            {title && <h2 className="adm-h2">{title}</h2>}
            {description && <p className="body-sm muted">{description}</p>}
          </div>
          <div className="wrap-row gap-8">
            {headerExtra}
            {!noSearch && (
              <label className="adm-search">
                <Icon name="search" size={16} />
                <span className="sr-only">Search {info.label}</span>
                <input type="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
            )}
            {!noAdd && <Button size="sm" icon="plus" onClick={() => openEditor(null)}>{addLabel ?? 'Add new'}</Button>}
          </div>
        </div>
      )}
      {q.isLoading ? (
        <Loading h={160} />
      ) : q.isError ? (
        <p className="field-error" role="alert">Could not load {info.label.toLowerCase()}: {errMsg(q.error)}</p>
      ) : (
        <div className="scroll-x adm-table-wrap">
          <table className="table adm-table">
            <thead>
              <tr>
                <th scope="col" className="adm-col-drag"><span className="sr-only">Order</span></th>
                {columns.map((c) => <th key={c.label} scope="col" className={c.className}>{c.label}</th>)}
                <th scope="col">Active</th>
                <th scope="col" className="adm-col-actions"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr
                  key={r.id}
                  className={`${r.active ? '' : 'is-inactive'} ${overId === r.id ? 'is-over' : ''} ${dragId === r.id ? 'is-dragging' : ''}`}
                  draggable={canDrag}
                  onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); }}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(r.id); } }}
                  onDragLeave={() => setOverId((o) => (o === r.id ? null : o))}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  onDrop={(e) => onDrop(e, r.id)}
                >
                  <td className="adm-col-drag">
                    {canDrag ? (
                      <span className="row gap-4">
                        <span className="adm-grip" aria-hidden title="Drag to reorder"><Icon name="drag" size={16} /></span>
                        <MoveButtons label={titleOf(r)} first={i === 0} last={i === visible.length - 1} onUp={() => moveRow(i, i - 1)} onDown={() => moveRow(i, i + 1)} />
                      </span>
                    ) : (
                      <span className="faint body-sm">{i + 1}</span>
                    )}
                  </td>
                  {columns.map((c, ci) => (
                    <td key={c.label} className={c.className}>
                      {ci === 0 ? (
                        <span className="adm-first-cell">
                          {c.render(r)}
                          {!r.active && <TonePill tone="beige">Inactive</TonePill>}
                        </span>
                      ) : (
                        c.render(r)
                      )}
                    </td>
                  ))}
                  <td>
                    <Switch small hideLabel label={`${r.active ? 'Deactivate' : 'Activate'} ${titleOf(r)}`} checked={r.active} onChange={() => void toggleActive(r)} />
                  </td>
                  <td className="adm-col-actions">
                    <span className="adm-actions">
                      {extraActions?.(r)}
                      <button type="button" className="adm-act" onClick={() => openEditor(r)} aria-label={`Edit ${titleOf(r)}`}><Icon name="edit" size={15} /><span>Edit</span></button>
                      {!noDuplicate && <button type="button" className="adm-mini" onClick={() => void duplicate(r)} aria-label={`Duplicate ${titleOf(r)}`} title="Duplicate"><Icon name="copy" size={15} /></button>}
                      {!noDelete && <button type="button" className="adm-mini danger" onClick={() => void askDelete(r)} aria-label={`Delete ${titleOf(r)}`} title="Delete"><Icon name="trash" size={15} /></button>}
                    </span>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={columns.length + 3} className="center muted body-sm" style={{ padding: 28 }}>{search ? 'No matches.' : emptyText ?? 'Nothing here yet.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <RecordEditor
          key={editing.n}
          open
          onClose={() => setEditing(null)}
          col={col}
          record={editing.rec as any}
          blank={blank}
          tabs={tabs}
          fields={fields}
          preview={preview}
          wide={wide}
          title={editorTitle?.(editing.rec)}
          top={editorTop?.(editing.rec)}
        />
      )}
      <Modal
        open={!!del}
        onClose={() => !del?.busy && setDel(null)}
        title={del ? `Delete "${del.name}"?` : 'Delete'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)} disabled={del?.busy}>Cancel</Button>
            <Button variant="danger" onClick={() => void doDelete()} disabled={!del || del.loading || del.busy}>{del?.busy ? 'Deleting…' : del?.usage?.count ? 'Delete anyway' : 'Delete'}</Button>
          </>
        }
      >
        {del?.loading ? (
          <p className="body-sm muted">Checking where this is used…</p>
        ) : del?.usage && del.usage.count > 0 ? (
          <div className="adm-warn" role="alert">
            <Icon name="alert" size={18} />
            <div className="stack gap-8">
              <strong>This is used by {del.usage.label}.</strong>
              <span className="body-sm">Deleting it can break those records and remove it from their history. In most cases it's safer to <strong>switch it to inactive</strong> instead — it disappears from the public site, but everything that already uses it stays intact.</span>
            </div>
          </div>
        ) : (
          <p className="body-sm">Nothing currently uses this item. It will be removed permanently and can't be undone. Prefer hiding it? Switch it to inactive instead.</p>
        )}
      </Modal>
    </div>
  );
}
