'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownLeft,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  GitMerge,
  SendHorizonal,
  Sparkles,
} from 'lucide-react';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import PortfolioElimination from '../components/PortfolioElimination';
import { useApp } from '../context/AppContext';
import { EscalationRecord, ExistingSystem, ProjectTracker, ZAIMergeRecommendation } from '../types';

function ScorePill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'var(--color-success)' : value >= 65 ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <div className="p-3 text-center" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="font-display font-bold text-lg" style={{ color }}>{value}</p>
    </div>
  );
}

function healthMeta(health: ProjectTracker['health']) {
  if (health === 'ON_TRACK') return { label: 'ON TRACK', bg: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' };
  if (health === 'AT_RISK') return { label: 'AT RISK', bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' };
  return { label: 'DELAYED', bg: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)' };
}

function metricStatusChar(status: 'ok' | 'warn' | 'bad') {
  if (status === 'ok') return { char: '✓', color: 'var(--color-success)' };
  if (status === 'warn') return { char: '⚠', color: 'var(--color-warning)' };
  return { char: '✗', color: 'var(--color-danger)' };
}

export default function DirectorPortal() {
  const {
    directorPendingEscalations,
    directorApprovedEscalations,
    directorReviewedEscalations,
    allDisplayedSystems,
    directorMergeRecommendations,
    projectTrackers,
    directorApprove,
    directorDeEscalateToStaff,
    deEscalateToDeptHead,
    approveMerge,
    logProjectDecision,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'decision' | 'merging' | 'projects'>('decision');
  const [showPortfolioElim, setShowPortfolioElim] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [decisionSub, setDecisionSub] = useState<'pending' | 'reviewed' | 'approved'>('pending');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<Record<string, 'review' | 'descalate' | null>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [mergingIds, setMergingIds] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);

  const tabs = [
    {
      id: 'decision' as const,
      icon: <ClipboardList size={18} />,
      label: 'Decision',
      sub: `${directorPendingEscalations.length} pending · ${directorApprovedEscalations.length} approved`,
      iconColor: '#d97706',
      activeBg: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(180,83,9,0.15))',
      activeBorder: '1px solid rgba(217,119,6,0.45)',
    },
    {
      id: 'merging' as const,
      icon: <GitMerge size={18} />,
      label: 'Merging',
      sub: `${directorApprovedEscalations.length} blueprint${directorApprovedEscalations.length === 1 ? '' : 's'} ready`,
      iconColor: 'var(--color-accent)',
      activeBg: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(29,78,216,0.15))',
      activeBorder: '1px solid rgba(37,99,235,0.45)',
    },
    {
      id: 'projects' as const,
      icon: <BarChart3 size={18} />,
      label: 'Project Manager',
      sub: `${projectTrackers.length} active project${projectTrackers.length === 1 ? '' : 's'}`,
      iconColor: 'var(--color-success)',
      activeBg: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))',
      activeBorder: '1px solid rgba(16,185,129,0.4)',
    },
  ] as const;

  function handleDirectorApprove(recordId: string) {
    directorApprove(recordId);
    setExpandedCardId(null);
    setExpandedAction(prev => ({ ...prev, [recordId]: null }));
  }

  function handleSendForReview(recordId: string) {
    const note = (reviewDrafts[recordId] ?? '').trim();
    if (!note) return;
    deEscalateToDeptHead(recordId, note);
    setReviewDrafts(prev => ({ ...prev, [recordId]: '' }));
    setExpandedCardId(null);
    setExpandedAction(prev => ({ ...prev, [recordId]: null }));
  }

  function handleDescalate(recordId: string) {
    const note = (reviewDrafts[`desc-${recordId}`] ?? '').trim();
    if (!note) return;
    directorDeEscalateToStaff(recordId, note);
    setReviewDrafts(prev => ({ ...prev, [`desc-${recordId}`]: '' }));
    setExpandedCardId(null);
    setExpandedAction(prev => ({ ...prev, [recordId]: null }));
  }

  function handleApproveMerge(rec: ZAIMergeRecommendation) {
    setMergingIds(rec.candidateIds);
    setTimeout(() => {
      approveMerge(rec);
      setMergingIds([]);
      setSelectedRecId(null);
    }, 550);
  }

  async function handleProjectDecision(projectId: string, action: string) {
    const key = `${projectId}-${action}`;
    setLoadingAction(key);
    await new Promise(resolve => setTimeout(resolve, 650));
    logProjectDecision(projectId, action);
    setLoadingAction(null);
  }

  const selectedRec = directorMergeRecommendations.find(r => r.id === selectedRecId) ?? null;

  // Decision tab content
  function renderDecisionTab() {
    const subCounts = {
      pending: directorPendingEscalations.length,
      reviewed: directorReviewedEscalations.length,
      approved: directorApprovedEscalations.length,
    };

    const currentList =
      decisionSub === 'pending'
        ? directorPendingEscalations
        : decisionSub === 'reviewed'
          ? directorReviewedEscalations
          : directorApprovedEscalations;

    return (
      <motion.div key="decision" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        {/* Sub-tab pills */}
        <div className="flex gap-2 mb-5">
          {(['pending', 'reviewed', 'approved'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => setDecisionSub(sub)}
              className="px-3 py-1.5 text-xs font-mono transition-all"
              style={{
                background: decisionSub === sub ? 'var(--color-border)' : 'transparent',
                color: decisionSub === sub ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: `1px solid ${decisionSub === sub ? 'var(--color-border)' : 'transparent'}`,
              }}
            >
              {sub.toUpperCase()} · {subCounts[sub]}
            </button>
          ))}
        </div>

        {currentList.length === 0 ? (
          <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {decisionSub === 'pending' ? 'No pending blueprints.' : decisionSub === 'reviewed' ? 'No reviewed blueprints yet.' : 'No approved blueprints yet.'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {decisionSub === 'pending'
                ? 'Blueprints forwarded by department heads appear here.'
                : decisionSub === 'reviewed'
                  ? 'Blueprints sent back for revision will appear here.'
                  : 'Approve a pending blueprint to add it to the merge canvas.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {currentList.map(record => renderDecisionCard(record, decisionSub))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    );
  }

  function renderDecisionCard(record: EscalationRecord, mode: 'pending' | 'reviewed' | 'approved') {
    const { blueprint, submission, submittedBy } = record;
    const isExpanded = expandedCardId === record.id;
    const actionMode = expandedAction[record.id] ?? null;

    const borderColor =
      mode === 'approved'
        ? 'rgba(16,185,129,0.25)'
        : mode === 'reviewed'
          ? 'rgba(245,158,11,0.2)'
          : 'var(--color-border)';

    const statusBadge =
      mode === 'approved'
        ? { label: 'APPROVED', bg: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: 'rgba(16,185,129,0.3)' }
        : mode === 'reviewed'
          ? record.status === 'returned_to_head'
            ? { label: 'SENT FOR REVIEW', bg: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', border: 'rgba(245,158,11,0.3)' }
            : { label: 'DE-ESCALATED', bg: 'rgba(59,130,246,0.1)', color: 'var(--color-accent)', border: 'rgba(59,130,246,0.3)' }
          : null;

    return (
      <motion.div
        key={record.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="overflow-hidden"
        style={{
          background: 'var(--color-bg-card)',
          border: `1px solid ${borderColor}`,
          opacity: mode === 'reviewed' ? 0.85 : 1,
        }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="font-mono text-[10px] px-2 py-0.5"
                  style={{ background: `${blueprint.color}20`, color: blueprint.color, border: `1px solid ${blueprint.color}40` }}
                >
                  {blueprint.department}
                </span>
                {statusBadge && (
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 flex items-center gap-1"
                    style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
                  >
                    {mode === 'approved' && <CheckCircle size={10} />}
                    {statusBadge.label}
                  </span>
                )}
              </div>
              <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {blueprint.title}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {submittedBy.name} · {submittedBy.department} · {record.escalatedAt}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="font-display font-bold text-2xl" style={{ color: blueprint.color }}>{blueprint.scores.total}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>total score</p>
              </div>
              <button
                onClick={() => setDetailRecordId(record.id)}
                className="px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                style={{ background: `${blueprint.color}15`, border: `1px solid ${blueprint.color}40`, color: blueprint.accentColor }}
              >
                View Details
              </button>
              {mode === 'pending' && (
                <button
                  onClick={() => setExpandedCardId(isExpanded ? null : record.id)}
                  className="p-2 transition-colors"
                  style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-panel)' }}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && mode === 'pending' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="p-4 mt-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Problem statement</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{submission.problemStatement}</p>
                </div>

                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>Score breakdown</p>
                  <div className="grid grid-cols-4 gap-2">
                    <ScorePill label="Feasibility" value={blueprint.scores.feasibility} />
                    <ScorePill label="Impact" value={blueprint.scores.businessImpact} />
                    <ScorePill label="Effort" value={blueprint.scores.effort} />
                    <ScorePill label="Risk" value={blueprint.scores.riskConflict} />
                  </div>
                </div>

                <div className="p-3 text-xs italic" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  &ldquo;{record.note}&rdquo;
                </div>

                {/* Primary action buttons */}
                {!actionMode && (
                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => handleDirectorApprove(record.id)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 0 16px rgba(217,119,6,0.25)' }}
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => setExpandedAction(prev => ({ ...prev, [record.id]: 'review' }))}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      <SendHorizonal size={14} />
                      Send for Review
                    </button>
                    <button
                      onClick={() => setExpandedAction(prev => ({ ...prev, [record.id]: 'descalate' }))}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)' }}
                    >
                      <ArrowDownLeft size={14} />
                      De-escalate
                    </button>
                  </div>
                )}

                {/* Send for Review panel */}
                {actionMode === 'review' && (
                  <div className="space-y-3 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Return to department head with review note</p>
                    <textarea
                      value={reviewDrafts[record.id] ?? ''}
                      onChange={e => setReviewDrafts(prev => ({ ...prev, [record.id]: e.target.value }))}
                      rows={3}
                      placeholder="Summarise what the department head should address before re-escalation."
                      className="w-full p-3 text-sm"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendForReview(record.id)}
                        disabled={!(reviewDrafts[record.id] ?? '').trim()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-80"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
                      >
                        <SendHorizonal size={13} />
                        Send for Review
                      </button>
                      <button
                        onClick={() => setExpandedAction(prev => ({ ...prev, [record.id]: null }))}
                        className="px-3 py-2 text-sm transition-all hover:opacity-70"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* De-escalate panel */}
                {actionMode === 'descalate' && (
                  <div className="space-y-3 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>De-escalate directly to staff — provide a reason</p>
                    <textarea
                      value={reviewDrafts[`desc-${record.id}`] ?? ''}
                      onChange={e => setReviewDrafts(prev => ({ ...prev, [`desc-${record.id}`]: e.target.value }))}
                      rows={3}
                      placeholder="Explain why this blueprint is being returned to staff for revision."
                      className="w-full p-3 text-sm"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDescalate(record.id)}
                        disabled={!(reviewDrafts[`desc-${record.id}`] ?? '').trim()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all hover:opacity-80"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: 'var(--color-danger)' }}
                      >
                        <ArrowDownLeft size={13} />
                        Confirm De-escalate
                      </button>
                      <button
                        onClick={() => setExpandedAction(prev => ({ ...prev, [record.id]: null }))}
                        className="px-3 py-2 text-sm transition-all hover:opacity-70"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Merging tab content
  function renderMergingTab() {
    return (
      <motion.div key="merging" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        <div className="flex gap-5" style={{ minHeight: '420px' }}>
          {/* Left — Z.AI recommendations */}
          <div className="flex flex-col gap-3" style={{ width: '280px', flexShrink: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} style={{ color: 'var(--color-accent)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>RECOMMENDED BY Z.AI</p>
            </div>

            {directorMergeRecommendations.length === 0 ? (
              <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No recommendations yet.</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Approve at least one blueprint in the Decision tab to generate Z.AI merge suggestions.
                </p>
              </div>
            ) : (
              directorMergeRecommendations.map(rec => {
                const isSelected = selectedRecId === rec.id;
                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecId(isSelected ? null : rec.id)}
                    className="p-4 text-left transition-all"
                    style={{
                      background: isSelected ? 'rgba(37,99,235,0.1)' : 'var(--color-bg-panel)',
                      border: `1px solid ${isSelected ? 'rgba(37,99,235,0.4)' : 'var(--color-border)'}`,
                      boxShadow: isSelected ? '0 0 14px rgba(37,99,235,0.15)' : 'none',
                    }}
                  >
                    <p className="font-display font-semibold text-xs mb-2 leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                      {rec.title}
                    </p>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${rec.compatibilityScore}%`, background: 'var(--color-primary)' }}
                        />
                      </div>
                      <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>{rec.compatibilityScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] leading-snug" style={{ color: 'var(--color-text-muted)' }}>
                        {rec.rationale.slice(0, 70)}…
                      </p>
                      <span className="text-[10px] font-mono ml-2 shrink-0" style={{ color: 'var(--color-success)' }}>
                        +{rec.projectedSavings}
                      </span>
                    </div>
                  </button>
                );
              })
            )}

            {selectedRec && (
              <div className="mt-2 p-3 space-y-2" style={{ background: 'var(--color-bg-panel)', border: '1px solid rgba(37,99,235,0.3)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{selectedRec.rationale}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                  Projected savings: {selectedRec.projectedSavings}
                </p>
                <button
                  onClick={() => handleApproveMerge(selectedRec)}
                  disabled={mergingIds.length > 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-all hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', boxShadow: '0 0 16px rgba(37,99,235,0.2)' }}
                >
                  <GitMerge size={14} />
                  {mergingIds.length > 0 ? 'Merging…' : 'Approve Merge'}
                </button>
              </div>
            )}
          </div>

          {/* Right — canvas */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Approved blueprints */}
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
                APPROVED BLUEPRINTS · {directorApprovedEscalations.length}
              </p>
              {directorApprovedEscalations.length === 0 ? (
                <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Approve blueprints in the Decision tab to add them here.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-2 gap-3">
                    {directorApprovedEscalations.map(record => {
                      const { blueprint } = record;
                      const isHighlighted = selectedRec?.candidateIds.includes(blueprint.id);
                      const isMerging = mergingIds.includes(blueprint.id);
                      return (
                        <motion.div
                          key={record.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: isMerging ? 0 : 1, scale: isMerging ? 0.85 : 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.35 }}
                          className="p-4"
                          style={{
                            background: 'var(--color-bg-panel)',
                            border: `1px solid ${isHighlighted ? 'rgba(217,119,6,0.5)' : 'var(--color-border)'}`,
                            boxShadow: isHighlighted ? '0 0 14px rgba(217,119,6,0.15)' : 'none',
                            opacity: selectedRec && !isHighlighted && !isMerging ? 0.45 : undefined,
                            transition: 'border 0.25s, box-shadow 0.25s, opacity 0.25s',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="font-mono text-[10px] px-2 py-0.5"
                              style={{ background: `${blueprint.color}20`, color: blueprint.color, border: `1px solid ${blueprint.color}40` }}
                            >
                              {blueprint.department}
                            </span>
                            {isHighlighted && (
                              <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(217,119,6,0.12)', color: '#d97706', border: '1px solid rgba(217,119,6,0.35)' }}>
                                SELECTED
                              </span>
                            )}
                          </div>
                          <p className="font-display font-semibold text-sm mb-2 leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                            {blueprint.title}
                          </p>
                          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span>Score {blueprint.scores.total}</span>
                            <span style={{ color: 'var(--color-success)' }}>ROI {blueprint.financeModel.roi}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Existing systems */}
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
                EXISTING SYSTEMS · {allDisplayedSystems.length}
              </p>
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-2 gap-3">
                  {allDisplayedSystems.map(system => renderSystemCard(system))}
                </div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  function renderSystemCard(system: ExistingSystem) {
    const isHighlighted = selectedRec?.candidateIds.includes(system.id);
    const isMerging = mergingIds.includes(system.id);
    return (
      <motion.div
        key={system.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isMerging ? 0 : 1, scale: isMerging ? 0.85 : 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.35 }}
        className="p-4"
        style={{
          background: system.isMerged ? 'rgba(37,99,235,0.06)' : 'var(--color-bg-panel)',
          border: `1px solid ${isHighlighted ? 'rgba(217,119,6,0.5)' : system.isMerged ? 'rgba(37,99,235,0.3)' : 'var(--color-border)'}`,
          boxShadow: isHighlighted ? '0 0 14px rgba(217,119,6,0.15)' : system.isMerged ? '0 0 12px rgba(37,99,235,0.1)' : 'none',
          opacity: selectedRec && !isHighlighted && !isMerging ? 0.45 : undefined,
          transition: 'border 0.25s, box-shadow 0.25s, opacity 0.25s',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="font-mono text-[10px] px-2 py-0.5"
            style={{ background: `${system.color}20`, color: system.color, border: `1px solid ${system.color}40` }}
          >
            {system.department}
          </span>
          {system.isMerged && (
            <span className="font-mono text-[10px] px-2 py-0.5 flex items-center gap-1" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <GitMerge size={9} />
              MERGED
            </span>
          )}
          {isHighlighted && !system.isMerged && (
            <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(217,119,6,0.12)', color: '#d97706', border: '1px solid rgba(217,119,6,0.35)' }}>
              SELECTED
            </span>
          )}
        </div>
        <p className="font-display font-semibold text-sm mb-1 leading-snug" style={{ color: 'var(--color-text-primary)' }}>{system.name}</p>
        <p className="text-[10px] mb-2 leading-snug" style={{ color: 'var(--color-text-muted)' }}>
          {system.description.slice(0, 60)}…
        </p>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--color-text-muted)' }}>
            ${(system.monthlyCost / 1000).toFixed(0)}k/mo
          </span>
          {system.combinedSavings && (
            <span className="font-mono text-[10px]" style={{ color: 'var(--color-success)' }}>
              saved {system.combinedSavings}
            </span>
          )}
        </div>
        {system.sourceTitles && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            From: {system.sourceTitles.join(' + ')}
          </p>
        )}
      </motion.div>
    );
  }

  // Projects tab content
  function renderProjectsTab() {
    return (
      <motion.div key="projects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        <div className="space-y-5">
          {projectTrackers.map(tracker => renderProjectCard(tracker))}
        </div>
      </motion.div>
    );
  }

  function renderProjectCard(tracker: ProjectTracker) {
    const hm = healthMeta(tracker.health);
    return (
      <div
        key={tracker.id}
        className="overflow-hidden"
        style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{tracker.title}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tracker.department}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className="text-xs px-3 py-1"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Month {tracker.currentMonth} of {tracker.totalMonths}
              </span>
              <span
                className="font-mono text-[11px] font-semibold px-3 py-1"
                style={{ background: hm.bg, color: hm.color }}
              >
                {hm.label}
              </span>
            </div>
          </div>

          {/* Phase progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(tracker.currentMonth / tracker.totalMonths) * 100}%`, background: hm.color }}
              />
            </div>
            <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>
              {Math.round((tracker.currentMonth / tracker.totalMonths) * 100)}%
            </span>
          </div>
        </div>

        {/* Metrics table */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>KEY ASSUMPTIONS</p>
          <div style={{ border: '1px solid var(--color-border)' }}>
            {/* Table header */}
            <div
              className="grid text-[10px] font-mono px-3 py-2"
              style={{ gridTemplateColumns: '1fr 110px 110px 32px', gap: '8px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text-muted)' }}
            >
              <span>METRIC</span>
              <span>PREDICTED</span>
              <span>ACTUAL</span>
              <span></span>
            </div>
            {tracker.metrics.map((row, i) => {
              const s = metricStatusChar(row.status);
              return (
                <div
                  key={row.label}
                  className="px-3 py-3"
                  style={{ borderBottom: i < tracker.metrics.length - 1 ? '1px solid var(--color-border)' : undefined }}
                >
                  <div
                    className="grid text-xs mb-1"
                    style={{ gridTemplateColumns: '1fr 110px 110px 32px', gap: '8px', alignItems: 'center' }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                    <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>{row.predicted}</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{row.actual}</span>
                    <span className="font-bold text-sm" style={{ color: s.color }}>{s.char}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)', paddingLeft: '0' }}>{row.impact}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Projected ROI</p>
            <p className="font-display font-bold" style={{ color: 'var(--color-success)' }}>{tracker.roiProjected}</p>
          </div>
        </div>

        {/* AT RISK decision panel */}
        {tracker.health === 'AT_RISK' && tracker.glmRecommendation && (
          <div className="mx-5 mb-5 p-4 space-y-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-warning)' }}>Decision Required</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{tracker.glmRecommendation}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(tracker.decisionActions ?? []).map(action => {
                const key = `${tracker.id}-${action}`;
                const isLoading = loadingAction === key;
                const isLogged = tracker.decisions.some(d => d.action === action);
                return (
                  <button
                    key={action}
                    onClick={() => !isLogged && handleProjectDecision(tracker.id, action)}
                    disabled={isLoading || isLogged}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all disabled:opacity-60"
                    style={{
                      background: isLogged ? 'rgba(16,185,129,0.1)' : 'var(--color-bg-card)',
                      border: `1px solid ${isLogged ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      color: isLogged ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {isLogged && <CheckCircle size={12} />}
                    {isLoading ? 'Logging…' : isLogged ? `Logged: ${action}` : action}
                  </button>
                );
              })}
            </div>

            {tracker.decisions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>LOGGED DECISIONS</p>
                {tracker.decisions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <CheckCircle size={11} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{d.action}</span>
                    <span>· {d.loggedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const pendingBlueprints = directorPendingEscalations.map(r => r.blueprint);
  const showBanner = pendingBlueprints.length > 0 && !bannerDismissed;
  const bannerTotalBudget = pendingBlueprints.reduce((sum, bp) => sum + bp.financeModel.capexValue, 0);
  const bannerAvgRoi = pendingBlueprints.length > 0
    ? Math.round(pendingBlueprints.reduce((sum, bp) => sum + bp.financeModel.roiValue, 0) / pendingBlueprints.length)
    : 0;
  const bannerAvgPayback = pendingBlueprints.length > 0
    ? Math.round(pendingBlueprints.reduce((sum, bp) => sum + bp.financeModel.paybackMonths, 0) / pendingBlueprints.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Portfolio analysis notification banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-4 px-5 py-4"
            style={{
              background: 'var(--color-bg-panel)',
              border: '1px solid var(--color-border)',
              borderLeft: '3px solid var(--color-primary)',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                Optimal portfolio combination identified
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {pendingBlueprints.length} blueprint{pendingBlueprints.length === 1 ? '' : 's'} analysed ·{' '}
                Budget ${Math.round(bannerTotalBudget / 1000)}k · ROI {bannerAvgRoi}% · Payback {bannerAvgPayback} months
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowPortfolioElim(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white transition-all hover:opacity-80"
                style={{ background: 'var(--color-primary)' }}
              >
                View Elimination Analysis
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 transition-opacity hover:opacity-60"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span style={{ fontSize: '14px' }}>×</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex gap-3"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              animate={{ flex: isActive ? 3 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="p-5 text-left overflow-hidden min-w-0"
              style={{
                background: isActive ? tab.activeBg : 'var(--color-bg-card)',
                border: isActive ? tab.activeBorder : '1px solid var(--color-border)',
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              <div style={{ color: tab.iconColor }} className="mb-3 shrink-0">{tab.icon}</div>
              <p className="font-display font-semibold text-sm mb-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: 'var(--color-text-primary)' }}>
                {tab.label}
              </p>
              <motion.p
                animate={{ opacity: isActive ? 1 : 0, height: isActive ? 'auto' : 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs overflow-hidden"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {tab.sub}
              </motion.p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Tab content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="p-6"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'decision' && renderDecisionTab()}
          {activeTab === 'merging' && renderMergingTab()}
          {activeTab === 'projects' && renderProjectsTab()}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showPortfolioElim && (
          <PortfolioElimination
            blueprints={pendingBlueprints}
            onClose={() => setShowPortfolioElim(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(() => {
          const allRecords = [...directorPendingEscalations, ...directorReviewedEscalations, ...directorApprovedEscalations];
          const detailRecord = allRecords.find(r => r.id === detailRecordId) ?? null;
          if (!detailRecord) return null;
          const isPending = directorPendingEscalations.some(r => r.id === detailRecord.id);
          return (
            <BlueprintDetailModal
              key={detailRecord.id}
              record={detailRecord}
              isForwarded={!isPending}
              onApprove={isPending ? () => { handleDirectorApprove(detailRecord.id); setDetailRecordId(null); } : undefined}
              approveLabel="Approve Blueprint"
              onClose={() => setDetailRecordId(null)}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
