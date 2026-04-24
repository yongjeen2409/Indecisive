'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  GitMerge,
  Layers3,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BatchBlueprintArenaModal from '../components/BatchBlueprintArenaModal';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import ManagerBatchReviewPanel from '../components/ManagerBatchReviewPanel';
import { useApp } from '../context/AppContext';
import { buildManagerBatchSyntheticRecord, getManagerBatchPrimaryBlueprint } from '../lib/managerReview';
import { ROUTES, getLatestStaffRoute, isDeptHead, isDirector } from '../lib/routes';
import { EscalationRecord, ManagerReviewBatch } from '../types';
import DirectorPortal from './DirectorPortal';
import ProblemChatModal from '../components/ProblemChatModal';

function getSubmissionPreview(problemStatement: string, maxLength = 150) {
  if (problemStatement.length <= maxLength) {
    return problemStatement;
  }

  return `${problemStatement.slice(0, maxLength - 3).trim()}...`;
}

function getStaffSubmissionStatusMeta(status: EscalationRecord['status']) {
  switch (status) {
    case 'forwarded':
      return {
        label: 'Forwarded to Director',
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.28)',
        color: 'var(--color-success)',
      };
    case 'merged':
      return {
        label: 'Included in merged strategy',
        background: 'rgba(245,158,11,0.12)',
        border: '1px solid rgba(245,158,11,0.28)',
        color: 'var(--color-warning)',
      };
    case 'returned_to_head':
      return {
        label: 'Returned to department head for review',
        background: 'rgba(234,179,8,0.12)',
        border: '1px solid rgba(234,179,8,0.28)',
        color: 'var(--color-warning)',
      };
    case 'returned_to_staff':
      return {
        label: 'Returned to staff for revision',
        background: 'rgba(59,130,246,0.12)',
        border: '1px solid rgba(59,130,246,0.28)',
        color: 'var(--color-accent)',
      };
    case 'pending':
    default:
      return {
        label: 'Awaiting department head review',
        background: 'rgba(37,99,235,0.12)',
        border: '1px solid rgba(37,99,235,0.28)',
        color: 'var(--color-accent)',
      };
  }
}

function getManagerBatchStatusMeta(status: ManagerReviewBatch['status']) {
  switch (status) {
    case 'forwarded_to_director':
      return {
        label: 'One blueprint forwarded to director',
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.28)',
        color: 'var(--color-success)',
      };
    case 'returned_to_employee':
      return {
        label: 'Returned for reranking',
        background: 'rgba(196,122,48,0.12)',
        border: '1px solid rgba(196,122,48,0.28)',
        color: 'var(--color-warning)',
      };
    case 'pending':
    default:
      return {
        label: 'Awaiting manager review',
        background: 'rgba(37,99,235,0.12)',
        border: '1px solid rgba(37,99,235,0.28)',
        color: 'var(--color-accent)',
      };
  }
}

