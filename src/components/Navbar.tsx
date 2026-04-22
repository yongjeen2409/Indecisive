'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOCK_USERS } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import ThemeToggle from './ThemeToggle';

const ROLE_COLORS: Record<string, string> = {
  staff: 'var(--color-primary)',
  lead: 'var(--color-accent)',
  director: 'var(--color-accent)',
  executive: 'var(--color-warning)',
};

const ROLE_LABELS: Record<string, string> = {
  staff: 'Department Staff',
  lead: 'Department Lead',
  director: 'Director',
  executive: 'Executive',
};

export default function Navbar() {
  const { currentUser, login, logout } = useApp();
  const router = useRouter();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSwitcherOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleUserSwitch(userId: string) {
    login(userId);
    setIsSwitcherOpen(false);
    router.push(ROUTES.dashboard);
  }

  if (!currentUser) {
    return null;
  }

  const roleColor = ROLE_COLORS[currentUser.role];

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6"
      style={{
        background: 'color-mix(in srgb, var(--color-bg-panel) 95%, transparent)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <button onClick={() => router.push(ROUTES.dashboard)} className="flex items-center gap-3 group">
        <div
          className="flex h-8 w-8 items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
        >
          <span className="font-display text-xs font-bold text-white">I</span>
        </div>
        <div className="text-left">
          <p className="font-display text-sm font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
            Indecisive
          </p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            AI Decision Intelligence Platform
          </p>
        </div>
      </button>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="relative p-2 transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
          <Bell size={16} />
          <span className="absolute right-1 top-1 h-2 w-2" style={{ background: 'var(--color-danger)' }} />
        </button>

        <div className="relative" ref={switcherRef}>
          <button
            type="button"
            aria-expanded={isSwitcherOpen}
            aria-haspopup="menu"
            aria-label="Switch user"
            onClick={() => setIsSwitcherOpen(open => !open)}
            className="flex items-center gap-2 px-3 py-1.5 transition-colors"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="flex h-6 w-6 items-center justify-center text-xs font-bold text-white"
              style={{ background: roleColor }}
            >
              {currentUser.avatar}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {currentUser.name}
              </p>
              <p className="text-xs" style={{ color: roleColor }}>
                {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--color-text-muted)' }}
            />
          </button>

          {isSwitcherOpen ? (
            <div
              role="menu"
              aria-label="User switcher"
              className="absolute right-0 mt-2 w-72 overflow-hidden"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.24)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                  Switch user
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Jump between demo roles from the navbar.
                </p>
              </div>

              <div className="py-1">
                {MOCK_USERS.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  const userRoleColor = ROLE_COLORS[user.role];

                  return (
                    <button
                      key={user.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isCurrent}
                      onClick={() => handleUserSwitch(user.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        background: isCurrent ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center text-xs font-bold text-white"
                        style={{ background: userRoleColor }}
                      >
                        {user.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {ROLE_LABELS[user.role]} - {user.department}
                        </p>
                      </div>
                      {isCurrent ? (
                        <span className="text-[11px] font-medium" style={{ color: userRoleColor }}>
                          Active
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <button
          onClick={() => {
            logout();
            router.push(ROUTES.landing);
          }}
          className="p-2 transition-colors hover:bg-red-500/10"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </motion.nav>
  );
}
