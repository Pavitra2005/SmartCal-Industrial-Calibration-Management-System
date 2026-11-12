import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { StatusBadge, SeverityBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const WorkOrdersPage = () => {
  const { addToast } = useToast();
  const { permissions, currentRole } = useAuth();

  const [workOrders, setWorkOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Status Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedWo, setSelectedWo] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    assigned_technician: '',
    downtime_hours: 0,
    corrective_action: '',
  });

  // Impact Assessment Modal (Edge Case 4)
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [assessing, setAssessing] = useState(false);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search,
        status: statusFilter,
        priority: priorityFilter,
      };
      const res = await api.get('/work-orders', { params });
      setWorkOrders(res.data.work_orders);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load work orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, priorityFilter, addToast]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleOpenUpdate = (wo) => {
    setSelectedWo(wo);
    setUpdateForm({
      status: wo.status,
      assigned_technician: wo.assigned_technician || '',
      downtime_hours: wo.downtime_hours || 0,
      corrective_action: wo.corrective_action || '',
    });
    setIsUpdateModalOpen(true);
  };

  const handleOpenAssessment = (wo) => {
    setSelectedWo(wo);
    setAssessmentNotes(wo.impact_assessment_notes || '');
    setIsAssessmentModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/work-orders/${selectedWo.id}`, updateForm);
      addToast(`Work Order ${selectedWo.id} updated!`, 'success');
      setIsUpdateModalOpen(false);
      fetchWorkOrders();
    } catch (err) {
      addToast('Failed to update work order', 'error');
    }
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!assessmentNotes.trim()) {
      addToast('Impact assessment engineering notes are required for signoff.', 'warning');
      return;
    }
    setAssessing(true);
    try {
      await api.post(`/work-orders/${selectedWo.id}/impact-assessment`, {
        impact_assessment_notes: assessmentNotes,
        impact_assessment_status: 'COMPLETED',
      });
      addToast(`Quality Impact Assessment signed off by ${currentRole.name}!`, 'success');
      setIsAssessmentModalOpen(false);
      fetchWorkOrders();
    } catch (err) {
      addToast('Assessment signoff failed', 'error');
    } finally {
      setAssessing(false);
    }
  };

  const columns = [
    {
      header: 'Work Order ID',
      accessor: 'id',
      className: 'font-mono font-bold text-blue-600 w-36',
    },
    {
      header: 'Asset & Event',
      render: (row) => (
        <div>
          <span className="font-mono font-semibold text-slate-800">{row.asset_id}</span>
          <div className="text-[11px] text-slate-400">
            {row.related_calibration_id ? `Linked: ${row.related_calibration_id}` : 'Routine PM'}
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <div className="max-w-xs">
          <div className="font-medium text-slate-900 truncate">{row.description}</div>
          <div className="text-[11px] text-slate-500">{row.work_order_type}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <SeverityBadge severity={row.priority} />,
    },
    {
      header: 'Downtime',
      accessor: 'downtime_hours',
      render: (row) => (
        <span className="font-mono font-medium text-slate-700">
          {row.downtime_hours} hrs
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Impact Assessment',
      render: (row) => {
        const isPending = row.impact_assessment_status === 'PENDING';
        return (
          <div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPending ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {row.impact_assessment_status}
            </span>
            {isPending && permissions.isQualityEngineer && (
              <button
                onClick={() => handleOpenAssessment(row)}
                className="block text-[10px] font-bold text-rose-600 hover:text-rose-800 underline mt-1"
              >
                Sign Off Review
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenUpdate(row)}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors"
          >
            Update
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance & Corrective Work Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated corrective action workflows, equipment quarantine, and batch impact assessments.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={workOrders}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search work order ID, asset, or technician..."
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
              <option value="OPEN">OPEN</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
            </select>
          </>
        }
      />

      {/* Update Work Order Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Work Order: ${selectedWo?.id}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="OPEN">OPEN</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Technician</label>
              <input
                type="text"
                value={updateForm.assigned_technician}
                onChange={(e) => setUpdateForm({ ...updateForm, assigned_technician: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Downtime (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={updateForm.downtime_hours}
                onChange={(e) => setUpdateForm({ ...updateForm, downtime_hours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Corrective Action Taken</label>
            <textarea
              rows="3"
              placeholder="e.g. Replaced worn carbide anvil, recalibrated zero offset, performed 5-point verification check..."
              value={updateForm.corrective_action}
              onChange={(e) => setUpdateForm({ ...updateForm, corrective_action: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Quality Impact Assessment Modal (Edge Case 4) */}
      <Modal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        title="Quality Impact Assessment Signoff"
      >
        <form onSubmit={handleAssessmentSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <strong>Mandatory ISO 17025 Requirement:</strong> When an instrument fails calibration, Quality Engineering must perform an impact assessment evaluating past production batches measured with this device to verify product conformity.
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Affected Instrument</label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800">
              {selectedWo?.asset_id} — {selectedWo?.description}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Engineering Impact Assessment Notes *</label>
            <textarea
              required
              rows="4"
              placeholder="Document your review of production lots: e.g., 'Inspected production lots 2026-A100 through A115. Component dimensions remained within product safety limits despite gauge drift. No customer recall required.'"
              value={assessmentNotes}
              onChange={(e) => setAssessmentNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-400">
              Signing Engineer: <strong className="text-slate-700">{currentRole.name}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
              >
                {assessing ? 'Signing...' : 'Approve & Complete Assessment'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
