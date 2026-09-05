// Format currency in Indian numbering format (e.g. ₹1,09,420)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date to human readable form (e.g. 10 Sep 2026)
export const formatDate = (dateString, format = 'short') => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  if (format === 'long') {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Status Badge Styling Helper
export const getStatusBadge = (status) => {
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'PAID':
    case 'ACTIVE':
    case 'SUCCESS':
    case 'RESOLVED':
      return {
        label: s,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10',
        dot: 'bg-emerald-500'
      };
    case 'PENDING':
    case 'OPEN':
      return {
        label: s,
        bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10',
        dot: 'bg-amber-500'
      };
    case 'PARTIAL':
      return {
        label: s,
        bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/10',
        dot: 'bg-blue-500'
      };
    case 'OVERDUE':
    case 'FAILED':
    case 'DISCONNECTED':
    case 'CANCELLED':
      return {
        label: s,
        bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10',
        dot: 'bg-rose-500'
      };
    case 'SUSPENDED':
    case 'IN_PROGRESS':
    case 'INACTIVE':
      return {
        label: s,
        bg: 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-600/10',
        dot: 'bg-orange-500'
      };
    default:
      return {
        label: s || 'UNKNOWN',
        bg: 'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-600/10',
        dot: 'bg-slate-400'
      };
  }
};

export const getProviderBadge = (provider) => {
  const code = (typeof provider === 'string' ? provider : provider?.code || '').toUpperCase();

  if (code.includes('BSNL')) {
    return {
      name: 'BSNL',
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      border: 'border-sky-500',
      textColor: 'text-sky-600'
    };
  }
  if (code.includes('RAIL')) {
    return {
      name: 'RailWire',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      border: 'border-amber-500',
      textColor: 'text-amber-600'
    };
  }
  if (code.includes('GTPL')) {
    return {
      name: 'GTPL',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      border: 'border-purple-500',
      textColor: 'text-purple-600'
    };
  }

  return {
    name: code || 'Broadband',
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    border: 'border-slate-500',
    textColor: 'text-slate-600'
  };
};
