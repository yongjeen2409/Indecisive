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
import { GitCommitHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import { ROLE_LABELS, RoleAvatar } from '../components/RoleAvatar';
import { useApp } from '../context/AppContext';
import { ROUTES, getLatestStaffRoute, isDeptHead, isDirector } from '../lib/routes';
import { EscalationRecord } from '../types';
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

export default function Dashboard() {
  const {
    currentUser,
    activeSubmission,
    retrievedContext,
    submissionStatus,
    selectedBlueprint,
    escalationQueue,
    staffEscalations,
    approveToDirector,
    deEscalateToStaff,
  } = useApp();
  const router = useRouter();
  const [modalRecord, setModalRecord] = useState<EscalationRecord | null>(null);
  const [staffHistoryRecord, setStaffHistoryRecord] = useState<EscalationRecord | null>(null);
  const [reviewDraftByRecord, setReviewDraftByRecord] = useState<Record<string, string>>({});
  const [deptTab, setDeptTab] = useState<'review' | 'forwarded' | 'all'>('review');
  const [staffTab, setStaffTab] = useState<'new' | 'current' | 'history'>('current');
  const [showOdisChat, setShowOdisChat] = useState(false);

  if (!currentUser) {
    return null;
  }

  const deptHeadMode = isDeptHead(currentUser.role);
  const directorMode = isDirector(currentUser.role);
  const latestStaffRoute = getLatestStaffRoute(submissionStatus);
  const myEscalatedSubmissions = escalationQueue.filter(
    record => record.level === 'staff_to_head' && record.submittedBy.id === currentUser.id,
  );
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
                  label: 'Review staff escalations',
                  sub: `${staffEscalations.filter(r => r.status === 'pending').length} blueprint${staffEscalations.filter(r => r.status === 'pending').length === 1 ? '' : 's'} waiting for review`,
                  iconColor: 'var(--color-accent)',
                  activeBg: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(29,78,216,0.15))',
                  activeBorder: '1px solid rgba(37,99,235,0.45)',
                },
                {
                  id: 'forwarded' as const,
                  icon: <GitMerge size={18} />,
                  label: 'Forwarded to Director',
                  sub: `${staffEscalations.filter(r => r.status === 'forwarded' || r.status === 'merged').length} blueprint${staffEscalations.filter(r => r.status === 'forwarded' || r.status === 'merged').length === 1 ? '' : 's'} in Director queue`,
                  iconColor: 'var(--color-success)',
                  activeBg: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))',
                  activeBorder: '1px solid rgba(16,185,129,0.4)',
                },
                {
                  id: 'all' as const,
                  icon: <BarChart3 size={18} />,
                  label: 'Total escalations',
                  sub: `${staffEscalations.length} solution${staffEscalations.length === 1 ? '' : 's'} submitted by staff`,
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
                        {staffEscalations.filter(r => r.status === 'pending').length} pending
                      </span>
                    </div>
                    {staffEscalations.filter(r => r.status === 'pending' || r.status === 'returned_to_head').length > 0 ? (
                      <div className="space-y-3">
                        {staffEscalations.filter(r => r.status === 'pending' || r.status === 'returned_to_head').map(record => (
                          <button
                            key={record.id}
                            onClick={() => setModalRecord(record)}
                            className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{record.blueprint.title}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {record.submittedBy.name} · {record.submittedBy.department} · score {record.blueprint.scores.total}
                                </p>
                              </div>
                              <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No pending escalations.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Once staff escalate a blueprint from the scoring step, it will appear here.</p>
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
                        {staffEscalations.filter(r => r.status === 'forwarded' || r.status === 'merged').length} forwarded
                      </span>
                    </div>
                    {staffEscalations.filter(r => r.status === 'forwarded' || r.status === 'merged').length > 0 ? (
                      <div className="space-y-3">
                        {staffEscalations.filter(r => r.status === 'forwarded' || r.status === 'merged').map(record => (
                          <button
                            key={record.id}
                            onClick={() => setModalRecord(record)}
                            className="w-full p-4 text-left transition-all hover:border-green-500/30"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid rgba(16,185,129,0.2)' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{record.blueprint.title}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {record.submittedBy.name} · {record.submittedBy.department} · score {record.blueprint.scores.total}
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 font-mono shrink-0" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                {record.status === 'merged' ? 'MERGED' : 'FORWARDED'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No forwarded blueprints yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Approve a staff escalation to forward it to the Director queue.</p>
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
                        {staffEscalations.length} total
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Pending review', value: staffEscalations.filter(r => r.status === 'pending' || r.status === 'returned_to_head').length, color: 'var(--color-warning)' },
                        { label: 'Forwarded', value: staffEscalations.filter(r => r.status === 'forwarded' || r.status === 'merged').length, color: 'var(--color-success)' },
                        { label: 'Returned to staff', value: staffEscalations.filter(r => r.status === 'returned_to_staff').length, color: 'var(--color-accent)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-4 text-center" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="font-display font-bold text-3xl mb-1" style={{ color }}>{value}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {staffEscalations.length > 0 ? (
                      <div className="space-y-3">
                        {staffEscalations.map(record => (
                          <button
                            key={record.id}
                            onClick={() => setModalRecord(record)}
                            className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{record.blueprint.title}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {record.submittedBy.name} · {record.submittedBy.department} · score {record.blueprint.scores.total}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {record.status !== 'pending' && (
                                  <span className="text-[10px] px-2 py-0.5 font-mono" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                    {record.status.toUpperCase().replace('_', ' ')}
                                  </span>
                                )}
                                <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No escalations yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Once staff escalate a blueprint from the scoring step, it will appear here.</p>
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
                  label: 'Escalation history',
                  sub: myEscalatedSubmissions.length > 0
                    ? `${myEscalatedSubmissions.length} past submission${myEscalatedSubmissions.length === 1 ? '' : 's'}`
                    : 'No escalations yet.',
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
                            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Preferred blueprint</p>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {selectedBlueprint ? selectedBlueprint.title : 'Not selected yet'}
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
                      Reopen any blueprint you already escalated and review the original submission record.
                    </p>
                    {myEscalatedSubmissions.length > 0 ? (
                      <div className="space-y-3">
                        {myEscalatedSubmissions.map(record => {
                          const statusMeta = getStaffSubmissionStatusMeta(record.status);
                          return (
                            <button
                              key={record.id}
                              onClick={() => setStaffHistoryRecord(record)}
                              aria-label={`Review ${record.blueprint.title} submission`}
                              className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                              style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{record.blueprint.title}</p>
                                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    Escalated {record.escalatedAt} | {record.blueprint.department}
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
                                  {getSubmissionPreview(record.submission.problemStatement)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>No past submissions yet.</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Once you escalate a blueprint, it will stay here so you can review it later.
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
        {modalRecord && (
          <BlueprintDetailModal
            record={modalRecord}
            isForwarded={modalRecord.status === 'forwarded' || modalRecord.status === 'merged'}
            onApprove={() => approveToDirector(modalRecord.id)}
            onClose={() => setModalRecord(null)}
            reviewPanel={(() => {
              const isLocked = modalRecord.status === 'forwarded' || modalRecord.status === 'merged';
              const reviews = modalRecord.reviews ?? [];
              return (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GitCommitHorizontal size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      Escalated on {modalRecord.escalatedAt}
                    </p>
                  </div>

                  <div style={{ border: '1px solid var(--color-border)' }}>
                    {/* Escalated row */}
                    <div
                      className="flex items-center justify-between gap-3 px-4 py-3"
                      style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
                          Escalated this blueprint
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <RoleAvatar initials={modalRecord.submittedBy.avatar} role={modalRecord.submittedBy.role} size={16} />
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{modalRecord.submittedBy.name}</span>
                            <span className="ml-1" style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
                              ({ROLE_LABELS[modalRecord.submittedBy.role]})
                            </span>
                            {' '}escalated · {modalRecord.escalatedAt}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 shrink-0"
                        style={{ background: `${modalRecord.blueprint.color}18`, color: modalRecord.blueprint.accentColor, border: `1px solid ${modalRecord.blueprint.color}35` }}
                      >
                        {modalRecord.submittedBy.department}
                      </span>
                    </div>

                    {/* Ticket row */}
                    {modalRecord.ticket && (
                      <div
                        className="flex items-center justify-between gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {modalRecord.ticket.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <RoleAvatar initials={modalRecord.ticket.createdByRole.slice(0, 2).toUpperCase()} role={modalRecord.ticket.createdByRole} size={16} />
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              <span style={{ color: 'var(--color-text-secondary)' }}>{ROLE_LABELS[modalRecord.ticket.createdByRole]}</span>
                              {' '}generated ticket · {modalRecord.ticket.createdAt}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 shrink-0"
                          style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.3)' }}
                        >
                          {modalRecord.ticket.id}
                        </span>
                      </div>
                    )}

                    {/* Review rows */}
                    {reviews.map((review, i) => (
                      <div
                        key={review.id}
                        className="px-4 py-3"
                        style={{ borderBottom: i < reviews.length - 1 || !isLocked ? '1px solid var(--color-border)' : undefined, background: 'var(--color-bg-panel)' }}
                      >
                        <p className="text-sm font-semibold leading-snug mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {review.note}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <RoleAvatar initials={review.byRole.slice(0, 2).toUpperCase()} role={review.byRole} size={16} />
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{ROLE_LABELS[review.byRole]}</span>
                            {' '}reviewed · {review.createdAt}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Forwarded row */}
                    {isLocked && (
                      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(16,185,129,0.06)' }}>
                        <GitMerge size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>Forwarded to Director</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>no further action needed</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isLocked && (
                    <div className="mt-5">
                      <div className="flex items-center gap-2 mb-2">
                        <RoleAvatar initials="DH" role="lead" size={16} />
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Leave a review</p>
                      </div>
                      <div style={{ border: '1px solid var(--color-border)' }}>
                        <textarea
                          value={reviewDraftByRecord[modalRecord.id] ?? ''}
                          onChange={event =>
                            setReviewDraftByRecord(current => ({ ...current, [modalRecord.id]: event.target.value }))
                          }
                          rows={4}
                          className="w-full p-3 text-sm"
                          style={{ background: 'var(--color-bg-panel)', color: 'var(--color-text-primary)', resize: 'vertical', display: 'block' }}
                          placeholder="Summarize what staff should revise before resubmission."
                        />
                        <div
                          className="flex items-center justify-end px-3 py-2"
                          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-deep)' }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const reviewNote = (reviewDraftByRecord[modalRecord.id] ?? '').trim();
                              if (!reviewNote) return;
                              deEscalateToStaff(modalRecord.id, reviewNote);
                              setReviewDraftByRecord(current => ({ ...current, [modalRecord.id]: '' }));
                              setModalRecord(null);
                            }}
                            disabled={!(reviewDraftByRecord[modalRecord.id] ?? '').trim()}
                            className="px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 hover:opacity-80"
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                          >
                            De-escalate to Staff
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
