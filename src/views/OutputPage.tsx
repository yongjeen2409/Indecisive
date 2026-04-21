'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Download, FileText, Printer, Sparkles, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delay * 1000);
    return () => window.clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return undefined;
    let index = 0;
    const interval = window.setInterval(() => {
      setDisplayed(text.slice(0, index + 1));
      index += 1;
      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 14);

    return () => window.clearInterval(interval);
  }, [started, text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started ? (
        <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse" style={{ background: '#3b82f6', verticalAlign: 'middle' }} />
      ) : null}
    </span>
  );
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OutputPage() {
  const { mergedStrategy } = useApp();
  const [activeTab, setActiveTab] = useState<'brief' | 'technical' | 'finance'>('brief');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const strategyPayload = useMemo(() => {
    if (!mergedStrategy) return '';
    return JSON.stringify(mergedStrategy, null, 2);
  }, [mergedStrategy]);

  if (!mergedStrategy) {
    return null;
  }

  const tabs = [
    { key: 'brief' as const, label: 'Executive Brief', icon: FileText },
    { key: 'technical' as const, label: 'Technical Blueprint', icon: Code2 },
    { key: 'finance' as const, label: 'Finance Model', icon: Wallet },
  ];

  const exportActions = [
    {
      label: 'Copy brief',
      icon: Copy,
      onClick: async () => {
        await navigator.clipboard.writeText(mergedStrategy.executiveBrief);
        setStatusMessage('Executive brief copied to clipboard.');
      },
    },
    {
      label: 'Download JSON',
      icon: Download,
      onClick: () => {
        downloadFile('odis-merged-strategy.json', strategyPayload, 'application/json');
        setStatusMessage('Merged strategy JSON downloaded.');
      },
    },
    {
      label: 'Download brief',
      icon: FileText,
      onClick: () => {
        downloadFile('odis-executive-brief.txt', mergedStrategy.executiveBrief, 'text/plain');
        setStatusMessage('Executive brief text file downloaded.');
      },
    },
    {
      label: 'Print page',
      icon: Printer,
      onClick: () => {
        window.print();
        setStatusMessage('Print dialog opened.');
      },
    },
  ];

  return (
    <div className="page-shell" style={{ background: '#050810' }}>
      <div className="page-container max-w-5xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: 1 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)' }}
            >
              <Sparkles size={18} className="text-white" />
            </motion.div>
            <div>
              <p className="font-mono text-xs" style={{ color: '#8b5cf6' }}>
                UNIFIED STRATEGY OUTPUT
              </p>
              <h1 className="font-display font-bold text-2xl" style={{ color: '#f0f6ff' }}>
                {mergedStrategy.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: '#4a6a94' }}>
              Synthesized from:
            </span>
            {mergedStrategy.sourceBlueprintTitles.map(title => (
              <span
                key={title}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: '#1a2d50', color: '#8bafd4' }}
              >
                {title}
              </span>
            ))}
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}
            >
              {mergedStrategy.approvalStatus}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? 'linear-gradient(135deg, #2563eb20, #06b6d420)' : 'transparent',
                color: activeTab === tab.key ? '#f0f6ff' : '#4a6a94',
                border: activeTab === tab.key ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid transparent',
              }}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          {activeTab === 'brief' ? (
            <div className="p-6 rounded-2xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                <span className="text-xs font-mono" style={{ color: '#10b981' }}>
                  GLM COMPOSING
                </span>
              </div>
              <div className="font-body text-sm leading-relaxed whitespace-pre-line" style={{ color: '#c8daf0' }}>
                <TypewriterText text={mergedStrategy.executiveBrief} delay={0.2} />
              </div>
            </div>
          ) : null}

          {activeTab === 'technical' ? (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                <p className="text-xs font-mono mb-4" style={{ color: '#06b6d4' }}>
                  ARCHITECTURE LAYERS
                </p>
                <div className="grid md:grid-cols-2 gap-2">
                  {mergedStrategy.technicalBlueprint.architecture.map(item => (
                    <div
                      key={item}
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ background: '#080d1a', border: '1px solid #1a2d50' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#06b6d4' }} />
                      <span className="text-xs" style={{ color: '#f0f6ff' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                <p className="text-xs font-mono mb-4" style={{ color: '#3b82f6' }}>
                  TECH STACK
                </p>
                <div className="flex flex-wrap gap-2">
                  {mergedStrategy.technicalBlueprint.techStack.map(item => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono"
                      style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)', color: '#60a5fa' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                <p className="text-xs font-mono mb-4" style={{ color: '#8b5cf6' }}>
                  DELIVERY PHASES
                </p>
                <div className="space-y-4">
                  {mergedStrategy.technicalBlueprint.phases.map(phase => (
                    <div
                      key={phase.name}
                      className="p-4 rounded-xl"
                      style={{ background: '#080d1a', border: '1px solid #1a2d50', borderLeft: '3px solid #8b5cf6' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display font-semibold text-sm" style={{ color: '#f0f6ff' }}>
                          {phase.name}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#1a2d50', color: '#8bafd4' }}>
                          {phase.duration}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phase.deliverables.map(deliverable => (
                          <span key={deliverable} className="text-xs px-2 py-0.5 rounded" style={{ background: '#0c1428', color: '#8bafd4' }}>
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'finance' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'CAPEX', value: mergedStrategy.financeModel.capex, color: '#f0f6ff' },
                  { label: 'OPEX / month', value: mergedStrategy.financeModel.opex, color: '#f0f6ff' },
                  { label: 'Projected ROI', value: mergedStrategy.financeModel.roi, color: '#10b981' },
                  { label: 'Payback Period', value: mergedStrategy.financeModel.paybackPeriod, color: '#3b82f6' },
                ].map(item => (
                  <div key={item.label} className="p-5 rounded-2xl text-center" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                    <p className="text-xs mb-2" style={{ color: '#4a6a94' }}>
                      {item.label}
                    </p>
                    <p className="font-display font-bold text-2xl" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="p-5 rounded-2xl"
                style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
              >
                <p className="text-xs font-mono mb-2" style={{ color: '#10b981' }}>
                  TOTAL INVESTMENT (YEAR 1)
                </p>
                <p className="font-display font-bold text-3xl" style={{ color: '#f0f6ff' }}>
                  {mergedStrategy.financeModel.totalCost}
                </p>
              </div>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-8 space-y-4"
        >
          <div className="flex flex-wrap gap-3">
            {exportActions.map(action => (
              <button
                key={action.label}
                onClick={() => {
                  void action.onClick();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ background: '#0c1428', border: '1px solid #1a2d50', color: '#8bafd4' }}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>

          {statusMessage ? (
            <p className="text-xs" style={{ color: '#4a6a94' }}>
              {statusMessage}
            </p>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
