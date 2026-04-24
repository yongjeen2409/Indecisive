'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, CheckCircle, X } from 'lucide-react';
import { Blueprint } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AssumptionStatus = 'pending' | 'confirmed' | 'corrected' | 'rejected';
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

interface Assumption {
  id: string;
  label: string;
  value: string;
  source: string;
  staleness: string | null;
  confidence: Confidence;
  impact: string;
  status: AssumptionStatus;
  correctedValue?: string;
  updatedRoi?: string;
  roiExplanation?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAssumptions(bp: Blueprint): Assumption[] {
  return [
    {
      id: 'budget',
      label: 'Implementation Budget',
      value: bp.financeModel.capex,
      source: 'Finance System · Q1 Budget Report',
      staleness: null,
      confidence: 'HIGH',
      impact: `ROI drops ~${Math.round(bp.financeModel.roiValue * 0.15)}% if budget overruns 20%`,
      status: 'pending',
    },
    {
      id: 'roi',
      label: 'Projected Annual ROI',
      value: bp.financeModel.roi,
      source: 'Finance Model · April 2025 Projection',
      staleness: 'Source is 12 months old',
      confidence: 'MEDIUM',
      impact: `Payback period extends to ${bp.financeModel.paybackMonths + 5} months if ROI is 20% lower than projected`,
      status: 'pending',
    },
    {
      id: 'headcount',
      label: 'Team Capacity Required',
      value: '6 FTEs · 3 months',
      source: 'HR System · Current Allocation Report',
      staleness: null,
      confidence: 'HIGH',
      impact: 'Timeline slips 6 weeks and costs increase ~15% if headcount unavailable in Q2',
      status: 'pending',
    },
    {
      id: 'payback',
      label: 'Payback Period',
      value: bp.financeModel.paybackPeriod,
      source: 'Finance Model · April 2026',
      staleness: null,
      confidence: 'MEDIUM',
      impact: 'Budget approval threshold exceeded if payback extends beyond 24 months',
      status: 'pending',
    },
  ];
}

function confidenceMeta(conf: Confidence) {
  if (conf === 'HIGH') return { bg: 'rgba(92,128,101,0.12)', color: 'var(--color-success)', border: 'rgba(92,128,101,0.3)' };
  if (conf === 'MEDIUM') return { bg: 'rgba(201,138,68,0.12)', color: 'var(--color-warning)', border: 'rgba(201,138,68,0.3)' };
  return { bg: 'rgba(184,74,57,0.12)', color: 'var(--color-danger)', border: 'rgba(184,74,57,0.3)' };
}

// ─── Assumption card ──────────────────────────────────────────────────────────

function AssumptionCard({
  assumption,
  blueprintTitle,
  blueprintRoi,
  onConfirm,
  onReject,
  onCorrect,
}: {
  assumption: Assumption;
  blueprintTitle: string;
  blueprintRoi: string;
  onConfirm: () => void;
  onReject: () => void;
  onCorrect: (value: string, updatedRoi: string, explanation: string) => void;
}) {
  const [correcting, setCorrecting] = useState(false);
  const [correctedInput, setCorrectedInput] = useState('');
  const [recalcLoading, setRecalcLoading] = useState(false);
  const conf = confidenceMeta(assumption.confidence);
  const isDone = assumption.status !== 'pending';

  async function handleSubmitCorrection() {
    if (!correctedInput.trim()) return;
    setRecalcLoading(true);
    try {
      const res = await fetch('/api/recalculate-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assumptionLabel: assumption.label,
          oldValue: assumption.value,
          newValue: correctedInput.trim(),
          currentRoi: blueprintRoi,
          blueprintTitle,
        }),
      });
      const data = await res.json();
      onCorrect(correctedInput.trim(), data.updatedRoi ?? blueprintRoi, data.explanation ?? '');
    } catch {
      onCorrect(correctedInput.trim(), blueprintRoi, `${assumption.label} corrected to "${correctedInput.trim()}".`);
    } finally {
      setRecalcLoading(false);
      setCorrecting(false);
    }
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        border: `1px solid ${isDone ? (assumption.status === 'rejected' ? 'rgba(184,74,57,0.3)' : assumption.status === 'corrected' ? 'rgba(201,138,68,0.3)' : 'rgba(92,128,101,0.3)') : 'var(--color-border)'}`,
        background: isDone
          ? assumption.status === 'rejected'
            ? 'rgba(184,74,57,0.04)'
            : assumption.status === 'corrected'
              ? 'rgba(201,138,68,0.04)'
              : 'rgba(92,128,101,0.04)'
          : 'var(--color-bg-panel)',
        opacity: isDone ? 0.9 : 1,
      }}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-mono text-[10px] px-1.5 py-0.5"
                style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }}
              >
                {assumption.confidence}
              </span>
              {isDone && (
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 flex items-center gap-1"
                  style={{
                    background: assumption.status === 'rejected' ? 'rgba(184,74,57,0.1)' : assumption.status === 'corrected' ? 'rgba(201,138,68,0.1)' : 'rgba(92,128,101,0.1)',
                    color: assumption.status === 'rejected' ? 'var(--color-danger)' : assumption.status === 'corrected' ? 'var(--color-warning)' : 'var(--color-success)',
                    border: `1px solid ${assumption.status === 'rejected' ? 'rgba(184,74,57,0.3)' : assumption.status === 'corrected' ? 'rgba(201,138,68,0.3)' : 'rgba(92,128,101,0.3)'}`,
                  }}
                >
                  {assumption.status === 'confirmed' && <CheckCircle size={9} />}
                  {assumption.status.toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {assumption.label}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {assumption.correctedValue ?? assumption.value}
            </p>
            {assumption.correctedValue && (
              <p className="text-[10px] line-through" style={{ color: 'var(--color-text-muted)' }}>
                was: {assumption.value}
              </p>
            )}
          </div>
        </div>

        {/* Source */}
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{assumption.source}</p>
          {assumption.staleness && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-warning)' }}>
              <AlertTriangle size={10} />
              {assumption.staleness}
            </span>
          )}
        </div>

        {/* Impact */}
        <div className="px-3 py-2 mb-3 text-xs" style={{ background: 'var(--color-bg-deep)', border: '1px solid var(--color-border)' }}>
          <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>IMPACT: </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{assumption.impact}</span>
        </div>

        {/* Updated ROI after correction */}
        {assumption.updatedRoi && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 px-3 py-2 text-xs"
            style={{ background: 'rgba(92,128,101,0.08)', border: '1px solid rgba(92,128,101,0.25)' }}
          >
            <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>UPDATED ROI: </span>
            <span className="font-bold" style={{ color: 'var(--color-success)' }}>{assumption.updatedRoi}</span>
            {assumption.roiExplanation && (
              <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{assumption.roiExplanation}</p>
            )}
          </motion.div>
        )}

        {/* Inline correction input */}
        <AnimatePresence>
          {correcting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={correctedInput}
                  onChange={e => setCorrectedInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitCorrection()}
                  placeholder={`Enter corrected value for ${assumption.label}…`}
                  className="flex-1 px-3 py-2 text-sm"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid rgba(201,138,68,0.4)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  onClick={handleSubmitCorrection}
                  disabled={!correctedInput.trim() || recalcLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium disabled:opacity-50 transition-all hover:opacity-80"
                  style={{ background: 'var(--color-primary)', color: '#fff' }}
                >
                  {recalcLoading ? 'Recalculating…' : <><Check size={12} /> Confirm</>}
                </button>
                <button
                  onClick={() => { setCorrecting(false); setCorrectedInput(''); }}
                  className="px-2 py-2 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {!isDone && !correcting && (
          <div className="flex items-center gap-2">
            <button
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(92,128,101,0.1)', border: '1px solid rgba(92,128,101,0.3)', color: 'var(--color-success)' }}
            >
              <CheckCircle size={12} />
              Confirm
            </button>
            <button
              onClick={() => setCorrecting(true)}
              className="px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(201,138,68,0.1)', border: '1px solid rgba(201,138,68,0.3)', color: 'var(--color-warning)' }}
            >
              Correct
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(184,74,57,0.1)', border: '1px solid rgba(184,74,57,0.3)', color: 'var(--color-danger)' }}
            >
              <X size={12} />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AssumptionAudit({
  blueprint,
  onAllActioned,
}: {
  blueprint: Blueprint;
  onAllActioned?: () => void;
}) {
  const [assumptions, setAssumptions] = useState<Assumption[]>(() => buildAssumptions(blueprint));

  const actioned = assumptions.filter(a => a.status !== 'pending').length;
  const allDone = actioned === assumptions.length;

  function update(id: string, patch: Partial<Assumption>) {
    const next = assumptions.map(a => (a.id === id ? { ...a, ...patch } : a));
    setAssumptions(next);
    if (next.every(a => a.status !== 'pending')) {
      onAllActioned?.();
    }
  }

  return (
    <div className="space-y-4 mt-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Assumption Audit
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Verify each assumption before escalating to the Director.
          </p>
        </div>
        <div className="text-right">
          <span
            className="font-mono text-[11px] px-2 py-1"
            style={{
              background: allDone ? 'rgba(92,128,101,0.1)' : 'var(--color-bg-deep)',
              border: `1px solid ${allDone ? 'rgba(92,128,101,0.3)' : 'var(--color-border)'}`,
              color: allDone ? 'var(--color-success)' : 'var(--color-text-muted)',
            }}
          >
            {actioned}/{assumptions.length} reviewed
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {assumptions.map(assumption => (
          <AssumptionCard
            key={assumption.id}
            assumption={assumption}
            blueprintTitle={blueprint.title}
            blueprintRoi={blueprint.financeModel.roi}
            onConfirm={() => update(assumption.id, { status: 'confirmed' })}
            onReject={() => update(assumption.id, { status: 'rejected' })}
            onCorrect={(val, roi, exp) =>
              update(assumption.id, { status: 'corrected', correctedValue: val, updatedRoi: roi, roiExplanation: exp })
            }
          />
        ))}
      </div>

      {!allDone && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Review all {assumptions.length} assumptions to enable escalation.
        </p>
      )}
    </div>
  );
}
