import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Scan,
  UserCheck,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const AlertsPage = () => {
  const { addToast } = useToast();
  const { permissions, currentRole } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pages, setPages] = useState(1);
  const [severitySummary, setSeveritySummary] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Resolve Alert Modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolving, setResolving] = useState(false);

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedPerson, setAssignedPerson] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        severity: severityFilter,
        status: statusFilter,
      };
      const res = await api.get('/alerts', { params });
      setAlerts(res.data.alerts);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setSeveritySummary(res.data.severity_summary);
    } catch (err) {
      addToast('Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, severityFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/alerts/scan');
      addToast(res.data.message, 'success');
      fetchAlerts();
    } catch (err) {
      addToast('Anomaly scan failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleOpenResolve = (alt) => {
    setSelectedAlert(alt);
    setResolutionRemarks('');
    setIsResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionRemarks.trim()) {
      addToast('Resolution remarks are required.', 'warning');
      return;
    }
    setResolving(true);
    try {
      await api.put(`/alerts/${selectedAlert.id}/resolve`, {
        resolution_remarks: resolutionRemarks,
      });
      addToast(`Alert ${selectedAlert.id} resolved successfully!`, 'success');
      setIsResolveModalOpen(false);
      fetchAlerts();
    } catch (err) {
      addToast('Failed to resolve alert', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleOpenAssign = (alt) => {
    setSelectedAlert(alt);
    setAssignedPerson(alt.assigned_person || currentRole.name);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/alerts/${selectedAlert.id}/assign`, {
        assigned_person: assignedPerson,
      });
      addToast(`Alert assigned to ${assignedPerson}!`, 'success');
      setIsAssignModalOpen(false);
      fetchAlerts();
    } catch (err) {
      addToast('Assignment failed', 'error');
    }
  };

  const columns = [
    {
      header: 'Alert ID',
      accessor: 'id',
      className: 'font-mono text-xs font-bold text-slate-800 w-36',
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (row) => <SeverityBadge severity={row.severity} />,
    },
    {
      header: 'Issue Category',
      accessor: 'issue_type',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.issue_type}</div>
          <span className="font-mono text-[10px] text-blue-600">Asset: {row.asset_id}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <div className="max-w-md text-xs text-slate-700">
          <p className="line-clamp-2">{row.description}</p>
          {row.resolution_remarks && (
            <p className="text-[11px] text-emerald-700 mt-1">
              ✓ <strong>Resolved:</strong> {row.resolution_remarks}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Owner',
      accessor: 'assigned_person',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Status',
      accessor: 'resolution_status',
      render: (row) => <StatusBadge status={row.resolution_status} />,
    },
    {
      header: 'Detected',
      accessor: 'detection_timestamp',
      className: 'text-xs text-slate-400 font-mono',
      render: (row) => row.detection_timestamp?.split('T')[0],
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.resolution_status !== 'RESOLVED' && permissions.isQualityEngineer && (
            <>
              <button
                onClick={() => handleOpenAssign(row)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
                title="Assign Lead"
              >
                Assign
              </button>
              <button
                onClick={() => handleOpenResolve(row)}
                className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-md transition-colors"
              >
                Resolve
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Alerts & Non-Conformance Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous metrology telemetry monitoring all 9 compliance exception types and anomalous deviations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all"
          >
            <Scan className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Running Anomaly Scan...' : 'Trigger Anomaly Scan'}
          </button>
        </div>
      </div>

      {/* Severity Filter Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setSeverityFilter(severityFilter === 'CRITICAL' ? '' : 'CRITICAL');
            setPage(1);
          }}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            severityFilter === 'CRITICAL' ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase">Critical</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {severitySummary.critical}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Safety & legal violations</div>
        </div>

        <div
          onClick={() => {
            setSeverityFilter(severityFilter === 'HIGH' ? '' : 'HIGH');
            setPage(1);
          }}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            severityFilter === 'HIGH' ? 'ring-2 ring-rose-400 bg-rose-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-500 uppercase">High</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {severitySummary.high}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Overdue calibrations & defects</div>
        </div>

        <div
          onClick={() => {
            setSeverityFilter(severityFilter === 'MEDIUM' ? '' : 'MEDIUM');
            setPage(1);
          }}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            severityFilter === 'MEDIUM' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">Medium</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {severitySummary.medium}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Due in 30 days notices</div>
        </div>

        <div
          onClick={() => {
            setSeverityFilter(severityFilter === 'LOW' ? '' : 'LOW');
            setPage(1);
          }}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            severityFilter === 'LOW' ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase">Low</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {severitySummary.low}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Routine operational updates</div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={alerts}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search alert ID, asset, or issue type..."
        filterControls={
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN Only</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </>
        }
      />

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Alert: ${selectedAlert?.id}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Issue</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
              <strong className="text-slate-900">{selectedAlert?.issue_type}:</strong> {selectedAlert?.description}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Resolution Remarks (Audit Trail) *</label>
            <textarea
              required
              rows="4"
              placeholder="Detail root cause analysis and resolution actions (e.g., 'Recalibrated tool with new NIST standard. Verified batches. Due date synchronized with plan.')..."
              value={resolutionRemarks}
              onChange={(e) => setResolutionRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResolveModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {resolving ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Alert Investigation: ${selectedAlert?.id}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Assigned Quality Engineer / Lead *</label>
            <input
              type="text"
              required
              value={assignedPerson}
              onChange={(e) => setAssignedPerson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Assign Alert
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
