import type { Lesson, Rec } from '@shift/core';
import type { Journey } from '../useJourney';

export interface ToolProps {
  j: Journey;
  lesson: Rec<Lesson>;
  /** The lesson's autosaved `work.tool` draft. */
  tool: Record<string, unknown>;
  setTool: (patch: Record<string, unknown>) => void;
  /** Replace the footer's primary action. Return true to continue to the next step. */
  registerSave: (fn: (() => Promise<boolean>) | null) => void;
  /** Go to the Next Step screen. */
  onContinue: () => void;
  /** Hide the step footer (e.g. while a confirmation screen is showing). */
  hideFooter: (hidden: boolean) => void;
}

export const str = (v: unknown) => (typeof v === 'string' ? v : '');
export const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
export const obj = <T = Record<string, unknown>>(v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : ({} as T));
