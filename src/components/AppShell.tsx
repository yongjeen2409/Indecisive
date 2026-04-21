'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { useApp } from '../context/AppContext';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  return (
    <div className="min-h-screen" style={{ background: '#050810' }}>
      {currentUser ? <Navbar /> : null}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
