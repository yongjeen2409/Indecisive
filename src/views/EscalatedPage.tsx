'use client';

import { motion } from 'framer-motion';
import { CheckCircle, FilePlus2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';

export default function EscalatedPage() {
  const { rankedBlueprints, reviewAssumptions, resetSubmission } = useApp();
  const router = useRouter();
  const topRanked = rankedBlueprints[0] ?? null;

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
            Ranked blueprint set escalated successfully
          </h1>
          <p className="mb-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {topRanked
              ? `"${topRanked.title}" is leading your Top 1 / Top 2 / Top 3 packet, and the full ranked set is now in the manager review queue with its current scoring assumptions and score breakdowns.`
              : 'Your ranked blueprint packet is now in the manager review queue with its current scoring assumptions and scoring context.'}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your manager can reevaluate the full set, adjust assumption values, then either forward one blueprint to the director or return the packet to you for revision.
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
              'Top 1 / Top 2 / Top 3 ranking preserved',
              `${reviewAssumptions.length} scoring assumption values attached`,
              'Retrieved context bundled for manager review',
              'Only one manager-selected blueprint will reach the director queue',
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
