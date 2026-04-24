'use client';

import { motion } from 'framer-motion';

export type RoleTone = 'primary' | 'blue' | 'olive';

interface RoleCardProps {
  title: string;
  subtitle: string;
  description: string;
  tone: RoleTone;
  index: number;
  rotation: number;
  selected: boolean;
  anySelected: boolean;
  isHovered?: boolean;
  isPassive?: boolean;
  onClick: () => void;
}

const TONE_MAP: Record<
  RoleTone,
  { hsl: string; tint: string; stroke: string; fill: string }
> = {
  primary: {
    hsl: 'hsl(17, 61%, 60%)',
    tint: 'hsl(24, 100%, 96%)',
    stroke: 'hsl(17, 61%, 55%)',
    fill: 'hsl(17, 61%, 60%)',
  },
  blue: {
    hsl: 'hsl(211, 45%, 60%)',
    tint: 'hsl(210, 38%, 96%)',
    stroke: 'hsl(211, 45%, 55%)',
    fill: 'hsl(211, 45%, 60%)',
  },
  olive: {
    hsl: 'hsl(87, 21%, 46%)',
    tint: 'hsl(80, 15%, 96%)',
    stroke: 'hsl(87, 21%, 42%)',
    fill: 'hsl(87, 21%, 46%)',
  },
};

/* ——— Per-role mini SVG visuals ——— */

function ExplorerVisual({ tone }: { tone: typeof TONE_MAP.primary }) {
  return (
    <div className="mt-6 flex justify-center w-full">
      <img
        src="/staff_crisp.png"
        alt="Department Staff"
        className="w-full max-w-[260px] h-auto object-contain"
        style={{
          animation: 'char-read 8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function EvaluatorVisual({ tone }: { tone: typeof TONE_MAP.blue }) {
  return (
    <div className="mt-6 flex justify-center w-full">
      <img
        src="/lead_crisp.png"
        alt="Department Head"
        className="w-full max-w-[260px] h-auto object-contain"
        style={{
          animation: 'char-evaluate 10s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />
    </div>
  );
}

function DirectorVisual({ tone }: { tone: typeof TONE_MAP.olive }) {
  return (
    <div className="mt-6 flex justify-center w-full">
      <img
        src="/director_crisp.png"
        alt="Director"
        className="w-full max-w-[260px] h-auto object-contain"
        style={{
          animation: 'char-direct 12s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
    </div>
  );
}

export default function RoleCard({
  title,
  subtitle,
  description,
  tone,
  index,
  rotation,
  selected,
  anySelected,
  isHovered,
  isPassive,
  onClick,
}: RoleCardProps) {
  const colors = TONE_MAP[tone];

  // Base state depends on whether something is selected, or if we are in passive hover mode
  const isDeselected = anySelected && !selected;
  
  // Combine passive/deselected states
  const fadeOut = isDeselected || isPassive;

  return (
    <motion.button
      onClick={onClick}
      className="paper-card relative text-left w-full h-full flex flex-col cursor-pointer overflow-hidden"
      style={{
        padding: '2rem',
        opacity: 1,
        outline: 'none',
      }}
      initial={{ opacity: 0, y: 28 }}
      animate={{
        opacity: fadeOut ? 0.6 : 1,
        y: isHovered ? -6 : 0,
        filter: fadeOut ? 'blur(1px)' : isHovered ? `drop-shadow(0 12px 24px ${colors.hsl}20)` : 'blur(0px)',
        backgroundColor: isHovered ? colors.tint : 'transparent',
      }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Selected ring */}
      {selected && (
        <motion.div
          layoutId="role-ring"
          className="absolute inset-0 rounded-[1rem]"
          style={{
            border: `2px solid ${colors.hsl}`,
            animation: 'ring-pulse 1.5s ease-in-out infinite',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Tone accent bar */}
      <div
        className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.hsl}, transparent)`,
          opacity: 0.4,
        }}
      />

      {/* Subtitle (role keyword) */}
      <span
        className="inline-block text-xs font-medium tracking-wider uppercase mb-2"
        style={{
          color: colors.hsl,
          fontFamily: 'var(--font-body-ui), sans-serif',
        }}
      >
        {subtitle}
      </span>

      {/* Title */}
      <h3
        className="text-xl font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-serif-ui), serif',
          color: 'hsl(60, 3%, 8%)',
        }}
      >
        {title}
      </h3>

      {/* Description wrapper: flex-grow so the image stays at the bottom */}
      <div className="flex-grow">
        <motion.p
          className="text-sm leading-relaxed mb-4 overflow-hidden"
          style={{ color: 'hsl(60, 3%, 30%)' }}
          animate={{
            opacity: isPassive ? 0 : 1,
            height: isPassive ? 0 : 'auto',
          }}
          transition={{ duration: 0.4 }}
        >
          {description}
        </motion.p>
      </div>

      {/* Per-role visual */}
      {tone === 'primary' && <ExplorerVisual tone={colors} />}
      {tone === 'blue' && <EvaluatorVisual tone={colors} />}
      {tone === 'olive' && <DirectorVisual tone={colors} />}
    </motion.button>
  );
}
