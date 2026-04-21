'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PrototypePreview as PrototypePreviewType } from '../types';

export default function PrototypePreview({
  preview,
  accentColor,
}: {
  preview: PrototypePreviewType;
  accentColor: string;
}) {
  const [activeScreenId, setActiveScreenId] = useState(preview.screens[0]?.id);
  const activeScreen =
    preview.screens.find(screen => screen.id === activeScreenId) ?? preview.screens[0];

  return (
    <div className="p-4" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: accentColor }}>
            {preview.title.toUpperCase()}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {preview.summary}
          </p>
        </div>
        <div
          className="px-2.5 py-1 text-[11px] font-medium"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          Interactive demo
        </div>
      </div>

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
        className="p-4"
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
              width: `${56 + preview.screens.findIndex(screen => screen.id === activeScreen.id) * 17}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
