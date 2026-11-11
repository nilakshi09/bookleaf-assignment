import React from 'react';

const priorityConfigs = {
  Critical: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
    dot: 'bg-rose-500',
  },
  High: {
    bg: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
    dot: 'bg-orange-500',
  },
  Medium: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    dot: 'bg-amber-500',
  },
  Low: {
    bg: 'bg-slate-50 text-slate-700 border-slate-200 font-medium',
    dot: 'bg-slate-400',
  },
};

export const PriorityBadge = ({ priority = 'Medium', size = 'normal' }) => {
  const config = priorityConfigs[priority] || priorityConfigs.Medium;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{priority}</span>
    </span>
  );
};

export default PriorityBadge;