export default function Dashboard() {
  const {
    currentUser,
    activeSubmission,
    retrievedContext,
    submissionStatus,
    selectedBlueprint,
    rankedBlueprints,
    managerPendingBatches,
    managerReturnedBatches,
    managerForwardedBatches,
    myManagerReviewBatches,
  } = useApp();
  const router = useRouter();
  const [staffHistoryRecord, setStaffHistoryRecord] = useState<EscalationRecord | null>(null);
  const [managerModalState, setManagerModalState] = useState<{ batchId: string; blueprintId: string } | null>(null);
  const [arenaBatchId, setArenaBatchId] = useState<string | null>(null);
  const [deptTab, setDeptTab] = useState<'review' | 'forwarded' | 'all'>('review');
  const [staffTab, setStaffTab] = useState<'new' | 'current' | 'history'>('current');
  const [showOdisChat, setShowOdisChat] = useState(false);

  if (!currentUser) {
    return null;
  }

  const deptHeadMode = isDeptHead(currentUser.role);
  const directorMode = isDirector(currentUser.role);
  const latestStaffRoute = getLatestStaffRoute(submissionStatus);
  const mySubmissionHistory = myManagerReviewBatches;
  const allManagerBatches = [...managerPendingBatches, ...managerForwardedBatches, ...managerReturnedBatches];
  const managerModalBatch = managerModalState
    ? allManagerBatches.find(batch => batch.id === managerModalState.batchId) ?? null
    : null;
  const managerModalBlueprint = managerModalBatch && managerModalState
    ? (managerModalBatch.rescoredBlueprints ?? managerModalBatch.blueprints).find(
      blueprint => blueprint.id === managerModalState.blueprintId,
    ) ?? null
    : null;
  const contextCounts = retrievedContext
    ? [
        { label: 'Jira tickets', value: retrievedContext.jiraTickets.length },
        { label: 'Confluence docs', value: retrievedContext.confluenceDocs.length },
        { label: 'Past decisions', value: retrievedContext.pastDecisions.length },
      ]
    : [
        { label: 'Jira tickets', value: 0 },
        { label: 'Confluence docs', value: 0 },
        { label: 'Past decisions', value: 0 },
      ];

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-6xl space-y-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs mb-3" style={{ color: 'var(--color-primary)' }}>
            {deptHeadMode ? 'DEPT HEAD DASHBOARD' : directorMode ? 'DIRECTOR DASHBOARD' : 'STAFF DASHBOARD'}
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {deptHeadMode || directorMode ? `Leadership review center for ${currentUser.name}` : `Welcome back, ${currentUser.name}`}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {deptHeadMode
              ? 'Review blueprints escalated by your staff, inspect scores, and forward the strongest options to the Director.'
              : directorMode
              ? 'Review escalations approved by department heads, inspect merge suggestions, and generate a unified strategy.'
              : 'Track your current submission, inspect retrieved context, and continue from the right point in the blueprint workflow.'}
          </p>
        </motion.div>

        {deptHeadMode ? (
          <>
            {/* Tab strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex gap-3"
            >
              {([
                {
                  id: 'review' as const,
                  icon: <ClipboardList size={18} />,
                  label: 'Review ranked batches',
                  sub: `${managerPendingBatches.length} batch${managerPendingBatches.length === 1 ? '' : 'es'} waiting for review`,
                  iconColor: 'var(--color-accent)',
                  activeBg: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(29,78,216,0.15))',
                  activeBorder: '1px solid rgba(37,99,235,0.45)',
                },
                {
                  id: 'forwarded' as const,
                  icon: <GitMerge size={18} />,
                  label: 'Forwarded to Director',
                  sub: `${managerForwardedBatches.length} batch${managerForwardedBatches.length === 1 ? '' : 'es'} already forwarded to Director`,
                  iconColor: 'var(--color-success)',
                  activeBg: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))',
                  activeBorder: '1px solid rgba(16,185,129,0.4)',
                },
                {
                  id: 'all' as const,
                  icon: <BarChart3 size={18} />,
                  label: 'Total manager batches',
                  sub: `${managerPendingBatches.length + managerForwardedBatches.length + managerReturnedBatches.length} ranked submission${managerPendingBatches.length + managerForwardedBatches.length + managerReturnedBatches.length === 1 ? '' : 's'} submitted by staff`,
                  iconColor: 'var(--color-warning)',
                  activeBg: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.12))',
                  activeBorder: '1px solid rgba(245,158,11,0.4)',
                },
              ] as const).map(tab => {
                const isActive = deptTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setDeptTab(tab.id)}
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
                {deptTab === 'review' && (
                  <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Awaiting your review
                      </h2>
                      <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {managerPendingBatches.length} pending
                      </span>
                    </div>
                    {managerPendingBatches.length > 0 ? (
                      <div className="space-y-3">
                        {managerPendingBatches.map(batch => {
                          const previewBlueprint = getManagerBatchPrimaryBlueprint(batch);
                          if (!previewBlueprint) {
                            return null;
                          }

                          return (
                            <button
                              key={batch.id}
                              onClick={() => setArenaBatchId(batch.id)}
                            className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                  {batch.submittedBy.name} ranked packet
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {previewBlueprint.title} · {batch.submittedBy.department} · 3 blueprints · score {previewBlueprint.scores.total}
                                </p>
                              </div>
                              <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No pending ranked packets.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Once staff escalate their 3 ranked blueprints, they will appear here.</p>
                      </div>
                    )}
                    <button
                      onClick={() => router.push(ROUTES.review)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: '#fff' }}
                    >
                      Open full review page
                      <ArrowRight size={14} />
                    </button>
                  </motion.div>
                )}

                {deptTab === 'forwarded' && (
                  <motion.div key="forwarded" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Forwarded to Director
                      </h2>
                      <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {managerForwardedBatches.length} forwarded
                      </span>
                    </div>
                    {managerForwardedBatches.length > 0 ? (
                      <div className="space-y-3">
                        {managerForwardedBatches.map(batch => {
                          const previewBlueprint = getManagerBatchPrimaryBlueprint(batch);
                          if (!previewBlueprint) {
                            return null;
                          }

                          return (
                            <button
                              key={batch.id}
                              onClick={() => setManagerModalState({ batchId: batch.id, blueprintId: previewBlueprint.id })}
                            className="w-full p-4 text-left transition-all hover:border-green-500/30"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid rgba(16,185,129,0.2)' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                  {batch.submittedBy.name} ranked packet
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {previewBlueprint.title} · {batch.submittedBy.department} · forwarded to director
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 font-mono shrink-0" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                FORWARDED
                              </span>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No forwarded packets yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Once you forward one blueprint from a ranked packet, it will stay visible here.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {deptTab === 'all' && (
                  <motion.div key="all" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        All escalations
                      </h2>
                      <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {managerPendingBatches.length + managerForwardedBatches.length + managerReturnedBatches.length} total
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Pending review', value: managerPendingBatches.length, color: 'var(--color-warning)' },
                        { label: 'Forwarded', value: managerForwardedBatches.length, color: 'var(--color-success)' },
                        { label: 'Returned to employee', value: managerReturnedBatches.length, color: 'var(--color-accent)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-4 text-center" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="font-display font-bold text-3xl mb-1" style={{ color }}>{value}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {allManagerBatches.length > 0 ? (
                      <div className="space-y-3">
                        {allManagerBatches.map(batch => {
                          const previewBlueprint = getManagerBatchPrimaryBlueprint(batch);
                          const statusMeta = getManagerBatchStatusMeta(batch.status);
                          if (!previewBlueprint) {
                            return null;
                          }

                          return (
                            <button
                              key={batch.id}
                              onClick={() => setManagerModalState({ batchId: batch.id, blueprintId: previewBlueprint.id })}
                            className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                  {batch.submittedBy.name} ranked packet
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {previewBlueprint.title} · {batch.submittedBy.department} · {previewBlueprint.scores.total} total score
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className="text-[10px] px-2 py-0.5 font-mono"
                                  style={{ background: statusMeta.background, color: statusMeta.color, border: statusMeta.border }}
                                >
                                  {statusMeta.label}
                                </span>
                                <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                              </div>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No ranked packets yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Once staff escalate a ranked batch from the blueprint page, it will appear here.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        ) : directorMode ? (
          <DirectorPortal />
        ) : (
          <>
            {/* Staff tab strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex gap-3"
            >
              {([
                {
                  id: 'new' as const,
                  icon: <Plus size={18} />,
                  label: 'Start a new problem',
                  sub: 'Open a fresh submission and let Indecisive build blueprints.',
                  iconColor: 'var(--color-primary-bright)',
                  activeBg: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(29,78,216,0.15))',
                  activeBorder: '1px solid rgba(37,99,235,0.45)',
                },
                {
                  id: 'current' as const,
                  icon: <Layers3 size={18} />,
                  label: 'Continue current flow',
                  sub: activeSubmission
                    ? `Resume at the ${submissionStatus} stage.`
                    : 'No active submission yet.',
                  iconColor: 'var(--color-accent)',
                  activeBg: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.12))',
                  activeBorder: '1px solid rgba(99,102,241,0.4)',
                },
                {
                  id: 'history' as const,
                  icon: <BarChart3 size={18} />,
                  label: 'Submission history',
                  sub: mySubmissionHistory.length > 0
                    ? `${mySubmissionHistory.length} past ranked submission${mySubmissionHistory.length === 1 ? '' : 's'}`
                    : 'No submissions yet.',
                  iconColor: 'var(--color-success)',
                  activeBg: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))',
                  activeBorder: '1px solid rgba(16,185,129,0.4)',
                },
              ] as const).map(tab => {
                const isActive = staffTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setStaffTab(tab.id)}
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

            {/* Staff tab content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="p-6"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <AnimatePresence mode="wait">
                {staffTab === 'new' && (
                  <motion.div key="new" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <h2 className="font-display font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Start a new problem</h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                      Submit a problem statement and let Indecisive retrieve context, generate blueprints, and walk you through scoring.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowOdisChat(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-80"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-bright))' }}
                      >
                        Validate with ODIS
                        <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(ROUTES.submit)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                      >
                        Open submission form
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {staffTab === 'current' && (
                  <motion.div key="current" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>Active submission</h2>
                      <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {submissionStatus}
                      </span>
                    </div>
                    {activeSubmission ? (
                      <div className="space-y-5">
                        <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Problem statement</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{activeSubmission.problemStatement}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {contextCounts.map(item => (
                            <div key={item.label} className="p-4 text-center" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                              <p className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>{item.value}</p>
                              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Current Top 1</p>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {rankedBlueprints[0]?.title ?? selectedBlueprint?.title ?? 'Not ranked yet'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(latestStaffRoute)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-80"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
                          >
                            Continue
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No active submission yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Start a new problem to see retrieved context, generated blueprints, and ranking progress here.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {staffTab === 'history' && (
                  <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText size={16} style={{ color: 'var(--color-accent)' }} />
                      <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>Past submissions</h2>
                    </div>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      Review the status of each ranked packet you previously sent for manager review.
                    </p>
                    {mySubmissionHistory.length > 0 ? (
                      <div className="space-y-3">
                        {mySubmissionHistory.map(batch => {
                          const statusMeta = getManagerBatchStatusMeta(batch.status);
                          const topRanked = (batch.rescoredBlueprints ?? batch.blueprints).find(blueprint => blueprint.id === batch.rankingOrder[0]);
                          return (
                            <div
                              key={batch.id}
                              className="w-full p-4 text-left"
                              style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                    {topRanked?.title ?? 'Ranked blueprint packet'}
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    Submitted {batch.escalatedAt} | Top 1 / Top 2 / Top 3 packet
                                  </p>
                                </div>
                                <span
                                  className="text-[10px] font-mono px-2 py-1 shrink-0"
                                  style={{ background: statusMeta.background, border: statusMeta.border, color: statusMeta.color }}
                                >
                                  {statusMeta.label}
                                </span>
                              </div>
                              <div className="p-3" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>Original problem statement</p>
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                  {getSubmissionPreview(batch.submission.problemStatement)}
                                </p>
                              </div>
                              {batch.managerNote ? (
                                <div className="mt-3 p-3" style={{ background: 'rgba(196,122,48,0.08)', border: '1px solid rgba(196,122,48,0.18)' }}>
                                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-warning)' }}>Latest manager note</p>
                                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                    {batch.managerNote}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No past submissions yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Once you escalate a ranked blueprint packet, it will stay here so you can review manager outcomes later.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showOdisChat && (
          <ProblemChatModal onClose={() => setShowOdisChat(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {arenaBatchId && (() => {
          const arenaBatch = allManagerBatches.find(b => b.id === arenaBatchId);
          return arenaBatch ? (
            <BatchBlueprintArenaModal
              batch={arenaBatch}
              onClose={() => setArenaBatchId(null)}
            />
          ) : null;
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {managerModalBatch && managerModalBlueprint && (
          <BlueprintDetailModal
            record={buildManagerBatchSyntheticRecord(managerModalBatch, managerModalBlueprint)}
            isForwarded={managerModalBatch.status === 'forwarded_to_director'}
            onClose={() => setManagerModalState(null)}
            statusLabel="Manager packet preview"
            reviewPanel={<ManagerBatchReviewPanel batch={managerModalBatch} blueprintId={managerModalBlueprint.id} />}
          />
        )}
        {staffHistoryRecord && (
          <BlueprintDetailModal
            record={staffHistoryRecord}
            isForwarded={staffHistoryRecord.status !== 'pending'}
            onClose={() => setStaffHistoryRecord(null)}
            statusLabel={`Past submission review | ${getStaffSubmissionStatusMeta(staffHistoryRecord.status).label}`}
            reviewPanel={
              (staffHistoryRecord.ticket || (staffHistoryRecord.reviews ?? []).length > 0) ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-accent)' }}>
                      Review
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Feedback from your department head on this escalation.
                    </p>
                  </div>

                  {staffHistoryRecord.ticket && (
                    <div className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                      <p className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Ticket</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {staffHistoryRecord.ticket.id} · {staffHistoryRecord.ticket.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {staffHistoryRecord.ticket.status} · {staffHistoryRecord.ticket.createdAt}
                      </p>
                    </div>
                  )}

                  {(staffHistoryRecord.reviews ?? []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>Review notes</p>
                      {(staffHistoryRecord.reviews ?? []).map(review => (
                        <div key={review.id} className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>{review.byRole} · {review.createdAt}</p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{review.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
