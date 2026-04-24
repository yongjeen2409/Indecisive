'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, GitCommitHorizontal, GitMerge, SendHorizonal, TicketCheck } from 'lucide-react';
import AssumptionAudit from '../components/AssumptionAudit';
import BlueprintDetailModal from '../components/BlueprintDetailModal';
import { useApp } from '../context/AppContext';
import { EscalationRecord } from '../types';
import { ROLE_LABELS, RoleAvatar } from '../components/RoleAvatar';

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
  const [assumptionsComplete, setAssumptionsComplete] = useState(false);
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

              <AssumptionAudit
                blueprint={blueprint}
                onAllActioned={() => setAssumptionsComplete(true)}
              />

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
                      disabled={!assumptionsComplete}
                      title={!assumptionsComplete ? 'Review all assumptions before escalating' : undefined}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        boxShadow: assumptionsComplete ? '0 0 16px rgba(37,99,235,0.25)' : 'none',
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
  const { staffEscalations, approveToDirector, deEscalateToStaff } = useApp();
  const [modalRecordId, setModalRecordId] = useState<string | null>(null);
  const [reviewDraftByRecord, setReviewDraftByRecord] = useState<Record<string, string>>({});
  const modalRecord = staffEscalations.find(record => record.id === modalRecordId) ?? null;

  const pendingCount = staffEscalations.filter(r => r.status === 'pending' || r.status === 'returned_to_head').length;
  const forwardedCount = staffEscalations.filter(r => r.status === 'forwarded').length;
  const returnedCount = staffEscalations.filter(r => r.status === 'returned_to_staff').length;

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
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total escalations', value: staffEscalations.length, color: 'var(--color-text-primary)' },
            { label: 'Awaiting review', value: pendingCount, color: 'var(--color-warning)' },
            { label: 'Forwarded to Director', value: forwardedCount, color: 'var(--color-success)' },
            { label: 'Returned to Staff', value: returnedCount, color: 'var(--color-accent)' },
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
                  isForwarded={record.status === 'forwarded' || record.status === 'merged'}
                  onApprove={() => approveToDirector(record.id)}
                  onViewDetails={() => setModalRecordId(record.id)}
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
            isForwarded={modalRecord.status === 'forwarded' || modalRecord.status === 'merged'}
            onApprove={() => approveToDirector(modalRecord.id)}
            reviewPanel={(() => {
              const isLocked = modalRecord.status === 'forwarded' || modalRecord.status === 'merged';

              // Build a flat list of timeline events
              type TimelineEvent =
                | { kind: 'escalated' }
                | { kind: 'ticket' }
                | { kind: 'review'; index: number }
                | { kind: 'forwarded' };

              const events: TimelineEvent[] = [
                { kind: 'escalated' },
                ...(modalRecord.ticket ? [{ kind: 'ticket' as const }] : []),
                ...(modalRecord.reviews ?? []).map((_, i) => ({ kind: 'review' as const, index: i })),
                ...(isLocked ? [{ kind: 'forwarded' as const }] : []),
              ];

              return (
                <div>
                  {/* Header — "Commits on Apr 23, 2026" style */}
                  <div className="flex items-center gap-2 mb-2">
                    <GitCommitHorizontal size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      Escalated on {modalRecord.escalatedAt}
                    </p>
                  </div>

                  {/* Commits-list box */}
                  <div style={{ border: '1px solid var(--color-border)' }}>
                    {events.map((ev, idx) => {
                      const isLast = idx === events.length - 1;

                      /* ── Escalated row ── */
                      if (ev.kind === 'escalated') {
                        return (
                          <div
                            key="escalated"
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
                        );
                      }

                      /* ── Ticket row ── */
                      if (ev.kind === 'ticket' && modalRecord.ticket) {
                        return (
                          <div
                            key="ticket"
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
                        );
                      }

                      /* ── Review row ── */
                      if (ev.kind === 'review') {
                        const review = (modalRecord.reviews ?? [])[ev.index];
                        if (!review) return null;
                        return (
                          <div
                            key={review.id}
                            className="px-4 py-3"
                            style={{ borderBottom: isLast ? undefined : '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
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
                        );
                      }

                      /* ── Forwarded row ── */
                      if (ev.kind === 'forwarded') {
                        return (
                          <div
                            key="forwarded"
                            className="flex items-center gap-3 px-4 py-3"
                            style={{ background: 'rgba(16,185,129,0.06)' }}
                          >
                            <GitMerge size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                                Forwarded to Director
                              </p>
                              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>no further action needed</p>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>

                  {/* Leave a review */}
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
                              setModalRecordId(null);
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
            onClose={() => setModalRecordId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
