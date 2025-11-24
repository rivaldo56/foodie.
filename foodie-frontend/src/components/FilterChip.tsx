import { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

interface FilterChipProps {
  label: string;
  active?: boolean;
  icon?: ComponentType<{ className?: string }> | LucideIcon;
  onClick?: () => void;
}

export default function FilterChip({ label, active = false, icon: Icon, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
        active
          ? 'bg-accent text-white shadow-glow'
          : 'bg-surface-highlight text-muted hover:text-white hover:bg-accent-soft'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
