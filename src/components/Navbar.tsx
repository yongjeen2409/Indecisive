'use client';

import { motion } from 'framer-motion';
import { Bell, FileText, GitMerge, LayoutDashboard, LogOut, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ROUTES, isSuperior } from '../lib/routes';

const ROLE_COLORS: Record<string, string> = {
  staff: '#2563eb',
  lead: '#06b6d4',
  director: '#8b5cf6',
  executive: '#f59e0b',
};

const ROLE_LABELS: Record<string, string> = {
  staff: 'Department Staff',
  lead: 'Department Lead',
  director: 'Director',
  executive: 'Executive',
};

export default function Navbar() {
  const { currentUser, logout, mergedStrategy } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser) {
    return null;
  }

  const roleColor = ROLE_COLORS[currentUser.role];
  const navItems = isSuperior(currentUser.role)
    ? [
        { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
        { to: ROUTES.merge, label: 'Merge View', icon: GitMerge },
        ...(mergedStrategy ? [{ to: ROUTES.output, label: 'Latest Output', icon: FileText }] : []),
      ]
    : [
        { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
        { to: ROUTES.submit, label: 'Submit Problem', icon: PlusCircle },
      ];

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4"
      style={{
        background: 'rgba(8, 13, 26, 0.95)',
        borderBottom: '1px solid #1a2d50',
        backdropFilter: 'blur(12px)',
      }}
    >
      <button onClick={() => router.push(ROUTES.dashboard)} className="flex items-center gap-3 group">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
        >
          <span className="font-display font-bold text-xs text-white">O</span>
        </div>
        <div className="text-left">
          <p className="font-display font-bold text-sm tracking-wider" style={{ color: '#f0f6ff' }}>
            ODIS
          </p>
          <p className="text-[11px]" style={{ color: '#4a6a94' }}>
            Organisational Decision Intelligence System
          </p>
        </div>
      </button>

      <div className="hidden md:flex items-center gap-1">
        {navItems.map(item => (
          <Link
            key={item.to}
            href={item.to}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
            style={{
              color: pathname === item.to ? '#f0f6ff' : '#8bafd4',
              background: pathname === item.to ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            }}
          >
            <item.icon size={13} />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg transition-colors" style={{ color: '#8bafd4' }}>
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
        </button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: '#0c1428', border: '1px solid #1a2d50' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: roleColor }}
          >
            {currentUser.avatar}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium" style={{ color: '#f0f6ff' }}>
              {currentUser.name}
            </p>
            <p className="text-xs" style={{ color: roleColor }}>
              {ROLE_LABELS[currentUser.role]}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            router.push(ROUTES.landing);
          }}
          className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
          style={{ color: '#4a6a94' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </motion.nav>
  );
}
