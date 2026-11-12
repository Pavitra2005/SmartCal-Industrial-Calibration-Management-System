import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  Search,
  Download,
  Eye
} from 'lucide-react';
import api from '../api';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const CertificatesPage = () => {
  const { addToast } = useToast();
  const { permissions } = useAuth();

  const [certificates, setCertificates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pages, setPages] = useState(1);
  const [missingCount, setMissingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    calibration_id: '',
    asset_id: '',
    certificate_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
  });
  const [uploading, setUploading] = useState(false);

  // Inspect / Verify Modal
  const [selectedCert, setSelectedCert] = useState(null);
  const [certDetail, setCertDetail] = useState(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search,
        status: statusFilter,
      };
      const res = await api.get('/certificates', { params });
      setCertificates(res.data.certificates);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setMissingCount(res.data.missing_certificates_count || 0);
    } catch (err) {
      addToast('Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, addToast]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleOpenInspect = async (cert) => {
    setSelectedCert(cert);
    setIsInspectModalOpen(true);
    try {
      const res = await api.get(`/certificates/${cert.id}`);
      setCertDetail(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunVerify = async () => {
    if (!selectedCert) return;
    setVerifying(true);
    try {
      const res = await api.post(`/certificates/verify/${selectedCert.id}`);
      addToast(res.data.message, res.data.verification_status === 'VERIFIED' ? 'success' : 'error', 6000);
      handleOpenInspect(selectedCert);
      fetchCertificates();
    } catch (err) {
      addToast('Verification failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.calibration_id || !uploadForm.asset_id || !uploadForm.certificate_number) {
      addToast('Please fill all required certificate fields', 'warning');
      return;
    }
    setUploading(true);
    try {
      await api.post('/certificates/upload', uploadForm);
      addToast('Certificate uploaded and linked successfully!', 'success');
      setIsUploadModalOpen(false);
      fetchCertificates();
    } catch (err) {
      addToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      header: 'Certificate No.',
      accessor: 'certificate_number',
      className: 'font-semibold text-slate-900 w-44',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.certificate_number}</div>
          <div className="font-mono text-[10px] text-slate-400">{row.id}</div>
        </div>
      ),
    },
    {
      header: 'Referenced Asset',
      accessor: 'asset_id',
      render: (row) => (
        <div>
          <span className="font-mono font-semibold text-blue-600">{row.asset_id}</span>
          <div className="text-[11px] text-slate-400">{row.asset_name}</div>
        </div>
      ),
    },
    {
      header: 'Calibration Event',
      accessor: 'calibration_id',
      className: 'font-mono text-xs text-slate-600',
    },
    {
      header: 'Issue / Expiry',
      render: (row) => {
        const isExpired = new Date(row.expiry_date) < new Date();
        return (
          <div className="text-xs">
            <div>Issue: {row.issue_date}</div>
            <div className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-500'}>
              Exp: {row.expiry_date}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Vendor',
      accessor: 'supplier_name',
      className: 'text-xs text-slate-600',
    },
    {
      header: 'Approval',
      accessor: 'approval_status',
      render: (row) => <StatusBadge status={row.approval_status} />,
    },
    {
      header: 'Integrity Check',
      accessor: 'verification_status',
      render: (row) => <StatusBadge status={row.verification_status} />,
    },
    {
      header: 'Action',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenInspect(row)}
          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium rounded-md transition-colors flex items-center gap-1 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Calibration Certificate Repository</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ISO/IEC 17025 conformity verification, asset reference cross-checks, and missing document detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canManagePlans && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all"
            >
              <Upload className="w-4 h-4" /> Upload Certificate
            </button>
          )}
        </div>
      </div>

      {/* Warning banner if missing certificates exist */}
      {missingCount > 0 && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Compliance Notice:</strong> {missingCount} passed calibration events are currently missing uploaded certificate conformity files.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('missing')}
            className="text-xs font-bold text-amber-900 underline hover:text-amber-800"
          >
            Review Missing
          </button>
        </div>
      )}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={certificates}
        total={total}
        page={page}
        perPage={perPage}
        pages={pages}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search certificate number, asset ID, or calibration ID..."
        filterControls={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="">All Certificates</option>
            <option value="valid">Valid & Verified</option>
            <option value="expired">Expired</option>
            <option value="mismatch">Mismatched Asset Flagged</option>
            <option value="pending">Pending Approval</option>
          </select>
        }
      />

      {/* Upload Certificate Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload & Link Calibration Certificate"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-slate-600">
            <strong>Traceability Verification:</strong> The system validates that the Certificate Asset ID matches the Calibration Event's recorded asset. Mismatches are flagged immediately.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Calibration Event ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. CAL-AST-000001-2026-000001"
                value={uploadForm.calibration_id}
                onChange={(e) => setUploadForm({ ...uploadForm, calibration_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Certificate Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. CERT-2026-90412"
                value={uploadForm.certificate_number}
                onChange={(e) => setUploadForm({ ...uploadForm, certificate_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Referenced Asset ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. AST-000001"
                value={uploadForm.asset_id}
                onChange={(e) => setUploadForm({ ...uploadForm, asset_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={uploadForm.issue_date}
                onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Certificate PDF File</label>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">ISO 17025 Conformity Document</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Simulated direct upload: PDF format</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {uploading ? 'Processing...' : 'Upload & Verify'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Certificate Modal */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        title={`Certificate Conformity: ${selectedCert?.certificate_number}`}
      >
        {certDetail ? (
          <div className="space-y-4 text-xs">
            {/* Visual Certificate Card */}
            <div className="p-5 border-2 border-slate-800 rounded-xl bg-slate-50/50 font-serif relative">
              <div className="text-center pb-3 border-b border-slate-300">
                <h4 className="font-sans font-black text-sm text-slate-900 tracking-wider uppercase">
                  Certificate of Calibration
                </h4>
                <p className="font-sans text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                  ISO/IEC 17025:2017 Accredited Metrology Laboratory
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 font-sans text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Certificate Number</span>
                  <strong className="text-slate-900 font-mono text-sm">{certDetail.certificate_number}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Calibration Vendor</span>
                  <strong className="text-slate-900">{certDetail.supplier_name || 'Apex Metrology Services Corp'}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Target Asset Referenced</span>
                  <strong className="font-mono text-blue-700 text-sm">{certDetail.asset_id}</strong>
                  <div className="text-slate-500 text-[11px]">{certDetail.asset_name}</div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Associated Calibration Event</span>
                  <strong className="font-mono text-slate-700">{certDetail.calibration_id}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Issue Date</span>
                  <strong className="text-slate-800">{certDetail.issue_date}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Expiration Date</span>
                  <strong className="text-slate-800">{certDetail.expiry_date}</strong>
                </div>
              </div>

              {/* Mismatch Alert Box if Edge Case 3 */}
              {certDetail.verification_status === 'MISMATCH_FLAGGED' && (
                <div className="mt-3 p-3 bg-rose-100 border border-rose-300 rounded-lg text-rose-900 font-sans">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    COMPLIANCE VIOLATION: ASSET MISMATCH DETECTED (EDGE CASE 3)
                  </div>
                  <p className="text-[11px] mt-1 text-rose-800">
                    This certificate references asset <span className="font-mono font-bold">{certDetail.asset_id}</span>, but the calibration event record links to asset <span className="font-mono font-bold">{certDetail.calibration_details?.asset_id}</span>.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={handleRunVerify}
                disabled={verifying}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {verifying ? 'Running Cross-Check...' : 'Re-Run Integrity Verification'}
              </button>

              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">Loading certificate data...</div>
        )}
      </Modal>
    </div>
  );
};
