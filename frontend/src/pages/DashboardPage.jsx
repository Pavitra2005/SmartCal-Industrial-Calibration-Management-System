import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileCheck,
  Wrench,
  AlertOctagon,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Building,
  Calendar
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import api from '../api';
import { StatCard } from '../components/StatCard';
import { StatusBadge, SeverityBadge, ResultBadge } from '../components/Badge';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingCalibrations, setUpcomingCalibrations] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, actRes, upRes, alertRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent-activities'),
        api.get('/dashboard/upcoming-calibrations'),
        api.get('/dashboard/critical-alerts'),
      ]);

      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setRecentActivities(actRes.data);
      setUpcomingCalibrations(upRes.data);
      setCriticalAlerts(alertRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Plant Calibration Intelligence</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time compliance monitoring, metrological traceability, and production safety telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/calibrations')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-all"
          >
            Record Calibration
          </button>
        </div>
      </div>

      {/* 8 Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Instruments"
          value={stats?.total_instruments ?? '...'}
          subtitle="Registered assets"
          icon={Gauge}
          color="blue"
          onClick={() => navigate('/instruments')}
        />
        <StatCard
          title="Active Instruments"
          value={stats?.active_instruments ?? '...'}
          subtitle="Ready in production"
          icon={CheckCircle2}
          color="green"
          onClick={() => navigate('/instruments?status=ACTIVE')}
        />
        <StatCard
          title="Overdue Instruments"
          value={stats?.overdue_instruments ?? '...'}
          subtitle="Expired calibration"
          icon={AlertTriangle}
          color="red"
          alert={(stats?.overdue_instruments || 0) > 0}
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          title="Due In 30 Days"
          value={stats?.due_within_30_days ?? '...'}
          subtitle="Calibration approaching"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/schedule')}
        />
        <StatCard
          title="Failed Calibrations"
          value={stats?.failed_calibrations ?? '...'}
          subtitle="Out-of-tolerance events"
          icon={XCircle}
          color="red"
          onClick={() => navigate('/calibrations?result=FAIL')}
        />
        <StatCard
          title="Valid Certificates"
          value={stats?.valid_certificates ?? '...'}
          subtitle="ISO/IEC 17025 compliant"
          icon={FileCheck}
          color="green"
          onClick={() => navigate('/certificates')}
        />
        <StatCard
          title="Open Work Orders"
          value={stats?.open_work_orders ?? '...'}
          subtitle="Active maintenance jobs"
          icon={Wrench}
          color="indigo"
          onClick={() => navigate('/work-orders')}
        />
        <StatCard
          title="Active Alerts"
          value={stats?.active_alerts ?? '...'}
          subtitle="Exceptions requiring action"
          icon={AlertOctagon}
          color="red"
          alert={(stats?.active_alerts || 0) > 0}
          onClick={() => navigate('/alerts')}
        />
      </div>

      {/* Visual Analytics Grid (6 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Calibration Pass/Fail Distribution */}
        <div className="card-enterprise p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Calibration Pass / Fail</h3>
            <span className="text-xs text-slate-400">Tolerance checks</span>
          </div>
          <div className="h-56">
            {charts?.pass_fail_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.pass_fail_distribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.pass_fail_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 2: Monthly Calibration Trends */}
        <div className="card-enterprise p-5 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Monthly Calibration Volume & Pass Rate</h3>
            <span className="text-xs text-slate-400">Historical performance</span>
          </div>
          <div className="h-56">
            {charts?.monthly_trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="passed" name="Passed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 3: Instrument Status Distribution */}
        <div className="card-enterprise p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Fleet Health Status</h3>
            <span className="text-xs text-slate-400">Current states</span>
          </div>
          <div className="h-56">
            {charts?.instrument_status_distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.instrument_status_distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                  >
                    {charts.instrument_status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 4: Overdue Instruments by Instrument Type */}
        <div className="card-enterprise p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Overdue by Category</h3>
            <span className="text-xs text-slate-400">Type breakdown</span>
          </div>
          <div className="h-56">
            {charts?.overdue_by_type ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.overdue_by_type} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="type" stroke="#94a3b8" fontSize={10} width={70} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" name="Overdue Count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 5: Production Usage Violations */}
        <div className="card-enterprise p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Usage Violations by Line</h3>
            <span className="text-xs text-slate-400">Blocked attempts</span>
          </div>
          <div className="h-56">
            {charts?.production_usage_violations && charts.production_usage_violations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.production_usage_violations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="line" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="violations" name="Violations" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active violations detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row: Critical Alerts & Upcoming Calibrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts Section */}
        <div className="card-enterprise p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Critical Compliance Alerts</h3>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View all ({stats?.active_alerts || 0}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-72">
            {criticalAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No critical alerts at this time. All systems operating within quality bounds.
              </div>
            ) : (
              criticalAlerts.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => navigate('/alerts')}
                  className="p-3 rounded-lg border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors cursor-pointer flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={alt.severity} />
                      <span className="font-semibold text-slate-900">{alt.issue_type}</span>
                      <span className="text-[11px] text-slate-400">#{alt.id}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{alt.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {alt.detection_timestamp?.split('T')[0]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Calibration Schedule Section */}
        <div className="card-enterprise p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Upcoming Calibrations</h3>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Open schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Asset ID</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2 text-right">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingCalibrations.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/instruments/${a.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-mono font-medium text-blue-600">{a.id}</td>
                    <td className="py-2.5 font-medium text-slate-800">{a.name}</td>
                    <td className="py-2.5 text-slate-600">{a.next_calibration_due_date}</td>
                    <td className="py-2.5 text-right text-slate-500">{a.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card-enterprise p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Recent System Activity & Audit Trail</h3>
          </div>
          <button
            onClick={() => navigate('/audit-trail')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            Full audit log <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                <th className="pb-2">Audit ID</th>
                <th className="pb-2">Entity</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">User / Role</th>
                <th className="pb-2">Reason / Details</th>
                <th className="pb-2 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-mono text-slate-500">{act.audit_id}</td>
                  <td className="py-2.5 font-medium text-slate-800">
                    <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 mr-1.5 text-[10px]">
                      {act.entity_type}
                    </span>
                    {act.entity_id}
                  </td>
                  <td className="py-2.5 font-semibold text-blue-700">{act.action}</td>
                  <td className="py-2.5 text-slate-600">{act.user}</td>
                  <td className="py-2.5 text-slate-500 max-w-xs truncate">{act.reason || 'Routine operation'}</td>
                  <td className="py-2.5 text-right text-slate-400 font-mono">
                    {act.timestamp?.replace('T', ' ').slice(0, 19)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
