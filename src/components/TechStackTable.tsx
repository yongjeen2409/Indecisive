'use client';

import { TechStackCategory } from '../types';

export default function TechStackTable({
  techStack,
  accentColor,
  title = 'Categorized implementation stack',
}: {
  techStack: TechStackCategory[];
  accentColor: string;
  title?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wide mb-4" style={{ color: accentColor }}>
        {title}
      </p>
      <div style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th
                className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] align-top"
                style={{ color: 'var(--color-text-muted)', width: '32%' }}
              >
                Category
              </th>
              <th
                className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.18em] align-top"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Technologies
              </th>
            </tr>
          </thead>
          <tbody>
            {techStack.map((entry, index) => (
              <tr key={`${entry.category}-${index}`} style={{ borderBottom: index === techStack.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                <td className="px-4 py-3 align-top">
                  <p className="text-xs font-semibold" style={{ color: accentColor }}>
                    {entry.category}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-2">
                    {entry.tools.map(tool => (
                      <span
                        key={`${entry.category}-${tool}`}
                        className="px-2.5 py-1 text-xs font-mono"
                        style={{
                          background: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
