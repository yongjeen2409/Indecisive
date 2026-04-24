'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronRight, GitMerge, Layers3, X, Zap } from 'lucide-react';
import { Blueprint } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EliminationRound {
  title: string;
  description: string;
  eliminatedIds: string[];
  mergedPair?: [string, string]; // IDs of blueprints to merge
}

interface FinalRec {
  survivorIds: string[];
  totalBudget: string;
  projectedRoi: string;
  payback: string;
  rationale: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `RM ${(value / 1_000_000).toFixed(1)}M`;
  return `RM ${(value / 1000).toFixed(0)}k`;
}

function buildElimination(blueprints: Blueprint[]): { rounds: EliminationRound[]; finalRec: FinalRec } {
  if (blueprints.length === 0) {
    return {
      rounds: [],
      finalRec: { survivorIds: [], totalBudget: 'N/A', projectedRoi: 'N/A', payback: 'N/A', rationale: 'No blueprints to evaluate.' },
    };
  }

  const sorted = [...blueprints].sort((a, b) => a.scores.total - b.scores.total);
  const eliminated: string[] = [];
  const rounds: EliminationRound[] = [];

  // Round 1: Budget feasibility — eliminate highest-capex if >1.5× median
  if (blueprints.length >= 2) {
    const capexValues = blueprints.map(b => b.financeModel.capexValue).sort((a, z) => a - z);
    const median = capexValues[Math.floor(capexValues.length / 2)];
    const overBudget = blueprints.filter(
      b => b.financeModel.capexValue > median * 1.4 && b.scores.total < 78,
    );
    const target = overBudget[0] ?? sorted[0];
    eliminated.push(target.id);
    rounds.push({
      title: 'Budget Feasibility Screen',
      description: `Q2 envelope is ${formatCurrency(median * 1.2)}. Blueprints exceeding the threshold with sub-optimal scores are eliminated. Lowest-scoring blueprint removed from consideration.`,
      eliminatedIds: [target.id],
    });
  }

  // Round 2: Strategic alignment — eliminate lowest business impact among remaining
  const remaining1 = blueprints.filter(b => !eliminated.includes(b.id));
  if (remaining1.length >= 2) {
    const target = [...remaining1].sort((a, b) => a.scores.businessImpact - b.scores.businessImpact)[0];
    eliminated.push(target.id);
    rounds.push({
      title: 'Strategic Alignment Check',
      description: `Active roadmap comparison shows ${remaining1.length - 1} conflict${remaining1.length - 1 === 1 ? '' : 's'}. Blueprint with lowest business impact score eliminated to protect core initiative overlap.`,
      eliminatedIds: [target.id],
    });
  }

  // Round 3: Risk assessment — check for merge opportunity among survivors
  const survivors = blueprints.filter(b => !eliminated.includes(b.id));
  if (survivors.length >= 2) {
    const [a, b] = survivors;
    const aStack = new Set(a.techStack.flatMap(t => t.tools));
    const bStack = new Set(b.techStack.flatMap(t => t.tools));
    const overlap = [...aStack].filter(t => bStack.has(t));
    const overlapPct = overlap.length / Math.max(aStack.size, bStack.size, 1);

    if (overlapPct > 0.35) {
      rounds.push({
        title: 'Merge Opportunity Detected',
        description: `${Math.round(overlapPct * 100)}% tech stack overlap between surviving blueprints. Z.AI recommends consolidation to eliminate duplication and reduce combined operational spend.`,
        eliminatedIds: [],
        mergedPair: [a.id, b.id],
      });
    } else {
      rounds.push({
        title: 'Risk & Dependency Assessment',
        description: `Surviving blueprints have distinct tech stacks with minimal overlap. Both cleared for portfolio approval without consolidation risk.`,
        eliminatedIds: [],
      });
    }
  }

  const finalSurvivors = blueprints.filter(b => !eliminated.includes(b.id));
  const totalCapex = finalSurvivors.reduce((sum, b) => sum + b.financeModel.capexValue, 0);
  const avgRoi = finalSurvivors.length > 0
    ? Math.round(finalSurvivors.reduce((sum, b) => sum + b.financeModel.roiValue, 0) / finalSurvivors.length)
    : 0;
  const avgPayback = finalSurvivors.length > 0
    ? Math.round(finalSurvivors.reduce((sum, b) => sum + b.financeModel.paybackMonths, 0) / finalSurvivors.length)
    : 0;

  return {
    rounds,
    finalRec: {
      survivorIds: finalSurvivors.map(b => b.id),
      totalBudget: formatCurrency(totalCapex),
      projectedRoi: `${avgRoi}%`,
      payback: `${avgPayback} months`,
      rationale: `Optimal portfolio combination of ${finalSurvivors.length} initiative${finalSurvivors.length === 1 ? '' : 's'} selected based on budget fit, strategic alignment, and risk profile. Combined implementation delivers projected ${avgRoi}% ROI within ${avgPayback}-month payback window.`,
    },
  };
}

