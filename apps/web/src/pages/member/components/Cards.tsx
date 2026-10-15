import type { ReactNode } from 'react';
import type { FutureSelfCard, Goal, Rec } from '@shift/core';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/kit';

/** "My SMART Goal" summary card (Brain & Behaviour next step, dashboard Goals tab). */
export function SmartGoalCard({ goal, image, imageQuote, editTo, title = 'My SMART Goal', firstStep }: { goal: Rec<Goal>; image?: string; imageQuote?: string; editTo?: string; title?: string; firstStep?: ReactNode }) {
  const rows: { icon: string; label: string; value: ReactNode }[] = [
    { icon: 'target', label: title, value: goal.statement },
    { icon: 'heart', label: 'Why this matters to me', value: goal.why },
    { icon: 'leaf', label: 'Aligned with my values', value: goal.values.join(' • ') },
    { icon: 'user', label: 'Aligned with my future self', value: goal.futureSelf },
    { icon: 'calendar', label: 'Timeline', value: goal.timeline },
    { icon: 'pencil', label: 'My first step', value: firstStep ?? goal.firstStep },
  ].filter((r) => r.value);
  return (
    <section className="m-goalcard" aria-label={title}>
      <div className="row between gap-8">
        <h3 className="h4">{title}</h3>
        {editTo && <Button size="sm" variant="ghost" to={editTo}>Edit</Button>}
      </div>
      {image && <Art src={image} quote={imageQuote} quotePos="tl" quoteSize={24} className="rounded ratio-16x9 m-goalcard-art" />}
      <ul className="m-goalrows">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="icon-circle sm" aria-hidden="true"><Icon name={r.icon} size={16} /></span>
            <span className="stack"><strong className="body-sm">{r.label}</strong><span className="body-sm muted">{r.value}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const COMMIT_ICONS = ['heart', 'leaf', 'people', 'target', 'sun', 'star'];

/** "My Future Self" card: art + statement, qualities and commitments with icons. */
export function FutureSelfCardView({ card, image = 'coast', quote, editTo, title = 'My Future Self', heading = "The person I'm becoming" }: { card: Rec<FutureSelfCard>; image?: string; quote?: string; editTo?: string; title?: string; heading?: string }) {
  return (
    <section className="card m-fscard" aria-label={title}>
      <div className="row between gap-8" style={{ marginBottom: 12 }}>
        <h3 className="h4">{title}</h3>
        {editTo && <Button size="sm" variant="ghost" to={editTo}>Edit</Button>}
      </div>
      <div className="m-fscard-body">
        <Art src={image} quote={quote} quotePos="tl" quoteSize={30} className="rounded-lg m-fscard-art" />
        <div className="stack gap-12">
          <div className="stack gap-4">
            <strong className="serif h4">{heading}</strong>
            <span className="body-sm muted">{card.qualities.map((q) => q.name).join(' · ')}</span>
            {card.statement && <p className="body-sm italic">“{card.statement}”</p>}
          </div>
          <ul className="m-commitments">
            {card.commitments.map((c, i) => (
              <li key={i}>
                <span className={`icon-circle sm ${i % 2 ? 'sage' : ''}`} aria-hidden="true"><Icon name={COMMIT_ICONS[i % COMMIT_ICONS.length]} size={15} /></span>
                <span className="body-sm">{c}</span>
              </li>
            ))}
          </ul>
          {editTo && <Button to={editTo} arrow block>Edit My Vision</Button>}
        </div>
      </div>
    </section>
  );
}
