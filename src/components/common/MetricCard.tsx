import React from 'react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  colorScheme?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  badge?: string;
  badgeType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50/70 hover:bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
    textColor: 'text-blue-900',
  },
  cyan: {
    bg: 'bg-cyan-50/70 hover:bg-cyan-50 border-cyan-100',
    iconBg: 'bg-cyan-600 text-white shadow-cyan-500/20',
    textColor: 'text-cyan-900',
  },
  emerald: {
    bg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
    textColor: 'text-emerald-900',
  },
  amber: {
    bg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-600 text-white shadow-amber-500/20',
    textColor: 'text-amber-900',
  },
  rose: {
    bg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-600 text-white shadow-rose-500/20',
    textColor: 'text-rose-900',
  },
  indigo: {
    bg: 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
    textColor: 'text-indigo-900',
  },
  slate: {
    bg: 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200',
    iconBg: 'bg-slate-700 text-white shadow-slate-500/20',
    textColor: 'text-slate-900',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  badge,
  badgeType = 'positive',
  onClick,
}) => {
  const colors = colorMap[colorScheme] || colorMap.blue;

  return (
    <div
      id={id}
      onClick={onClick}
      className={`rounded-2xl border p-5 transition-all duration-200 shadow-xs hover:shadow-md ${colors.bg} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${colors.textColor}`}>{value}</span>
            {badge && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  badgeType === 'positive'
                    ? 'bg-emerald-100 text-emerald-800'
                    : badgeType === 'negative'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl shadow-md ${colors.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
