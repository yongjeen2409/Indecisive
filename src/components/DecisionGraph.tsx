'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  pulsePhase: number;
}

interface Edge {
  from: number;
  to: number;
  progress: number;
  speed: number;
  opacity: number;
}

export default function DecisionGraph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init nodes
    const nodeCount = 22;
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 3 + 2,
      opacity: Math.random() * 0.5 + 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // Init edges
    edgesRef.current = Array.from({ length: 18 }, () => {
      const from = Math.floor(Math.random() * nodeCount);
      let to = Math.floor(Math.random() * nodeCount);
      while (to === from) to = Math.floor(Math.random() * nodeCount);
      return { from, to, progress: Math.random(), speed: Math.random() * 0.003 + 0.001, opacity: Math.random() * 0.3 + 0.1 };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Update nodes
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        n.pulsePhase += 0.02;
      });

      // Draw edges with flowing particle
      edges.forEach(e => {
        e.progress += e.speed;
        if (e.progress > 1) e.progress = 0;

        const n1 = nodes[e.from];
        const n2 = nodes[e.to];
        const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
        if (dist > 300) return;

        // Static line
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = `rgba(37, 99, 235, ${e.opacity * 0.6})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Flowing particle
        const px = n1.x + (n2.x - n1.x) * e.progress;
        const py = n1.y + (n2.y - n1.y) * e.progress;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${e.opacity * 2})`;
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach(n => {
        const pulse = Math.sin(n.pulsePhase) * 0.3 + 0.7;
        const r = n.r * pulse;

        // Glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
        grad.addColorStop(0, `rgba(96, 165, 250, ${n.opacity * 0.6})`);
        grad.addColorStop(1, 'rgba(96, 165, 250, 0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${n.opacity})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
}
