export function timeAgo(dateStr: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals: [string, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hr', 3600], ['min', 60],
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count > 0) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export function formatNumber(num?: number): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

export function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name?: string): string {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  let hash = 0;
  for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function heshimaLevel(score: number): { name: string; color: string; icon: string } {
  if (score >= 5000) return { name: 'Mwalimu Mkuu', color: 'text-yellow-500', icon: '🌟' };
  if (score >= 2000) return { name: 'Mtaalamu', color: 'text-orange-500', icon: '🏆' };
  if (score >= 500) return { name: 'Mwalimu', color: 'text-emerald-500', icon: '🎓' };
  if (score >= 100) return { name: 'Mwananchi', color: 'text-blue-500', icon: '🇰🇪' };
  return { name: 'Mgeni', color: 'text-gray-400', icon: '🌱' };
}

export function roleBadge(role?: string): string {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    moderator: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    expert: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    user: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  return map[role || 'user'] || map.user;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
