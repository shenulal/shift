import { useEffect, useState } from 'react';
import { addDays, DAY_LETTERS, DAY_SHORT, firstHabitWeek, fmtWeekRange, habitWeek, isoDate, latestHabitWeek, now, overallWeek, parseDate, weekStart, type Habit, type HabitCheck, type Rec } from '@shift/core';
import { useAction } from '@/data';
import { Icon } from '@/ui/Icon';
import { IconButton, Ring, useToast } from '@/ui/kit';
import { tone } from './ui';

/** Default week: this week, or — if nothing is logged yet this week — the latest week that has check-ins. */
export function defaultHabitWeek(habits: Rec<Habit>[], checks: HabitCheck[]) {
  const thisWeek = weekStart(now());
  if (!checks.length) return thisWeek;
  if (overallWeek(habits, checks, thisWeek).started) return thisWeek;
  return latestHabitWeek(checks) ?? thisWeek;
}

export function useHabitWeek(habits: Rec<Habit>[] | undefined, checks: HabitCheck[] | undefined) {
  const [monday, setMonday] = useState<Date | null>(null);
  useEffect(() => {
    if (!monday && habits && checks) setMonday(defaultHabitWeek(habits, checks));
  }, [monday, habits, checks]);
  return [monday ?? weekStart(now()), setMonday] as const;
}

export function WeekNav({ monday, onChange, label }: { monday: Date; onChange: (d: Date) => void; label?: string }) {
  return (
    <div className="m-weeknav" role="group" aria-label="Week">
      <IconButton icon="chevron-left" label="Previous week" size="sm" onClick={() => onChange(addDays(monday, -7))} />
      <span className="m-weeknav-label" aria-live="polite">{label ?? `Week of ${fmtWeekRange(monday)}`}</span>
      <IconButton icon="chevron-right" label="Next week" size="sm" onClick={() => onChange(addDays(monday, 7))} />
    </div>
  );
}

export function DayPills({ days, size = 'sm' }: { days: number[]; size?: 'sm' | 'xs' }) {
  return (
    <span className={`m-daypills ${size}`} aria-label={`Planned: ${days.map((d) => DAY_SHORT[d]).join(', ') || 'none'}`}>
      {DAY_LETTERS.map((l, i) => <span key={i} className={days.includes(i) ? 'on' : ''} aria-hidden="true">{l}</span>)}
    </span>
  );
}

export const habitTone = (h: Pick<Habit, 'color'>) => tone(h.color);

/** One tickable day cell: done (deep green ✓), missed (rose ✗), planned-empty (white) or unplanned (grey). */
function DayCell({ habit, date, planned, status, dayLabel }: { habit: Rec<Habit>; date: string; planned: boolean; status: 'done' | 'missed' | null; dayLabel: string }) {
  const toggle = useAction('toggleHabitCheck');
  const toast = useToast();
  const future = parseDate(date) > now();
  const cls = status === 'done' ? 'done' : status === 'missed' ? 'missed' : planned ? 'empty' : 'off';
  const label = `${habit.name}, ${dayLabel}: ${status === 'done' ? 'done' : status === 'missed' ? 'missed' : planned ? 'not logged' : 'not planned'}`;
  if (!planned && !status) return <span className={`m-cell ${cls}`} title={`${dayLabel} · not planned`}><span className="m-cell-dash" aria-hidden="true" /><span className="sr-only">{label}</span></span>;
  return (
    <button
      type="button"
      className={`m-cell ${cls} ${future ? 'future' : ''}`}
      aria-label={`${label}. Tap to change.`}
      title={label}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ habitId: habit.id, date }, { onError: (e) => toast(e.message, true) })}
    >
      {status === 'done' && <Icon name="check" size={16} stroke={2.4} />}
      {status === 'missed' && <Icon name="x" size={16} stroke={2.2} />}
    </button>
  );
}

/** Weekly habit grid. mode="planner" shows planned-day pills + edit/delete; mode="progress" adds a completion ring per habit. */
export function HabitGrid({ habits, checks, monday, mode, onEdit, onDelete }: { habits: Rec<Habit>[]; checks: HabitCheck[]; monday: Date; mode: 'planner' | 'progress'; onEdit?: (h: Rec<Habit>) => void; onDelete?: (h: Rec<Habit>) => void }) {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const today = isoDate(now());
  return (
    <div className="scroll-x m-gridwrap">
      <table className="table m-habit-table">
        <thead>
          <tr>
            <th scope="col">Habit</th>
            <th scope="col">Planned days</th>
            {mode === 'planner' && <th scope="col"><span className="sr-only">Actions</span></th>}
            {dates.map((d, i) => (
              <th key={i} scope="col" className={`m-daycol ${isoDate(d) === today ? 'today' : ''}`}>
                {mode === 'progress' ? `${DAY_SHORT[i]} ${d.getDate()}` : DAY_LETTERS[i]}
              </th>
            ))}
            {mode === 'progress' && <th scope="col">Completion rate</th>}
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const w = habitWeek(h, checks, monday);
            return (
              <tr key={h.id}>
                <th scope="row" className="m-habit-name">
                  <div className="m-habit-name-in">
                  <span className={`m-habit-ic ${habitTone(h)}`} aria-hidden="true"><Icon name={h.icon} size={18} /></span>
                  <span className="stack">
                    <span>{h.name}</span>
                    <span className="body-sm muted">{h.detail}</span>
                  </span>
                  </div>
                </th>
                <td><DayPills days={h.days} /></td>
                {mode === 'planner' && (
                  <td className="m-habit-actions">
                    {onEdit && <IconButton icon="edit" size="sm" label={`Edit ${h.name}`} onClick={() => onEdit(h)} />}
                    {onDelete && <IconButton icon="trash" size="sm" label={`Delete ${h.name}`} onClick={() => onDelete(h)} />}
                  </td>
                )}
                {w.days.map((d, i) => (
                  <td key={d.date} className="m-daycol">
                    <DayCell habit={h} date={d.date} planned={d.planned} status={d.status} dayLabel={`${DAY_SHORT[i]} ${dates[i].getDate()}`} />
                  </td>
                ))}
                {mode === 'progress' && (
                  <td>
                    <span className="row gap-12">
                      <Ring pct={w.pct} size={44} stroke={5} label="" />
                      <span className="stack">
                        <span className="serif" style={{ fontSize: 18 }}>{w.pct}%</span>
                        <span className="body-sm muted">{w.done} of {w.planned} planned days</span>
                      </span>
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Week number relative to the first week with check-ins (Week 1, Week 2…). */
export function weekNumber(checks: HabitCheck[], monday: Date) {
  const first = firstHabitWeek(checks);
  if (!first) return 1;
  return Math.round((monday.getTime() - first.getTime()) / (7 * 864e5)) + 1;
}
