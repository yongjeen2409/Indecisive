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
      className="w-full p-4 rounded-2xl text-left transition-all"
      style={{
        background: selected ? 'rgba(37, 99, 235, 0.15)' : '#0c1428',
        border: `1px solid ${selected ? 'rgba(37, 99, 235, 0.45)' : '#1a2d50'}`,
        boxShadow: selected ? '0 0 18px rgba(37, 99, 235, 0.2)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
            {title}
          </p>
          <p className="text-xs mb-2" style={{ color: '#8bafd4' }}>
            {subtitle}
          </p>
          <p className="text-[11px]" style={{ color: '#4a6a94' }}>
            {meta}
          </p>
        </div>
        {selected ? <CheckCircle size={16} style={{ color: '#60a5fa' }} /> : null}
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
    <div className="page-shell" style={{ background: '#050810' }}>
      <div className="page-container max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: '#8b5cf6' }}>
            SUPERIOR MERGE VIEW
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: '#f0f6ff' }}>
            Compare pending escalations and generate a unified strategy
          </h1>
          <p style={{ color: '#8bafd4' }}>
            Review only the blueprints that staff have escalated, choose a compatible pair, and let
            ODIS synthesize one executive-ready recommendation.
          </p>
        </motion.div>

        {activeMergeSuggestion ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mb-6 p-4 rounded-2xl flex items-start gap-3"
            style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <Sparkles size={18} style={{ color: '#a78bfa' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#f0f6ff' }}>
                GLM merge suggestion
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#8bafd4' }}>
                {activeMergeSuggestion.rationale}
              </p>
            </div>
          </motion.div>
        ) : null}

        {mergeableEscalations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 rounded-2xl text-center"
            style={{ background: '#0c1428', border: '1px dashed #1a2d50' }}
          >
            <GitMerge size={32} className="mx-auto mb-4" style={{ color: '#4a6a94' }} />
            <h2 className="font-display font-semibold text-xl mb-2" style={{ color: '#f0f6ff' }}>
              No pending escalations yet
            </h2>
            <p className="max-w-xl mx-auto text-sm" style={{ color: '#8bafd4' }}>
              Once staff users escalate their preferred blueprint, it will appear here for
              leadership review and merge analysis.
            </p>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,1.1fr] gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold" style={{ color: '#f0f6ff' }}>
                  Pending escalations
                </h2>
                <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#1a2d50', color: '#8bafd4' }}>
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
              <h2 className="font-display font-semibold mb-4" style={{ color: '#f0f6ff' }}>
                Merge preview
              </h2>

              <AnimatePresence mode="wait">
                {selectedRecords.length !== 2 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 rounded-2xl flex flex-col items-center justify-center text-center"
                    style={{ background: '#0c1428', border: '1px dashed #1a2d50', minHeight: '300px' }}
                  >
                    <GitMerge size={32} className="mb-3" style={{ color: '#2a4a7f' }} />
                    <p style={{ color: '#4a6a94' }}>
                      Select two pending escalations to preview the unified strategy path.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {selectedRecords.map(record => (
                        <div
                          key={record.id}
                          className="p-4 rounded-2xl"
                          style={{ background: '#0c1428', border: `1px solid ${record.blueprint.color}45` }}
                        >
                          <p className="text-xs font-mono mb-2" style={{ color: record.blueprint.accentColor }}>
                            {record.blueprint.department}
                          </p>
                          <p className="font-display font-semibold text-sm mb-2" style={{ color: '#f0f6ff' }}>
                            {record.blueprint.title}
                          </p>
                          <p className="text-xs leading-relaxed mb-3" style={{ color: '#8bafd4' }}>
                            {record.blueprint.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {record.blueprint.techStack.slice(0, 3).map(item => (
                              <span
                                key={item}
                                className="text-[11px] px-2 py-0.5 rounded"
                                style={{ background: '#080d1a', border: '1px solid #1a2d50', color: '#8bafd4' }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {activeMergeSuggestion ? (
                      <div className="p-5 rounded-2xl mb-4" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                        <p className="text-xs font-mono mb-4" style={{ color: '#8b5cf6' }}>
                          COMPATIBILITY ANALYSIS
                        </p>
                        <div className="space-y-3">
                          {Object.entries(activeMergeSuggestion.compatibility).map(([label, value], index) => (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs capitalize" style={{ color: '#8bafd4' }}>
                                  {label}
                                </span>
                                <span className="text-xs font-mono" style={{ color: '#f0f6ff' }}>
                                  {value}%
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a2d50' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${value}%` }}
                                  transition={{ delay: index * 0.08 + 0.2, duration: 0.8, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-4 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                          <p className="text-xs mb-1" style={{ color: '#4a6a94' }}>
                            Projected shared savings
                          </p>
                          <p className="font-display font-bold text-xl" style={{ color: '#10b981' }}>
                            {activeMergeSuggestion.projectedSavings}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <motion.button
                      onClick={handleMerge}
                      disabled={isMerging || selectedMergeRecords.length !== 2}
                      className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:scale-100 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
                    >
                      {isMerging ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