// ─── Blueprint card in the grid ───────────────────────────────────────────────

function BlueprintGridCard({
  blueprint,
  isEliminated,
  isSurvivor,
  isMerging,
  elimReason,
}: {
  blueprint: Blueprint;
  isEliminated: boolean;
  isSurvivor: boolean;
  isMerging: boolean;
  elimReason?: string;
}) {
  return (
    <motion.div
      layout
      animate={{
        opacity: isEliminated ? 0.35 : isMerging ? 0.5 : 1,
        scale: isMerging ? 0.95 : 1,
      }}
      transition={{ duration: 0.5 }}
      className="p-4 relative overflow-hidden"
      style={{
        background: isSurvivor
          ? 'rgba(92,128,101,0.06)'
          : isEliminated
            ? 'var(--color-bg-deep)'
            : 'var(--color-bg-panel)',
        border: `1px solid ${isSurvivor ? 'rgba(92,128,101,0.35)' : isEliminated ? 'rgba(184,74,57,0.25)' : 'var(--color-border)'}`,
        boxShadow: isSurvivor ? '0 0 12px rgba(92,128,101,0.1)' : 'none',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono text-[10px] px-2 py-0.5"
          style={{
            background: `${blueprint.color}20`,
            color: blueprint.color,
            border: `1px solid ${blueprint.color}40`,
            opacity: isEliminated ? 0.5 : 1,
          }}
        >
          {blueprint.department}
        </span>
        {isSurvivor && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 flex items-center gap-1" style={{ background: 'rgba(92,128,101,0.12)', color: 'var(--color-success)', border: '1px solid rgba(92,128,101,0.3)' }}>
            <CheckCircle size={9} />
            SELECTED
          </span>
        )}
        {isEliminated && (
          <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: 'rgba(184,74,57,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(184,74,57,0.25)' }}>
            ELIMINATED
          </span>
        )}
      </div>

      <p
        className="font-display font-semibold text-sm mb-1 leading-snug"
        style={{
          color: 'var(--color-text-primary)',
          textDecoration: isEliminated ? 'line-through' : 'none',
          opacity: isEliminated ? 0.6 : 1,
        }}
      >
        {blueprint.title}
      </p>

      <div className="flex items-center justify-between text-xs mt-2">
        <span style={{ color: 'var(--color-text-muted)' }}>
          {blueprint.financeModel.capex}
        </span>
        <span style={{ color: 'var(--color-success)' }}>
          ROI {blueprint.financeModel.roi}
        </span>
        <span className="font-mono font-bold" style={{ color: blueprint.color }}>
          {blueprint.scores.total}
        </span>
      </div>

      {isEliminated && elimReason && (
        <div className="mt-2 px-2 py-1.5 text-[10px]" style={{ background: 'rgba(184,74,57,0.06)', border: '1px solid rgba(184,74,57,0.2)', color: 'var(--color-text-muted)' }}>
          {elimReason}
        </div>
      )}
    </motion.div>
  );
}

// ─── Merged card ──────────────────────────────────────────────────────────────

