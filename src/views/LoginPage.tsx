'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Briefcase, Building2, ChevronLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { Role } from '../types';

const ROLE_OPTIONS: {
  role: Role;
  label: string;
  description: string;
  icon: typeof Users;
  color: string;
  userId: string;
}[] = [
  {
    role: 'staff',
    label: 'Department Staff',
    description: 'Submit a business problem, review AI-generated blueprints, acknowledge conflicts, and escalate a preferred solution to your department head.',
    icon: Users,
    color: 'var(--color-primary)',
    userId: 'u1',
  },
  {
    role: 'lead',
    label: 'Department Head',
    description: 'Review solutions escalated by your staff, inspect scores and architecture, then forward the strongest options to the Director.',
    icon: Briefcase,
    color: 'var(--color-accent)',
    userId: 'u2',
  },
  {
    role: 'director',
    label: 'Director',
    description: 'Merge department-head-approved blueprints into a unified cross-organisational strategy and generate the final executive output.',
    icon: Building2,
    color: 'var(--color-warning)',
    userId: 'u3',
  },
];

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'role'>('login');
  const [email, setEmail] = useState('demo@organization.com');
  const [password, setPassword] = useState('demo-password');
  const [loading, setLoading] = useState(false);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setStep('role');
    }, 900);
  };

  const handleRoleSelect = (userId: string) => {
    login(userId);
    router.push(ROUTES.dashboard);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 relative" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="absolute inset-0 pointer-events-none grid-bg" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 30%, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
        }}
      />

      <button
        onClick={() => router.push(ROUTES.landing)}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm transition-colors hover:text-blue-400"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <AnimatePresence mode="wait">
        {step === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="text-center mb-12">
              <div
                className="inline-flex w-14 h-14 items-center justify-center mb-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  boxShadow: '0 0 30px rgba(37, 99, 235, 0.4)',
                }}
              >
                <span className="font-display font-bold text-xl text-white">O</span>
              </div>
              <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                Welcome to Indecisive
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Sign in to explore the role-based decision intelligence demo.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="p-7 space-y-5 rounded-2xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Work email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="w-full px-4 py-3 text-sm outline-none transition-all focus:border-blue-500/50 rounded-lg"
                    style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="w-full px-4 py-3 text-sm outline-none transition-all rounded-lg"
                    style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 font-semibold text-white transition-all hover:scale-105 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                  boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
              Demo mode: any credentials will work.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-4xl"
          >
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Select your role
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Your role changes what Indecisive shows next in the decision flow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {ROLE_OPTIONS.map((option, index) => (
                <motion.button
                  key={option.role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => handleRoleSelect(option.userId)}
                  className="p-6 text-left group transition-all"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                  whileHover={{
                    scale: 1.02,
                    borderColor: `${option.color}70`,
                    boxShadow: `0 0 20px ${option.color}20`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0"
                      style={{ background: `${option.color}20`, border: `1px solid ${option.color}40` }}
                    >
                      <option.icon size={20} style={{ color: option.color }} />
                    </div>
                    <div>
                      <div className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {option.label}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
