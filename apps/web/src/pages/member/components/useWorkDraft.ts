import { useCallback, useEffect, useRef, useState } from 'react';
import type { Rec, Work } from '@shift/core';
import { useAction } from '@/data';
import { useAutosave } from '@/ui/kit';

export interface WorkDraft { reflections: Record<string, string>; tool: Record<string, unknown>; nextStep: { text: string; checklist?: Record<string, boolean> } }

/**
 * Local, autosaving copy of one `work` record (a lesson, stage reflection or checkpoint).
 * The draft is seeded once from the server and is the single source of truth while the page is open,
 * so background refetches never clobber what the person is typing. Every autosave sends the whole draft.
 */
export function useWorkDraft(context: string, work: Rec<Work> | undefined, ready: boolean) {
  const save = useAction('saveWork');
  const [draft, setDraft] = useState<WorkDraft | null>(null);
  const draftRef = useRef<WorkDraft | null>(null);
  const ctxRef = useRef(context);

  useEffect(() => {
    if (ctxRef.current !== context) {
      ctxRef.current = context;
      draftRef.current = null;
      setDraft(null);
    }
  }, [context]);

  useEffect(() => {
    if (ready && !draftRef.current) {
      const d: WorkDraft = {
        reflections: { ...(work?.reflections ?? {}) },
        tool: { ...(work?.tool ?? {}) },
        nextStep: { text: '', ...(work?.nextStep ?? {}) },
      };
      draftRef.current = d;
      setDraft(d);
    }
  }, [ready, work, context, draft]);

  const pending = useRef(false);
  const saveRef = useRef(save.mutateAsync);
  saveRef.current = save.mutateAsync;
  const [status, trigger] = useAutosave<WorkDraft>((d) => saveRef.current({ context: ctxRef.current, patch: d }).finally(() => { pending.current = false; }));

  // Flush an unsaved edit if the page is left before the debounce fires.
  useEffect(() => () => {
    if (pending.current && draftRef.current) void saveRef.current({ context: ctxRef.current, patch: draftRef.current }).catch(() => undefined);
  }, []);

  const update = useCallback((fn: (d: WorkDraft) => WorkDraft) => {
    const base = draftRef.current ?? { reflections: {}, tool: {}, nextStep: { text: '' } };
    const next = fn(base);
    draftRef.current = next;
    pending.current = true;
    setDraft(next);
    trigger(next);
  }, [trigger]);

  const setReflection = useCallback((id: string, v: string) => update((d) => ({ ...d, reflections: { ...d.reflections, [id]: v } })), [update]);
  const setTool = useCallback((patch: Record<string, unknown>) => update((d) => ({ ...d, tool: { ...d.tool, ...patch } })), [update]);
  const setNext = useCallback((patch: Partial<WorkDraft['nextStep']>) => update((d) => ({ ...d, nextStep: { ...d.nextStep, ...patch } })), [update]);

  /** Immediate save of the draft plus extra fields (step, completed…). */
  const commit = useCallback(
    (extra: Partial<Work> = {}) => {
      pending.current = false;
      return saveRef.current({ context: ctxRef.current, patch: { ...(draftRef.current ?? {}), ...extra } });
    },
    [],
  );

  return { draft, status, setReflection, setTool, setNext, commit, saving: save.isPending };
}