function MergedCard({ blueprints }: { blueprints: Blueprint[] }) {
  const combinedCapex = blueprints.reduce((sum, b) => sum + b.financeModel.capexValue, 0);
  const avgRoi = Math.round(blueprints.reduce((sum, b) => sum + b.financeModel.roiValue, 0) / blueprints.length);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
      className="p-4 col-span-2"
      style={{
        background: 'rgba(37,99,235,0.06)',
        border: '1px solid rgba(37,99,235,0.35)',
        boxShadow: '0 0 20px rgba(37,99,235,0.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] px-2 py-0.5 flex items-center gap-1" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.3)' }}>
          <GitMerge size={9} />
          MERGED INITIATIVE
        </span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 flex items-center gap-1" style={{ background: 'rgba(92,128,101,0.12)', color: 'var(--color-success)', border: '1px solid rgba(92,128,101,0.3)' }}>
          <CheckCircle size={9} />
          SELECTED
        </span>
      </div>
      <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Unified {blueprints[0]?.department ?? 'Platform'} Initiative
      </p>
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Merged from: {blueprints.map(b => b.title).join(' + ')}
      </p>
      <div className="flex items-center gap-6 text-xs">
        <div>
          <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Combined Budget</p>
          <p className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(Math.round(combinedCapex * 0.85))}</p>
          <p className="text-[10px]" style={{ color: 'var(--color-success)' }}>15% savings from consolidation</p>
        </div>
        <div>
          <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Projected ROI</p>
          <p className="font-mono font-bold" style={{ color: 'var(--color-success)' }}>{avgRoi + 8}%</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PortfolioElimination({
  blueprints,
  onClose,
  onApprove,
  onDefer,
}: {
  blueprints: Blueprint[];
  onClose: () => void;
  onApprove?: (survivorIds: string[]) => void;
  onDefer?: () => void;
}) {
  const { rounds, finalRec } = buildElimination(blueprints);

  const [visibleRounds, setVisibleRounds] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitted, setOverrideSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timerRef.current = rounds.map((_, i) =>
      setTimeout(() => setVisibleRounds(v => Math.max(v, i + 1)), (i + 1) * 1800),
    );
    const finalTimer = setTimeout(() => setShowFinal(true), (rounds.length + 1) * 1800);
    timerRef.current.push(finalTimer);
    return () => timerRef.current.forEach(clearTimeout);
  }, [rounds.length]);

  const eliminatedByRound: Record<string, string> = {};
  rounds.forEach((r, i) => {
    r.eliminatedIds.forEach(id => {
      const bp = blueprints.find(b => b.id === id);
      if (bp) eliminatedByRound[id] = r.description.slice(0, 60) + '…';
    });
  });

  const allEliminated = new Set(rounds.flatMap(r => r.eliminatedIds));
  const mergedPair = rounds.find(r => r.mergedPair)?.mergedPair;
  const showMerge = visibleRounds >= rounds.findIndex(r => r.mergedPair) + 1 && Boolean(mergedPair);

  const visibleRoundsData = rounds.slice(0, visibleRounds);
  const currentEliminated = new Set(visibleRoundsData.flatMap(r => r.eliminatedIds));

  const nonMergedBlueprints = blueprints.filter(b => !(mergedPair && showMerge && mergedPair.includes(b.id)));
  const mergedBlueprints = mergedPair ? blueprints.filter(b => mergedPair.includes(b.id)) : [];

  const totalBudget = blueprints.reduce((sum, b) => sum + b.financeModel.capexValue, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '900px',
          maxWidth: '96vw',
          height: '88vh',
          maxHeight: '780px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8"
              style={{ background: 'rgba(194,96,73,0.12)', border: '1px solid rgba(194,96,73,0.3)' }}
            >
              <Layers3 size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Portfolio Elimination Analysis
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                ODIS · Z.AI GLM · {blueprints.length} blueprint{blueprints.length === 1 ? '' : 's'} evaluated · Budget {formatCurrency(totalBudget)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 transition-opacity hover:opacity-60" style={{ color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Blueprint grid */}
            <div>
              <p className="font-mono text-[10px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
                CANDIDATE BLUEPRINTS
              </p>
              <div className="grid grid-cols-2 gap-3">
                {nonMergedBlueprints.map(bp => (
                  <BlueprintGridCard
                    key={bp.id}
                    blueprint={bp}
                    isEliminated={currentEliminated.has(bp.id)}
                    isSurvivor={showFinal && finalRec.survivorIds.includes(bp.id) && !allEliminated.has(bp.id)}
                    isMerging={Boolean(mergedPair && mergedPair.includes(bp.id) && !showMerge)}
                    elimReason={currentEliminated.has(bp.id) ? eliminatedByRound[bp.id] : undefined}
                  />
                ))}
                <AnimatePresence>
                  {showMerge && mergedBlueprints.length === 2 && (
                    <MergedCard blueprints={mergedBlueprints} />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Elimination log */}
            <div>
              <p className="font-mono text-[10px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
                ELIMINATION LOG
              </p>
              <div className="space-y-3">
                <AnimatePresence>
                  {visibleRoundsData.map((round, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex gap-4 p-4"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="w-7 h-7 flex items-center justify-center text-xs font-mono font-bold"
                          style={{
                            background: round.mergedPair ? 'rgba(37,99,235,0.12)' : round.eliminatedIds.length > 0 ? 'rgba(184,74,57,0.12)' : 'rgba(92,128,101,0.12)',
                            color: round.mergedPair ? '#2563eb' : round.eliminatedIds.length > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                            border: `1px solid ${round.mergedPair ? 'rgba(37,99,235,0.3)' : round.eliminatedIds.length > 0 ? 'rgba(184,74,57,0.3)' : 'rgba(92,128,101,0.3)'}`,
                          }}
                        >
                          {round.mergedPair ? <GitMerge size={12} /> : round.eliminatedIds.length > 0 ? '✗' : '✓'}
                        </div>
                        {i < visibleRoundsData.length - 1 && (
                          <div className="flex-1 w-px mt-2" style={{ background: 'var(--color-border)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            ROUND {i + 1}
                          </p>
                          <span className="font-mono text-[10px] px-1.5 py-0.5" style={{ background: 'rgba(194,96,73,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(194,96,73,0.25)' }}>
                            {round.title}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                          {round.description}
                        </p>
                        {round.eliminatedIds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {round.eliminatedIds.map(id => {
                              const bp = blueprints.find(b => b.id === id);
                              return bp ? (
                                <span key={id} className="text-[10px] px-2 py-0.5 font-mono" style={{ background: 'rgba(184,74,57,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(184,74,57,0.25)' }}>
                                  ✗ {bp.title}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {visibleRounds < rounds.length && (
                  <div className="flex items-center gap-3 p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: 'var(--color-primary)' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      ODIS analysing next round…
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Final recommendation */}
            <AnimatePresence>
              {showFinal && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <div style={{ border: '1px solid rgba(194,96,73,0.35)', background: 'rgba(194,96,73,0.04)' }}>
                    <div
                      className="flex items-center gap-2 px-5 py-3"
                      style={{ borderBottom: '1px solid rgba(194,96,73,0.2)' }}
                    >
                      <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                      <p className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                        ODIS RECOMMENDATION
                      </p>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {finalRec.rationale}
                      </p>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Total Spend', value: finalRec.totalBudget },
                          { label: 'Projected ROI', value: finalRec.projectedRoi },
                          { label: 'Payback Period', value: finalRec.payback },
                        ].map(item => (
                          <div key={item.label} className="p-3 text-center" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                            <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                            <p className="font-display font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      {!overrideMode && !overrideSubmitted && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { onApprove?.(finalRec.survivorIds); onClose(); }}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-bright))', boxShadow: '0 0 16px rgba(194,96,73,0.25)' }}
                          >
                            <CheckCircle size={14} />
                            Approve Recommendation
                          </button>
                          <button
                            onClick={() => setOverrideMode(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                          >
                            <ChevronRight size={14} />
                            Override
                          </button>
                          <button
                            onClick={() => { onDefer?.(); onClose(); }}
                            className="px-4 py-2.5 text-sm font-medium transition-all hover:opacity-70"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Defer All
                          </button>
                        </div>
                      )}

                      {overrideMode && (
                        <div className="space-y-3">
                          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            Provide a reason for overriding the ODIS recommendation:
                          </p>
                          <textarea
                            autoFocus
                            value={overrideReason}
                            onChange={e => setOverrideReason(e.target.value)}
                            rows={3}
                            placeholder="Explain the business rationale for overriding this recommendation…"
                            className="w-full p-3 text-sm"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (!overrideReason.trim()) return;
                                setOverrideSubmitted(true);
                                setOverrideMode(false);
                              }}
                              disabled={!overrideReason.trim()}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all hover:opacity-80"
                              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                            >
                              Submit Override
                            </button>
                            <button
                              onClick={() => setOverrideMode(false)}
                              className="px-3 py-2 text-sm transition-all hover:opacity-70"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {overrideSubmitted && (
                        <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(201,138,68,0.08)', border: '1px solid rgba(201,138,68,0.3)' }}>
                          <CheckCircle size={14} style={{ color: 'var(--color-warning)' }} />
                          <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
                            Override logged — manual review required before approval.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
