'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle, ChevronDown, ChevronUp, RefreshCw, SendHorizonal, TriangleAlert, Undo2 } from 'lucide-react';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import ManagerBatchReviewPanel from '../components/ManagerBatchReviewPanel';
import { useApp } from '../context/AppContext';
import { buildManagerBatchSyntheticRecord, getManagerBatchBlueprintRank, orderManagerBatchBlueprints } from '../lib/managerReview';
import { reevaluateBlueprintSet } from '../lib/reviewAssumptions';
import { Blueprint, ManagerReviewBatch, ScoringInsight } from '../types';

function splitValueParts(value: string): { type: 'text' | 'number'; content: string }[] {
  const parts: { type: 'text' | 'number'; content: string }[] = [];
  const regex = /(\d+(?:\.\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(value)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: value.slice(last, m.index) });
    parts.push({ type: 'number', content: m[0] });
    last = m.index + m[0].length;
  }
  if (last < value.length) parts.push({ type: 'text', content: value.slice(last) });
  return parts;
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <p className="font-display font-bold text-3xl mb-1" style={{ color }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
    </div>
  );
}

const STATUS_STYLES: Record<ScoringInsight['status'], { dot: string; text: string }> = {
  positive: { dot: 'var(--color-success)', text: 'var(--color-success)' },
  neutral: { dot: 'var(--color-warning)', text: 'var(--color-warning)' },
  warning: { dot: 'var(--color-danger)', text: 'var(--color-danger)' },
};

const INSIGHT_LABELS = ['Budget', 'Project Pipeline', 'Product Portfolio', 'Past Rejections', 'Market Research', 'HR & Execution', 'Legal & Compliance'];

function InsightCell({ insight }: { insight: ScoringInsight }) {
  const styles = STATUS_STYLES[insight.status];
  return (
    <div>
      <p className="font-mono font-bold text-base mb-1" style={{ color: styles.dot }}>
        {insight.score}<span className="text-xs font-normal opacity-50">/100</span>
      </p>
      <p className="text-xs leading-snug" style={{ color: styles.text }}>
        {insight.summary}
      </p>
    </div>
  );
}

