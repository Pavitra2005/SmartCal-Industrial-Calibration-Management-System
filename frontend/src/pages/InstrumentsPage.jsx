import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Eye, Edit2, Gauge, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const InstrumentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { permissions } = useAuth();

  const [instruments, setInstruments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [filterMeta, setFilterMeta] = useState({ locations: [], departments: [], statuses: [], types: [], suppliers: [] });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    instrument_type_id: '',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    description: '',
    location: '',
    department: '',
    criticality_level: 'MEDIUM',
    calibration_interval: 6,
    interval_unit: 'months',
    tolerance_limit: 0.05,
    installation_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search,
        status: statusFilter,
        type_id: typeFilter,
        department: deptFilter,
      };
      const res = await api.get('/instruments', { params });
      setInstruments(res.data.instruments);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      addToast('Failed to fetch instruments', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, typeFilter, deptFilter, addToast]);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  useEffect(() => {
    api.get('/instruments/filters/metadata')
      .then((res) => setFilterMeta(res.data))
      .catch((e) => console.error(e));
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.serial_number || !formData.instrument_type_id) {
      addToast('Please fill out all required fields.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/instruments', formData);
      addToast(`Instrument ${res.data.id} registered successfully!`, 'success');
      setIsAddModalOpen(false);
      fetchInstruments();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create instrument';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Asset ID',
      accessor: 'id',
      className: 'font-mono font-semibold text-blue-600 w-32',
      render: (row) => (
        <span className="hover:underline flex items-center gap-1">
          {row.id}
        </span>
      ),
    },
    {
      header: 'Instrument Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-400">{row.manufacturer} • {row.model_number}</div>
        </div>
      ),
    },
    {
      header: 'Serial No.',
      accessor: 'serial_number',
      className: 'font-mono text-xs text-slate-600',
    },
    {
      header: 'Category',
      accessor: 'instrument_type_name',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Department',
      accessor: 'department',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Next Due',
      accessor: 'next_calibration_due_date',
      render: (row) => {
        const isOverdue = new Date(row.next_calibration_due_date) < new Date();
        return (
          <div className="text-xs">
            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
              {row.next_calibration_due_date}
            </span>
            <div className="text-[10px] text-slate-400">Int: {row.calibration_interval} mo</div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'current_status',
      render: (row) => <StatusBadge status={row.current_status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/instruments/${row.id}`)}
            className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Instrument Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage calibrated tools, inspection equipment, tolerances, and metrology master data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Instrument
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={instruments}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, name, serial or manufacturer..."
        onRowClick={(row) => navigate(`/instruments/${row.id}`)}
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
              {filterMeta.statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="">All Types</option>
              {filterMeta.types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {filterMeta.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </>
        }
      />

      {/* Add Instrument Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Calibrated Instrument"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Instrument Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mitutoyo Digital Caliper 150mm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Instrument Type *</label>
              <select
                required
                value={formData.instrument_type_id}
                onChange={(e) => setFormData({ ...formData, instrument_type_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select Category...</option>
                {filterMeta.types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mitutoyo / Fluke"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Model Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 500-196-30"
                value={formData.model_number}
                onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Serial Number (Unique) *</label>
              <input
                type="text"
                required
                placeholder="e.g. SN-2026-CAL-0891"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Building A - Cleanroom 101"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                placeholder="e.g. Quality Metrology Lab"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Criticality Level</label>
              <select
                value={formData.criticality_level}
                onChange={(e) => setFormData({ ...formData, criticality_level: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Calibration Interval (Months)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.calibration_interval}
                onChange={(e) => setFormData({ ...formData, calibration_interval: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tolerance Limit (±)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.tolerance_limit}
                onChange={(e) => setFormData({ ...formData, tolerance_limit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Installation Date</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Calibration Vendor</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="">Select Vendor...</option>
                {filterMeta.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description & Engineering Notes</label>
            <textarea
              rows="2"
              placeholder="Operational context, mounting details, special metrology considerations..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {submitting ? 'Registering...' : 'Save Instrument'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
