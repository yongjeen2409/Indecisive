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
  Sparkles,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import { useApp } from '../context/AppContext';
import { ROUTES, getLatestStaffRoute, isDeptHead, isDirector } from '../lib/routes';
import { EscalationRecord } from '../types';

export default function Dashboard() {
  const {
    currentUser,
    activeSubmission,
    retrievedContext,
    submissionStatus,
    selectedBlueprint,
    staffEscalations,
    pendingEscalations,
    mergeSuggestions,
    mergedStrategy,
    approveToDirector,
  } = useApp();
  const router = useRouter();
  const [modalRecord, setModalRecord] = useState<EscalationRecord | null>(null);
  const [directorModalRecord, setDirectorModalRecord] = useState<EscalationRecord | null>(null);

  if (!currentUser) {
    return null;
  }

  const deptHeadMode = isDeptHead(currentUser.role);
  const directorMode = isDirector(currentUser.role);
  const latestStaffRoute = getLatestStaffRoute(submissionStatus);
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="grid md:grid-cols-3 gap-4"
            >
              <button
                onClick={() => router.push(ROUTES.review)}
                className="p-5 text-left transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(29,78,216,0.12))', border: '1px solid rgba(37,99,235,0.3)' }}
              >
                <ClipboardList size={18} className="mb-3" style={{ color: 'var(--color-accent)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Review staff escalations
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {staffEscalations.filter(r => r.status === 'pending').length} blueprint{staffEscalations.filter(r => r.status === 'pending').length === 1 ? '' : 's'} are waiting for your review.
                </p>
              </button>

              <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <GitMerge size={18} className="mb-3" style={{ color: 'var(--color-success)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Forwarded to Director
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {staffEscalations.filter(r => r.status !== 'pending').length} blueprint{staffEscalations.filter(r => r.status !== 'pending').length === 1 ? '' : 's'} approved and in the Director queue.
                </p>
              </div>

              <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <BarChart3 size={18} className="mb-3" style={{ color: 'var(--color-warning)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Total escalations
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {staffEscalations.length} solution{staffEscalations.length === 1 ? '' : 's'} submitted by your staff for review.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="p-6"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Staff escalation queue
                </h2>
                <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {staffEscalations.filter(r => r.status === 'pending').length} pending
                </span>
              </div>

              {staffEscalations.length > 0 ? (
                <div className="space-y-3">
                  {staffEscalations.slice(0, 4).map(record => (
                    <button
                      key={record.id}
                      onClick={() => setModalRecord(record)}
                      className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                            {record.blueprint.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {record.submittedBy.name} · {record.submittedBy.department} · score {record.blueprint.scores.total}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.status !== 'pending' && (
                            <span className="text-[10px] px-2 py-0.5 font-mono" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                              FORWARDED
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
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    No escalations yet.
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Once staff escalate a blueprint from the scoring step, it will appear here for review.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        ) : directorMode ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="grid md:grid-cols-3 gap-4"
            >
              <button
                onClick={() => router.push(ROUTES.merge)}
                className="p-5 text-left transition-all hover:scale-[1.02]"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <GitMerge size={18} className="mb-3" style={{ color: 'var(--color-accent)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Pending merges
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {pendingEscalations.length} escalations approved by dept heads, ready for merge.
                </p>
              </button>

              <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <Sparkles size={18} className="mb-3" style={{ color: 'var(--color-accent)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  GLM suggestions
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {mergeSuggestions.length > 0
                    ? `${mergeSuggestions.length} compatible blueprint pairs are ready for comparison.`
                    : 'No merge suggestions yet. Department heads must forward blueprints first.'}
                </p>
              </div>

              <button
                onClick={() => router.push(mergedStrategy ? ROUTES.output : ROUTES.merge)}
                className="p-5 text-left transition-all hover:scale-[1.02]"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <FileText size={18} className="mb-3" style={{ color: 'var(--color-success)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Latest strategy output
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {mergedStrategy
                    ? `${mergedStrategy.title} is ready for review.`
                    : 'No unified strategy generated yet.'}
                </p>
              </button>
            </motion.div>

            <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="p-6"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Pending escalations
                  </h2>
                  <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {pendingEscalations.length} pending
                  </span>
                </div>

                {pendingEscalations.length > 0 ? (
                  <div className="space-y-3">
                    {pendingEscalations.slice(0, 4).map(record => (
                      <button
                        key={record.id}
                        onClick={() => setDirectorModalRecord(record)}
                        className="w-full p-4 text-left transition-all hover:border-blue-500/30"
                        style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                              {record.blueprint.title}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              Escalated by {record.submittedBy.name} from {record.submittedBy.department}
                            </p>
                          </div>
                          <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      No escalations waiting for merge.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Once department heads approve and forward blueprints, they will appear here for merge.
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <h2 className="font-display font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Best merge suggestion
                </h2>
                {mergeSuggestions[0] ? (
                  <>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {mergeSuggestions[0].rationale}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {Object.entries(mergeSuggestions[0].compatibility).map(([label, value]) => (
                        <div key={label} className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="text-xs capitalize mb-1" style={{ color: 'var(--color-text-muted)' }}>
                            {label}
                          </p>
                          <p className="font-display font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                            {value}%
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push(ROUTES.merge)}
                      className="w-full py-3 font-semibold text-white transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))' }}
                    >
                      Open merge workspace
                    </button>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Indecisive needs at least two pending escalations before it can recommend a compatible merge pair.
                  </p>
                )}
              </motion.div>
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="grid md:grid-cols-3 gap-4"
            >
              <button
                onClick={() => router.push(ROUTES.submit)}
                className="p-5 text-left transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #2563eb20, #1d4ed820)', border: '1px solid rgba(37, 99, 235, 0.3)' }}
              >
                <Plus size={18} className="mb-3" style={{ color: 'var(--color-primary-bright)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Start a new problem
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Open a fresh submission and let Indecisive build a new set of blueprints.
                </p>
              </button>

              <button
                onClick={() => router.push(latestStaffRoute)}
                className="p-5 text-left transition-all hover:scale-[1.02]"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <Layers3 size={18} className="mb-3" style={{ color: 'var(--color-accent)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Continue current flow
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {activeSubmission
                    ? `Resume at the ${submissionStatus} stage for your active submission.`
                    : 'No active submission yet. Indecisive will take you to the submission page.'}
                </p>
              </button>

              <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <BarChart3 size={18} className="mb-3" style={{ color: 'var(--color-success)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Escalation queue
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Submit and escalate a blueprint to start the review pipeline.
                </p>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="p-6"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Active submission
                  </h2>
                  <span className="text-xs font-mono px-2 py-1" style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {submissionStatus}
                  </span>
                </div>

                {activeSubmission ? (
                  <div className="space-y-5">
                    <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                        Problem statement
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                        {activeSubmission.problemStatement}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {contextCounts.map(item => (
                        <div key={item.label} className="p-4 text-center" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                          <p className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                            {item.value}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          Preferred blueprint
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {selectedBlueprint ? selectedBlueprint.title : 'Not selected yet'}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(latestStaffRoute)}
                        className="px-4 py-2 text-sm font-medium transition-all"
                        style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      No active submission yet.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Start a new problem to see retrieved context, generated blueprints, conflicts,
                      and ranking progress here.
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} style={{ color: 'var(--color-accent)' }} />
                  <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Staff workflow guide
                  </h2>
                </div>
                <div className="space-y-3">
                  {[
                    'Submit a business problem in plain text.',
                    'Review retrieved context and AI-generated blueprints.',
                    'Acknowledge conflicts before opening the ranking table.',
                    'Escalate one preferred blueprint to a superior.',
                  ].map(step => (
                    <div key={step} className="p-3" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {modalRecord && (
          <BlueprintDetailModal
            record={modalRecord}
            isForwarded={modalRecord.status !== 'pending'}
            onApprove={() => approveToDirector(modalRecord.id)}
            onClose={() => setModalRecord(null)}
          />
        )}
        {directorModalRecord && (
          <BlueprintDetailModal
            record={directorModalRecord}
            isForwarded={false}
            onApprove={() => { setDirectorModalRecord(null); router.push(ROUTES.merge); }}
            onClose={() => setDirectorModalRecord(null)}
            approveLabel="Open Merge View"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
