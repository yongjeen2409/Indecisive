'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import ArchitectureFlowchart from './ArchitectureFlowchart';
import PrototypePreview from './PrototypePreview';
import TechStackTable from './TechStackTable';
import { useApp } from '../context/AppContext';
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

const STATUS_STYLES: Record<ScoringInsight['status'], { dot: string; text: string }> = {
  positive: { dot: 'var(--color-success)', text: 'var(--color-success)' },
  neutral: { dot: 'var(--color-warning)', text: 'var(--color-warning)' },
  warning: { dot: 'var(--color-danger)', text: 'var(--color-danger)' },
};

const INSIGHT_LABELS = ['Budget', 'Project Pipeline', 'Product Portfolio', 'Past Rejections', 'Market Research', 'HR & Execution', 'Legal & Compliance'];

const DETAIL_TABS = ['Prototype Concept', 'System Architecture', 'Tech Stack', 'Finance Model', 'Development Timeline'] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

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

function DetailView({
  blueprints,
  initialIndex,
  onClose,
}: {
  blueprints: Blueprint[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState<DetailTab>('Prototype Concept');
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
      className="fixed inset-0 z-[60] flex items-center justify-center"
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
            width: '80vw',
            height: '80vh',
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
              <span
                className="text-[10px] font-mono px-2 py-0.5 uppercase"
                style={{ background: 'rgba(196, 122, 48, 0.14)', color: 'var(--color-warning)' }}
              >
                Rank {currentIndex + 1}
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl mb-1 pr-10" style={{ color: 'var(--color-text-primary)' }}>
              {blueprint.title}
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              {blueprint.description}
            </p>

            <div className="flex overflow-x-auto gap-0" style={{ marginBottom: '-1px' }}>
              {DETAIL_TABS.map(tab => (
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
                      Cost estimates, ROI projection &amp; payback period
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

export default function BatchBlueprintArenaModal({
  batch,
  onClose,
}: {
  batch: ManagerReviewBatch;
  onClose: () => void;
}) {
  const { managerUpdateAssumptionValue, managerEscalateBatchToDirector, managerRejectBatch } = useApp();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReviewNote, setReturnReviewNote] = useState('');

  const startEditing = (assumptionId: string) => {
    const assumption = batch.assumptions.find(a => a.id === assumptionId);
    if (!assumption) return;
    setDraftValues(prev => ({ ...prev, [assumptionId]: assumption.value }));
    setEditingId(assumptionId);
  };

  const handleSave = (assumptionId: string) => {
    const draft = draftValues[assumptionId];
    if (draft == null) { setEditingId(null); return; }
    managerUpdateAssumptionValue(batch.id, assumptionId, draft);
    setEditingId(null);
  };

  const handleCancel = (assumptionId: string) => {
    setDraftValues(prev => { const next = { ...prev }; delete next[assumptionId]; return next; });
    setEditingId(null);
  };

  const handleEscalate = () => {
    managerEscalateBatchToDirector(batch.id);
    onClose();
  };

  const handleReturn = () => {
    setReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setReturnModalOpen(false);
    setReturnReviewNote('');
  };

  const submitReturnReview = () => {
    const note = returnReviewNote.trim();
    if (!note) return;
    managerRejectBatch(batch.id, note);
    closeReturnModal();
    onClose();
  };

  const displayBlueprints = useMemo<Blueprint[]>(() => {
    const reevaluated = reevaluateBlueprintSet(batch.blueprints, batch.assumptions, batch.baselineAssumptions);
    if (batch.rankingOrder.length > 0) {
      return batch.rankingOrder
        .map(id => reevaluated.find(bp => bp.id === id))
        .filter((bp): bp is Blueprint => Boolean(bp));
    }
    return reevaluated;
  }, [batch.blueprints, batch.assumptions, batch.rankingOrder]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.25 }}
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '92vw',
          maxWidth: '1400px',
          height: '90vh',
          background: 'var(--color-bg-deep)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 0 80px rgba(0,0,0,0.4)',
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

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className="font-mono text-[10px] px-2 py-0.5"
                style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.26)' }}
              >
                {batch.submittedBy.department}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                Escalated {batch.escalatedAt}
              </span>
            </div>
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>
              BLUEPRINT ARENA — MANAGER REVIEW
            </p>
            <h1 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {batch.submittedBy.name}&apos;s ranked blueprint set
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Inspect all {displayBlueprints.length} blueprints ranked by the employee. Click &quot;View Full Details&quot; on any blueprint to explore its prototype, architecture, tech stack, finance model, and timeline.
            </p>
            <div className="mt-3 inline-flex max-w-3xl p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Problem: </span>
                {batch.submission.problemStatement}
              </p>
            </div>
          </div>

          {/* Blueprint grid — same structure as BlueprintArena */}
          <div
            className="overflow-x-auto"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div style={{ minWidth: `${220 + displayBlueprints.length * 220}px` }}>
              <div
                className="grid"
                style={{ gridTemplateColumns: `220px repeat(${displayBlueprints.length}, minmax(220px, 1fr))` }}
              >
                {/* Header row — label cell */}
                <div className="p-5" style={{ borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                  <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Blueprint comparison
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Ranked by employee. View full details of each blueprint below.
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
                      onClick={() => setExpandedIndex(idx)}
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

          {/* Shared assumptions — double-click value to edit, save to apply */}
          {batch.assumptions.length > 0 && (
            <div
              className="p-5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Current scoring assumptions
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                These are the actual assumptions driving the current blueprint scores. Double-click a value to edit it.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {batch.assumptions.map(assumption => {
                  const isEditing = editingId === assumption.id;
                  const draftValue = draftValues[assumption.id] ?? assumption.value;
                  const isDirty = isEditing && draftValue !== assumption.value;

                  return (
                    <div
                      key={assumption.id}
                      className="p-4 relative"
                      style={{
                        background: 'var(--color-bg-panel)',
                        border: isEditing ? '1px solid rgba(37,99,235,0.45)' : '1px solid var(--color-border)',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {/* Save button — top right of card */}
                      {isEditing && (
                        <button
                          onClick={() => handleSave(assumption.id)}
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.03]"
                          style={{
                            background: isDirty
                              ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                              : 'var(--color-bg-panel)',
                            color: isDirty ? '#fff' : 'var(--color-text-muted)',
                            boxShadow: isDirty ? '0 0 12px rgba(37,99,235,0.3)' : 'none',
                            border: isDirty ? 'none' : '1px solid var(--color-border)',
                          }}
                        >
                          <Save size={12} />
                          Save
                        </button>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-3 pr-20">
                        <p className="text-xs font-mono uppercase" style={{ color: 'var(--color-accent)' }}>
                          {assumption.label}
                        </p>
                        <span
                          className="text-[10px] font-mono px-2 py-1 shrink-0"
                          style={{
                            background: assumption.confidence === 'HIGH'
                              ? 'rgba(16,185,129,0.12)'
                              : assumption.confidence === 'MEDIUM'
                                ? 'rgba(196,122,48,0.12)'
                                : 'rgba(239,68,68,0.12)',
                            border: assumption.confidence === 'HIGH'
                              ? '1px solid rgba(16,185,129,0.22)'
                              : assumption.confidence === 'MEDIUM'
                                ? '1px solid rgba(196,122,48,0.22)'
                                : '1px solid rgba(239,68,68,0.22)',
                            color: assumption.confidence === 'HIGH'
                              ? 'var(--color-success)'
                              : assumption.confidence === 'MEDIUM'
                                ? 'var(--color-warning)'
                                : 'var(--color-danger)',
                          }}
                        >
                          {assumption.confidence}
                        </span>
                      </div>

                      {/* Value — read-only or editable */}
                      {isEditing ? (
                        <div
                          className="flex items-center gap-2 px-3 py-2 font-mono text-sm mb-3"
                          style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(37,99,235,0.35)', minHeight: '38px' }}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={draftValue}
                            onChange={e => setDraftValues(prev => ({ ...prev, [assumption.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSave(assumption.id);
                              if (e.key === 'Escape') handleCancel(assumption.id);
                            }}
                            className="flex-1 outline-none bg-transparent font-mono"
                            style={{
                              color: 'var(--color-text-primary)',
                              borderBottom: '2px solid rgba(37,99,235,0.6)',
                            }}
                            placeholder="e.g. $500k, 200%, 8 FTEs / 6 months"
                          />
                          <span className="text-[10px] select-none shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                            Enter · Save &nbsp;|&nbsp; Esc · Cancel
                          </span>
                        </div>
                      ) : (
                        <div
                          className="px-3 py-2 font-mono text-sm mb-3 cursor-pointer select-none transition-all hover:border-blue-500/30"
                          style={{ background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)', minHeight: '38px' }}
                          onDoubleClick={() => startEditing(assumption.id)}
                          title="Double-click to edit"
                        >
                          <span style={{ color: 'var(--color-text-primary)' }}>{assumption.value}</span>
                          <span className="ml-3 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Double-click to edit</span>
                        </div>
                      )}

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
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 shrink-0 flex items-center justify-between gap-4" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {displayBlueprints.length} blueprints · Submitted by {batch.submittedBy.name} · {batch.submittedBy.department}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturn}
              className="px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-warning)' }}
            >
              Return to Staff
            </button>
            <button
              onClick={handleEscalate}
              className="px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: '#fff' }}
            >
              Escalate to Director
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium transition-all hover:opacity-80 ml-2"
              style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* Detail drill-down modal (stacked on top) */}
      <AnimatePresence>
        {expandedIndex !== null && (
          <DetailView
            blueprints={displayBlueprints}
            initialIndex={expandedIndex}
            onClose={() => setExpandedIndex(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {returnModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(18,18,18,0.52)', backdropFilter: 'blur(5px)' }}
            onClick={closeReturnModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl overflow-hidden"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid rgba(196,122,48,0.28)',
                boxShadow: '0 26px 70px rgba(0,0,0,0.32)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div
                className="p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,122,48,0.12), transparent)',
                  borderBottom: '1px solid rgba(196,122,48,0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="font-mono text-[10px] px-2 py-0.5"
                    style={{
                      background: 'rgba(196,122,48,0.12)',
                      border: '1px solid rgba(196,122,48,0.24)',
                      color: 'var(--color-warning)',
                    }}
                  >
                    RETURN TO STAFF
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    {batch.submittedBy.department}
                  </span>
                </div>
                <h2 className="font-display font-semibold text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Send review notes to {batch.submittedBy.name}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Let the staff member know what needs to be revised before they resubmit this ranked blueprint set.
                </p>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <label
                    htmlFor={`return-review-${batch.id}`}
                    className="block text-xs font-mono uppercase mb-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Review Notes
                  </label>
                  <textarea
                    id={`return-review-${batch.id}`}
                    autoFocus
                    rows={6}
                    value={returnReviewNote}
                    onChange={e => setReturnReviewNote(e.target.value)}
                    onKeyDown={e => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        submitReturnReview();
                      }
                    }}
                    placeholder="Explain what should be improved, clarified, or re-ranked before resubmission."
                    className="w-full resize-none px-4 py-3 text-sm outline-none"
                    style={{
                      background: 'var(--color-bg-panel)',
                      border: `1px solid ${returnReviewNote.trim() ? 'rgba(196,122,48,0.35)' : 'var(--color-border)'}`,
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    These notes will be attached to the returned packet for staff review.
                  </p>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    Ctrl/Cmd + Enter to send
                  </p>
                </div>
              </div>

              <div
                className="p-5 flex items-center justify-end gap-3"
                style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
              >
                <button
                  onClick={closeReturnModal}
                  className="px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturnReview}
                  disabled={!returnReviewNote.trim()}
                  className="px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(196,122,48,0.14)',
                    border: '1px solid rgba(196,122,48,0.32)',
                    color: 'var(--color-warning)',
                  }}
                >
                  Return to Staff
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
