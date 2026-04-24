'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArchitectureFlowchart from '../components/ArchitectureFlowchart';
import PrototypePreview from '../components/PrototypePreview';
import TechStackTable from '../components/TechStackTable';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Blueprint, ScoringInsight } from '../types';

const STATUS_STYLES: Record<ScoringInsight['status'], { dot: string; text: string }> = {
  positive: { dot: 'var(--color-success)', text: 'var(--color-success)' },
  neutral: { dot: 'var(--color-warning)', text: 'var(--color-warning)' },
  warning: { dot: 'var(--color-danger)', text: 'var(--color-danger)' },
};

const TABS = ['Prototype Concept', 'System Architecture', 'Tech Stack', 'Finance Model', 'Development Timeline'] as const;
type Tab = (typeof TABS)[number];

function rankLabel(index: number) {
  return `Rank ${index + 1}`;
}

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

const INSIGHT_LABELS = ['Budget', 'Project Pipeline', 'Product Portfolio', 'Past Rejections', 'Market Research', 'HR & Execution', 'Legal & Compliance'];

function DetailModal({
  blueprints,
  initialIndex,
  onClose,
  rankingOrder,
  onAssignRank,
}: {
  blueprints: Blueprint[];
  initialIndex: number;
  onClose: () => void;
  rankingOrder: string[];
  onAssignRank: (blueprintId: string, rankIndex: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState<Tab>('Prototype Concept');
  const blueprint = blueprints[currentIndex];
  const currentRank = rankingOrder.findIndex(id => id === blueprint.id);

  function navigate(dir: 1 | -1) {
    setCurrentIndex((currentIndex + dir + blueprints.length) % blueprints.length);
    setActiveTab('Prototype Concept');
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <button
        className="absolute left-5 z-10 transition-opacity opacity-70 hover:opacity-100"
        style={{ color: '#ffffff' }}
        onClick={e => { e.stopPropagation(); navigate(-1); }}
        aria-label="Previous blueprint"
      >
        <ChevronLeft size={44} strokeWidth={1.5} />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={blueprint.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="relative flex flex-col overflow-hidden"
          style={{
            width: '85vw',
            height: '85vh',
            background: 'var(--color-bg-card)',
            border: `1px solid ${blueprint.color}50`,
            boxShadow: `0 0 80px ${blueprint.color}20`,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 z-20 p-1.5 transition-all hover:scale-110"
            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            onClick={onClose}
          >
            <X size={13} />
          </button>

          <div
            className="p-6 pb-0 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${blueprint.color}14, transparent)`,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-[10px] font-mono px-2 py-0.5 uppercase"
                style={{ background: `${blueprint.color}20`, color: blueprint.accentColor }}
              >
                {blueprint.department}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {currentIndex + 1} of {blueprints.length}
              </span>
              {currentRank >= 0 ? (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 uppercase"
                  style={{ background: 'rgba(196, 122, 48, 0.14)', color: 'var(--color-warning)' }}
                >
                  {rankLabel(currentRank)}
                </span>
              ) : null}
            </div>
            <h2 className="font-display font-bold text-2xl mb-1 pr-10" style={{ color: 'var(--color-text-primary)' }}>
              {blueprint.title}
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              {blueprint.description}
            </p>

            <div className="flex overflow-x-auto gap-0" style={{ marginBottom: '-1px' }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all shrink-0"
                  style={{
                    color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeTab === tab ? `2px solid ${blueprint.color}` : '2px solid transparent',
                    background: 'transparent',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${blueprint.id}-${activeTab}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'Prototype Concept' && (
                  <PrototypePreview preview={blueprint.prototypePreview} accentColor={blueprint.accentColor} />
                )}

                {activeTab === 'System Architecture' && (
                  <ArchitectureFlowchart
                    architecture={blueprint.architecture}
                    accentColor={blueprint.accentColor}
                    color={blueprint.color}
                    title="System architecture flow"
                  />
                )}

                {activeTab === 'Tech Stack' && (
                  <TechStackTable
                    techStack={blueprint.techStack}
                    accentColor={blueprint.accentColor}
                    title="Categorized tools, platforms, and vendors"
                  />
                )}

                {activeTab === 'Finance Model' && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wide mb-4" style={{ color: blueprint.accentColor }}>
                      Cost estimates, ROI projection & payback period
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {([
                        { label: 'CAPEX', value: blueprint.financeModel.capex, color: 'var(--color-text-primary)' },
                        { label: 'OPEX / month', value: blueprint.financeModel.opex, color: 'var(--color-text-primary)' },
                        { label: 'ROI', value: blueprint.financeModel.roi, color: 'var(--color-success)' },
                        { label: 'Payback Period', value: blueprint.financeModel.paybackPeriod, color: 'var(--color-text-primary)' },
                        { label: 'Year 1 Total Cost', value: blueprint.financeModel.totalCost, color: 'var(--color-warning)' },
                      ] as const).map(item => (
                        <div key={item.label} className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                          <p className="text-lg font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Development Timeline' && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wide mb-4" style={{ color: blueprint.accentColor }}>
                      Phased milestones
                    </p>
                    <div className="space-y-3">
                      {blueprint.timeline.map((phase, i) => (
                        <div key={phase.name} className="relative pl-9">
                          {i < blueprint.timeline.length - 1 && (
                            <div className="absolute left-3.5 top-7 bottom-0 w-px" style={{ background: `${blueprint.color}30` }} />
                          )}
                          <div
                            className="absolute left-0 top-0 w-7 h-7 flex items-center justify-center text-xs font-bold"
                            style={{ background: blueprint.color, color: 'var(--color-text-primary)' }}
                          >
                            {i + 1}
                          </div>
                          <div className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{phase.name}</p>
                              <span
                                className="text-[10px] font-mono px-2 py-0.5 shrink-0"
                                style={{ background: `${blueprint.color}20`, color: blueprint.accentColor }}
                              >
                                {phase.duration}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {phase.deliverables.map(d => (
                                <li key={d} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: blueprint.color }} />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="grid grid-cols-3 gap-2">
              {blueprints.map((_, rankIndex) => {
                const active = currentRank === rankIndex;
                return (
                  <button
                    key={rankIndex}
                    onClick={() => onAssignRank(blueprint.id, rankIndex)}
                    className="py-2.5 text-sm font-medium transition-all hover:opacity-90"
                    style={{
                      background: active ? blueprint.color : `${blueprint.color}18`,
                      border: `1px solid ${blueprint.color}50`,
                      color: active ? 'var(--color-text-primary)' : blueprint.accentColor,
                    }}
                  >
                    {active ? `${rankIndex + 1} Selected` : `Set ${rankIndex + 1}`}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        className="absolute right-5 z-10 transition-opacity opacity-70 hover:opacity-100"
        style={{ color: '#ffffff' }}
        onClick={e => { e.stopPropagation(); navigate(1); }}
        aria-label="Next blueprint"
      >
        <ChevronRight size={44} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}

export default function BlueprintArena() {
  const {
    blueprints,
    rankedBlueprintIds,
    latestReturnedManagerBatch,
    activeSubmission,
    setBlueprintRanking,
    escalateRankedBlueprints,
    submissionStatus,
  } = useApp();
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isEscalating, setIsEscalating] = useState(false);

  useEffect(() => {
    if (isEscalating && submissionStatus === 'escalated') {
      router.push(ROUTES.escalated);
    }
  }, [isEscalating, submissionStatus, router]);

  const assignRank = (blueprintId: string, rankIndex: number) => {
    const currentOrder = rankedBlueprintIds.length > 0
      ? [...rankedBlueprintIds]
      : blueprints.map(blueprint => blueprint.id);
    const currentIndex = currentOrder.indexOf(blueprintId);
    if (currentIndex === -1) return;

    const nextOrder = [...currentOrder];
    const [movedId] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(rankIndex, 0, movedId);
    setBlueprintRanking(nextOrder);
  };

  const handleEscalate = () => {
    if (blueprints.length === 0 || isEscalating) return;
    setIsEscalating(true);
    window.setTimeout(() => {
      escalateRankedBlueprints();
    }, 900);
  };

  const topRankedId = rankedBlueprintIds[0] ?? blueprints[0]?.id ?? null;
  const topRanked = blueprints.find(blueprint => blueprint.id === topRankedId) ?? null;

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>
            BLUEPRINT ARENA
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Rank all 3 blueprints here
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Label each blueprint as rank 1, 2, or 3 directly on its card, then escalate the full ranked set to your manager.
          </p>
          {activeSubmission ? (
            <div className="mt-4 inline-flex max-w-3xl p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Problem: </span>
                {activeSubmission.problemStatement}
              </p>
            </div>
          ) : null}
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
              The manager has sent this batch back to you. Update the ranking if needed and resubmit all 3 blueprints with the current assumption set.
            </p>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="overflow-x-auto"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="min-w-205">
            <div
              className="grid"
              style={{ gridTemplateColumns: `220px repeat(${blueprints.length}, minmax(220px, 1fr))` }}
            >
              <div className="p-5" style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Blueprint ranking board
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Set each blueprint to `1`, `2`, or `3` directly on its card. The plans stay in their original order.
                </p>
              </div>

              {blueprints.map((blueprint, index) => {
                const currentRank = rankedBlueprintIds.findIndex(id => id === blueprint.id);
                return (
                  <div
                    key={blueprint.id}
                    className="p-5"
                    style={{
                      borderLeft: index === 0 ? 'none' : '1px solid var(--color-border)',
                      borderBottom: '1px solid var(--color-border)',
                      background: 'transparent',
                    }}
                  >
                    <p className="text-[10px] font-mono mb-2" style={{ color: blueprint.accentColor }}>
                      {currentRank >= 0 ? rankLabel(currentRank) : 'Not ranked'}
                    </p>
                    <h2 className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                      {blueprint.title}
                    </h2>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {blueprint.department}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {blueprints.map((_, rankIndex) => {
                        const active = currentRank === rankIndex;
                        return (
                          <button
                            key={rankIndex}
                            onClick={() => assignRank(blueprint.id, rankIndex)}
                            className="py-2 text-xs font-medium transition-all"
                            style={{
                              background: active ? blueprint.color : `${blueprint.color}18`,
                              border: `1px solid ${blueprint.color}45`,
                              color: active ? 'var(--color-text-primary)' : blueprint.accentColor,
                            }}
                          >
                            {rankIndex + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setExpandedIndex(index)}
                      className="w-full py-2 text-xs font-medium transition-all hover:opacity-80"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${blueprint.color}30`,
                        color: blueprint.accentColor,
                      }}
                    >
                      View Full Details
                    </button>
                  </div>
                );
              })}

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

                  {blueprints.map((blueprint, colIndex) => {
                    const isLast = labelIndex === INSIGHT_LABELS.length - 1;
                    return (
                      <div
                        key={`${label}-${blueprint.id}`}
                        className="p-5"
                        style={{
                          borderLeft: colIndex === 0 ? 'none' : '1px solid var(--color-border)',
                          borderBottom: '1px solid var(--color-border)',
                          background: 'transparent',
                        }}
                      >
                        <InsightCell insight={blueprint.scoringInsights[labelIndex]} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {topRanked
              ? `${topRanked.title} is currently rank 1. Escalating now will send all 3 blueprints with their chosen rank labels and assumptions to your manager.`
              : 'Rank the blueprints, then escalate the full batch to your manager.'}
          </p>
          <div className="flex gap-3">
            <motion.button
              onClick={handleEscalate}
              disabled={blueprints.length === 0 || isEscalating}
              className="px-6 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                color: 'var(--color-text-primary)',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.35)',
              }}
              whileHover={!isEscalating && blueprints.length > 0 ? { scale: 1.03 } : {}}
            >
              {isEscalating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                  Escalating ranked batch...
                </>
              ) : (
                <>
                  <ArrowUpRight size={16} />
                  Escalate
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {expandedIndex !== null && (
          <DetailModal
            blueprints={blueprints}
            initialIndex={expandedIndex}
            onClose={() => setExpandedIndex(null)}
            rankingOrder={rankedBlueprintIds}
            onAssignRank={assignRank}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
