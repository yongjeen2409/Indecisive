'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Layers3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PrototypePreview from '../components/PrototypePreview';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Blueprint } from '../types';

const CONFLICT_TYPE_COLORS: Record<string, string> = {
  budget: '#ef4444',
  timeline: '#f59e0b',
  headcount: '#8b5cf6',
  technical: '#06b6d4',
};

function ConflictBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: `${CONFLICT_TYPE_COLORS[label]}20`,
        border: `1px solid ${CONFLICT_TYPE_COLORS[label]}50`,
        color: CONFLICT_TYPE_COLORS[label],
      }}
    >
      <AlertTriangle size={10} />
      {label}
    </span>
  );
}

function BlueprintCard({
  blueprint,
  index,
  selected,
  onSelect,
}: {
  blueprint: Blueprint;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: '#0c1428',
        border: `1px solid ${selected ? `${blueprint.color}70` : '#1a2d50'}`,
        boxShadow: selected ? `0 0 26px ${blueprint.color}1d` : 'none',
      }}
    >
      <div
        className="p-5"
        style={{ borderBottom: '1px solid #1a2d50', background: `linear-gradient(135deg, ${blueprint.color}12, transparent)` }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: `${blueprint.color}20`, color: blueprint.accentColor }}
            >
              {blueprint.department}
            </span>
            <h3 className="font-display font-bold text-lg mt-2" style={{ color: '#f0f6ff' }}>
              {blueprint.title}
            </h3>
          </div>
          <div
            className="px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: '#080d1a', border: '1px solid #1a2d50', color: '#8bafd4' }}
          >
            Blueprint {index + 1}
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: '#8bafd4' }}>
          {blueprint.description}
        </p>

        {blueprint.conflicts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {blueprint.conflicts.map(conflict => (
              <ConflictBadge key={conflict.id} label={conflict.type} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-5 space-y-4 flex-1">
        <PrototypePreview preview={blueprint.prototypePreview} accentColor={blueprint.accentColor} />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
            <p className="text-xs font-mono mb-3" style={{ color: blueprint.accentColor }}>
              SYSTEM ARCHITECTURE
            </p>
            <div className="space-y-2">
              {blueprint.architecture.slice(0, 4).map(item => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: '#8bafd4' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: blueprint.color }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: '#080d1a', border: '1px solid #1a2d50' }}>
            <p className="text-xs font-mono mb-3" style={{ color: blueprint.accentColor }}>
              FINANCE MODEL
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p style={{ color: '#4a6a94' }}>CAPEX</p>
                <p style={{ color: '#f0f6ff' }}>{blueprint.financeModel.capex}</p>
              </div>
              <div>
                <p style={{ color: '#4a6a94' }}>OPEX</p>
                <p style={{ color: '#f0f6ff' }}>{blueprint.financeModel.opex}</p>
              </div>
              <div>
                <p style={{ color: '#4a6a94' }}>ROI</p>
                <p style={{ color: '#10b981' }}>{blueprint.financeModel.roi}</p>
              </div>
              <div>
                <p style={{ color: '#4a6a94' }}>Payback</p>
                <p style={{ color: '#f0f6ff' }}>{blueprint.financeModel.paybackPeriod}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4" style={{ borderTop: '1px solid #1a2d50' }}>
        <button
          onClick={onSelect}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: selected ? blueprint.color : `${blueprint.color}1f`,
            border: `1px solid ${blueprint.color}50`,
            color: selected ? '#fff' : blueprint.accentColor,
          }}
        >
          {selected ? 'Preferred blueprint selected' : 'Select as preferred blueprint'}
        </button>
      </div>
    </motion.div>
  );
}

export default function BlueprintArena() {
  const { blueprints, selectedBlueprint, selectBlueprint, activeSubmission, openConflictReview } = useApp();
  const router = useRouter();
  const uniqueConflicts = Array.from(
    new Map(blueprints.flatMap(blueprint => blueprint.conflicts).map(conflict => [conflict.id, conflict])).values(),
  );

  return (
    <div className="page-shell" style={{ background: '#050810' }}>
      <div className="page-container max-w-7xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: '#2563eb' }}>
            BLUEPRINT ARENA
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: '#f0f6ff' }}>
            ODIS generated {blueprints.length} solution blueprints
          </h1>
          <p style={{ color: '#8bafd4' }}>
            Review the prototype concept, architecture, tech stack, and finance model for each
            option before moving into conflict review and ranking.
          </p>
          {activeSubmission ? (
            <div className="mt-4 inline-flex max-w-3xl p-3 rounded-xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#8bafd4' }}>
                <span style={{ color: '#4a6a94' }}>Problem: </span>
                {activeSubmission.problemStatement}
              </p>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mb-6 p-4 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="flex items-start gap-3">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: 2, duration: 0.5 }}>
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            </motion.div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#f0f6ff' }}>
                {uniqueConflicts.length} conflicts detected before ranking
              </p>
              <p className="text-xs" style={{ color: '#8bafd4' }}>
                ODIS requires conflict review before the scoring table opens.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              openConflictReview();
              router.push(ROUTES.conflicts);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}
          >
            Review conflict report
            <ChevronRight size={14} />
          </button>
        </motion.div>

        <div className="grid xl:grid-cols-3 gap-6 mb-8">
          {blueprints.map((blueprint, index) => (
            <BlueprintCard
              key={blueprint.id}
              blueprint={blueprint}
              index={index}
              selected={selectedBlueprint?.id === blueprint.id}
              onSelect={() => selectBlueprint(blueprint.id)}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl"
          style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
        >
          <div className="flex items-center gap-3">
            <Layers3 size={16} style={{ color: '#06b6d4' }} />
            <p className="text-sm" style={{ color: '#8bafd4' }}>
              {selectedBlueprint
                ? `Preferred blueprint: ${selectedBlueprint.title}`
                : 'Select a preferred blueprint now or choose it later in the scoring table.'}
            </p>
          </div>
          <button
            onClick={() => {
              openConflictReview();
              router.push(ROUTES.conflicts);
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}
          >
            Continue to conflict review
          </button>
        </motion.div>
      </div>
    </div>
  );
}
