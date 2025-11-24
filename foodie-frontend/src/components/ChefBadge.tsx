import { Award, Star, Flame, Sprout } from 'lucide-react';

type BadgeType = 'new' | 'rising' | 'michelin';

interface ChefBadgeProps {
    badge: BadgeType;
    size?: 'sm' | 'md' | 'lg';
}

const BADGE_CONFIG = {
    new: {
        label: 'New Chef in Town',
        icon: Sprout,
        color: 'from-amber-600 to-amber-800',
        glow: 'shadow-amber-500/20',
        iconColor: 'text-amber-300',
    },
    rising: {
        label: 'Hot New Chef',
        icon: Flame,
        color: 'from-orange-500 to-red-600',
        glow: 'shadow-orange-500/30',
        iconColor: 'text-orange-300',
    },
    michelin: {
        label: 'Michelin Rating',
        icon: Star,
        color: 'from-yellow-400 to-yellow-600',
        glow: 'shadow-yellow-500/40',
        iconColor: 'text-yellow-200',
    },
};

export default function ChefBadge({ badge, size = 'md' }: ChefBadgeProps) {
    const config = BADGE_CONFIG[badge];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${config.color} ${sizeClasses[size]} font-semibold text-white shadow-lg ${config.glow}`}
        >
            <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
            <span>{config.label}</span>
        </div>
    );
}
