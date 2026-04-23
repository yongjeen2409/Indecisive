import { Role } from '../types';

export const ROLE_AVATAR_COLORS: Record<Role, string> = {
  staff: '#2563eb',
  lead: '#7c3aed',
  director: '#d97706',
  executive: '#059669',
};

export const ROLE_LABELS: Record<Role, string> = {
  staff: 'Staff',
  lead: 'Dept Head',
  director: 'Director',
  executive: 'Executive',
};

export function RoleAvatar({ initials, role, size = 20 }: { initials: string; role: Role; size?: number }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        background: ROLE_AVATAR_COLORS[role] ?? '#6b7280',
        color: '#fff',
        fontSize: size * 0.42,
        borderRadius: 3,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  );
}
