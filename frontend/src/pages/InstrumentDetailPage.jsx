import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  History,
  FileCheck,
  Wrench,
  Factory,
  AlertTriangle,
  Building,
  CheckCircle,
  FileText,
  ShieldCheck,
  Send
} from 'lucide-react';
import api from '../api';
import { StatusBadge, SeverityBadge, ResultBadge, DecisionBadge } from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const InstrumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { permissions } = useAuth();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calibrations'); // calibrations, certificates, work_orders, usage, alerts

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/instruments/${id}`);
      setAsset(res.data);
    } catch (err) {
      addToast(`Failed to load instrument ${id}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Loading instrument profile...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="card-enterprise p-12 text-center">
        <p className="text-slate-600 font-medium">Instrument {id} not found.</p>
        <button
          onClick={() => navigate('/instruments')}
          className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div>
        <button
          onClick={() => navigate('/instruments')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Instruments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {asset.id}
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{asset.name}</h2>
              <StatusBadge status={asset.current_status} />
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {asset.criticality_level} CRITICALITY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {asset.manufacturer} • Model: {asset.model_number} • Serial: <span className="font-mono text-slate-700">{asset.serial_number}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/calibrations?new_asset=${asset.id}`)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Perform Calibration
            </button>
            <button
              onClick={() => navigate('/schedule')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Reschedule
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Location & Dept</div>
          <div className="text-sm font-bold text-slate-900 mt-1">{asset.location}</div>
          <div className="text-xs text-slate-500">{asset.department}</div>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tolerance Limit</div>
          <div className="text-sm font-bold text-slate-900 mt-1">±{asset.tolerance_limit}</div>
          <div className="text-xs text-slate-500">Category: {asset.instrument_category}</div>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Last Calibrated</div>
          <div className="text-sm font-bold text-slate-900 mt-1">{asset.last_calibration_date || 'Never'}</div>
          <div className="text-xs text-slate-500">Interval: {asset.calibration_interval} {asset.interval_unit}</div>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Next Calibration Due</div>
          <div className={`text-sm font-bold mt-1 ${new Date(asset.next_calibration_due_date) < new Date() ? 'text-rose-600' : 'text-slate-900'}`}>
            {asset.next_calibration_due_date}
          </div>
          <div className="text-xs text-slate-500">Vendor: {asset.supplier_name || 'In-House'}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('calibrations')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'calibrations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Calibration Events ({asset.calibration_history?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'certificates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Certificates ({asset.certificates?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('work_orders')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'work_orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" /> Work Orders ({asset.work_orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'usage'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Factory className="w-4 h-4" /> Production Usage ({asset.production_usage_history?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Active Alerts ({asset.alerts?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card-enterprise p-5">
        {/* Tab 1: Calibrations */}
        {activeTab === 'calibrations' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Calibration Execution History</h3>
              <span className="text-xs text-slate-400">All historical passes, fails, and tolerance analyses</span>
            </div>

            {asset.calibration_history?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No calibration events on record.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="pb-2">Calibration ID</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Technician</th>
                      <th className="pb-2">Measured</th>
                      <th className="pb-2">Expected</th>
                      <th className="pb-2">Error</th>
                      <th className="pb-2">Tolerance</th>
                      <th className="pb-2">Result</th>
                      <th className="pb-2">Cert Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {asset.calibration_history.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 font-mono font-medium text-blue-600">{ev.id}</td>
                        <td className="py-2.5 text-slate-700">{ev.calibration_date}</td>
                        <td className="py-2.5 text-slate-600">{ev.technician}</td>
                        <td className="py-2.5 font-mono">{ev.measured_value}</td>
                        <td className="py-2.5 font-mono">{ev.expected_value}</td>
                        <td className={`py-2.5 font-mono font-bold ${Math.abs(ev.measurement_error) > ev.tolerance ? 'text-rose-600' : 'text-slate-800'}`}>
                          {ev.measurement_error > 0 ? `+${ev.measurement_error}` : ev.measurement_error}
                        </td>
                        <td className="py-2.5 font-mono text-slate-500">±{ev.tolerance}</td>
                        <td className="py-2.5"><ResultBadge result={ev.pass_fail_result} /></td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ev.certificate_status === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {ev.certificate_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Certificates */}
        {activeTab === 'certificates' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Calibration Certificates</h3>
              <span className="text-xs text-slate-400">ISO/IEC 17025 conformity documents</span>
            </div>

            {asset.certificates?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No certificates uploaded for this asset.</p>
            ) : (
              <div className="space-y-3">
                {asset.certificates.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{c.certificate_number}</div>
                        <div className="text-slate-500 mt-0.5">
                          Issued: <span className="text-slate-700 font-medium">{c.issue_date}</span> • Expiry: <span className="text-slate-700 font-medium">{c.expiry_date}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          File: {c.document_location} ({c.file_size_kb} KB)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                        c.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 font-bold'
                      }`}>
                        {c.verification_status}
                      </span>
                      <button
                        onClick={() => navigate('/certificates')}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        Inspect Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Work Orders */}
        {activeTab === 'work_orders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Maintenance & Corrective Work Orders</h3>
              <span className="text-xs text-slate-400">Calibration remediations and downtime tracking</span>
            </div>

            {asset.work_orders?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No maintenance work orders logged.</p>
            ) : (
              <div className="space-y-3">
                {asset.work_orders.map((wo) => (
                  <div key={wo.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-blue-600">{wo.id}</span>
                        <StatusBadge status={wo.status} />
                        <SeverityBadge severity={wo.priority} />
                      </div>
                      <p className="font-medium text-slate-800 text-sm">{wo.description}</p>
                      <div className="text-slate-500 mt-1">
                        Technician: <span className="text-slate-700 font-medium">{wo.assigned_technician || 'Unassigned'}</span> • Downtime: <span className="font-bold text-slate-800">{wo.downtime_hours} hrs</span>
                      </div>
                      {wo.corrective_action && (
                        <p className="text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                          <strong className="text-slate-700">Corrective Action:</strong> {wo.corrective_action}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-slate-400 text-[11px]">Impact Assessment</div>
                      <div className={`font-semibold mt-0.5 ${wo.impact_assessment_status === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600 font-bold'}`}>
                        {wo.impact_assessment_status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Production Usage */}
        {activeTab === 'usage' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Production Batches</h3>
              <span className="text-xs text-slate-400">Audit trail of production tool checks</span>
            </div>

            {asset.production_usage_history?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No production usage events recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Batch ID</th>
                      <th className="pb-2">Line</th>
                      <th className="pb-2">Operator</th>
                      <th className="pb-2">Decision</th>
                      <th className="pb-2">Issue / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {asset.production_usage_history.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-slate-500 font-mono">{u.usage_timestamp?.replace('T', ' ').slice(0, 19)}</td>
                        <td className="py-2.5 font-medium text-slate-800">{u.production_batch_id}</td>
                        <td className="py-2.5 text-slate-600">{u.production_line}</td>
                        <td className="py-2.5 text-slate-600">{u.operator}</td>
                        <td className="py-2.5"><DecisionBadge decision={u.usage_decision} /></td>
                        <td className="py-2.5 text-slate-500 max-w-xs truncate">{u.issue_type || u.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Active Alerts */}
        {activeTab === 'alerts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Active Asset Alerts & Non-Conformances</h3>
              <span className="text-xs text-slate-400">Quality exception tracking</span>
            </div>

            {asset.alerts?.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                ✓ No active alerts. Instrument is compliant.
              </div>
            ) : (
              <div className="space-y-3">
                {asset.alerts.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={a.severity} />
                        <span className="font-bold text-slate-900">{a.issue_type}</span>
                        <span className="text-slate-400">#{a.id}</span>
                      </div>
                      <p className="text-slate-700">{a.description}</p>
                    </div>

                    <button
                      onClick={() => navigate('/alerts')}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
