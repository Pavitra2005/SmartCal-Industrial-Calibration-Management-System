import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Database,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  Gauge
} from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

export const ReportsPage = () => {
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/reports/summary')
      .then((res) => setSummary(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = (entity) => {
    window.open(`/api/reports/export/csv?entity=${entity}`, '_blank');
    addToast(`Exporting ${entity}.csv...`, 'info');
  };

  const handleExportSql = () => {
    window.open('/api/reports/export/sql', '_blank');
    addToast('Generating MySQL SQL Seed dump...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Data Exports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational quality KPIs, ISO 17025 conformity metrics, and relational database exports.
          </p>
        </div>

        <button
          onClick={handleExportSql}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          Export MySQL Seed Dump (.sql)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Calibration Pass Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary?.calibration_quality?.pass_rate ?? '...'}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary?.calibration_quality?.passed} of {summary?.calibration_quality?.total_events} passed
          </p>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Certificate Compliance</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {summary?.certificates?.compliance_rate ?? '...'}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary?.certificates?.verified} of {summary?.certificates?.total_issued} verified
          </p>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Work Order Resolution</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {summary?.maintenance_work_orders?.resolution_rate ?? '...'}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary?.maintenance_work_orders?.completed} completed
          </p>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Fleet Utilization</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {summary?.instruments?.utilization_rate ?? '...'}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary?.instruments?.active} active tools
          </p>
        </div>

        <div className="card-enterprise p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Blocked Unsafe Uses</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {summary?.production_safety?.blocked_unsafe_attempts ?? '...'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Safety violations stopped</p>
        </div>
      </div>

      {/* Export Hub */}
      <div className="card-enterprise p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Data Export Center (CSV / Spreadsheet)</h3>
            <p className="text-xs text-slate-500">Download clean, auditable CSV datasets for offline analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'instruments', label: 'Instruments Fleet', desc: 'All assets, locations, tolerances, serials' },
            { id: 'calibrations', label: 'Calibration Events', desc: 'Measured values, errors, pass/fail logs' },
            { id: 'certificates', label: 'Certificates Registry', desc: 'ISO 17025 document locations & expiries' },
            { id: 'work_orders', label: 'Work Orders & Downtime', desc: 'Maintenance records, corrective actions' },
            { id: 'production_usage', label: 'Production Usage Logs', desc: 'Tool scans, decisions, batch tracking' },
            { id: 'alerts', label: 'Alerts & Non-Conformances', desc: 'Historical quality alarms & resolutions' },
            { id: 'suppliers', label: 'Vendors & Metrology Labs', desc: 'Accreditations, addresses, contacts' },
            { id: 'audit_trail', label: 'Audit Trail Records', desc: 'Chronological JSON state mutations' },
          ].map((ent) => (
            <div key={ent.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <strong className="text-xs font-bold text-slate-900">{ent.label}</strong>
                <p className="text-[11px] text-slate-500 mt-1">{ent.desc}</p>
              </div>
              <button
                onClick={() => handleExportCsv(ent.id)}
                className="mt-4 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
