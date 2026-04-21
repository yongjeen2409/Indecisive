'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  FileText,
  GitMerge,
  Layers3,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES, getLatestStaffRoute, isSuperior } from '../lib/routes';

export default function Dashboard() {
  const {
    currentUser,
    activeSubmission,
    retrievedContext,
    submissionStatus,
    selectedBlueprint,
    pendingEscalations,
    mergeSuggestions,
    mergedStrategy,
  } = useApp();
  const router = useRouter();

  if (!currentUser) {
    return null;
  }

  const superiorMode = isSuperior(currentUser.role);
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
            {superiorMode ? 'SUPERIOR DASHBOARD' : 'STAFF DASHBOARD'}
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {superiorMode
              ? `Leadership review center for ${currentUser.name}`
              : `Welcome back, ${currentUser.name}`}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {superiorMode
              ? 'Review escalations, inspect ODIS merge suggestions, and move the strongest option toward executive approval.'
              : 'Track your current submission, inspect retrieved context, and continue from the right point in the blueprint workflow.'}
          </p>
        </motion.div>

        {superiorMode ? (
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
                  {pendingEscalations.length} escalations are waiting for superior review.
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
                    : 'No merge suggestions yet. Escalate more blueprints to unlock a paired review.'}
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
                        onClick={() => router.push(ROUTES.merge)}
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
                      No escalations are waiting right now.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Once staff users escalate a blueprint, ODIS will queue it here for superior review.
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
                    ODIS needs at least two pending escalations before it can recommend a compatible merge pair.
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
                  Open a fresh submission and let ODIS build a new set of blueprints.
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
                    : 'No active submission yet. ODIS will take you to the submission page.'}
                </p>
              </button>

              <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <BarChart3 size={18} className="mb-3" style={{ color: 'var(--color-success)' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Escalation queue
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {pendingEscalations.length} blueprint{pendingEscalations.length === 1 ? '' : 's'} are currently waiting in the superior review queue.
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
    </div>
  );
}
