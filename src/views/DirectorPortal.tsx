'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  GitMerge,
  SendHorizonal,
  Sparkles,
} from 'lucide-react';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import PortfolioElimination from '../components/PortfolioElimination';
import { useApp } from '../context/AppContext';
import { buildMergedSystemName } from '../lib/mergeNaming';
import { Blueprint, EscalationRecord, ExistingSystem, ProjectTracker, ZAIMergeRecommendation } from '../types';

const MERGE_STEPS = [
  'Loading approved blueprints...',
  'Scanning existing system landscape...',
  'Identifying functional overlaps...',
  'Calculating compatibility matrices...',
  'Detecting consolidation opportunities...',
  'Mapping integration dependencies...',
  'Generating merge groupings...',
];

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
  if (status === 'ok') return { char: 'OK', color: 'var(--color-success)' };
  if (status === 'warn') return { char: 'WARN', color: 'var(--color-warning)' };
  return { char: 'RISK', color: 'var(--color-danger)' };
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
    deEscalateToDeptHead,
    approveMerge,
    logProjectDecision,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'decision' | 'merging' | 'projects'>('decision');
  const [showPortfolioElim, setShowPortfolioElim] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [decisionSub, setDecisionSub] = useState<'pending' | 'reviewed' | 'approved'>('pending');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<Record<string, 'review' | null>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [mergingIds, setMergingIds] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [mergeAnalysisState, setMergeAnalysisState] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [mergeStepIndex, setMergeStepIndex] = useState(0);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergeApiLanes, setMergeApiLanes] = useState<ZAIMergeRecommendation[] | null>(null);
  const mergeDataRef = useRef<{ blueprints: object[]; systems: object[] } | null>(null);

  const tabs = [
    {
      id: 'decision' as const,
      icon: <ClipboardList size={18} />,
      label: 'Decision',
      sub: `${directorPendingEscalations.length} pending / ${directorApprovedEscalations.length} approved`,
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

  function handleApproveMerge(rec: ZAIMergeRecommendation) {
    setMergingIds(rec.candidateIds);
    setTimeout(() => {
      approveMerge(rec);
      setMergingIds([]);
    }, 550);
  }

  async function handleProjectDecision(projectId: string, action: string) {
    const key = `${projectId}-${action}`;
    setLoadingAction(key);
    await new Promise(resolve => setTimeout(resolve, 650));
    logProjectDecision(projectId, action);
    setLoadingAction(null);
  }

  useEffect(() => {
    if (mergeAnalysisState !== 'analyzing') return;

    let minDone = false;
    let apiFetched = false;
    let result: ZAIMergeRecommendation[] | null = null;

    function tryFinish() {
      if (!minDone || !apiFetched) return;
      if (result) setMergeApiLanes(result);
      setMergeProgress(100);
      setTimeout(() => setMergeAnalysisState('done'), 200);
    }

    setMergeStepIndex(0);
    setMergeProgress(0);

    const minTimer = setTimeout(() => { minDone = true; tryFinish(); }, 3400);
    const stepTimer = setInterval(() => setMergeStepIndex(i => Math.min(i + 1, MERGE_STEPS.length - 1)), 500);
    const progTimer = setInterval(() => setMergeProgress(p => (p >= 92 ? p : p + 1.8)), 80);

    fetch('/api/merge-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergeDataRef.current ?? { blueprints: [], systems: [] }),
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.lanes) && data.lanes.length > 0) result = data.lanes; })
      .catch(() => {})
      .finally(() => { apiFetched = true; tryFinish(); });

    return () => {
      clearTimeout(minTimer);
      clearInterval(stepTimer);
      clearInterval(progTimer);
    };
  }, [mergeAnalysisState]);

  function handleStartMergeAnalysis() {
    mergeDataRef.current = {
      blueprints: directorApprovedEscalations.map(r => ({
        id: r.blueprint.id,
        title: r.blueprint.title,
        department: r.blueprint.department,
        description: r.blueprint.description,
      })),
      systems: allDisplayedSystems.map(s => ({
        id: s.id,
        name: s.name,
        department: s.department,
        description: s.description,
        monthlyCost: s.monthlyCost,
      })),
    };
    setMergeAnalysisState('analyzing');
  }

  function renderThreeLaneColumn({
    label,
    title,
    subtitle,
    accentColor,
    borderColor,
    children,
  }: {
    label: string;
    title: string;
    subtitle: string;
    accentColor: string;
    borderColor: string;
    children: React.ReactNode;
  }) {
    return (
      <div
        className="flex flex-col shrink-0"
        style={{
          width: '320px',
          background: 'var(--color-bg-panel)',
          border: `1px solid ${borderColor}`,
          boxShadow: `0 0 22px ${accentColor}12`,
        }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <p className="font-mono text-[10px] mb-1" style={{ color: accentColor }}>{label}</p>
          <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>
        </div>
        <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{ maxHeight: '520px' }}>
          {children}
        </div>
      </div>
    );
  }

  function renderBlueprintSummaryCard(blueprint: Blueprint) {
    return (
      <div
        key={blueprint.id}
        className="p-3"
        style={{
          background: `${blueprint.color}08`,
          border: `1px solid ${blueprint.color}65`,
          boxShadow: `inset 0 0 0 1px ${blueprint.color}12`,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <span
            className="font-mono text-[9px] px-1.5 py-0.5"
            style={{ background: `${blueprint.color}20`, color: blueprint.color, border: `1px solid ${blueprint.color}45` }}
          >
            {blueprint.department}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Score {blueprint.scores.total}</span>
        </div>
        <p className="text-xs font-medium leading-snug mb-1" style={{ color: 'var(--color-text-primary)' }}>{blueprint.title}</p>
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {blueprint.description}
        </p>
      </div>
    );
  }

  function renderStandaloneSystemCard(system: ExistingSystem) {
    const isMergedSystem = Boolean(system.isMerged);
    return (
      <div
        key={system.id}
        className="p-3"
        style={{
          background: isMergedSystem ? 'rgba(37,99,235,0.08)' : `${system.color}08`,
          border: isMergedSystem ? '1px solid rgba(37,99,235,0.58)' : `1px solid ${system.color}65`,
          boxShadow: isMergedSystem ? 'inset 0 0 0 1px rgba(37,99,235,0.18)' : `inset 0 0 0 1px ${system.color}12`,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-[9px] px-1.5 py-0.5"
              style={{ background: `${system.color}20`, color: system.color, border: `1px solid ${system.color}45` }}
            >
              {system.department}
            </span>
            {isMergedSystem && (
              <span
                className="font-mono text-[9px] px-1.5 py-0.5"
                style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(37,99,235,0.4)' }}
              >
                APPROVED MERGE
              </span>
            )}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            ${(system.monthlyCost / 1000).toFixed(0)}k/mo
          </span>
        </div>
        <p className="text-xs font-medium leading-snug mb-1" style={{ color: 'var(--color-text-primary)' }}>{system.name}</p>
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {system.description}
        </p>
      </div>
    );
  }

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
              {sub.toUpperCase()} / {subCounts[sub]}
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
                  ? 'Blueprints returned for more work stay in reviewed until re-submitted.'
                  : 'Approve a pending blueprint to add it to the merge canvas.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {currentList.map(record => renderDecisionCard(record))}
          </div>
        )}
      </motion.div>
    );
  }

  function renderDecisionCard(record: EscalationRecord) {
    const { blueprint, submission, submittedBy } = record;
    const expanded = expandedCardId === record.id;
    const activeAction = expandedAction[record.id] ?? null;

    return (
      <div
        key={record.id}
        className="overflow-hidden"
        style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-mono text-[10px] px-2 py-0.5"
                  style={{ background: `${blueprint.color}20`, color: blueprint.color, border: `1px solid ${blueprint.color}40` }}
                >
                  {blueprint.department}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  {record.ticket ? `Ticket ${record.ticket.id}` : 'No ticket'}
                </span>
              </div>
              <p className="font-display font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {blueprint.title}
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {blueprint.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Problem</p>
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{submission.problemStatement}</p>
                </div>
                <div className="p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Submitted By</p>
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{submittedBy.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{submittedBy.department}</p>
                </div>
                <div className="p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Financials</p>
                  <p className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{blueprint.financeModel.capex}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>ROI {blueprint.financeModel.roi}</p>
                </div>
                <div className="p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Score</p>
                  <p className="font-display font-bold text-2xl" style={{ color: blueprint.color }}>{blueprint.scores.total}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center gap-2 shrink-0 min-w-[180px] self-stretch">
              <button
                onClick={() => setDetailRecordId(record.id)}
                className="w-full max-w-[180px] px-4 py-2 text-xs font-semibold text-center transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #fffaf0, #f6e6cc)',
                  border: '1px solid #e4c79d',
                  color: '#6b4a24',
                  boxShadow: '0 8px 20px rgba(145,104,49,0.14)',
                }}
              >
                View Details
              </button>

              {record.status === 'forwarded' && (
                <>
                  <button
                    onClick={() => handleDirectorApprove(record.id)}
                    className="w-full max-w-[180px] px-4 py-2 text-xs font-semibold text-white text-center transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.92))' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setExpandedCardId(expanded ? null : record.id);
                      setExpandedAction(prev => ({ ...prev, [record.id]: activeAction === 'review' ? null : 'review' }));
                    }}
                    className="w-full max-w-[180px] px-4 py-2 text-xs font-semibold text-center transition-opacity hover:opacity-90"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', color: 'var(--color-warning)' }}
                  >
                    Send To Dept Head
                  </button>
                </>
              )}

              {record.status !== 'forwarded' && (
                <div className="w-full max-w-[180px] px-4 py-2 text-xs font-semibold text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  {record.status === 'approved_by_director' ? 'Approved for merge analysis' : 'Awaiting resubmission'}
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && activeAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <ScorePill label="Feasibility" value={blueprint.scores.feasibility} />
                  <ScorePill label="Impact" value={blueprint.scores.businessImpact} />
                  <ScorePill label="Effort" value={blueprint.scores.effort} />
                  <ScorePill label="Risk" value={blueprint.scores.riskConflict} />
                </div>

                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Explain why this blueprint is being returned to the department head.
                  </p>
                  <textarea
                    value={reviewDrafts[record.id] ?? ''}
                    onChange={event => setReviewDrafts(prev => ({
                      ...prev,
                      [record.id]: event.target.value,
                    }))}
                    rows={4}
                    className="w-full p-3 text-sm outline-none"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Explain what needs review from the department head."
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setExpandedCardId(null);
                      setExpandedAction(prev => ({ ...prev, [record.id]: null }));
                    }}
                    className="px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendForReview(record.id)}
                    className="px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-warning)' }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <SendHorizonal size={12} />
                      Send Review
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Merge tab content
  function renderMergeTab() {
    return (
      <motion.div key="merging" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
        <AnimatePresence mode="wait">
          {mergeAnalysisState === 'idle' && renderMergeIdle()}
          {mergeAnalysisState === 'analyzing' && renderMergeAnalyzing()}
          {mergeAnalysisState === 'done' && renderMergeDone()}
        </AnimatePresence>
      </motion.div>
    );
  }

  function renderMergeIdle() {
    return (
      <motion.div key="merge-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
        <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
          <div className="flex items-center gap-2">
            <img
              src="/z-ai-logo.png"
              alt="Z.ai logo"
              className="w-[18px] h-[18px] shrink-0 object-cover"
              style={{ borderRadius: '0.3rem' }}
            />
            <p className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>Z.AI MERGE ANALYSIS</p>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Blueprint & System Grouping
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Z.AI will analyze your approved blueprints and existing systems to identify optimal merge groupings and consolidation opportunities.
            </p>
          </div>
          {directorApprovedEscalations.length === 0 ? (
            <div className="p-4 max-w-sm" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Approve at least one blueprint in the Decision tab to start.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {directorApprovedEscalations.length} blueprint{directorApprovedEscalations.length !== 1 ? '' : 's'} / {allDisplayedSystems.length} system{allDisplayedSystems.length !== 1 ? '' : 's'} ready
              </p>
              <button
                onClick={handleStartMergeAnalysis}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white mx-auto transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
              >
                <Sparkles size={15} />
                Analyze with Z.AI
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  function renderMergeAnalyzing() {
    return (
      <motion.div key="merge-analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="text-center">
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>Z.AI IS ANALYZING</p>
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
              Grouping blueprints & systems
            </h2>
          </div>
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 border-2" style={{ borderColor: 'rgba(37,99,235,0.2)' }} />
            <div
              className="absolute inset-0 animate-spin-slow"
              style={{
                background: 'conic-gradient(from 0deg, transparent 70%, var(--color-primary) 100%)',
                borderRadius: '50%',
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
              }}
            />
            <div className="absolute border" style={{ inset: '10px', borderColor: 'rgba(6,182,212,0.2)' }} />
            <div
              className="absolute animate-spin-reverse"
              style={{
                inset: '10px',
                background: 'conic-gradient(from 180deg, transparent 70%, var(--color-accent) 100%)',
                borderRadius: '50%',
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-bold text-xs tracking-widest" style={{ color: 'var(--color-primary-glow)' }}>Z.AI</span>
            </div>
          </div>
          <div className="h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={mergeStepIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-sm text-center"
                style={{ color: 'var(--color-primary-glow)' }}
              >
                {MERGE_STEPS[mergeStepIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="w-64 h-1 overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <motion.div
              className="h-full"
              style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', width: `${Math.min(mergeProgress, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {Math.min(Math.round(mergeProgress), 100)}%
          </p>
        </div>
      </motion.div>
    );
  }

  function renderMergeDone() {
    const effectiveLanes = mergeApiLanes ?? directorMergeRecommendations;
    const assignedBlueprintIds = new Set(
      effectiveLanes.flatMap(l => l.candidateIds.filter(id => l.candidateType[id] === 'blueprint')),
    );
    const assignedSystemIds = new Set(
      effectiveLanes.flatMap(l => l.candidateIds.filter(id => l.candidateType[id] === 'system')),
    );
    const unassignedBlueprints = directorApprovedEscalations
      .map(r => r.blueprint)
      .filter(bp => !assignedBlueprintIds.has(bp.id));
    const unassignedSystems = allDisplayedSystems.filter(s => !assignedSystemIds.has(s.id));

    return (
      <motion.div key="merge-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--color-accent)' }} />
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              Z.AI ANALYSIS / 3 LANES
            </p>
          </div>
          <button
            onClick={() => { setMergeAnalysisState('idle'); setMergeApiLanes(null); }}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Re-analyze
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3" style={{ alignItems: 'flex-start' }}>
          {renderThreeLaneColumn({
            label: 'MERGED LANE',
            title: 'Combined Systems Ready For Approval',
            subtitle: `${effectiveLanes.length} combined system${effectiveLanes.length === 1 ? '' : 's'} identified`,
            accentColor: 'var(--color-accent)',
            borderColor: 'rgba(37,99,235,0.3)',
            children: effectiveLanes.length > 0
              ? effectiveLanes.map((lane, idx) => renderMergeLane(lane, idx))
              : (
                <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No merge groupings were generated.</p>
                </div>
              ),
          })}

          {renderThreeLaneColumn({
            label: 'EXISTING SYSTEMS',
            title: 'Systems Not In A Merge',
            subtitle: `${unassignedSystems.length} standalone system${unassignedSystems.length === 1 ? '' : 's'}`,
            accentColor: '#d97706',
            borderColor: 'rgba(217,119,6,0.3)',
            children: unassignedSystems.length > 0
              ? unassignedSystems.map(system => renderStandaloneSystemCard(system))
              : (
                <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px dashed rgba(217,119,6,0.35)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>All systems are included in a merged lane.</p>
                </div>
              ),
          })}

          {renderThreeLaneColumn({
            label: 'BLUEPRINTS',
            title: 'Blueprints Not Merged',
            subtitle: `${unassignedBlueprints.length} blueprint${unassignedBlueprints.length === 1 ? '' : 's'} left standalone`,
            accentColor: '#7c3aed',
            borderColor: 'rgba(124,58,237,0.3)',
            children: unassignedBlueprints.length > 0
              ? unassignedBlueprints.map(blueprint => renderBlueprintSummaryCard(blueprint))
              : (
                <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px dashed rgba(124,58,237,0.35)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>All approved blueprints are part of a merged lane.</p>
                </div>
              ),
          })}
        </div>
      </motion.div>
    );
  }

  function renderMergeLane(lane: ZAIMergeRecommendation, idx: number) {
    const laneBlueprintIds = lane.candidateIds.filter(id => lane.candidateType[id] === 'blueprint');
    const laneSystemIds = lane.candidateIds.filter(id => lane.candidateType[id] === 'system');
    const laneBlueprints = directorApprovedEscalations.map(r => r.blueprint).filter(bp => laneBlueprintIds.includes(bp.id));
    const laneSystems = allDisplayedSystems.filter(s => laneSystemIds.includes(s.id));
    const isMergingLane = lane.candidateIds.some(id => mergingIds.includes(id));
    const mergedSystemName = buildMergedSystemName({
      proposedName: lane.title,
      department: laneBlueprints[0]?.department ?? laneSystems[0]?.department ?? 'Technology',
      blueprintTitles: laneBlueprints.map(bp => bp.title),
      systemNames: laneSystems.map(sys => sys.name),
    });

    return (
      <motion.div
        key={lane.id}
        initial={{ opacity: 0, y: 16 }}
        animate={isMergingLane ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, delay: idx * 0.06 }}
        className="overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(37,99,235,0.08), rgba(15,23,42,0) 35%)',
          border: '1px solid rgba(37,99,235,0.32)',
          boxShadow: '0 0 20px rgba(37,99,235,0.08)',
        }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid rgba(37,99,235,0.18)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <GitMerge size={11} style={{ color: 'var(--color-accent)' }} />
            <span className="font-mono text-[10px]" style={{ color: 'var(--color-accent)' }}>COMBINED SYSTEM</span>
          </div>
          <p className="font-display font-bold text-sm leading-snug mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {mergedSystemName}
          </p>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${lane.compatibilityScore}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }}
              />
            </div>
            <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{lane.compatibilityScore}%</span>
          </div>
          <span className="font-mono text-[10px]" style={{ color: 'var(--color-success)' }}>+{lane.projectedSavings}</span>
        </div>

        <div className="p-3 space-y-3">
          {laneBlueprints.length > 0 && (
            <div
              className="p-3"
              style={{
                background: 'rgba(37,99,235,0.05)',
                border: '1px solid rgba(37,99,235,0.45)',
              }}
            >
              <p className="font-mono text-[10px] mb-2" style={{ color: 'var(--color-primary)' }}>BLUEPRINTS IN MERGE</p>
              <div className="space-y-2">
                {laneBlueprints.map(bp => (
                  <div key={bp.id} className="p-2.5" style={{ background: `${bp.color}08`, border: `1px solid ${bp.color}70` }}>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 inline-block mb-1" style={{ background: `${bp.color}20`, color: bp.color, border: `1px solid ${bp.color}40` }}>
                      {bp.department}
                    </span>
                    <p className="text-xs font-medium leading-snug" style={{ color: 'var(--color-text-primary)' }}>{bp.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Score {bp.scores.total}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-success)' }}>ROI {bp.financeModel.roi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {laneSystems.length > 0 && (
            <div
              className="p-3"
              style={{
                background: 'rgba(217,119,6,0.05)',
                border: '1px solid rgba(217,119,6,0.45)',
              }}
            >
              <p className="font-mono text-[10px] mb-2" style={{ color: '#d97706' }}>SYSTEMS IN MERGE</p>
              <div className="space-y-2">
                {laneSystems.map(sys => (
                  <div key={sys.id} className="p-2.5" style={{ background: `${sys.color}08`, border: `1px solid ${sys.color}70` }}>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 inline-block mb-1" style={{ background: `${sys.color}20`, color: sys.color, border: `1px solid ${sys.color}40` }}>
                      {sys.department}
                    </span>
                    <p className="text-xs font-medium leading-snug" style={{ color: 'var(--color-text-primary)' }}>{sys.name}</p>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      ${(sys.monthlyCost / 1000).toFixed(0)}k/mo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-2.5" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <p className="text-[10px] leading-relaxed italic" style={{ color: 'var(--color-text-muted)' }}>
              {lane.rationale.slice(0, 140)}{lane.rationale.length > 140 ? '...' : ''}
            </p>
          </div>
        </div>

        <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => handleApproveMerge(lane)}
            disabled={mergingIds.length > 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white disabled:opacity-60 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', boxShadow: '0 0 12px rgba(37,99,235,0.15)' }}
          >
            <GitMerge size={11} />
            {isMergingLane ? 'Merging...' : 'Approve Merge'}
          </button>
        </div>
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
                style={{ background: hm.bg, color: hm.color, border: `1px solid ${hm.color}33` }}
              >
                {hm.label}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 grid lg:grid-cols-[1.3fr,0.8fr] gap-5">
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {tracker.metrics.map(metric => {
                const statusMeta = metricStatusChar(metric.status);
                return (
                  <div key={metric.label} className="p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{metric.label}</p>
                      <span className="text-xs font-mono" style={{ color: statusMeta.color }}>{statusMeta.char}</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{metric.actual}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Target {metric.predicted}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>DECISION LOG</p>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Projected ROI {tracker.roiProjected}</span>
              </div>
              <div className="space-y-2">
                {tracker.decisions.map(entry => (
                  <div key={`${entry.action}-${entry.loggedAt}`} className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>{entry.action}</span>
                    <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>{entry.loggedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <p className="font-mono text-[10px] mb-2" style={{ color: 'var(--color-text-muted)' }}>GLM RECOMMENDATION</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {tracker.glmRecommendation ?? 'No recommendation generated yet.'}
              </p>
            </div>

            <div className="space-y-2">
              {(tracker.decisionActions ?? []).map(action => {
                const isLoading = loadingAction === `${tracker.id}-${action}`;
                return (
                  <button
                    key={action}
                    onClick={() => handleProjectDecision(tracker.id, action)}
                    disabled={Boolean(loadingAction)}
                    className="w-full px-4 py-3 text-sm font-semibold text-left transition-all hover:scale-[1.01] disabled:opacity-60"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    {isLoading ? 'Logging decision...' : action}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const detailRecord = detailRecordId
    ? [...directorPendingEscalations, ...directorReviewedEscalations, ...directorApprovedEscalations].find(record => record.id === detailRecordId) ?? null
    : null;

  return (
    <div className="space-y-6">
      {!bannerDismissed && (
        <div
          className="p-4 flex items-start justify-between gap-4"
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} style={{ color: 'var(--color-primary)' }} className="mt-0.5" />
            <div>
              <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Director workflow active
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Review escalated blueprints, group approved work into merge lanes, and track merged delivery decisions in one place.
              </p>
            </div>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
        <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>DIRECTOR PORTAL</p>
              <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                Blueprint Governance
              </h1>
            </div>
            <button
              onClick={() => setShowPortfolioElim(value => !value)}
              className="px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {showPortfolioElim ? 'Hide Portfolio View' : 'Show Portfolio View'}
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="p-4 text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: active ? tab.activeBg : 'var(--color-bg-card)',
                    border: active ? tab.activeBorder : '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span style={{ color: tab.iconColor }}>{tab.icon}</span>
                    <p className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>{tab.label}</p>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{tab.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        {showPortfolioElim && (
          <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
            <p className="font-mono text-[10px] mb-3" style={{ color: 'var(--color-text-muted)' }}>PORTFOLIO ELIMINATION</p>
            <PortfolioElimination
              blueprints={directorPendingEscalations.map(record => record.blueprint)}
              onClose={() => setShowPortfolioElim(false)}
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'decision' && renderDecisionTab()}
        {activeTab === 'merging' && renderMergeTab()}
        {activeTab === 'projects' && renderProjectsTab()}
      </AnimatePresence>

      {detailRecord && (
        <BlueprintDetailModal
          record={detailRecord}
          isForwarded={detailRecord.status === 'forwarded'}
          onClose={() => setDetailRecordId(null)}
        />
      )}
    </div>
  );
}

