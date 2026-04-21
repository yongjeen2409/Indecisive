'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Paperclip, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Attachment } from '../types';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';

const EXAMPLE_PROBLEMS = [
  'Our legacy monolith is slowing release cycles and creating risk whenever multiple teams need to ship at the same time.',
  'Teams rely on conflicting data sources, so leadership gets different answers from each department and struggles to make decisions.',
  'Operations needs a governed self-serve workflow model because engineering is overloaded with manual internal requests.',
];

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function ProblemSubmission() {
  const { currentUser, startSubmission } = useApp();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [problemStatement, setProblemStatement] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (problemStatement.trim().length < 30) return;
    startSubmission(problemStatement.trim(), attachments);
    router.push(ROUTES.analyzing);
  };

  const handleAttachFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setAttachments(files.map(file => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    })));
  };

  return (
    <div className="page-shell" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="page-container max-w-4xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-primary)' }}>
            PROBLEM SUBMISSION
          </p>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Describe the business problem ODIS should solve
          </h1>
          <p className="max-w-3xl" style={{ color: 'var(--color-text-secondary)' }}>
            Submit the challenge in plain language. ODIS will retrieve context, extract
            constraints, detect conflicts, and propose multiple cross-department blueprints for
            review.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-6">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <textarea
                value={problemStatement}
                onChange={event => setProblemStatement(event.target.value)}
                placeholder="Example: We need one decision process across engineering, data, and operations because each team is pursuing a different solution to the same business issue."
                rows={11}
                className="w-full px-5 py-4 text-sm leading-relaxed outline-none resize-none"
                style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
              />

              <div className="flex items-center justify-between px-5 py-3 gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs transition-colors hover:text-blue-400"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Paperclip size={14} />
                    Attach supporting files
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />
                </div>
                <span className="text-xs font-mono" style={{ color: problemStatement.trim().length >= 30 ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                  {problemStatement.trim().length} chars
                </span>
              </div>
            </div>

            {attachments.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                {attachments.map(file => (
                  <span
                    key={file.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs"
                    style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    <Paperclip size={10} />
                    {file.name}
                    <span style={{ color: 'var(--color-text-muted)' }}>{file.sizeLabel}</span>
                  </span>
                ))}
              </motion.div>
            ) : null}

            <button
              type="submit"
              disabled={problemStatement.trim().length < 30}
              className="w-full py-4 font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                boxShadow:
                  problemStatement.trim().length >= 30 ? '0 0 30px rgba(37, 99, 235, 0.4)' : 'none',
              }}
            >
              <Send size={16} />
              Analyze with ODIS
            </button>
          </motion.form>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} style={{ color: 'var(--color-warning)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Example prompts
                </span>
              </div>
              <div className="space-y-2">
                {EXAMPLE_PROBLEMS.map(example => (
                  <button
                    key={example}
                    onClick={() => setProblemStatement(example)}
                    className="w-full text-left p-3 text-xs leading-relaxed transition-all hover:border-blue-500/30"
                    style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5"
              style={{ background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)' }}
            >
              <p className="text-xs font-mono mb-3" style={{ color: 'var(--color-primary-bright)' }}>
                ODIS WILL AUTOMATICALLY PULL
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
                    5
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Jira tickets
                  </p>
                </div>
                <div>
                  <p className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
                    4
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Confluence docs
                  </p>
                </div>
                <div>
                  <p className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
                    3
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Past decisions
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-5"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-xs font-mono mb-3" style={{ color: 'var(--color-accent)' }}>
                ACTIVE ROLE
              </p>
              <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {currentUser?.name ?? 'ODIS staff mode'}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Staff users own problem submission, conflict acknowledgement, blueprint ranking, and escalation to leadership.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
