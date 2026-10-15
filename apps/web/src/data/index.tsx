import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActionName, ActionPayload, ActionResult, CollectionName, Rec, RecOf, User } from '@shift/core';
import type { DataClient } from './client';
import { HttpClient } from './http';
import { LocalClient } from './local';

export { ClientError } from './client';
export type { DataClient } from './client';

export const client: DataClient = __DEMO__ ? new LocalClient() : new HttpClient();
export const isDemo = client.mode === 'local';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: (n, e) => n < 1 && (e as { status?: number }).status !== 401 && (e as { status?: number }).status !== 403, refetchOnWindowFocus: false } } });

// ───────────────────────────── auth
interface AuthState {
  user: Rec<User> | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<Rec<User>>;
  loginAs: (userId: string) => Promise<Rec<User>>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
const AuthCtx = createContext<AuthState | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rec<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const refresh = useCallback(async () => {
    try {
      setUser(await client.me());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login: async (email, password) => {
      const u = await client.login(email, password);
      setUser(u);
      qc.clear();
      return u;
    },
    loginAs: async (id) => {
      if (!client.loginAs) throw new Error('Not available');
      const u = await client.loginAs(id);
      setUser(u);
      qc.clear();
      return u;
    },
    logout: async () => {
      await client.logout();
      setUser(null);
      qc.clear();
    },
    refresh,
  }), [user, loading, qc, refresh]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth outside DataProvider');
  return v;
}

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

// ───────────────────────────── queries
/** List a collection (active items only for the public; admin sees inactive too). */
export function useList<C extends CollectionName>(col: C, where?: Record<string, unknown>, opts: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['c', col, where ?? null, user?.id ?? null],
    queryFn: () => client.list(col, where),
    enabled: opts.enabled ?? true,
  });
}
/** Active items only, even for admins (what the public site shows). */
export function usePublicList<C extends CollectionName>(col: C, where?: Record<string, unknown>) {
  const q = useList(col, where);
  const data = useMemo(() => q.data?.filter((r) => r.active), [q.data]);
  return { ...q, data };
}
export function useRecord<C extends CollectionName>(col: C, id: string | undefined) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['c', col, 'id', id, user?.id ?? null], queryFn: () => client.get(col, id!), enabled: !!id });
}
/** Singleton master record (settings, branding, freeTool, blueprint). */
export function useSingleton<C extends 'settings' | 'branding' | 'freeTool' | 'blueprint'>(col: C): RecOf<C> | undefined {
  const q = useList(col);
  return q.data?.[0];
}
export const useSettings = () => useSingleton('settings');
export const useBranding = () => useSingleton('branding');

/** A content page's editable copy. */
export function usePage<T = Record<string, any>>(slug: string): T | undefined {
  const q = useList('pages');
  return q.data?.find((p) => p.slug === slug)?.content as T | undefined;
}

// ───────────────────────────── mutations
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['c'] });
}
export function useAction<N extends ActionName>(name: N) {
  const invalidate = useInvalidate();
  return useMutation<ActionResult<N>, Error, ActionPayload<N>>({ mutationFn: (p) => client.action(name, p), onSuccess: () => void invalidate() });
}
export function useCrud<C extends CollectionName>(col: C) {
  const invalidate = useInvalidate();
  const create = useMutation({ mutationFn: (data: Record<string, unknown>) => client.create(col, data), onSuccess: () => void invalidate() });
  const update = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => client.update(col, id, patch), onSuccess: () => void invalidate() });
  const remove = useMutation({ mutationFn: (id: string) => client.remove(col, id), onSuccess: () => void invalidate() });
  const reorder = useMutation({ mutationFn: (ids: string[]) => client.reorder(col, ids), onSuccess: () => void invalidate() });
  return { create, update, remove, reorder };
}
export { useQueryClient };
