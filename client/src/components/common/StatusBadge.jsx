import React from 'react';
import { getStatusBadge } from '../../utils/formatters';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const badge = getStatusBadge(status);

  const sizeClasses = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-sm px-3.5 py-1.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-xs tracking-wide ${badge.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${badge.dot}`} />
      {badge.label}
    </span>
  );
};

export default StatusBadge;
