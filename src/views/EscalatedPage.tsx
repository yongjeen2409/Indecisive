'use client';

import { motion } from 'framer-motion';
import { CheckCircle, FilePlus2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';

export default function EscalatedPage() {
  const { selectedBlueprint, resetSubmission } = useApp();
  const router = useRouter();

  return (
    <div className="page-shell flex items-center justify-center" style={{ background: '#050810' }}>
      <div className="max-w-xl w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'rgba(37, 99, 235, 0.15)',
            border: '2px solid #2563eb',
            boxShadow: '0 0 40px rgba(37, 99, 235, 0.3)',
          }}
        >
          <CheckCircle size={36} style={{ color: '#3b82f6' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display font-bold text-3xl mb-3" style={{ color: '#f0f6ff' }}>
            Blueprint escalated successfully
          </h1>
          <p className="mb-3 leading-relaxed" style={{ color: '#8bafd4' }}>
            {selectedBlueprint
              ? `"${selectedBlueprint.title}" is now in the superior review queue with its context, conflict notes, and score breakdown.`
              : 'Your preferred blueprint is now in the superior review queue with its context and ranking details.'}
          </p>
          <p className="text-sm" style={{ color: '#4a6a94' }}>
            Leadership can compare this escalation with other pending blueprints and generate a
            unified strategy from the strongest pair.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 p-5 rounded-2xl"
          style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
        >
          <div className="space-y-2 text-left">
            {[
              'Submission attached to escalation record',
              'Retrieved context bundled for superior review',
              'Conflict acknowledgement preserved',
              'Scoring table snapshot included',
            ].map(step => (
              <div key={step} className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} style={{ color: '#10b981' }} />
                <span style={{ color: '#8bafd4' }}>{step}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 mt-6"
        >
          <button
            onClick={() => router.push(ROUTES.dashboard)}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: '#0c1428', border: '1px solid #1a2d50', color: '#8bafd4' }}
          >
            Back to dashboard
          </button>
          <button
            onClick={() => {
              resetSubmission();
              router.push(ROUTES.submit);
            }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            <FilePlus2 size={16} />
            Start another submission
          </button>
        </motion.div>
      </div>
    </div>
  );
}
