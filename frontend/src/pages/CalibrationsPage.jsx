import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle, XCircle, Calculator, FileText, AlertTriangle, Search } from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { ResultBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const CalibrationsPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { permissions } = useAuth();

  const [calibrations, setCalibrations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState(searchParams.get('result') || '');

  // Record Calibration Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetAssetId, setTargetAssetId] = useState(searchParams.get('new_asset') || '');
  const [assetDetails, setAssetDetails] = useState(null);
  const [calForm, setCalForm] = useState({
    calibration_date: new Date().toISOString().split('T')[0],
    technician: 'Marcus Vance',
    reference_standard: 'NIST Standard Gage Block Set #88410',
    measured_value: '',
    expected_value: '25.000',
    tolerance: '0.020',
    calibration_remarks: '',
  });
  const [recording, setRecording] = useState(false);

  // Auto-calculated error and live evaluation preview
  const measured = parseFloat(calForm.measured_value);
  const expected = parseFloat(calForm.expected_value);
  const tol = parseFloat(calForm.tolerance);
  const hasValues = !isNaN(measured) && !isNaN(expected) && !isNaN(tol);
  const errorVal = hasValues ? (measured - expected).toFixed(5) : 0;
  const isPassLive = hasValues ? Math.abs(errorVal) <= tol : true;

  const fetchCalibrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search,
        result: resultFilter,
      };
      const res = await api.get('/calibrations', { params });
      setCalibrations(res.data.calibrations);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load calibration history', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, resultFilter, addToast]);

  useEffect(() => {
    fetchCalibrations();
  }, [fetchCalibrations]);

  // Open modal if new_asset query param exists
  useEffect(() => {
    if (searchParams.get('new_asset')) {
      setTargetAssetId(searchParams.get('new_asset'));
      setIsRecordModalOpen(true);
    }
  }, [searchParams]);

  // Load target asset details when ID changes in modal
  useEffect(() => {
    if (targetAssetId && targetAssetId.startsWith('AST-')) {
      api.get(`/instruments/${targetAssetId}`)
        .then((res) => {
          setAssetDetails(res.data);
          setCalForm((prev) => ({
            ...prev,
            tolerance: res.data.tolerance_limit.toString(),
            expected_value: '25.000',
          }));
        })
        .catch(() => setAssetDetails(null));
    }
  }, [targetAssetId]);

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!targetAssetId || !calForm.measured_value || !calForm.expected_value) {
      addToast('Please fill in measured and expected values.', 'warning');
      return;
    }
    setRecording(true);
    try {
      const payload = {
        asset_id: targetAssetId,
        calibration_date: calForm.calibration_date,
        technician: calForm.technician,
        reference_standard: calForm.reference_standard,
        measured_value: parseFloat(calForm.measured_value),
        expected_value: parseFloat(calForm.expected_value),
        tolerance: parseFloat(calForm.tolerance),
        calibration_remarks: calForm.calibration_remarks,
      };
      const res = await api.post('/calibrations', payload);
      const result = res.data.calibration_event.pass_fail_result;
      if (result === 'PASS') {
        addToast(`Calibration recorded: PASSED. Next due date calculated.`, 'success');
      } else {
        addToast(`Calibration FAILED: Out-of-tolerance. Corrective Work Order created and instrument locked OUT_OF_SERVICE!`, 'error', 6000);
      }
      setIsRecordModalOpen(false);
      fetchCalibrations();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to record calibration', 'error');
    } finally {
      setRecording(false);
    }
  };

  const columns = [
    {
      header: 'Calibration ID',
      accessor: 'id',
      className: 'font-mono text-xs font-semibold text-blue-600 w-48',
    },
    {
      header: 'Asset',
      accessor: 'asset_id',
      render: (row) => (
        <div>
          <span className="font-mono font-medium text-slate-800">{row.asset_id}</span>
          <div className="text-[11px] text-slate-400">{row.asset_name}</div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'calibration_date',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Technician',
      accessor: 'technician',
      className: 'text-xs text-slate-700 font-medium',
    },
    {
      header: 'Measured',
      accessor: 'measured_value',
      className: 'font-mono text-xs text-slate-800',
    },
    {
      header: 'Expected',
      accessor: 'expected_value',
      className: 'font-mono text-xs text-slate-500',
    },
    {
      header: 'Error / Tol',
      render: (row) => {
        const isExceeded = Math.abs(row.measurement_error) > row.tolerance;
        return (
          <div className="font-mono text-xs">
            <span className={isExceeded ? 'text-rose-600 font-bold' : 'text-slate-800 font-medium'}>
              {row.measurement_error > 0 ? `+${row.measurement_error}` : row.measurement_error}
            </span>
            <span className="text-slate-400 text-[10px] ml-1">/ ±{row.tolerance}</span>
          </div>
        );
      },
    },
    {
      header: 'Result',
      accessor: 'pass_fail_result',
      render: (row) => <ResultBadge result={row.pass_fail_result} />,
    },
    {
      header: 'Next Due',
      accessor: 'next_calibration_due_date',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Certificate',
      accessor: 'certificate_status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            row.certificate_status === 'VALID'
              ? 'bg-emerald-50 text-emerald-700'
              : row.certificate_status === 'MISSING'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.certificate_status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Calibration Execution & History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable metrological logs with automated tolerance comparison and failure-triggered corrective action.
          </p>
        </div>

        {permissions.canExecuteCalibration && (
          <button
            onClick={() => {
              setTargetAssetId('');
              setAssetDetails(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Execute Calibration
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={calibrations}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, asset, technician or standard..."
        filterControls={
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="">All Results</option>
            <option value="PASS">PASS Only</option>
            <option value="FAIL">FAIL Only</option>
          </select>
        }
      />

      {/* Execute Calibration Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Execute Metrology Calibration"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-slate-600">
            <strong>ISO 17025 Automated Evaluation:</strong> Entering measured value will automatically compute measurement error and evaluate tolerance limits. Failing events immediately create corrective Work Orders and lock the asset.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Asset ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. AST-000001"
                value={targetAssetId}
                onChange={(e) => setTargetAssetId(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
              {assetDetails && (
                <div className="mt-1 text-[11px] text-emerald-600 font-medium">
                  ✓ {assetDetails.name} (Tol: ±{assetDetails.tolerance_limit})
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Calibration Date *</label>
              <input
                type="date"
                required
                value={calForm.calibration_date}
                onChange={(e) => setCalForm({ ...calForm, calibration_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Technician / Metrologist *</label>
              <input
                type="text"
                required
                value={calForm.technician}
                onChange={(e) => setCalForm({ ...calForm, technician: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Reference Standard (NIST Traceable) *</label>
              <input
                type="text"
                required
                value={calForm.reference_standard}
                onChange={(e) => setCalForm({ ...calForm, reference_standard: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nominal Expected Value *</label>
              <input
                type="number"
                step="0.0001"
                required
                value={calForm.expected_value}
                onChange={(e) => setCalForm({ ...calForm, expected_value: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tolerance Limit (±) *</label>
              <input
                type="number"
                step="0.0001"
                required
                value={calForm.tolerance}
                onChange={(e) => setCalForm({ ...calForm, tolerance: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Actual Measured Value *</label>
              <input
                type="number"
                step="0.0001"
                required
                placeholder="Enter reading from reference standard..."
                value={calForm.measured_value}
                onChange={(e) => setCalForm({ ...calForm, measured_value: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-blue-400 rounded-lg font-mono text-base font-bold text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Real-time Calculation Indicator */}
          {hasValues && (
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              isPassLive ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <Calculator className={`w-5 h-5 ${isPassLive ? 'text-emerald-600' : 'text-rose-600'}`} />
                <div>
                  <div className="font-semibold text-slate-800">
                    Measurement Error: <span className="font-mono">{errorVal}</span> (Tolerance: ±{tol})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Formula: Error = Measured ({measured}) - Expected ({expected})
                  </div>
                </div>
              </div>

              <div>
                <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                  isPassLive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  PREDICTED: {isPassLive ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Calibration Remarks</label>
            <textarea
              rows="2"
              placeholder="Environmental conditions (temp, humidity), standard uncertainty notes..."
              value={calForm.calibration_remarks}
              onChange={(e) => setCalForm({ ...calForm, calibration_remarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recording}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {recording ? 'Recording Event...' : 'Commit Calibration Result'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
