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
    <div className="page-shell flex items-center justify-center" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="max-w-xl w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'rgba(37, 99, 235, 0.15)',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 0 40px rgba(37, 99, 235, 0.3)',
          }}
        >
          <CheckCircle size={36} style={{ color: 'var(--color-primary-bright)' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display font-bold text-3xl mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Blueprint escalated successfully
          </h1>
          <p className="mb-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedBlueprint
              ? `"${selectedBlueprint.title}" is now in the superior review queue with its context, conflict notes, and score breakdown.`
              : 'Your preferred blueprint is now in the superior review queue with its context and ranking details.'}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Leadership can compare this escalation with other pending blueprints and generate a
            unified strategy from the strongest pair. You can reopen this submission later from
            your dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 p-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="space-y-2 text-left">
            {[
              'Submission attached to escalation record',
              'Retrieved context bundled for superior review',
              'Conflict acknowledgement preserved',
              'Scoring table snapshot included',
            ].map(step => (
              <div key={step} className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{step}</span>
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
            className="flex-1 py-3 text-sm font-medium transition-all"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Review past submissions
          </button>
          <button
            onClick={() => {
              resetSubmission();
              router.push(ROUTES.submit);
            }}
            className="flex-1 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))' }}
          >
            <FilePlus2 size={16} />
            Start another submission
          </button>
        </motion.div>
      </div>
    </div>
  );
}
