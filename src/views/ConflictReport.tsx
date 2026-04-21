'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Conflict } from '../types';

const CONFLICT_ICONS: Record<string, typeof AlertTriangle> = {
  budget: DollarSign,
  timeline: Clock,
  headcount: Users,
  technical: Wrench,
};

const CONFLICT_COLORS: Record<string, string> = {
  budget: '#ef4444',
  timeline: '#f59e0b',
  headcount: '#8b5cf6',
  technical: '#06b6d4',
};

function ConflictCard({
  conflict,
  blueprintTitles,
  index,
}: {
  conflict: Conflict;
  blueprintTitles: Record<string, string>;
  index: number;
}) {
  const Icon = CONFLICT_ICONS[conflict.type];
  const color = CONFLICT_COLORS[conflict.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="p-5 rounded-2xl"
      style={{ background: '#0c1428', border: `1px solid ${color}33` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon size={18} style={{ color }} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>
              {conflict.type.toUpperCase()}
            </span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1a2d50', color: '#8bafd4' }}>
              {conflict.severity.toUpperCase()}
            </span>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: '#f0f6ff' }}>
            {conflict.description}
          </p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: '#8bafd4' }}>
            Recommended resolution: {conflict.resolution}
          </p>

          <div className="flex flex-wrap gap-2">
            {conflict.affectedBlueprints.map(blueprintId => (
              <span
                key={blueprintId}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: '#080d1a', border: '1px solid #1a2d50', color: '#8bafd4' }}
              >
                {blueprintTitles[blueprintId] ?? blueprintId}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ConflictReport() {
  const { blueprints, acknowledgeConflicts, conflictsAcknowledged, submissionStatus } = useApp();
  const router = useRouter();
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const conflicts = Array.from(
    new Map(blueprints.flatMap(blueprint => blueprint.conflicts).map(conflict => [conflict.id, conflict])).values(),
  );
  const blueprintTitles = Object.fromEntries(blueprints.map(blueprint => [blueprint.id, blueprint.title]));

  const bySeverity = {
    high: conflicts.filter(conflict => conflict.severity === 'high').length,
    medium: conflicts.filter(conflict => conflict.severity === 'medium').length,
    low: conflicts.filter(conflict => conflict.severity === 'low').length,
  };

  useEffect(() => {
    if (isAcknowledging && conflictsAcknowledged && submissionStatus === 'scoring') {
      router.push(ROUTES.scoring);
    }
  }, [conflictsAcknowledged, isAcknowledging, router, submissionStatus]);

  return (
    <div className="page-shell" style={{ background: '#050810' }}>
      <div className="page-container max-w-4xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: 3, duration: 0.5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
            >
              <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            </motion.div>
            <div>
              <p className="font-mono text-xs" style={{ color: '#ef4444' }}>
                CONFLICT REPORT
              </p>
              <h1 className="font-display font-bold text-2xl" style={{ color: '#f0f6ff' }}>
                GLM-detected conflicts must be reviewed first
              </h1>
            </div>
          </div>
          <p style={{ color: '#8bafd4' }}>
            ODIS identified the following delivery, budget, staffing, and technical conflicts across
            the generated blueprints. Review them before the scoring table opens.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'High severity', count: bySeverity.high, color: '#ef4444' },
            { label: 'Medium severity', count: bySeverity.medium, color: '#f59e0b' },
            { label: 'Low severity', count: bySeverity.low, color: '#10b981' },
          ].map(item => (
            <div
              key={item.label}
              className="p-4 rounded-2xl text-center"
              style={{ background: '#0c1428', border: `1px solid ${item.color}33` }}
            >
              <div className="font-display font-bold text-3xl mb-1" style={{ color: item.color }}>
                {item.count}
              </div>
              <div className="text-xs" style={{ color: '#8bafd4' }}>
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="space-y-4 mb-8">
          {conflicts.map((conflict, index) => (
            <ConflictCard key={conflict.id} conflict={conflict} blueprintTitles={blueprintTitles} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-5 rounded-2xl mb-8"
          style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)' }}
        >
          <p className="text-xs font-mono mb-2" style={{ color: '#06b6d4' }}>
            ODIS RECOMMENDATION
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#8bafd4' }}>
            Continue to scoring once the team agrees that these conflicts are understood and can be
            handled through sequencing, shared governance, or superior review during escalation.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(ROUTES.blueprints)}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: '#0c1428', border: '1px solid #1a2d50', color: '#8bafd4' }}
          >
            Back to blueprints
          </button>
          <button
            onClick={() => {
              setIsAcknowledging(true);
              acknowledgeConflicts();
            }}
            disabled={isAcknowledging}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}
          >
            <CheckCircle size={16} />
            {isAcknowledging ? 'Opening scoring workspace...' : 'Acknowledge conflicts and open scoring'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
