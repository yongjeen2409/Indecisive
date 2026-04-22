'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Blueprint } from '../types';

const STEPS = [
  'Loading budget & financial data...',
  'Scanning active project pipeline...',
  'Reviewing product portfolio...',
  'Checking past rejected proposals...',
  'Analysing market intelligence...',
  'Reviewing HR capacity & skills...',
  'Checking legal & compliance policies...',
  'Generating AI blueprints...',
];

export default function AnalyzingLoader() {
  const { activeSubmission, completeAnalysis, completeAnalysisWithBlueprints } = useApp();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!activeSubmission || doneRef.current) return;

    let aiBlueprints: Blueprint[] | null = null;
    let minTimePassed = false;
    let apiFetched = false;

    function tryFinish() {
      if (!minTimePassed || !apiFetched) return;
      if (doneRef.current) return;
      doneRef.current = true;

      if (aiBlueprints && aiBlueprints.length > 0) {
        completeAnalysisWithBlueprints(aiBlueprints);
      } else {
        completeAnalysis();
      }
      router.replace(ROUTES.blueprints);
    }

    const minTimer = window.setTimeout(() => {
      minTimePassed = true;
      tryFinish();
    }, 3400);

    fetch('/api/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: activeSubmission.problemStatement }),
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.blueprints) && data.blueprints.length > 0) {
          aiBlueprints = data.blueprints;
        }
      })
      .catch(() => {})
      .finally(() => {
        apiFetched = true;
        tryFinish();
      });

    const stepTimer = window.setInterval(() => {
      setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
    }, 500);

    const progressTimer = window.setInterval(() => {
      setProgress(p => {
        if (p >= 92) return p;
        return p + 1.8;
      });
    }, 80);

    return () => {
      window.clearTimeout(minTimer);
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
    };
  }, [activeSubmission?.id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="text-center mb-10">
        <p className="font-mono text-xs mb-3" style={{ color: 'var(--color-primary)' }}>
          INDECISIVE IS ANALYZING
        </p>
        <h1 className="font-display font-bold text-3xl mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Building solution blueprints
        </h1>
        <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {activeSubmission
            ? `Processing: "${activeSubmission.problemStatement.slice(0, 110)}${activeSubmission.problemStatement.length > 110 ? '...' : ''}"`
            : 'Assembling cross-department options from 7 internal data sources.'}
        </p>
      </div>

      <div className="relative w-40 h-40 mb-10">
        <div className="absolute inset-0 border-2" style={{ borderColor: 'rgba(37, 99, 235, 0.2)' }} />
        <div
          className="absolute inset-0 animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, transparent 70%, var(--color-primary) 100%)',
            borderRadius: '50%',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
          }}
        />
        <div
          className="absolute border"
          style={{ inset: '12px', borderColor: 'rgba(6, 182, 212, 0.2)' }}
        />
        <div
          className="absolute animate-spin-reverse"
          style={{
            inset: '12px',
            background: 'conic-gradient(from 180deg, transparent 70%, var(--color-accent) 100%)',
            borderRadius: '50%',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-sm tracking-widest" style={{ color: 'var(--color-primary-glow)' }}>
            Indecisive
          </span>
        </div>
      </div>

      <div className="h-8 mb-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="font-mono text-sm text-center"
            style={{ color: 'var(--color-primary-glow)' }}
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-64 h-1 overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <p className="mt-3 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {Math.min(Math.round(progress), 100)}%
      </p>
    </div>
  );
}