function BatchCard({
  batch,
  onViewDetails,
}: {
  batch: ManagerReviewBatch;
  onViewDetails: (batch: ManagerReviewBatch, blueprintId: string) => void;
}) {
  const {
    managerUpdateAssumptionValue,
    managerApplyReevaluation,
    managerEscalateBatchToDirector,
    managerRejectBatch,
  } = useApp();
  const [expanded, setExpanded] = useState(batch.status === 'pending');
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [descalateOpen, setDescalateOpen] = useState(false);
  const [managerNote, setManagerNote] = useState(batch.managerNote ?? '');
  const [isReevaluating, setIsReevaluating] = useState(false);

  const displayBlueprints = useMemo<Blueprint[]>(() => {
    const reevaluated = reevaluateBlueprintSet(batch.blueprints, batch.assumptions, batch.baselineAssumptions);
    if (batch.rankingOrder.length > 0) {
      return batch.rankingOrder
        .map(id => reevaluated.find(bp => bp.id === id))
        .filter((bp): bp is Blueprint => Boolean(bp));
    }
    return reevaluated;
  }, [batch.blueprints, batch.assumptions, batch.rankingOrder]);

  const handleReevaluate = async () => {
    setIsReevaluating(true);
    try {
      const response = await fetch('/api/reevaluate-blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprints: batch.blueprints,
          assumptions: batch.assumptions,
          baselineAssumptions: batch.baselineAssumptions,
        }),
      });
      const data = await response.json();
      if (Array.isArray(data.blueprints) && typeof data.provider === 'string' && typeof data.fallback === 'boolean') {
        managerApplyReevaluation(batch.id, data.blueprints, data.provider, data.fallback);
      }
    } finally {
      setIsReevaluating(false);
    }
  };

  const isForwarded = batch.status === 'forwarded_to_director';
  const isReturned = batch.status === 'returned_to_employee';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: `1px solid ${isForwarded ? 'rgba(16,185,129,0.28)' : isReturned ? 'rgba(196,122,48,0.28)' : 'var(--color-border)'}`,
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="font-mono text-[10px] px-2 py-0.5"
                style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.26)' }}
              >
                {batch.submittedBy.department}
              </span>
              {isForwarded && (
                <span
                  className="font-mono text-[10px] px-2 py-0.5"
                  style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.24)' }}
                >
                  FORWARDED TO DIRECTOR
                </span>
              )}
              {isReturned && (
                <span
                  className="font-mono text-[10px] px-2 py-0.5"
                  style={{ background: 'rgba(196,122,48,0.12)', color: 'var(--color-warning)', border: '1px solid rgba(196,122,48,0.24)' }}
                >
                  RETURNED TO EMPLOYEE
                </span>
              )}
            </div>
            <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Ranked set from {batch.submittedBy.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {batch.blueprints.length} blueprints · {batch.escalatedAt}
            </p>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-2 transition-colors rounded shrink-0"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-panel)' }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              {/* Blueprint grid — same structure as BlueprintArena */}
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${220 + displayBlueprints.length * 220}px` }}>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `220px repeat(${displayBlueprints.length}, minmax(220px, 1fr))` }}
                  >
                    {/* Header row — label cell */}
                    <div
                      className="p-5"
                      style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                    >
                      <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        Blueprint comparison
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        Ranks set by employee. Scores update when assumptions change.
                      </p>
                    </div>

                    {/* Header row — blueprint columns */}
                    {displayBlueprints.map((bp, idx) => (
                      <div
                        key={bp.id}
                        className="p-5"
                        style={{
                          borderLeft: idx === 0 ? 'none' : '1px solid var(--color-border)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <p className="text-[10px] font-mono mb-2" style={{ color: bp.accentColor }}>
                          Rank {idx + 1}
                        </p>
                        <h3 className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                          {bp.title}
                        </h3>
                        <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                          {bp.department}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Total score</span>
                          <span className="font-display font-bold text-xl" style={{ color: bp.accentColor }}>
                            {bp.scores.total}
                          </span>
                        </div>
                        <button
                          onClick={() => onViewDetails(batch, bp.id)}
                          className="w-full py-2 text-xs font-medium transition-all hover:opacity-80 flex items-center justify-center gap-1"
                          style={{ background: 'transparent', border: `1px solid ${bp.color}30`, color: bp.accentColor }}
                        >
                          View Full Details
                        </button>
                      </div>
                    ))}

                    {/* Insight rows */}
                    {INSIGHT_LABELS.map((label, labelIndex) => (
                      <div key={label} className="contents">
                        <div
                          className="p-5"
                          style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                        >
                          <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {label}
                          </p>
                        </div>
                        {displayBlueprints.map((bp, colIndex) => (
                          <div
                            key={`${label}-${bp.id}`}
                            className="p-5"
                            style={{
                              borderLeft: colIndex === 0 ? 'none' : '1px solid var(--color-border)',
                              borderBottom: '1px solid var(--color-border)',
                            }}
                          >
                            <InsightCell insight={bp.scoringInsights[labelIndex]} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shared Assumptions collapsible */}
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setAssumptionsOpen(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span>Shared Assumptions</span>
                  {assumptionsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {assumptionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 grid gap-3 md:grid-cols-2">
                        <p className="text-xs md:col-span-2" style={{ color: 'var(--color-text-muted)' }}>
                          Edit the scoring assumptions below — scores update live against the original blueprint baseline.
                        </p>
                        {batch.assumptions.map(assumption => (
                          <div key={assumption.id} className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="text-xs font-mono uppercase" style={{ color: 'var(--color-accent)' }}>
                                  {assumption.label}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                  {assumption.source}
                                </p>
                              </div>
                              <span
                                className="text-[10px] font-mono px-2 py-0.5 shrink-0"
                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', color: 'var(--color-success)' }}
                              >
                                {assumption.confidence}
                              </span>
                            </div>
                            <div
                              className="flex items-center flex-wrap px-3 py-2 font-mono text-sm"
                              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', minHeight: '38px', gap: 0 }}
                            >
                              {splitValueParts(assumption.value).map((part, idx) =>
                                part.type === 'text' ? (
                                  <span key={idx} className="select-none" style={{ color: 'var(--color-text-muted)' }}>
                                    {part.content}
                                  </span>
                                ) : (
                                  <input
                                    key={idx}
                                    type="text"
                                    inputMode="numeric"
                                    value={part.content}
                                    onChange={e => {
                                      const val = e.target.value.replace(/[^\d.]/g, '');
                                      const parts = splitValueParts(assumption.value);
                                      managerUpdateAssumptionValue(
                                        batch.id,
                                        assumption.id,
                                        parts.map((p, i) => (i === idx ? val : p.content)).join(''),
                                      );
                                    }}
                                    className="text-center outline-none bg-transparent font-mono"
                                    style={{
                                      width: `${Math.max(3, part.content.length + 1)}ch`,
                                      color: 'var(--color-text-primary)',
                                      borderBottom: '1px solid rgba(37,99,235,0.5)',
                                    }}
                                  />
                                )
                              )}
                            </div>
                            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                              {assumption.impact}
                            </p>
                            {assumption.staleness && (
                              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-warning)' }}>
                                {assumption.staleness}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions footer */}
              <div className="px-5 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleReevaluate}
                      disabled={isReevaluating || isForwarded}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <RefreshCw size={14} className={isReevaluating ? 'animate-spin' : ''} />
                      {isReevaluating ? 'Reevaluating...' : 'Reevaluate with Z.AI'}
                    </button>
                    {!isForwarded && (
                      <button
                        onClick={() => setDescalateOpen(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                        style={{ background: 'rgba(196,122,48,0.1)', border: '1px solid rgba(196,122,48,0.24)', color: 'var(--color-warning)' }}
                      >
                        <Undo2 size={14} />
                        De-escalate
                      </button>
                    )}
                  </div>
                  {isForwarded ? (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm" style={{ color: 'var(--color-success)' }}>
                      <CheckCircle size={14} />
                      Forwarded to Director
                    </div>
                  ) : (
                    <button
                      onClick={() => managerEscalateBatchToDirector(batch.id)}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        boxShadow: '0 0 16px rgba(37,99,235,0.25)',
                      }}
                    >
                      Escalate to Director
                      <SendHorizonal size={14} />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {descalateOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 flex items-start gap-2">
                        <textarea
                          value={managerNote}
                          onChange={e => setManagerNote(e.target.value)}
                          rows={2}
                          placeholder="Reason for de-escalation..."
                          className="flex-1 px-3 py-2 text-sm resize-none"
                          style={{ background: 'var(--color-bg-panel)', border: '1px solid rgba(196,122,48,0.35)', color: 'var(--color-text-primary)' }}
                        />
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => { managerRejectBatch(batch.id, managerNote); setDescalateOpen(false); }}
                            disabled={!managerNote.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                            style={{ background: 'rgba(196,122,48,0.15)', border: '1px solid rgba(196,122,48,0.35)', color: 'var(--color-warning)' }}
                          >
                            <SendHorizonal size={13} />
                            Send Back
                          </button>
                          <button
                            onClick={() => setDescalateOpen(false)}
                            className="px-4 py-2 text-sm transition-all hover:opacity-70"
                            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DeptHeadReview() {
  const { managerPendingBatches, managerReturnedBatches, managerForwardedBatches } = useApp();
  const [modalState, setModalState] = useState<{ batchId: string; blueprintId: string } | null>(null);

  const allBatches = [...managerPendingBatches, ...managerForwardedBatches, ...managerReturnedBatches];
  const modalBatch = modalState ? allBatches.find(batch => batch.id === modalState.batchId) ?? null : null;
  const modalBlueprint = modalBatch && modalState
    ? orderManagerBatchBlueprints(modalBatch).find(blueprint => blueprint.id === modalState.blueprintId) ?? null
    : null;

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs mb-3" style={{ color: 'var(--color-accent)' }}>
            MANAGER REVIEW
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Ranked employee blueprint review
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Review each employee packet as one batch, inspect the 3 ranked blueprints, edit only the assumption values, reevaluate the set, and either select one blueprint for director escalation or return the packet to the employee.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <SummaryCard label="Total review batches" value={allBatches.length} color="var(--color-text-primary)" />
          <SummaryCard label="Awaiting manager review" value={managerPendingBatches.length} color="var(--color-warning)" />
          <SummaryCard label="Forwarded to Director" value={managerForwardedBatches.length} color="var(--color-success)" />
          <SummaryCard label="Returned to Employee" value={managerReturnedBatches.length} color="var(--color-accent)" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Awaiting review
              </h2>
              <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {managerPendingBatches.length} pending
              </span>
            </div>
            {managerPendingBatches.length > 0 ? (
              managerPendingBatches.map(batch => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onViewDetails={(targetBatch, blueprintId) => setModalState({ batchId: targetBatch.id, blueprintId })}
                />
              ))
            ) : (
              <div className="p-8 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <p className="font-display font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  No ranked batches waiting
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  New employee ranking packets will appear here once staff escalate their Top 1, Top 2, and Top 3 blueprint set.
                </p>
              </div>
            )}
          </section>

          {managerForwardedBatches.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Forwarded to director
                </h2>
                <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {managerForwardedBatches.length} forwarded
                </span>
              </div>
              {managerForwardedBatches.map(batch => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onViewDetails={(targetBatch, blueprintId) => setModalState({ batchId: targetBatch.id, blueprintId })}
                />
              ))}
            </section>
          ) : null}

          {managerReturnedBatches.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Returned to employee
                </h2>
                <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {managerReturnedBatches.length} returned
                </span>
              </div>
              {managerReturnedBatches.map(batch => (
                <div
                  key={batch.id}
                  className="p-5"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(196,122,48,0.24)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {batch.submittedBy.name} returned ranked packet
                      </p>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {batch.submission.problemStatement}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-warning)' }}>
                        {batch.managerNote ?? 'Returned with updated assumption values.'}
                      </p>
                    </div>
                    <TriangleAlert size={18} style={{ color: 'var(--color-warning)' }} />
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </motion.div>
      </div>

      <AnimatePresence>
        {modalBatch && modalBlueprint ? (
          <BlueprintDetailModal
            record={buildManagerBatchSyntheticRecord(modalBatch, modalBlueprint)}
            isForwarded={modalBatch.status === 'forwarded_to_director'}
            onClose={() => setModalState(null)}
            statusLabel={`Manager batch review | Top ${getManagerBatchBlueprintRank(modalBatch, modalBlueprint.id) ?? '--'}`}
            reviewPanel={<ManagerBatchReviewPanel batch={modalBatch} blueprintId={modalBlueprint.id} />}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
