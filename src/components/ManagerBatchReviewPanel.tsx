'use client';

import { ManagerReviewBatch } from '../types';
import { getManagerBatchBlueprintRank } from '../lib/managerReview';

export default function ManagerBatchReviewPanel({
  batch,
  blueprintId,
}: {
  batch: ManagerReviewBatch;
  blueprintId: string;
}) {
  const rank = getManagerBatchBlueprintRank(batch, blueprintId);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-accent)' }}>
          Packet context
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          This blueprint is part of a ranked 3-blueprint packet escalated by {batch.submittedBy.name}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
          <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Rank</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {rank ? `Top ${rank}` : 'Unranked'}
          </p>
        </div>
        <div className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
          <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Provider</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {batch.provider.toUpperCase()} {batch.fallback ? 'fallback' : 'primary'}
          </p>
        </div>
        <div className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
          <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Packet size</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {batch.blueprints.length} blueprints
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-accent)' }}>
            Current scoring assumptions
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            These are the actual assumptions currently driving the ranked packet scores.
          </p>
        </div>

        {batch.assumptions.map(assumption => (
          <div
            key={assumption.id}
            className="p-3"
            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {assumption.label}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {assumption.source}
                </p>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-1"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.22)',
                  color: 'var(--color-success)',
                }}
              >
                {assumption.confidence}
              </span>
            </div>

            <div className="p-3 mb-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Value</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {assumption.value}
              </p>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {assumption.impact}
            </p>

            {assumption.staleness ? (
              <p className="text-[11px] mt-2" style={{ color: 'var(--color-warning)' }}>
                {assumption.staleness}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {batch.managerNote ? (
        <div className="p-3" style={{ background: 'rgba(196,122,48,0.08)', border: '1px solid rgba(196,122,48,0.18)' }}>
          <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-warning)' }}>
            Latest manager note
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {batch.managerNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
