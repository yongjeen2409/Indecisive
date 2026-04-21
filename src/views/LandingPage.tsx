'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, GitMerge, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DecisionGraph from '../components/DecisionGraph';
import { ROUTES } from '../lib/routes';

const METRICS = [
  { value: '340%', label: 'Projected ROI on merged strategies' },
  { value: '6.2x', label: 'Faster decision cycles across teams' },
  { value: '94%', label: 'Conflict detection confidence' },
  { value: '48h', label: 'From problem to leadership-ready strategy' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Zap,
    title: 'Submit and analyze',
    description:
      'Users describe a business problem in plain language, and ODIS pulls related Jira tickets, Confluence documents, and past decisions.',
  },
  {
    step: '02',
    icon: BarChart3,
    title: 'Generate and rank',
    description:
      'A GLM reasoning layer proposes multiple solution blueprints and the decision engine scores each one for feasibility, impact, effort, and risk.',
  },
  {
    step: '03',
    icon: GitMerge,
    title: 'Merge and deliver',
    description:
      'Superiors review escalated blueprints, accept recommended pairings, and generate a unified strategy with an executive brief, technical blueprint, and finance model.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: '#050810' }}>
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid-bg" />
        <DecisionGraph />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-mono"
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              color: '#60a5fa',
            }}
          >
            <Sparkles size={12} />
            Role-based decision intelligence for complex organizations
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#f0f6ff' }}
          >
            Turn complex business problems into
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              aligned organizational strategy.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg mb-12 max-w-3xl mx-auto leading-relaxed"
            style={{ color: '#8bafd4' }}
          >
            ODIS is a role-based AI decision platform that retrieves internal context, generates
            multiple cross-department blueprints, detects conflicts before ranking, and helps
            leadership merge the best options into one unified strategy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <button
              onClick={() => router.push(ROUTES.login)}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 0 30px rgba(37, 99, 235, 0.4)',
              }}
            >
              Launch ODIS
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push(ROUTES.login)}
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-medium transition-all hover:border-blue-500/50"
              style={{
                border: '1px solid #1a2d50',
                color: '#8bafd4',
                background: 'rgba(12, 20, 40, 0.8)',
              }}
            >
              View live demo
              <ShieldCheck size={16} />
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-mono" style={{ color: '#4a6a94' }}>
            Scroll to explore
          </span>
          <div className="w-px h-12" style={{ background: 'linear-gradient(to bottom, #2563eb, transparent)' }} />
        </motion.div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: '1px solid #1a2d50' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {METRICS.map(metric => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl"
              style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
            >
              <div
                className="font-display font-bold text-3xl mb-2"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {metric.value}
              </div>
              <div className="text-xs" style={{ color: '#8bafd4' }}>
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="font-mono text-xs mb-3" style={{ color: '#2563eb' }}>
              HOW IT WORKS
            </p>
            <h2 className="font-display font-bold text-4xl" style={{ color: '#f0f6ff' }}>
              From problem statement to unified strategy in three steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-7">
            {HOW_IT_WORKS.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className="relative p-6 rounded-2xl group transition-all"
                style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
              >
                <div
                  className="font-mono text-6xl font-bold absolute top-4 right-4"
                  style={{ color: 'rgba(37, 99, 235, 0.08)' }}
                >
                  {item.step}
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <item.icon size={20} style={{ color: '#3b82f6' }} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2" style={{ color: '#f0f6ff' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8bafd4' }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6" style={{ borderTop: '1px solid #1a2d50' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0c1428, #111d35)', border: '1px solid #1a2d50' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="font-display font-bold text-3xl mb-4" style={{ color: '#f0f6ff' }}>
                Ready to align decision-making across the organization?
              </h2>
              <p className="mb-8" style={{ color: '#8bafd4' }}>
                Try the ODIS demo to submit a business problem, review AI-generated blueprints,
                and step through the superior merge flow.
              </p>
              <button
                onClick={() => router.push(ROUTES.login)}
                className="px-8 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 0 30px rgba(37, 99, 235, 0.4)',
                }}
              >
                Start the demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
