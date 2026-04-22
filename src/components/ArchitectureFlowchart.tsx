'use client';

type ArchitectureFlowchartProps = {
  architecture: string[];
  accentColor: string;
  color: string;
  title?: string;
};

type ArchitectureNode = {
  id: string;
  label: string;
  detail: string;
};

function parseArchitectureNode(item: string, index: number): ArchitectureNode {
  const colonIndex = item.indexOf(':');

  if (colonIndex === -1) {
    return {
      id: `${index}-${item}`,
      label: `Step ${String(index + 1).padStart(2, '0')}`,
      detail: item,
    };
  }

  return {
    id: `${index}-${item}`,
    label: item.slice(0, colonIndex).trim(),
    detail: item.slice(colonIndex + 1).trim(),
  };
}

export default function ArchitectureFlowchart({
  architecture,
  accentColor,
  color,
  title = 'System architecture flow',
}: ArchitectureFlowchartProps) {
  const nodes = architecture.map(parseArchitectureNode);
  const boxBorderColor = '#f28c28';

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.24em] mb-5" style={{ color: accentColor }}>
        {title}
      </p>
      <div
        className="relative max-w-3xl mx-auto overflow-hidden p-4 sm:p-6"
        style={{
          background: `linear-gradient(180deg, ${color}10, rgba(0, 0, 0, 0))`,
          border: `1px solid ${color}28`,
        }}
      >
        <div className="space-y-3 sm:space-y-4">
          {nodes.map((node, index) => {
            const isLast = index === nodes.length - 1;

            return (
              <div key={node.id} className="flex flex-col items-center">
                <div
                  className="w-full max-w-xl rounded-[14px] px-4 py-3"
                  style={{
                    background: `linear-gradient(180deg, ${color}10, rgba(0, 0, 0, 0))`,
                    border: `1.5px solid ${boxBorderColor}`,
                  }}
                >
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] mb-1.5" style={{ color: accentColor }}>
                    Stage {String(index + 1).padStart(2, '0')}
                  </p>
                  <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    {node.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {node.detail}
                  </p>
                </div>

                {!isLast ? (
                  <div className="flex justify-center py-2 sm:py-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-px sm:h-8" style={{ background: `${color}80` }} />
                      <div
                        className="h-2.5 w-2.5 rotate-45"
                        style={{
                          borderRight: `1.8px solid ${color}`,
                          borderBottom: `1.8px solid ${color}`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
