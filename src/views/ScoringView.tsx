'use client';

import { DragEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, GripVertical, RotateCcw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Blueprint, ReviewAssumption, Scores } from '../types';

const CRITERIA = [
  { key: 'feasibility', label: 'Feasibility', description: 'Technical and organizational viability', color: 'var(--color-primary-bright)' },
  { key: 'businessImpact', label: 'Business Impact', description: 'Strategic value and measurable upside', color: 'var(--color-success)' },
  { key: 'effort', label: 'Effort', description: 'Implementation ease and resource readiness', color: 'var(--color-accent)' },
  { key: 'riskConflict', label: 'Risk / Conflict', description: 'Conflict tolerance and delivery resilience', color: 'var(--color-warning)' },
] as const satisfies ReadonlyArray<{
  key: keyof Omit<Scores, 'total'>;
  label: string;
  description: string;
  color: string;
}>;

function ScoreBar({ score, color, delay }: { score: number; color: string; delay: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 h-2 overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.9, delay, ease: 'easeOut' }}
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}bb)` }}
          />
        </div>
        <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--color-text-secondary)' }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function AssumptionValueCard({ assumption }: { assumption: ReviewAssumption }) {
  return (
    <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-mono uppercase" style={{ color: 'var(--color-accent)' }}>
            {assumption.label}
          </p>
          <p className="text-lg font-display font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {assumption.value}
          </p>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-1"
          style={{
            background: 'rgba(196, 122, 48, 0.12)',
            border: '1px solid rgba(196, 122, 48, 0.22)',
            color: 'var(--color-warning)',
          }}
        >
          {assumption.confidence}
        </span>
      </div>
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {assumption.source}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {assumption.impact}
      </p>
      {assumption.staleness ? (
        <p className="text-[11px] mt-2" style={{ color: 'var(--color-warning)' }}>
          {assumption.staleness}
        </p>
      ) : null}
    </div>
  );
}

function rankLabel(index: number) {
  return index === 0 ? 'Top 1' : index === 1 ? 'Top 2' : `Top ${index + 1}`;
}

export default function ScoringView() {
  const {
    rankedBlueprints,
    reviewAssumptions,
    latestReturnedManagerBatch,
    setBlueprintRanking,
    selectBlueprint,
    escalateRankedBlueprints,
    submissionStatus,
  } = useApp();
  const router = useRouter();
  const [isEscalating, setIsEscalating] = useState(false);
  const [draggedBlueprintId, setDraggedBlueprintId] = useState<string | null>(null);

  useEffect(() => {
    if (isEscalating && submissionStatus === 'escalated') {
      router.push(ROUTES.escalated);
    }
  }, [isEscalating, router, submissionStatus]);

  const handleEscalate = () => {
    if (rankedBlueprints.length === 0 || isEscalating) return;
    setIsEscalating(true);
    window.setTimeout(() => {
      escalateRankedBlueprints();
    }, 900);
  };

  const moveBlueprint = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const currentOrder = rankedBlueprints.map(blueprint => blueprint.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const nextOrder = [...currentOrder];
    const [dragged] = nextOrder.splice(draggedIndex, 1);
    nextOrder.splice(targetIndex, 0, dragged);
    setBlueprintRanking(nextOrder);
    selectBlueprint(nextOrder[0]);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, blueprintId: string) => {
    setDraggedBlueprintId(blueprintId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', blueprintId);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedBlueprintId) return;
    moveBlueprint(draggedBlueprintId, targetId);
    setDraggedBlueprintId(null);
  };

  const resetToScoreOrder = () => {
    const ordered = [...rankedBlueprints]
      .sort((left, right) => right.scores.total - left.scores.total)
      .map(blueprint => blueprint.id);
    setBlueprintRanking(ordered);
    if (ordered[0]) {
      selectBlueprint(ordered[0]);
    }
  };

  const leadBlueprint = rankedBlueprints[0] ?? null;

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>
            SCORING AND RANKING
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Rank all 3 blueprints for manager review
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Drag the blueprints into your preferred Top 1, Top 2, and Top 3 order. Your manager will receive the full ranked set together with the actual scoring assumptions used for this blueprint pass.
          </p>
        </motion.div>

        {latestReturnedManagerBatch?.managerNote ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5"
            style={{ background: 'rgba(196, 122, 48, 0.08)', border: '1px solid rgba(196, 122, 48, 0.24)' }}
          >
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-warning)' }}>
              RETURNED BY MANAGER
            </p>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {latestReturnedManagerBatch.managerNote}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              The assumption values below now reflect the updated manager review context. Re-rank the blueprints and resubmit the full set when ready.
            </p>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Employee ranking
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Drag cards to reorder the manager packet.
                </p>
              </div>
              <button
                onClick={resetToScoreOrder}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <RotateCcw size={14} />
                Reset to score order
              </button>
            </div>

            <div className="space-y-3">
              {rankedBlueprints.map((blueprint, index) => (
                <motion.div
                  key={blueprint.id}
                  layout
                  draggable
                  onDragStart={event => handleDragStart(event as unknown as DragEvent<HTMLDivElement>, blueprint.id)}
                  onDragOver={event => event.preventDefault()}
                  onDragEnter={event => event.preventDefault()}
                  onDragEnd={() => setDraggedBlueprintId(null)}
                  onDrop={() => handleDrop(blueprint.id)}
                  className="p-4 cursor-move"
                  style={{
                    background: index === 0 ? `${blueprint.color}14` : 'var(--color-bg-panel)',
                    border: `1px solid ${draggedBlueprintId === blueprint.id ? blueprint.color : 'var(--color-border)'}`,
                    boxShadow: index === 0 ? `0 0 20px ${blueprint.color}18` : 'none',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 flex items-center justify-center shrink-0"
                        style={{ background: `${blueprint.color}18`, border: `1px solid ${blueprint.color}35`, color: blueprint.accentColor }}
                      >
                        <GripVertical size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono mb-1" style={{ color: blueprint.accentColor }}>
                          {rankLabel(index)}
                        </p>
                        <h2 className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {blueprint.title}
                        </h2>
                        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {blueprint.department}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                          {blueprint.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Total
                      </p>
                      <p className="font-display font-bold text-2xl" style={{ color: blueprint.accentColor }}>
                        {blueprint.scores.total}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Current scoring assumptions
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                These are the actual assumptions behind the current blueprint scores, and they will travel with your ranked batch to the manager portal.
              </p>
              <div className="space-y-3">
                {reviewAssumptions.map(assumption => (
                  <AssumptionValueCard key={assumption.id} assumption={assumption} />
                ))}
              </div>
            </div>

            {leadBlueprint ? (
              <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
                  <p className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Current Top 1
                  </p>
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {leadBlueprint.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  This ranked packet will be escalated to your manager as a three-blueprint batch. The manager can reevaluate the whole set, edit assumption values, then either choose one blueprint for director review or return the set to you.
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="overflow-x-auto"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="min-w-[920px]">
            <div
              className="grid"
              style={{ gridTemplateColumns: `260px repeat(${rankedBlueprints.length}, minmax(220px, 1fr))` }}
            >
              <div className="p-5" style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Score table
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Scores update visually here, but the employee ranking order stays fixed unless you drag it.
                </p>
              </div>

              {rankedBlueprints.map((blueprint, index) => (
                <div
                  key={blueprint.id}
                  className="p-5"
                  style={{
                    borderLeft: index === 0 ? 'none' : '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    background: index === 0 ? `${blueprint.color}12` : 'transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-mono mb-2" style={{ color: blueprint.accentColor }}>
                        {rankLabel(index)}
                      </p>
                      <h2 className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {blueprint.title}
                      </h2>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {blueprint.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Total
                      </p>
                      <p className="font-display font-bold text-2xl" style={{ color: blueprint.accentColor }}>
                        {blueprint.scores.total}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {CRITERIA.map((criterion, criterionIndex) => (
                <div key={criterion.key} className="contents">
                  <div className="p-5" style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                    <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {criterion.label}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {criterion.description}
                    </p>
                  </div>

                  {rankedBlueprints.map((blueprint, columnIndex) => (
                    <div
                      key={`${criterion.key}-${blueprint.id}`}
                      className="p-5"
                      style={{
                        borderLeft: columnIndex === 0 ? 'none' : '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                        background: columnIndex === 0 ? `${blueprint.color}12` : 'transparent',
                      }}
                    >
                      <ScoreBar
                        score={blueprint.scores[criterion.key]}
                        color={criterion.color}
                        delay={criterionIndex * 0.08 + columnIndex * 0.06}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
                <p className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Ready to escalate the ranked batch?
                </p>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {leadBlueprint
                  ? `${leadBlueprint.title} is your current Top 1, but all three ranked blueprints and the current scoring assumptions will be sent together to your manager.`
                  : 'Rank the three blueprints to continue.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(ROUTES.blueprints)}
                className="px-4 py-2.5 text-sm font-medium transition-all"
                style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Back to blueprints
              </button>
              <motion.button
                onClick={handleEscalate}
                disabled={rankedBlueprints.length === 0 || isEscalating}
                className="px-6 py-2.5 text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                  boxShadow: leadBlueprint ? '0 0 20px rgba(37, 99, 235, 0.35)' : 'none',
                }}
                whileHover={!isEscalating && rankedBlueprints.length > 0 ? { scale: 1.03 } : {}}
              >
                {isEscalating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                    Escalating ranked batch...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={16} />
                    Escalate ranked batch
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
