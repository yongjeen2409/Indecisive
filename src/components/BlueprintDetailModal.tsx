'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, SendHorizonal, X } from 'lucide-react';
import PrototypePreview from './PrototypePreview';
import { EscalationRecord } from '../types';

const TABS = ['Prototype Concept', 'System Architecture', 'Tech Stack', 'Finance Model', 'Development Timeline'] as const;
type Tab = (typeof TABS)[number];

export default function BlueprintDetailModal({
  record,
  isForwarded,
  onApprove,
  onClose,
  approveLabel = 'Escalate to Director',
  statusLabel,
}: {
  record: EscalationRecord;
  isForwarded: boolean;
  onApprove?: () => void;
  onClose: () => void;
  approveLabel?: string;
  statusLabel?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('Prototype Concept');
  const { blueprint, submission } = record;

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
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '85vw',
          height: '85vh',
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
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Submitted by {record.submittedBy.name} · {record.submittedBy.department}
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl mb-1 pr-10" style={{ color: 'var(--color-text-primary)' }}>
            {blueprint.title}
          </h2>
          <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {blueprint.description}
          </p>
          <div
            className="inline-block mt-2 mb-4 p-2.5"
            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-[10px] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Problem statement</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {submission.problemStatement}
            </p>
          </div>

          <div className="flex overflow-x-auto gap-0" style={{ marginBottom: '-1px' }}>
            {TABS.map(tab => (
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
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wide mb-5" style={{ color: blueprint.accentColor }}>
                    System architecture — data flow
                  </p>
                  <div className="flex flex-col items-stretch gap-0 max-w-2xl mx-auto">
                    {blueprint.architecture.map((item, i) => {
                      const colonIdx = item.indexOf(':');
                      const layerLabel = colonIdx !== -1 ? item.slice(0, colonIdx).trim() : `Layer ${i + 1}`;
                      const layerDetail = colonIdx !== -1 ? item.slice(colonIdx + 1).trim() : item;
                      const isLast = i === blueprint.architecture.length - 1;
                      return (
                        <div key={item} className="flex flex-col items-stretch">
                          <div
                            className="flex items-start gap-3 p-3.5"
                            style={{
                              background: 'var(--color-bg-panel)',
                              border: `1px solid ${blueprint.color}40`,
                              borderLeft: `3px solid ${blueprint.color}`,
                            }}
                          >
                            <div
                              className="flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5"
                              style={{
                                width: '22px',
                                height: '22px',
                                background: `${blueprint.color}25`,
                                color: blueprint.accentColor,
                                border: `1px solid ${blueprint.color}40`,
                              }}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: blueprint.accentColor }}>
                                {layerLabel}
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {layerDetail}
                              </p>
                            </div>
                          </div>
                          {!isLast && (
                            <div className="flex flex-col items-center" style={{ height: '28px' }}>
                              <div className="flex-1 w-px" style={{ background: `${blueprint.color}50` }} />
                              <div
                                style={{
                                  width: 0,
                                  height: 0,
                                  borderLeft: '6px solid transparent',
                                  borderRight: '6px solid transparent',
                                  borderTop: `7px solid ${blueprint.color}70`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'Tech Stack' && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wide mb-4" style={{ color: blueprint.accentColor }}>
                    Specific tools, platforms & vendors recommended
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.techStack.map(tech => (
                      <div
                        key={tech}
                        className="px-3 py-1.5 text-sm"
                        style={{ background: 'var(--color-bg-panel)', border: `1px solid ${blueprint.color}40`, color: 'var(--color-text-primary)' }}
                      >
                        {tech}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Finance Model' && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wide mb-4" style={{ color: blueprint.accentColor }}>
                    Cost estimates, ROI projection & payback period
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

        <div className="p-4 shrink-0 flex items-center justify-between gap-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
            &ldquo;{record.note}&rdquo;
          </p>
          {!onApprove ? (
            <div className="flex items-center gap-2 px-4 py-2 text-sm shrink-0" style={{ color: isForwarded ? 'var(--color-success)' : 'var(--color-accent)' }}>
              <CheckCircle size={14} />
              {statusLabel ?? (isForwarded ? 'Forwarded to Director' : 'Read-only review')}
            </div>
          ) : isForwarded ? (
            <div className="flex items-center gap-2 px-4 py-2 text-sm shrink-0" style={{ color: 'var(--color-success)' }}>
              <CheckCircle size={14} />
              {statusLabel ?? 'Forwarded to Director'}
            </div>
          ) : (
            <button
              onClick={() => { onApprove?.(); onClose(); }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                boxShadow: '0 0 16px rgba(37,99,235,0.25)',
              }}
            >
              {approveLabel}
              <SendHorizonal size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
