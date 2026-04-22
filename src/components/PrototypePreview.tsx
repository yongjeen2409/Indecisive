'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, X } from 'lucide-react';
import InteractivePrototypeMockData from '../../data/interactive_prototype_mock_data.jsx';
import { PrototypePreview as PrototypePreviewType } from '../types';

function PrototypeHeader({
  accentColor,
  title,
  summary,
  badgeLabel,
  onOpenFullscreen,
}: {
  accentColor: string;
  title: string;
  summary: string;
  badgeLabel: string;
  onOpenFullscreen: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div>
        <p className="text-xs font-mono mb-1" style={{ color: accentColor }}>
          {title.toUpperCase()}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {summary}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div
          className="px-2.5 py-1 text-[11px] font-medium"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {badgeLabel}
        </div>
        <button
          type="button"
          onClick={onOpenFullscreen}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <Expand size={12} />
          Full screen
        </button>
      </div>
    </div>
  );
}

function ScreenPrototypeBody({
  accentColor,
  preview,
  fullscreen = false,
}: {
  accentColor: string;
  preview: PrototypePreviewType;
  fullscreen?: boolean;
}) {
  const [activeScreenId, setActiveScreenId] = useState(preview.screens[0]?.id ?? '');
  const activeScreen = preview.screens.find(s => s.id === activeScreenId) ?? preview.screens[0];

  return (
    <div
      className={fullscreen ? 'h-full flex flex-col' : 'p-4'}
      style={{
        background: fullscreen ? 'var(--color-bg-panel)' : 'var(--color-bg-panel)',
        border: fullscreen ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {preview.screens.map(screen => (
          <button
            key={screen.id}
            onClick={() => setActiveScreenId(screen.id)}
            className="px-2.5 py-1 text-xs transition-all"
            style={{
              background: activeScreen.id === screen.id ? `${accentColor}20` : 'var(--color-bg-card)',
              border: `1px solid ${activeScreen.id === screen.id ? `${accentColor}55` : 'var(--color-border)'}`,
              color: activeScreen.id === screen.id ? accentColor : 'var(--color-text-secondary)',
            }}
          >
            {screen.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeScreen.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={fullscreen ? 'flex-1 p-5' : 'p-4'}
        style={{ background: 'var(--color-bg-card)', border: `1px solid ${accentColor}22` }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {activeScreen.headline}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {activeScreen.detail}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {activeScreen.metricLabel}
            </p>
            <p className="font-display font-bold text-lg" style={{ color: accentColor }}>
              {activeScreen.metricValue}
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full"
            style={{
              width: `${56 + preview.screens.findIndex(s => s.id === activeScreen.id) * 17}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function PrototypeBody({
  preview,
  accentColor,
  fullscreen = false,
}: {
  preview: PrototypePreviewType;
  accentColor: string;
  fullscreen?: boolean;
}) {
  if (preview.prototypeCode) {
    return (
      <iframe
        srcDoc={preview.prototypeCode}
        sandbox="allow-scripts"
        className="w-full"
        style={{
          height: fullscreen ? 'calc(100vh - 140px)' : '440px',
          border: `1px solid ${accentColor}30`,
          background: '#0a0a0f',
          display: 'block',
        }}
        title="Prototype preview"
      />
    );
  }

  if (preview.screens.length === 0) {
    return (
      <div
        className="overflow-hidden"
        style={{
          border: `1px solid ${accentColor}30`,
          background: 'var(--color-bg-panel)',
          maxHeight: fullscreen ? 'calc(100vh - 140px)' : 'none',
          overflowY: fullscreen ? 'auto' : 'hidden',
        }}
      >
        <InteractivePrototypeMockData embedded={!fullscreen} />
      </div>
    );
  }

  return <ScreenPrototypeBody accentColor={accentColor} preview={preview} fullscreen={fullscreen} />;
}

export default function PrototypePreview({
  preview,
  accentColor,
}: {
  preview: PrototypePreviewType;
  accentColor: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    }

    if (!isFullscreen) {
      return;
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const badgeLabel = preview.prototypeCode
    ? 'Live sandbox'
    : preview.screens.length === 0
      ? 'Interactive demo'
      : 'Interactive demo';

  return (
    <>
      <div>
        <PrototypeHeader
          accentColor={accentColor}
          title={preview.title}
          summary={preview.summary}
          badgeLabel={badgeLabel}
          onOpenFullscreen={() => setIsFullscreen(true)}
        />
        <PrototypeBody preview={preview} accentColor={accentColor} />
      </div>

      {isFullscreen ? (
        <div
          className="fixed inset-0 z-[100] p-4 sm:p-6"
          style={{ background: 'rgba(3, 7, 18, 0.82)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden"
            style={{ background: 'var(--color-bg-deep)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="text-xs font-mono mb-1" style={{ color: accentColor }}>
                  {preview.title.toUpperCase()}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {preview.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: `${accentColor}18`, color: accentColor }}
                >
                  {badgeLabel}
                </div>
                <button
                  type="button"
                  aria-label="Close full screen prototype"
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <X size={12} />
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <PrototypeBody preview={preview} accentColor={accentColor} fullscreen />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
