import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    OUT_OF_SERVICE: 'bg-amber-50 text-amber-700 border-amber-200',
    UNDER_MAINTENANCE: 'bg-blue-50 text-blue-700 border-blue-200',
    RETIRED: 'bg-slate-100 text-slate-600 border-slate-200',
    OPEN: 'bg-rose-50 text-rose-700 border-rose-200',
    ASSIGNED: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    ON_HOLD: 'bg-purple-50 text-purple-700 border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MISMATCH_FLAGGED: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    MISSING_FLAGGED: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const currentStyle = styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = (status || '').replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${currentStyle}`}>
      {label}
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  const styles = {
    CRITICAL: 'bg-rose-600 text-white font-bold',
    HIGH: 'bg-rose-50 text-rose-700 border border-rose-300 font-semibold',
    MEDIUM: 'bg-amber-50 text-amber-800 border border-amber-300',
    LOW: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs tracking-wide uppercase ${styles[severity] || styles.LOW}`}>
      {severity}
    </span>
  );
};

export const ResultBadge = ({ result }) => {
  if (result === 'PASS') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        PASS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
      FAIL
    </span>
  );
};

export const DecisionBadge = ({ decision }) => {
  if (decision === 'ALLOWED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        ALLOWED
      </span>
    );
  } else if (decision === 'BLOCKED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
        BLOCKED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      EXCEPTION
    </span>
  );
};
