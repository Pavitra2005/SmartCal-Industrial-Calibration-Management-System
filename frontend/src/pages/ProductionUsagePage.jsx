import React, { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send
} from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { DecisionBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const ProductionUsagePage = () => {
  const { addToast } = useToast();
  const { permissions, currentRole } = useAuth();

  const [usages, setUsages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');

  // Pre-flight Simulator Modal
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [checkForm, setCheckForm] = useState({
    asset_id: '',
    production_batch_id: 'BATCH-2026-B892',
    production_line: 'Line 1 - CNC Milling',
    operator: currentRole.userName || 'Carlos Mendez',
    exception_approval_id: '',
  });
  const [validationResult, setValidationResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [recording, setRecording] = useState(false);

  const fetchUsages = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search,
        decision: decisionFilter,
      };
      const res = await api.get('/usage', { params });
      setUsages(res.data.usages);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load production usages', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, decisionFilter, addToast]);

  useEffect(() => {
    fetchUsages();
  }, [fetchUsages]);

  const handleRunValidationCheck = async () => {
    if (!checkForm.asset_id.trim()) {
      addToast('Please enter an Asset ID to validate.', 'warning');
      return;
    }
    setChecking(true);
    setValidationResult(null);
    try {
      const res = await api.post('/usage/validate', {
        asset_id: checkForm.asset_id.trim().toUpperCase(),
        exception_approval_id: checkForm.exception_approval_id.trim() || null,
      });
      setValidationResult(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Validation error', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleRecordUsageSubmit = async (e) => {
    e.preventDefault();
    setRecording(true);
    try {
      const res = await api.post('/usage', {
        asset_id: checkForm.asset_id.trim().toUpperCase(),
        production_batch_id: checkForm.production_batch_id,
        production_line: checkForm.production_line,
        operator: checkForm.operator,
        exception_approval_id: checkForm.exception_approval_id.trim() || null,
      });

      if (res.data.decision === 'ALLOWED') {
        addToast('Production usage ALLOWED and recorded!', 'success');
      } else if (res.data.decision === 'ALLOWED_WITH_EXCEPTION') {
        addToast('Production usage ALLOWED WITH EXCEPTION!', 'warning');
      }
      setIsCheckModalOpen(false);
      fetchUsages();
    } catch (err) {
      if (err.response?.status === 403) {
        addToast('USAGE BLOCKED! Violation logged to auditable records & alerts.', 'error', 6000);
        setIsCheckModalOpen(false);
        fetchUsages();
      } else {
        addToast(err.response?.data?.error || 'Failed to record usage', 'error');
      }
    } finally {
      setRecording(false);
    }
  };

  const columns = [
    {
      header: 'Usage ID',
      accessor: 'id',
      className: 'font-mono text-xs font-semibold text-slate-800 w-44',
    },
    {
      header: 'Timestamp',
      accessor: 'usage_timestamp',
      className: 'font-mono text-xs text-slate-500',
      render: (row) => row.usage_timestamp?.replace('T', ' ').slice(0, 19),
    },
    {
      header: 'Asset ID',
      accessor: 'asset_id',
      className: 'font-mono font-bold text-blue-600',
    },
    {
      header: 'Batch ID',
      accessor: 'production_batch_id',
      className: 'font-semibold text-slate-800 text-xs',
    },
    {
      header: 'Production Line',
      accessor: 'production_line',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Operator',
      accessor: 'operator',
      className: 'text-xs text-slate-700',
    },
    {
      header: 'Decision',
      accessor: 'usage_decision',
      render: (row) => <DecisionBadge decision={row.usage_decision} />,
    },
    {
      header: 'Reason / Issue',
      render: (row) => (
        <div className="text-xs max-w-xs truncate text-slate-600">
          {row.issue_type ? (
            <span className="font-bold text-rose-600 mr-1">[{row.issue_type}]</span>
          ) : null}
          {row.notes}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Production Tool Usage & Safety Gate</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero-trust production validation: blocks uncalibrated or out-of-tolerance tools before parts are machined.
          </p>
        </div>

        <button
          onClick={() => {
            setValidationResult(null);
            setIsCheckModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all"
        >
          <ShieldCheck className="w-4 h-4" /> Check & Checkout Instrument
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={usages}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search usage ID, batch ID, or operator..."
        filterControls={
          <select
            value={decisionFilter}
            onChange={(e) => {
              setDecisionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="">All Decisions</option>
            <option value="ALLOWED">ALLOWED</option>
            <option value="BLOCKED">BLOCKED (Safety Violations)</option>
            <option value="ALLOWED_WITH_EXCEPTION">ALLOWED_WITH_EXCEPTION</option>
          </select>
        }
      />

      {/* Pre-flight Simulator Modal */}
      <Modal
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        title="Production Safety Gate — Tool Pre-Flight Check"
      >
        <form onSubmit={handleRecordUsageSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-slate-700">
            <strong>Production Safety Rule:</strong> Instruments must be active and in-calibration. Any attempt to use an expired or quarantined tool will be automatically blocked and logged to the permanent audit trail.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Asset ID *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. AST-000001"
                  value={checkForm.asset_id}
                  onChange={(e) => {
                    setCheckForm({ ...checkForm, asset_id: e.target.value });
                    setValidationResult(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleRunValidationCheck}
                  disabled={checking}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg shrink-0"
                >
                  {checking ? 'Checking...' : 'Pre-Check'}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Production Batch ID *</label>
              <input
                type="text"
                required
                value={checkForm.production_batch_id}
                onChange={(e) => setCheckForm({ ...checkForm, production_batch_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Production Line *</label>
              <select
                value={checkForm.production_line}
                onChange={(e) => setCheckForm({ ...checkForm, production_line: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Line 1 - CNC Milling">Line 1 - CNC Milling</option>
                <option value="Line 2 - Stamping">Line 2 - Stamping</option>
                <option value="Line 3 - Heat Treat">Line 3 - Heat Treat</option>
                <option value="Line 4 - Final Assembly">Line 4 - Final Assembly</option>
                <option value="Line 5 - Inspection Bay">Line 5 - Inspection Bay</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Operator Name *</label>
              <input
                type="text"
                required
                value={checkForm.operator}
                onChange={(e) => setCheckForm({ ...checkForm, operator: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Exception Approval ID (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank unless authorized by Quality Manager (e.g. EXC-2026-0042)"
                value={checkForm.exception_approval_id}
                onChange={(e) => {
                  setCheckForm({ ...checkForm, exception_approval_id: e.target.value });
                  setValidationResult(null);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Validation Pre-Check Result Card */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                validationResult.usage_decision === 'ALLOWED'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : validationResult.usage_decision === 'ALLOWED_WITH_EXCEPTION'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {validationResult.usage_decision === 'ALLOWED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold">
                    SYSTEM DECISION: {validationResult.usage_decision}
                  </strong>
                  {validationResult.issue_type && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-rose-200 text-rose-800">
                      {validationResult.issue_type}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs">{validationResult.reason}</p>
                <div className="mt-1 text-[11px] opacity-75">
                  Calibration Status: <strong>{validationResult.calibration_status_at_usage}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCheckModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recording}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {recording ? 'Processing...' : 'Authorize / Commit Usage'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
