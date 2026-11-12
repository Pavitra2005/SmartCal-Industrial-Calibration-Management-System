import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  FilePlus,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import api from '../api';
import { StatusBadge, SeverityBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const SchedulePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { permissions } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overdue'); // overdue, this_week, this_month, upcoming, plans

  // Reschedule Modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // New Plan Modal
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    plan_name: '',
    instrument_type_id: 1,
    calibration_interval: 6,
    interval_unit: 'months',
    tolerance_limits: 0.02,
    responsible_department: 'Quality Metrology Lab',
  });
  const [types, setTypes] = useState([]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const [schedRes, plansRes, typesRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/schedule/plans'),
        api.get('/instruments/types'),
      ]);
      setScheduleData(schedRes.data);
      setPlans(plansRes.data);
      setTypes(typesRes.data);
    } catch (err) {
      addToast('Failed to load calibration schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOpenReschedule = (asset) => {
    setSelectedAsset(asset);
    setNewDueDate(asset.next_due_date || '');
    setRescheduleReason('');
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !newDueDate || !rescheduleReason) {
      addToast('Please provide a new due date and formal justification reason.', 'warning');
      return;
    }
    setRescheduling(true);
    try {
      await api.post('/schedule/reschedule', {
        asset_id: selectedAsset.asset_id,
        new_due_date: newDueDate,
        reason: rescheduleReason,
      });
      addToast(`Asset ${selectedAsset.asset_id} rescheduled to ${newDueDate}`, 'success');
      setIsRescheduleOpen(false);
      fetchSchedule();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to reschedule', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schedule/plans', newPlan);
      addToast('Calibration Plan created successfully!', 'success');
      setIsNewPlanOpen(false);
      fetchSchedule();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create plan', 'error');
    }
  };

  const currentList =
    activeTab === 'overdue'
      ? scheduleData?.overdue || []
      : activeTab === 'this_week'
      ? scheduleData?.due_this_week || []
      : activeTab === 'this_month'
      ? scheduleData?.due_this_month || []
      : scheduleData?.upcoming || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Calibration Planning & Scheduling</h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic interval calculations based on approved ISO 17025 metrology protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canManagePlans && (
            <button
              onClick={() => setIsNewPlanOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <FilePlus className="w-4 h-4" /> Create Calibration Protocol
            </button>
          )}
          <button
            onClick={fetchSchedule}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Breakdown Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('overdue')}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            activeTab === 'overdue' ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">
            {scheduleData?.summary?.overdue_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Instruments needing immediate calibration</div>
        </div>

        <div
          onClick={() => setActiveTab('this_week')}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            activeTab === 'this_week' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">Due This Week</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {scheduleData?.summary?.due_this_week_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Expiring within 7 days</div>
        </div>

        <div
          onClick={() => setActiveTab('this_month')}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            activeTab === 'this_month' ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase">Due This Month</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {scheduleData?.summary?.due_this_month_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Current month queue</div>
        </div>

        <div
          onClick={() => setActiveTab('plans')}
          className={`card-enterprise p-4 cursor-pointer transition-all ${
            activeTab === 'plans' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase">Calibration Plans</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">
            {plans.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active interval protocols</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="card-enterprise overflow-hidden">
        {activeTab !== 'plans' ? (
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 capitalize">
                {activeTab.replace('_', ' ')} Calibrations Queue ({currentList.length})
              </h3>
              <span className="text-xs text-slate-400">Click any instrument to view profile</span>
            </div>

            {currentList.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No instruments in this schedule queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Asset ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Next Due Date</th>
                      <th className="px-4 py-3">Interval</th>
                      <th className="px-4 py-3">Vendor / Standard</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentList.map((item) => (
                      <tr
                        key={item.asset_id}
                        onClick={() => navigate(`/instruments/${item.asset_id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{item.asset_id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.asset_name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.department}</td>
                        <td className="px-4 py-3 text-slate-600">{item.location}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              new Date(item.next_due_date) < new Date()
                                ? 'font-bold text-rose-600'
                                : 'font-medium text-slate-800'
                            }
                          >
                            {item.next_due_date}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.interval}</td>
                        <td className="px-4 py-3 text-slate-600">{item.supplier_name}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/calibrations?new_asset=${item.asset_id}`)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-md transition-colors"
                            >
                              Calibrate
                            </button>
                            <button
                              onClick={() => handleOpenReschedule(item)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              Reschedule
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Calibration Plans Tab */
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Standard Calibration Protocols & Rules</h3>
              <span className="text-xs text-slate-400">Master interval rules governing instrument fleets</span>
            </div>

            <div className="divide-y divide-slate-100">
              {plans.map((p) => (
                <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-blue-600">{p.id}</span>
                      <StatusBadge status={p.plan_status} />
                      <span className="font-bold text-slate-900 text-sm">{p.plan_name}</span>
                    </div>
                    <p className="text-slate-600">
                      Category: <span className="font-medium text-slate-800">{p.instrument_type_name}</span> • Department: <span className="font-medium text-slate-800">{p.responsible_department}</span>
                    </p>
                    <div className="text-slate-500 mt-1 flex items-center gap-4">
                      <span>Interval: <strong className="text-slate-800">{p.calibration_interval} {p.interval_unit}</strong></span>
                      <span>Tolerance: <strong className="text-slate-800">±{p.tolerance_limits}</strong></span>
                      <span>Calculation: <strong className="text-slate-800">{p.due_date_calc_method}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400">Effective Since</span>
                    <div className="font-mono text-slate-700 font-semibold">{p.effective_start_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title={`Reschedule Calibration for ${selectedAsset?.asset_id}`}
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Instrument</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
              {selectedAsset?.asset_name} ({selectedAsset?.asset_id})
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Current Due Date</label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono">
              {selectedAsset?.next_due_date}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">New Calibration Due Date *</label>
            <input
              type="date"
              required
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Formal Justification Reason (Audit Trail) *</label>
            <textarea
              required
              rows="3"
              placeholder="Engineering reason (e.g. tool currently engaged in critical aerospace batch, scheduled for maintenance overhaul next Tuesday)..."
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduling}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {rescheduling ? 'Recording...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Plan Modal */}
      <Modal
        isOpen={isNewPlanOpen}
        onClose={() => setIsNewPlanOpen(false)}
        title="Create Calibration Plan Protocol"
      >
        <form onSubmit={handleCreatePlanSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Plan / Protocol Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Standard Digital Micrometer Calibration Procedure"
              value={newPlan.plan_name}
              onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Instrument Category *</label>
              <select
                value={newPlan.instrument_type_id}
                onChange={(e) => setNewPlan({ ...newPlan, instrument_type_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Responsible Department</label>
              <input
                type="text"
                value={newPlan.responsible_department}
                onChange={(e) => setNewPlan({ ...newPlan, responsible_department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Calibration Interval (Months)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={newPlan.calibration_interval}
                onChange={(e) => setNewPlan({ ...newPlan, calibration_interval: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tolerance Limit (±)</label>
              <input
                type="number"
                step="0.001"
                value={newPlan.tolerance_limits}
                onChange={(e) => setNewPlan({ ...newPlan, tolerance_limits: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewPlanOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Save Protocol
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
