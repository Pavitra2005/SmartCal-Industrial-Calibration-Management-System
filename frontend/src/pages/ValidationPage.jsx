import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  FileCode,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

export const ValidationPage = () => {
  const { addToast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchValidation = async () => {
    setLoading(true);
    try {
      const res = await api.get('/validation');
      setReport(res.data);
    } catch (err) {
      addToast('Failed to run validation suite', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, []);

  const handleExport = (fmt) => {
    window.open(`/api/validation/export?format=${fmt}`, '_blank');
    addToast(`Exporting validation report as ${fmt.toUpperCase()}...`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Database & Metrological Data Validation Suite</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated schema verification, relational foreign key constraints, date ordering, and business calculation audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={fetchValidation}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Validation Suite
          </button>
        </div>
      </div>

      {/* Validation Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-enterprise p-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Integrity Checks</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {report?.total_checks ?? '...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Rules & invariants verified</p>
        </div>

        <div className="card-enterprise p-4">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Passed Checks</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {report?.passed_checks ?? '...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">100% compliant structures</p>
        </div>

        <div className="card-enterprise p-4">
          <span className="text-xs font-semibold text-amber-600 uppercase">Warnings / Injected Anomalies</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {report?.warning_count ?? '...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Labelled benchmark edge cases</p>
        </div>

        <div className="card-enterprise p-4">
          <span className="text-xs font-semibold text-rose-600 uppercase">Failed Checks</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {report?.failed_checks ?? '0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Zero corruption tolerance</p>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="card-enterprise overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Validation Audit Report</h3>
            <span className="text-xs text-slate-500">
              Evaluated at: <strong className="font-mono text-slate-700">{report?.validation_timestamp?.replace('T', ' ').slice(0, 19)} UTC</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Check Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Detailed Finding / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.checks?.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">{c.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.category}</td>
                  <td className="px-4 py-3">
                    {c.passed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                      </span>
                    ) : c.severity === 'WARNING' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> WARNING ({c.affected_count})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> FAILED ({c.affected_count})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
