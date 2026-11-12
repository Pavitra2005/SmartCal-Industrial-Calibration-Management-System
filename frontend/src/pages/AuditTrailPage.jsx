import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Filter, ShieldCheck, Eye, Terminal } from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

export const AuditTrailPage = () => {
  const { addToast } = useToast();

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [action, setAction] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Diff Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        entity_type: entityType,
        entity_id: entityId,
        action: action,
        user: userSearch,
      };
      const res = await api.get('/audit', { params });
      setRecords(res.data.audit_records);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load audit records', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, entityType, entityId, action, userSearch, addToast]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const handleOpenDiff = (rec) => {
    setSelectedRecord(rec);
    setIsDiffModalOpen(true);
  };

  const columns = [
    {
      header: 'Audit ID',
      accessor: 'audit_id',
      className: 'font-mono text-xs text-slate-500 w-36',
    },
    {
      header: 'Entity Type & ID',
      render: (row) => (
        <div>
          <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-bold mr-1.5">
            {row.entity_type}
          </span>
          <span className="font-mono text-xs font-semibold text-blue-600">{row.entity_id}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs px-2 py-0.5 rounded-md bg-blue-50/70 text-blue-800 border border-blue-200">
          {row.action}
        </span>
      ),
    },
    {
      header: 'User / Actor',
      accessor: 'user',
      className: 'text-xs text-slate-700 font-medium',
    },
    {
      header: 'Reason / Operation Note',
      accessor: 'reason',
      render: (row) => (
        <div className="max-w-md text-xs text-slate-600 truncate">
          {row.reason || 'Standard system action'}
        </div>
      ),
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      className: 'font-mono text-xs text-slate-400',
      render: (row) => row.timestamp?.replace('T', ' ').slice(0, 19),
    },
    {
      header: 'Payload',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenDiff(row)}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Inspect State Snapshot"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Immutable Compliance Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically chronological records of all equipment calibrations, status transitions, usage checks, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tamper-Proof Audit Active
          </span>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={records}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={entityId}
        onSearchChange={setEntityId}
        searchPlaceholder="Filter by Entity ID (e.g. AST-000001)..."
        filterControls={
          <>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="">All Entity Types</option>
              <option value="ASSET">ASSET</option>
              <option value="CALIBRATION">CALIBRATION</option>
              <option value="CERTIFICATE">CERTIFICATE</option>
              <option value="WORK_ORDER">WORK_ORDER</option>
              <option value="PRODUCTION_USE">PRODUCTION_USE</option>
              <option value="ALERT">ALERT</option>
              <option value="CALIBRATION_PLAN">CALIBRATION_PLAN</option>
            </select>

            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="CALIBRATE">CALIBRATE</option>
              <option value="RESCHEDULE">RESCHEDULE</option>
              <option value="RECORD_USAGE">RECORD_USAGE</option>
              <option value="RESOLVE_ALERT">RESOLVE_ALERT</option>
            </select>
          </>
        }
      />

      {/* State Snapshot Diff Modal */}
      <Modal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        title={`Audit Snapshot: ${selectedRecord?.audit_id}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg font-sans">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Entity</span>
              <strong className="text-slate-800">{selectedRecord?.entity_type} ({selectedRecord?.entity_id})</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Action by</span>
              <strong className="text-slate-800">{selectedRecord?.user} @ {selectedRecord?.timestamp?.replace('T', ' ').slice(0, 19)}</strong>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-700 mb-1 font-sans">Operation Reason / Justification:</div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-sans">
              {selectedRecord?.reason || 'None specified'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-700 mb-1 font-sans">Previous State:</div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[11px] max-h-64">
                {selectedRecord?.previous_value ? (
                  JSON.stringify(JSON.parse(selectedRecord.previous_value), null, 2)
                ) : (
                  '// No prior state (Entity Creation)'
                )}
              </pre>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-700 mb-1 font-sans">New State:</div>
              <pre className="p-3 bg-slate-900 text-blue-300 rounded-lg overflow-x-auto text-[11px] max-h-64">
                {selectedRecord?.new_value ? (
                  JSON.stringify(JSON.parse(selectedRecord.new_value), null, 2)
                ) : (
                  '// Null'
                )}
              </pre>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
