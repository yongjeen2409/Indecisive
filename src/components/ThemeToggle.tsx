'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      style={{ color: 'var(--color-text-secondary)' }}
      aria-label="Toggle dark mode"
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
