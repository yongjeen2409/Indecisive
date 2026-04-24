'use client';

/**
 * Sketches — background grid wash, color glows, drifting doodles
 * for the landing page paper aesthetic.
 */
export default function Sketches() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Warm radial glow — top-right terracotta */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-8%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(17 61% 60% / 0.06) 0%, transparent 70%)',
          animation: 'drift 28s ease-in-out infinite',
        }}
      />

      {/* Cool radial glow — bottom-left blue */}
      <div
        style={{
          position: 'absolute',
          bottom: '-12%',
          left: '-6%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(211 45% 60% / 0.05) 0%, transparent 70%)',
          animation: 'drift 32s ease-in-out infinite reverse',
        }}
      />

      {/* Olive glow — center-left */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '10%',
          width: '30vw',
          height: '30vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(87 21% 46% / 0.04) 0%, transparent 70%)',
          animation: 'drift 36s ease-in-out infinite',
          animationDelay: '-12s',
        }}
      />

      {/* Drifting doodle — small spiral SVG */}
      <svg
        style={{
          position: 'absolute',
          top: '15%',
          right: '18%',
          width: '60px',
          height: '60px',
          opacity: 0.12,
          animation: 'drift 22s ease-in-out infinite',
          animationDelay: '-4s',
        }}
        viewBox="0 0 60 60"
        fill="none"
        stroke="hsl(17 61% 60%)"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M30 30 C30 22, 38 22, 38 30 C38 38, 22 38, 22 30 C22 18, 42 18, 42 30 C42 42, 18 42, 18 30" />
      </svg>

      {/* Drifting doodle — triangle */}
      <svg
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '12%',
          width: '40px',
          height: '40px',
          opacity: 0.08,
          animation: 'drift 26s ease-in-out infinite reverse',
          animationDelay: '-8s',
        }}
        viewBox="0 0 40 40"
        fill="none"
        stroke="hsl(211 45% 60%)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 L36 34 L4 34 Z" />
      </svg>

      {/* Drifting doodle — circle */}
      <svg
        style={{
          position: 'absolute',
          top: '60%',
          left: '6%',
          width: '32px',
          height: '32px',
          opacity: 0.1,
          animation: 'drift 20s ease-in-out infinite',
          animationDelay: '-6s',
        }}
        viewBox="0 0 32 32"
        fill="none"
        stroke="hsl(87 21% 46%)"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <circle cx="16" cy="16" r="12" />
      </svg>

      {/* Drifting doodle — small squiggly line */}
      <svg
        style={{
          position: 'absolute',
          top: '30%',
          left: '25%',
          width: '80px',
          height: '20px',
          opacity: 0.07,
          animation: 'drift 30s ease-in-out infinite',
          animationDelay: '-15s',
        }}
        viewBox="0 0 80 20"
        fill="none"
        stroke="hsl(17 61% 60%)"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M2 10 Q12 2, 20 10 T40 10 T60 10 T78 10" />
      </svg>

      {/* Drifting x mark */}
      <svg
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '35%',
          width: '24px',
          height: '24px',
          opacity: 0.08,
          animation: 'drift 24s ease-in-out infinite reverse',
          animationDelay: '-10s',
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="hsl(211 45% 60%)"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M6 6 L18 18 M18 6 L6 18" />
      </svg>
    </div>
  );
}
