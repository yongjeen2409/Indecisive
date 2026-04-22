'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle, GitMerge, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';

function EscalationCard({
  title,
  subtitle,
  meta,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  meta: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full p-4 text-left transition-all"
      style={{
        background: selected ? 'rgba(37, 99, 235, 0.15)' : 'var(--color-bg-card)',
        border: `1px solid ${selected ? 'rgba(37, 99, 235, 0.45)' : 'var(--color-border)'}`,
        boxShadow: selected ? '0 0 18px rgba(37, 99, 235, 0.2)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </p>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {meta}
          </p>
        </div>
        {selected ? <CheckCircle size={16} style={{ color: 'var(--color-primary-glow)' }} /> : null}
      </div>
    </button>
  );
}

export default function MergeView() {
  const {
    pendingEscalations,
    selectedMergeIds,
    selectMergePair,
    selectedMergeRecords,
    activeMergeSuggestion,
    completeMerge,
  } = useApp();
  const router = useRouter();
  const [isMerging, setIsMerging] = useState(false);

  const mergeableEscalations = pendingEscalations;
  const selectedBlueprintIds = selectedMergeIds;

  const selectedRecords = useMemo(
    () => mergeableEscalations.filter(record => selectedBlueprintIds.includes(record.blueprint.id)),
    [mergeableEscalations, selectedBlueprintIds],
  );

  const handleToggleSelect = (blueprintId: string) => {
    const isSelected = selectedBlueprintIds.includes(blueprintId);
    if (isSelected) {
      selectMergePair(selectedBlueprintIds.filter(id => id !== blueprintId));
      return;
    }

    if (selectedBlueprintIds.length === 0) {
      selectMergePair([blueprintId]);
      return;
    }

    if (selectedBlueprintIds.length === 1) {
      selectMergePair([...selectedBlueprintIds, blueprintId]);
      return;
    }

    selectMergePair([selectedBlueprintIds[1], blueprintId]);
  };

  const handleMerge = () => {
    if (selectedBlueprintIds.length !== 2) return;
    setIsMerging(true);
    window.setTimeout(() => {
      completeMerge();
      router.push(ROUTES.output);
    }, 1100);
  };

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-accent)' }}>
            SUPERIOR MERGE VIEW
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Compare pending escalations and generate a unified strategy
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Review only the blueprints that staff have escalated, choose a compatible pair, and let
            Indecisive synthesize one executive-ready recommendation.
          </p>
        </motion.div>

        {activeMergeSuggestion ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mb-6 p-4 flex items-start gap-3"
            style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <Sparkles size={18} style={{ color: '#a78bfa' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                GLM merge suggestion
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {activeMergeSuggestion.rationale}
              </p>
            </div>
          </motion.div>
        ) : null}

        {mergeableEscalations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 text-center"
            style={{ background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}
          >
            <GitMerge size={32} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="font-display font-semibold text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
              No pending escalations yet
            </h2>
            <p className="max-w-xl mx-auto text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Once staff users escalate their preferred blueprint, it will appear here for
              leadership review and merge analysis.
            </p>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,1.1fr] gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Pending escalations
                </h2>
                <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {mergeableEscalations.length} items
                </span>
              </div>

              <div className="space-y-3">
                {mergeableEscalations.map(record => (
                  <EscalationCard
                    key={record.id}
                    title={record.blueprint.title}
                    subtitle={`${record.submittedBy.name} · ${record.submittedBy.department}`}
                    meta={record.note}
                    selected={selectedBlueprintIds.includes(record.blueprint.id)}
                    onSelect={() => handleToggleSelect(record.blueprint.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Merge preview
              </h2>

              <AnimatePresence mode="wait">
                {selectedRecords.length !== 2 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 flex flex-col items-center justify-center text-center"
                    style={{ background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)', minHeight: '300px' }}
                  >
                    <GitMerge size={32} className="mb-3" style={{ color: 'var(--color-border-bright)' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>
                      Select two pending escalations to preview the unified strategy path.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {selectedRecords.map(record => (
                        <div
                          key={record.id}
                          className="p-4"
                          style={{ background: 'var(--color-bg-card)', border: `1px solid ${record.blueprint.color}45` }}
                        >
                          <p className="text-xs font-mono mb-2" style={{ color: record.blueprint.accentColor }}>
                            {record.blueprint.department}
                          </p>
                          <p className="font-display font-semibold text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            {record.blueprint.title}
                          </p>
                          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                            {record.blueprint.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {record.blueprint.techStack.slice(0, 3).map(item => (
                              <span
                                key={item}
                                className="text-[11px] px-2 py-0.5"
                                style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {activeMergeSuggestion ? (
                      <div className="p-5 mb-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-mono mb-4" style={{ color: 'var(--color-accent)' }}>
                          COMPATIBILITY ANALYSIS
                        </p>
                        <div className="space-y-3">
                          {Object.entries(activeMergeSuggestion.compatibility).map(([label, value], index) => (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                                  {label}
                                </span>
                                <span className="text-xs font-mono" style={{ color: 'var(--color-text-primary)' }}>
                                  {value}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden" style={{ background: 'var(--color-border)' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${value}%` }}
                                  transition={{ delay: index * 0.08 + 0.2, duration: 0.8, ease: 'easeOut' }}
                                  className="h-full"
                                  style={{ background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent))' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                            Projected shared savings
                          </p>
                          <p className="font-display font-bold text-xl" style={{ color: 'var(--color-success)' }}>
                            {activeMergeSuggestion.projectedSavings}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <motion.button
                      onClick={handleMerge}
                      disabled={isMerging || selectedMergeRecords.length !== 2}
                      className="w-full py-3.5 font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:scale-100 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))' }}
                    >
                      {isMerging ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                          Synthesizing unified strategy...
                        </>
                      ) : (
                        <>
                          <GitMerge size={16} />
                          Confirm merge and generate strategy
                          <ArrowRight size={16} />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
