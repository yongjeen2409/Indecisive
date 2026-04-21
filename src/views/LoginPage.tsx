'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Briefcase, Building2, ChevronLeft, Crown, Users } from 'lucide-react';
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
    description: 'Submit a business problem, review conflicts, rank blueprints, and escalate a preferred option.',
    icon: Users,
    color: '#2563eb',
    userId: 'u1',
  },
  {
    role: 'lead',
    label: 'Department Lead',
    description: 'Review pending escalations, compare compatible pairs, and approve a merged recommendation.',
    icon: Briefcase,
    color: '#06b6d4',
    userId: 'u2',
  },
  {
    role: 'director',
    label: 'Director',
    description: 'Oversee cross-department strategy alignment and pressure-test the recommended merge path.',
    icon: Building2,
    color: '#8b5cf6',
    userId: 'u3',
  },
  {
    role: 'executive',
    label: 'Executive',
    description: 'Review the final unified strategy, finance model, and executive brief for sign-off.',
    icon: Crown,
    color: '#f59e0b',
    userId: 'u4',
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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 relative" style={{ background: '#050810' }}>
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
        style={{ color: '#4a6a94' }}
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
                className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  boxShadow: '0 0 30px rgba(37, 99, 235, 0.4)',
                }}
              >
                <span className="font-display font-bold text-xl text-white">O</span>
              </div>
              <h1 className="font-display font-bold text-2xl" style={{ color: '#f0f6ff' }}>
                Welcome to ODIS
              </h1>
              <p className="text-sm mt-1" style={{ color: '#8bafd4' }}>
                Sign in to explore the role-based decision intelligence demo.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="p-7 rounded-2xl space-y-5" style={{ background: '#0c1428', border: '1px solid #1a2d50' }}>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#8bafd4' }}>
                    Work email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:border-blue-500/50"
                    style={{ background: '#080d1a', border: '1px solid #1a2d50', color: '#f0f6ff' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#8bafd4' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#080d1a', border: '1px solid #1a2d50', color: '#f0f6ff' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

            <p className="text-center text-xs mt-6" style={{ color: '#4a6a94' }}>
              Demo mode: any credentials will work.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-3xl"
          >
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-2xl mb-2" style={{ color: '#f0f6ff' }}>
                Select your role
              </h2>
              <p className="text-sm" style={{ color: '#8bafd4' }}>
                Your role changes what ODIS shows next in the decision flow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {ROLE_OPTIONS.map((option, index) => (
                <motion.button
                  key={option.role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => handleRoleSelect(option.userId)}
                  className="p-6 rounded-2xl text-left group transition-all"
                  style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
                  whileHover={{
                    scale: 1.02,
                    borderColor: `${option.color}70`,
                    boxShadow: `0 0 20px ${option.color}20`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${option.color}20`, border: `1px solid ${option.color}40` }}
                    >
                      <option.icon size={20} style={{ color: option.color }} />
                    </div>
                    <div>
                      <div className="font-display font-semibold text-sm mb-1" style={{ color: '#f0f6ff' }}>
                        {option.label}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: '#8bafd4' }}>
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
