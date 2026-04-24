'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Send, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';

// ─── XML parser types ────────────────────────────────────────────────────────

interface ElimLine {
  passed: boolean;
  item: string;
  reason: string;
}

type OdisPart =
  | { kind: 'text'; content: string }
  | { kind: 'elim'; round: string; title: string; lines: ElimLine[] }
  | { kind: 'dataref'; metric: string; value: string; source: string }
  | { kind: 'conflict'; data: string; user: string }
  | { kind: 'impact'; value: string; period: string; impactType: string }
  | { kind: 'decision'; status: 'VALIDATED' | 'REJECTED' | 'NEEDS_INFO'; confidence: string; content: string };

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function parseElimLines(content: string): ElimLine[] {
  return content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('✗') || l.startsWith('✓'))
    .map(l => {
      const passed = l.startsWith('✓');
      const rest = l.slice(1).trim();
      const idx = rest.indexOf(' — ');
      return {
        passed,
        item: idx >= 0 ? rest.slice(0, idx).trim() : rest,
        reason: idx >= 0 ? rest.slice(idx + 3).trim() : '',
      };
    });
}

function parseOdisMessage(raw: string): OdisPart[] {
  const parts: OdisPart[] = [];
  // matches self-closing and paired XML tags we care about
  const pattern = /<(elim|dataref|conflict|impact|decision)((?:[^>]|"[^"]*")*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const text = raw.slice(lastIndex, match.index).trim();
      if (text) parts.push({ kind: 'text', content: text });
    }

    const tag = match[1];
    const attrs = parseAttrs(match[2]);
    const inner = (match[3] ?? '').trim();

    if (tag === 'elim') {
      parts.push({ kind: 'elim', round: attrs.round ?? '1', title: attrs.title ?? '', lines: parseElimLines(inner) });
    } else if (tag === 'dataref') {
      parts.push({ kind: 'dataref', metric: attrs.metric ?? '', value: attrs.value ?? '', source: attrs.source ?? '' });
    } else if (tag === 'conflict') {
      parts.push({ kind: 'conflict', data: attrs.data ?? '', user: attrs.user ?? '' });
    } else if (tag === 'impact') {
      parts.push({ kind: 'impact', value: attrs.value ?? '', period: attrs.period ?? '', impactType: attrs.type ?? '' });
    } else if (tag === 'decision') {
      const status = (attrs.status ?? 'NEEDS_INFO') as 'VALIDATED' | 'REJECTED' | 'NEEDS_INFO';
      parts.push({ kind: 'decision', status, confidence: attrs.confidence ?? 'MEDIUM', content: inner });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = raw.slice(lastIndex).trim();
  if (tail) parts.push({ kind: 'text', content: tail });

  return parts;
}

// ─── Part renderers ───────────────────────────────────────────────────────────

function RenderElim({ part }: { part: Extract<OdisPart, { kind: 'elim' }> }) {
  return (
    <div className="my-3" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-deep)' }}>
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
      >
        <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(194,96,73,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(194,96,73,0.3)' }}>
          ROUND {part.round}
        </span>
        <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          ELIMINATION — {part.title.toUpperCase()}
        </span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        {part.lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="font-bold text-sm shrink-0 mt-0.5" style={{ color: line.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {line.passed ? '✓' : '✗'}
            </span>
            <div>
              <span
                style={{
                  color: line.passed ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  textDecoration: line.passed ? 'none' : 'line-through',
                }}
              >
                {line.item}
              </span>
              {line.reason && (
                <span style={{ color: 'var(--color-text-muted)' }}> — {line.reason}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenderDataRef({ part }: { part: Extract<OdisPart, { kind: 'dataref' }> }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 text-[10px] font-mono"
      style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.25)', verticalAlign: 'middle' }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{part.metric}:</span>
      <span className="font-semibold">{part.value}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>· {part.source}</span>
    </span>
  );
}

function RenderConflict({ part }: { part: Extract<OdisPart, { kind: 'conflict' }> }) {
  return (
    <div className="my-3" style={{ border: '1px solid rgba(201,138,68,0.35)', background: 'rgba(201,138,68,0.06)' }}>
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'rgba(201,138,68,0.25)' }}>
        <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-warning)' }}>⚠ DATA CONFLICT</span>
      </div>
      <div className="grid grid-cols-2 divide-x text-xs" style={{ borderColor: 'rgba(201,138,68,0.2)' }}>
        <div className="p-3 space-y-1">
          <p className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>COMPANY RECORDS</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>{part.data}</p>
        </div>
        <div className="p-3 space-y-1">
          <p className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>YOU REPORTED</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>{part.user}</p>
        </div>
      </div>
    </div>
  );
}

function RenderImpact({ part }: { part: Extract<OdisPart, { kind: 'impact' }> }) {
  return (
    <div
      className="my-2 flex items-center gap-3 px-3 py-2 text-sm"
      style={{ background: 'rgba(92,128,101,0.08)', border: '1px solid rgba(92,128,101,0.25)' }}
    >
      <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        {part.impactType.toUpperCase()} · {part.period.toUpperCase()}
      </span>
      <span className="font-display font-bold" style={{ color: 'var(--color-success)' }}>{part.value}</span>
    </div>
  );
}

function RenderDecision({ part }: { part: Extract<OdisPart, { kind: 'decision' }> }) {
  const colors = {
    VALIDATED: { bg: 'rgba(92,128,101,0.08)', border: 'rgba(92,128,101,0.3)', color: 'var(--color-success)', label: 'VALIDATED' },
    REJECTED: { bg: 'rgba(184,74,57,0.08)', border: 'rgba(184,74,57,0.3)', color: 'var(--color-danger)', label: 'REJECTED' },
    NEEDS_INFO: { bg: 'rgba(201,138,68,0.08)', border: 'rgba(201,138,68,0.3)', color: 'var(--color-warning)', label: 'NEEDS INFO' },
  };
  const c = colors[part.status];
  return (
    <div className="my-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${c.border}` }}>
        <span className="font-mono text-[10px] font-semibold px-2 py-0.5" style={{ background: c.border, color: c.color }}>
          {c.label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          Confidence: {part.confidence}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{part.content}</p>
      </div>
    </div>
  );
}

function OdisMessageContent({ raw }: { raw: string }) {
  const parts = parseOdisMessage(raw);
  return (
    <div>
      {parts.map((part, i) => {
        if (part.kind === 'text') {
          return (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {part.content}
            </p>
          );
        }
        if (part.kind === 'elim') return <RenderElim key={i} part={part} />;
        if (part.kind === 'dataref') return <RenderDataRef key={i} part={part} />;
        if (part.kind === 'conflict') return <RenderConflict key={i} part={part} />;
        if (part.kind === 'impact') return <RenderImpact key={i} part={part} />;
        if (part.kind === 'decision') return <RenderDecision key={i} part={part} />;
        return null;
      })}
    </div>
  );
}

function StreamingOdisContent({ parts, streamingTexts }: { parts: OdisPart[]; streamingTexts: Record<number, string> }) {
  return (
    <div>
      {parts.map((part, i) => {
        const streamingText = streamingTexts[i] ?? '';

        if (part.kind === 'text') {
          return (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {streamingText}
            </p>
          );
        }

        if (part.kind === 'elim') {
          return (
            <div key={i} className="my-3" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-deep)' }}>
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
              >
                <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(194,96,73,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(194,96,73,0.3)' }}>
                  ROUND {part.round}
                </span>
                <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  ELIMINATION — {part.title.toUpperCase()}
                </span>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{streamingText}</p>
              </div>
            </div>
          );
        }

        if (part.kind === 'dataref') {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 text-[10px] font-mono"
              style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.25)', verticalAlign: 'middle' }}
            >
              {streamingText}
            </span>
          );
        }

        if (part.kind === 'conflict') {
          return (
            <div key={i} className="my-3" style={{ border: '1px solid rgba(201,138,68,0.35)', background: 'rgba(201,138,68,0.06)' }}>
              <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'rgba(201,138,68,0.25)' }}>
                <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-warning)' }}>⚠ DATA CONFLICT</span>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{streamingText}</p>
              </div>
            </div>
          );
        }

        if (part.kind === 'impact') {
          return (
            <div
              key={i}
              className="my-2 flex items-center gap-3 px-3 py-2 text-sm"
              style={{ background: 'rgba(92,128,101,0.08)', border: '1px solid rgba(92,128,101,0.25)' }}
            >
              <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {part.impactType.toUpperCase()} · {part.period.toUpperCase()}
              </span>
              <span className="font-display font-bold" style={{ color: 'var(--color-success)' }}>{streamingText}</span>
            </div>
          );
        }

        if (part.kind === 'decision') {
          const colors = {
            VALIDATED: { bg: 'rgba(92,128,101,0.08)', border: 'rgba(92,128,101,0.3)', color: 'var(--color-success)', label: 'VALIDATED' },
            REJECTED: { bg: 'rgba(184,74,57,0.08)', border: 'rgba(184,74,57,0.3)', color: 'var(--color-danger)', label: 'REJECTED' },
            NEEDS_INFO: { bg: 'rgba(201,138,68,0.08)', border: 'rgba(201,138,68,0.3)', color: 'var(--color-warning)', label: 'NEEDS INFO' },
          };
          const c = colors[part.status];
          return (
            <div key={i} className="my-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5" style={{ background: c.border, color: c.color }}>
                  {c.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Confidence: {part.confidence}
                </span>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{streamingText}</p>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ODIS_GREETING =
  "I'm ODIS — I check whether the problem you're describing genuinely exists in this company, using live data from finance, HR, and active projects. Describe the problem you want to solve. I'll validate it and tell you whether it's real — or what the actual problem is.";

export default function ProblemChatModal({ onClose }: { onClose: () => void }) {
  const { startSubmission } = useApp();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: ODIS_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingParts, setStreamingParts] = useState<OdisPart[]>([]);
  const [streamingTexts, setStreamingTexts] = useState<Record<number, string>>({});

  const hasValidated = messages.some(m => {
    if (m.role !== 'assistant') return false;
    return m.content.includes('status="VALIDATED"') || m.content.includes("status='VALIDATED'");
  });

  const hasRejected = messages.some(m => {
    if (m.role !== 'assistant') return false;
    return m.content.includes('status="REJECTED"') || m.content.includes("status='REJECTED'");
  });

  const isDone = hasValidated || hasRejected;

  const validatedProblem =
    messages.find(m => m.role === 'user')?.content ?? '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingTexts]);

  function extractTextFromPart(part: OdisPart): string {
    if (part.kind === 'text') return part.content;
    if (part.kind === 'elim') return part.lines.map(l => `${l.passed ? '✓' : '✗'} ${l.item}${l.reason ? ' — ' + l.reason : ''}`).join('\n');
    if (part.kind === 'decision') return part.content;
    if (part.kind === 'dataref') return `${part.metric}: ${part.value} · ${part.source}`;
    if (part.kind === 'impact') return `${part.value} · ${part.period}`;
    if (part.kind === 'conflict') return `Company: ${part.data}\nYou: ${part.user}`;
    return '';
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setStreamingParts([]);
    setStreamingTexts({});

    try {
      const res = await fetch('/api/odis-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      const fullContent = data.content ?? '';
      const parts = parseOdisMessage(fullContent);

      // Reveal each box and animate its text sequentially
      for (let partIdx = 0; partIdx < parts.length; partIdx++) {
        setStreamingParts(prev => [...prev, parts[partIdx]]);

        const textContent = extractTextFromPart(parts[partIdx]);
        if (!textContent) continue;

        const words = textContent.split(/(\s+)/);
        for (let i = 0; i < words.length; i++) {
          await new Promise(r => setTimeout(r, 25));
          setStreamingTexts(prev => ({
            ...prev,
            [partIdx]: words.slice(0, i + 1).join(''),
          }));
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
      setStreamingParts([]);
      setStreamingTexts({});
    } catch {
      const errorMsg = 'Connection issue — please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      setStreamingParts([]);
      setStreamingTexts({});
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateBlueprints() {
    setIsGenerating(true);
    startSubmission(validatedProblem, []);
    onClose();
    router.push(ROUTES.analyzing);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="relative flex flex-col"
        style={{
          width: '80vw',
          height: '80vh',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8"
              style={{ background: 'rgba(194,96,73,0.12)', border: '1px solid rgba(194,96,73,0.3)' }}
            >
              <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                ODIS — Decision Intelligence Engine
              </p>
              <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                Z.AI GLM · Problem Validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ scrollBehavior: 'smooth' }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' ? (
                  <div className="max-w-[90%]">
                    <p className="font-mono text-[10px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Z.AI GLM · ODIS
                    </p>
                    <div
                      className="p-4"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                    >
                      <OdisMessageContent raw={msg.content} />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[75%]">
                    <p className="font-mono text-[10px] mb-2 text-right" style={{ color: 'var(--color-text-muted)' }}>
                      You
                    </p>
                    <div
                      className="p-4 text-sm leading-relaxed"
                      style={{
                        background: 'rgba(194,96,73,0.08)',
                        border: '1px solid rgba(194,96,73,0.2)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
                          className="w-2 h-2 rounded-full"
                          style={{ background: 'var(--color-primary)' }}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>
                        ODIS is thinking…
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        Validating against company data
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {streamingParts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="max-w-[90%]">
                    <p className="font-mono text-[10px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      Z.AI GLM · ODIS
                    </p>
                    <div
                      className="p-4"
                      style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                    >
                      <StreamingOdisContent parts={streamingParts} streamingTexts={streamingTexts} />
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {hasValidated && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 pt-2"
            >
              <p className="text-xs font-mono" style={{ color: 'var(--color-success)' }}>
                ✓ PROBLEM CONFIRMED — READY FOR BLUEPRINT GENERATION
              </p>
              <button
                onClick={handleGenerateBlueprints}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-bright))',
                  boxShadow: '0 0 20px rgba(194,96,73,0.3)',
                }}
              >
                {isGenerating ? 'Launching blueprint generation…' : 'Generate Blueprints'}
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {hasRejected && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start gap-3 pt-2 px-1"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(184,74,57,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(184,74,57,0.3)' }}>
                  ✗ PROBLEM NOT CONFIRMED
                </span>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  The actual problem is described above. Refine your statement and try again.
                </p>
              </div>
              <button
                onClick={() => {
                  setMessages([{ role: 'assistant', content: ODIS_GREETING }]);
                  setInput('');
                }}
                className="px-4 py-2 text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Start over with a new problem statement
              </button>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className="shrink-0 p-4"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-panel)' }}
        >
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={isDone ? 'Validation complete — use the action above or start over.' : 'Describe the problem your company is facing…'}
              disabled={isLoading || isGenerating || isDone}
              className="flex-1 px-3 py-2 text-sm resize-none"
              style={{
                background: isDone ? 'var(--color-bg-panel)' : 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                cursor: isDone ? 'not-allowed' : undefined,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isGenerating || isDone}
              className="flex items-center justify-center w-10 h-10 self-end transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {isDone ? 'Validation complete.' : 'Press Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
