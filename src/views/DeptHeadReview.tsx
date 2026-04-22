'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, SendHorizonal } from 'lucide-react';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import { useApp } from '../context/AppContext';
import { EscalationRecord } from '../types';

function ScorePill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'var(--color-success)' : value >= 65 ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <div
      className="p-3 text-center"
      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="font-display font-bold text-lg" style={{ color }}>{value}</p>
    </div>
  );
}

function EscalationCard({
  record,
  isForwarded,
  onApprove,
  onViewDetails,
}: {
  record: EscalationRecord;
  isForwarded: boolean;
  onApprove: () => void;
  onViewDetails: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { blueprint, submission, submittedBy } = record;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden"
      style={{
        background: isForwarded ? 'var(--color-bg-panel)' : 'var(--color-bg-card)',
        border: `1px solid ${isForwarded ? 'rgba(16,185,129,0.25)' : 'var(--color-border)'}`,
        opacity: isForwarded ? 0.8 : 1,
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="font-mono text-[10px] px-2 py-0.5"
                style={{
                  background: `${blueprint.color}20`,
                  color: blueprint.color,
                  border: `1px solid ${blueprint.color}40`,
                }}
              >
                {blueprint.department}
              </span>
              {isForwarded && (
                <span
                  className="font-mono text-[10px] px-2 py-0.5 flex items-center gap-1"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    color: 'var(--color-success)',
                    border: '1px solid rgba(16,185,129,0.3)',
                  }}
                >
                  <CheckCircle size={10} />
                  FORWARDED TO DIRECTOR
                </span>
              )}
            </div>
            <p className="font-display font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {blueprint.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Escalated by {submittedBy.name} · {submittedBy.department} · {record.escalatedAt}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="font-display font-bold text-2xl" style={{ color: blueprint.color }}>
                {blueprint.scores.total}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>total score</p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 transition-colors rounded"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-panel)' }}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div
                className="p-4 mt-4"
                style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Problem statement</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {submission.problemStatement}
                </p>
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

              <div
                className="flex items-center justify-between gap-4 pt-2"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                  &ldquo;{record.note}&rdquo;
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onViewDetails}
                    className="px-4 py-2 text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      background: `${blueprint.color}15`,
                      border: `1px solid ${blueprint.color}40`,
                      color: blueprint.accentColor,
                    }}
                  >
                    View Full Details
                  </button>
                  {isForwarded ? (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm" style={{ color: 'var(--color-success)' }}>
                      <CheckCircle size={14} />
                      Forwarded to Director
                    </div>
                  ) : (
                    <button
                      onClick={onApprove}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        boxShadow: '0 0 16px rgba(37,99,235,0.25)',
                      }}
                    >
                      Escalate to Director
                      <SendHorizonal size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DeptHeadReview() {
  const { staffEscalations, approveToDirector } = useApp();
  const [modalRecord, setModalRecord] = useState<EscalationRecord | null>(null);

  const pendingCount = staffEscalations.filter(r => r.status === 'pending').length;
  const forwardedCount = staffEscalations.filter(r => r.status !== 'pending').length;

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-4xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs mb-3" style={{ color: 'var(--color-accent)' }}>
            DEPT HEAD REVIEW
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Staff escalation review
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Review solutions escalated by your staff. Inspect scores, architecture, and finance — then
            forward the strongest options to the Director for strategic merge.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total escalations', value: staffEscalations.length, color: 'var(--color-text-primary)' },
            { label: 'Awaiting review', value: pendingCount, color: 'var(--color-warning)' },
            { label: 'Forwarded to Director', value: forwardedCount, color: 'var(--color-success)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="p-5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-display font-bold text-3xl mb-1" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {staffEscalations.length === 0 ? (
            <div
              className="p-8 text-center"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-display font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                No escalations yet
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Once staff users escalate a blueprint from the scoring step, it will appear here for your review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Escalated solutions
                </h2>
                <span
                  className="font-mono text-xs px-2 py-1"
                  style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  {staffEscalations.length} total
                </span>
              </div>
              {staffEscalations.map(record => (
                <EscalationCard
                  key={record.id}
                  record={record}
                  isForwarded={record.status !== 'pending'}
                  onApprove={() => approveToDirector(record.id)}
                  onViewDetails={() => setModalRecord(record)}
                />
              ))}
            </div>
          )}
        </motion.div>
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
      </AnimatePresence>
    </div>
  );
}
