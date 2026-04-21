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
    <div className="page-shell" style={{ background: '#050810' }}>
      <div className="page-container max-w-6xl space-y-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs mb-3" style={{ color: '#2563eb' }}>
            {superiorMode ? 'SUPERIOR DASHBOARD' : 'STAFF DASHBOARD'}
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: '#f0f6ff' }}>
            {superiorMode
              ? `Leadership review center for ${currentUser.name}`
              : `Welcome back, ${currentUser.name}`}
          </h1>
          <p style={{ color: '#8bafd4' }}>
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
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <GitMerge size={18} className="mb-3" style={{ color: '#8b5cf6' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                  Pending merges
                </p>
                <p className="text-xs" style={{ color: '#8bafd4' }}>
                  {pendingEscalations.length} escalations are waiting for superior review.
                </p>
              </button>

              <div className="p-5 rounded-2xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                <Sparkles size={18} className="mb-3" style={{ color: '#06b6d4' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                  GLM suggestions
                </p>
                <p className="text-xs" style={{ color: '#8bafd4' }}>
                  {mergeSuggestions.length > 0
                    ? `${mergeSuggestions.length} compatible blueprint pairs are ready for comparison.`
                    : 'No merge suggestions yet. Escalate more blueprints to unlock a paired review.'}
                </p>
              </div>

              <button
                onClick={() => router.push(mergedStrategy ? ROUTES.output : ROUTES.merge)}
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <FileText size={18} className="mb-3" style={{ color: '#10b981' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                  Latest strategy output
                </p>
                <p className="text-xs" style={{ color: '#8bafd4' }}>
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
                className="p-6 rounded-2xl"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold" style={{ color: '#f0f6ff' }}>
                    Pending escalations
                  </h2>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#1a2d50', color: '#8bafd4' }}>
                    {pendingEscalations.length} pending
                  </span>
                </div>

                {pendingEscalations.length > 0 ? (
                  <div className="space-y-3">
                    {pendingEscalations.slice(0, 4).map(record => (
                      <button
                        key={record.id}
                        onClick={() => router.push(ROUTES.merge)}
                        className="w-full p-4 rounded-xl text-left transition-all hover:border-blue-500/30"
                        style={{ background: '#080d1a', border: '1px solid #1a2d50' }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                              {record.blueprint.title}
                            </p>
                            <p className="text-xs" style={{ color: '#8bafd4' }}>
                              Escalated by {record.submittedBy.name} from {record.submittedBy.department}
                            </p>
                          </div>
                          <ArrowRight size={16} style={{ color: '#4a6a94' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                    <p className="text-sm mb-1" style={{ color: '#f0f6ff' }}>
                      No escalations are waiting right now.
                    </p>
                    <p className="text-xs" style={{ color: '#8bafd4' }}>
                      Once staff users escalate a blueprint, ODIS will queue it here for superior review.
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <h2 className="font-display font-semibold mb-4" style={{ color: '#f0f6ff' }}>
                  Best merge suggestion
                </h2>
                {mergeSuggestions[0] ? (
                  <>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: '#8bafd4' }}>
                      {mergeSuggestions[0].rationale}
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {Object.entries(mergeSuggestions[0].compatibility).map(([label, value]) => (
                        <div key={label} className="p-3 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                          <p className="text-xs capitalize mb-1" style={{ color: '#4a6a94' }}>
                            {label}
                          </p>
                          <p className="font-display font-bold text-lg" style={{ color: '#f0f6ff' }}>
                            {value}%
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push(ROUTES.merge)}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
                    >
                      Open merge workspace
                    </button>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: '#8bafd4' }}>
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
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #2563eb20, #1d4ed820)', border: '1px solid rgba(37, 99, 235, 0.3)' }}
              >
                <Plus size={18} className="mb-3" style={{ color: '#3b82f6' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                  Start a new problem
                </p>
                <p className="text-xs" style={{ color: '#8bafd4' }}>
                  Open a fresh submission and let ODIS build a new set of blueprints.
                </p>
              </button>

              <button
                onClick={() => router.push(latestStaffRoute)}
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <Layers3 size={18} className="mb-3" style={{ color: '#06b6d4' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                  Continue current flow
                </p>
                <p className="text-xs" style={{ color: '#8bafd4' }}>
                  {activeSubmission
                    ? `Resume at the ${submissionStatus} stage for your active submission.`
                    : 'No active submission yet. ODIS will take you to the submission page.'}
                </p>
              </button>

              <div className="p-5 rounded-2xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                <BarChart3 size={18} className="mb-3" style={{ color: '#10b981' }} />
                <p className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                  Escalation queue
                </p>
                <p className="text-xs" style={{ color: '#8bafd4' }}>
                  {pendingEscalations.length} blueprint{pendingEscalations.length === 1 ? '' : 's'} are currently waiting in the superior review queue.
                </p>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="p-6 rounded-2xl"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-semibold" style={{ color: '#f0f6ff' }}>
                    Active submission
                  </h2>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#1a2d50', color: '#8bafd4' }}>
                    {submissionStatus}
                  </span>
                </div>

                {activeSubmission ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                      <p className="text-xs mb-2" style={{ color: '#4a6a94' }}>
                        Problem statement
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: '#f0f6ff' }}>
                        {activeSubmission.problemStatement}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {contextCounts.map(item => (
                        <div key={item.label} className="p-4 rounded-xl text-center" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                          <p className="font-display font-bold text-2xl" style={{ color: '#f0f6ff' }}>
                            {item.value}
                          </p>
                          <p className="text-xs" style={{ color: '#8bafd4' }}>
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#4a6a94' }}>
                          Preferred blueprint
                        </p>
                        <p className="text-sm" style={{ color: '#f0f6ff' }}>
                          {selectedBlueprint ? selectedBlueprint.title : 'Not selected yet'}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(latestStaffRoute)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: '#1a2d50', color: '#8bafd4' }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                    <p className="text-sm mb-1" style={{ color: '#f0f6ff' }}>
                      No active submission yet.
                    </p>
                    <p className="text-xs" style={{ color: '#8bafd4' }}>
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
                className="p-6 rounded-2xl"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} style={{ color: '#06b6d4' }} />
                  <h2 className="font-display font-semibold" style={{ color: '#f0f6ff' }}>
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
                    <div key={step} className="p-3 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
                      <p className="text-sm" style={{ color: '#8bafd4' }}>
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
