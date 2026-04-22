'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PrototypePreview from '../components/PrototypePreview';
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
  selectedId,
  onSelect,
}: {
  blueprints: Blueprint[];
  initialIndex: number;
  onClose: () => void;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState<Tab>('Prototype Concept');
  const blueprint = blueprints[currentIndex];

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
      {/* Prev arrow — no background, high contrast */}
      <button
        className="absolute left-5 z-10 transition-opacity opacity-70 hover:opacity-100"
        style={{ color: '#ffffff' }}
        onClick={e => { e.stopPropagation(); navigate(-1); }}
        aria-label="Previous blueprint"
      >
        <ChevronLeft size={44} strokeWidth={1.5} />
      </button>

      {/* Main card — 85% screen */}
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
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-20 p-1.5 transition-all hover:scale-110"
            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            onClick={onClose}
          >
            <X size={13} />
          </button>

          {/* Header */}
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
            </div>
            <h2 className="font-display font-bold text-2xl mb-1 pr-10" style={{ color: 'var(--color-text-primary)' }}>
              {blueprint.title}
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              {blueprint.description}
            </p>

            {/* Tabs */}
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

          {/* Tab content */}
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
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wide mb-5" style={{ color: blueprint.accentColor }}>
                      System architecture — data flow
                    </p>
                    <div className="flex flex-col items-stretch gap-0 max-w-2xl mx-auto">
                      {blueprint.architecture.map((item, i) => {
                        const colonIdx = item.indexOf(':');
                        const layerLabel = colonIdx !== -1 ? item.slice(0, colonIdx).trim() : `Layer ${i + 1}`;
                        const layerDetail = colonIdx !== -1 ? item.slice(colonIdx + 1).trim() : item;
                        const isLast = i === blueprint.architecture.length - 1;
                        return (
                          <div key={item} className="flex flex-col items-stretch">
                            <div
                              className="flex items-start gap-3 p-3.5"
                              style={{
                                background: 'var(--color-bg-panel)',
                                border: `1px solid ${blueprint.color}40`,
                                borderLeft: `3px solid ${blueprint.color}`,
                              }}
                            >
                              <div
                                className="flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5"
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  background: `${blueprint.color}25`,
                                  color: blueprint.accentColor,
                                  border: `1px solid ${blueprint.color}40`,
                                }}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: blueprint.accentColor }}>
                                  {layerLabel}
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                  {layerDetail}
                                </p>
                              </div>
                            </div>
                            {!isLast && (
                              <div className="flex flex-col items-center" style={{ height: '28px' }}>
                                <div className="flex-1 w-px" style={{ background: `${blueprint.color}50` }} />
                                <div
                                  style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderTop: `7px solid ${blueprint.color}70`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'Tech Stack' && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wide mb-4" style={{ color: blueprint.accentColor }}>
                      Specific tools, platforms & vendors recommended
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {blueprint.techStack.map(tech => (
                        <div
                          key={tech}
                          className="px-3 py-1.5 text-sm"
                          style={{ background: 'var(--color-bg-panel)', border: `1px solid ${blueprint.color}40`, color: 'var(--color-text-primary)' }}
                        >
                          {tech}
                        </div>
                      ))}
                    </div>
                  </div>
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

          {/* Footer */}
          <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => onSelect(blueprint.id)}
              className="w-full py-2.5 text-sm font-medium transition-all hover:opacity-90"
              style={{
                background: selectedId === blueprint.id ? blueprint.color : `${blueprint.color}20`,
                border: `1px solid ${blueprint.color}50`,
                color: selectedId === blueprint.id ? 'var(--color-text-primary)' : blueprint.accentColor,
              }}
            >
              {selectedId === blueprint.id ? 'Preferred blueprint selected' : 'Select as preferred blueprint'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next arrow — no background, high contrast */}
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

const SEL_C = 'rgba(196, 122, 48,';
const SEL_SIDES = `inset 2px 0 0 ${SEL_C} 0.75), inset -2px 0 0 ${SEL_C} 0.75)`;
const SEL_TOP = `inset 0 2px 0 ${SEL_C} 0.75)`;
const SEL_BOTTOM = `inset 0 -2px 0 ${SEL_C} 0.75)`;
const SEL_GLOW = `inset 0 0 28px ${SEL_C} 0.12)`;

export default function BlueprintArena() {
  const { blueprints, selectedBlueprint, selectBlueprint, activeSubmission, openConflictReview, escalateSelectedBlueprint, submissionStatus } = useApp();
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isEscalating, setIsEscalating] = useState(false);

  const handleEscalate = () => {
    if (!selectedBlueprint || isEscalating) return;
    setIsEscalating(true);
    window.setTimeout(() => {
      escalateSelectedBlueprint();
    }, 900);
  };

  useEffect(() => {
    if (isEscalating && submissionStatus === 'escalated') {
      router.push(ROUTES.escalated);
    }
  }, [isEscalating, submissionStatus, router]);

  const uniqueConflicts = Array.from(
    new Map(blueprints.flatMap(b => b.conflicts).map(c => [c.id, c])).values(),
  );

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>
            BLUEPRINT ARENA
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Indecisive generated {blueprints.length} solution blueprints
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Each blueprint is scored across 7 dimensions. Click View Full Details to explore the prototype, architecture, and implementation plan.
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

        {/* Conflict banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="flex items-start gap-3">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: 2, duration: 0.5 }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
            </motion.div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {uniqueConflicts.length} conflicts detected before ranking
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Indecisive requires conflict review before the scoring table opens.
              </p>
            </div>
          </div>
          <button
            onClick={() => { openConflictReview(); router.push(ROUTES.conflicts); }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger-glow)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
          >
            Review conflict report
            <ChevronRight size={14} />
          </button>
        </motion.div>

        {/* Scoring-style table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-x-auto"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="min-w-205">
            <div
              className="grid"
              style={{ gridTemplateColumns: `200px repeat(${blueprints.length}, minmax(200px, 1fr))` }}
            >
              {/* Top-left header cell */}
              <div className="p-5" style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Blueprint table
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Scored across 7 dimensions drawn from internal systems and policies.
                </p>
              </div>

              {/* Blueprint header columns */}
              {blueprints.map((blueprint, index) => {
                const sel = selectedBlueprint?.id === blueprint.id;
                return (
                <div
                  key={blueprint.id}
                  className="p-5"
                  style={{
                    borderLeft: index === 0 ? 'none' : '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'transparent',
                    boxShadow: sel ? `${SEL_SIDES}, ${SEL_TOP}, ${SEL_GLOW}` : 'none',
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <p className="text-[10px] font-mono mb-2" style={{ color: blueprint.accentColor }}>
                    Blueprint {index + 1}
                  </p>
                  <h2 className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {blueprint.title}
                  </h2>
                  <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {blueprint.department}
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => selectBlueprint(blueprint.id)}
                      className="w-full py-2 text-xs font-medium transition-all"
                      style={{
                        background: sel ? blueprint.color : `${blueprint.color}22`,
                        border: `1px solid ${blueprint.color}55`,
                        color: sel ? 'var(--color-text-primary)' : blueprint.accentColor,
                      }}
                    >
                      {sel ? 'Selected' : 'Select blueprint'}
                    </button>
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
                </div>
                );
              })}

              {/* Insight rows */}
              {INSIGHT_LABELS.map((label, labelIndex) => (
                <div key={label} className="contents">
                  {/* Row label */}
                  <div
                    className="p-5"
                    style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {label}
                    </p>
                  </div>

                  {/* Per-blueprint insight cells */}
                  {blueprints.map((blueprint, colIndex) => {
                    const sel = selectedBlueprint?.id === blueprint.id;
                    const isLast = labelIndex === INSIGHT_LABELS.length - 1;
                    return (
                    <div
                      key={`${label}-${blueprint.id}`}
                      className="p-5"
                      style={{
                        borderLeft: colIndex === 0 ? 'none' : '1px solid var(--color-border)',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'transparent',
                        boxShadow: sel ? `${SEL_SIDES}, ${isLast ? `${SEL_BOTTOM}, ` : ''}${SEL_GLOW}` : 'none',
                        transition: 'box-shadow 0.3s',
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

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedBlueprint
              ? `Ready to escalate: ${selectedBlueprint.title}`
              : 'Select a blueprint to escalate it for superior review.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { openConflictReview(); router.push(ROUTES.conflicts); }}
              className="px-4 py-2.5 text-sm font-medium transition-all"
              style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Review conflicts
            </button>
            <motion.button
              onClick={handleEscalate}
              disabled={!selectedBlueprint || isEscalating}
              className="px-6 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                color: 'var(--color-text-primary)',
                boxShadow: selectedBlueprint ? '0 0 20px rgba(37, 99, 235, 0.35)' : 'none',
              }}
              whileHover={!isEscalating && !!selectedBlueprint ? { scale: 1.03 } : {}}
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
        </motion.div>
      </div>

      <AnimatePresence>
        {expandedIndex !== null && (
          <DetailModal
            blueprints={blueprints}
            initialIndex={expandedIndex}
            onClose={() => setExpandedIndex(null)}
            selectedId={selectedBlueprint?.id}
            onSelect={id => selectBlueprint(id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
