'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Scores } from '../types';

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

export default function ScoringView() {
  const {
    blueprints,
    selectedBlueprint,
    selectBlueprint,
    escalateSelectedBlueprint,
    submissionStatus,
  } = useApp();
  const router = useRouter();
  const [isEscalating, setIsEscalating] = useState(false);

  const rankedBlueprints = useMemo(
    () => [...blueprints].sort((left, right) => right.scores.total - left.scores.total),
    [blueprints],
  );

  useEffect(() => {
    if (isEscalating && submissionStatus === 'escalated') {
      router.push(ROUTES.escalated);
    }
  }, [isEscalating, router, submissionStatus]);

  const handleEscalate = () => {
    if (!selectedBlueprint || isEscalating) return;
    setIsEscalating(true);
    window.setTimeout(() => {
      escalateSelectedBlueprint();
    }, 900);
  };

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>
            SCORING AND RANKING
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Compare blueprints side by side
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            The decision engine has scored each blueprint across the four Indecisive criteria. Select one
            option and escalate it to your superior for review.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
                  Ranking table
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Higher scores indicate stronger fit for the requested outcome under the current constraints.
                </p>
              </div>

              {rankedBlueprints.map((blueprint, index) => (
                <div
                  key={blueprint.id}
                  className="p-5"
                  style={{
                    borderLeft: index === 0 ? 'none' : '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    background: selectedBlueprint?.id === blueprint.id ? `${blueprint.color}14` : 'transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-mono mb-2" style={{ color: blueprint.accentColor }}>
                        Rank {index + 1}
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

                  <button
                    onClick={() => selectBlueprint(blueprint.id)}
                    className="w-full py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: selectedBlueprint?.id === blueprint.id ? blueprint.color : `${blueprint.color}22`,
                      border: `1px solid ${blueprint.color}55`,
                      color: selectedBlueprint?.id === blueprint.id ? 'var(--color-text-primary)' : blueprint.accentColor,
                    }}
                  >
                    {selectedBlueprint?.id === blueprint.id ? 'Selected for escalation' : 'Select blueprint'}
                  </button>
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
                        background: selectedBlueprint?.id === blueprint.id ? `${blueprint.color}14` : 'transparent',
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
          transition={{ delay: 0.25 }}
          className="mt-8 p-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
                <p className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Ready to escalate?
                </p>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedBlueprint
                  ? `${selectedBlueprint.title} will move into the superior review queue.`
                  : 'Select one blueprint from the comparison table to continue.'}
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
                disabled={!selectedBlueprint || isEscalating}
                className="px-6 py-2.5 text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                  boxShadow: selectedBlueprint ? '0 0 20px rgba(37, 99, 235, 0.35)' : 'none',
                }}
                whileHover={!isEscalating && selectedBlueprint ? { scale: 1.03 } : {}}
              >
                {isEscalating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                    Escalating...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={16} />
                    Escalate blueprint
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
