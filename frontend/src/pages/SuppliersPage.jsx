import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
  ExternalLink,
  Edit2
} from 'lucide-react';
import api from '../api';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const SuppliersPage = () => {
  const { addToast } = useToast();
  const { permissions } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupId, setCurrentSupId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    calibration_services: '',
    accreditation_details: '',
    address: '',
    status: 'ACTIVE',
  });

  // Supplier Details Modal (associated events)
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      addToast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentSupId(null);
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      calibration_services: '',
      accreditation_details: 'ISO/IEC 17025:2017 Accredited',
      address: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setIsEditing(true);
    setCurrentSupId(sup.id);
    setFormData({
      name: sup.name,
      contact_name: sup.contact_name || '',
      contact_email: sup.contact_email || '',
      contact_phone: sup.contact_phone || '',
      calibration_services: sup.calibration_services || '',
      accreditation_details: sup.accreditation_details || '',
      address: sup.address || '',
      status: sup.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEvents = async (sup) => {
    try {
      const res = await api.get(`/suppliers/${sup.id}`);
      setSelectedSupplier(res.data);
      setEventsModalOpen(true);
    } catch (err) {
      addToast('Failed to load supplier events', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      addToast('Supplier name is required', 'warning');
      return;
    }
    try {
      if (isEditing) {
        await api.put(`/suppliers/${currentSupId}`, formData);
        addToast('Supplier updated successfully!', 'success');
      } else {
        await api.post('/suppliers', formData);
        addToast('Supplier registered successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      addToast('Failed to save supplier', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Calibration Vendor & Supplier Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ISO/IEC 17025 accredited calibration providers, factory OEM services, and standards traceability.
          </p>
        </div>

        {permissions.isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </button>
        )}
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((sup) => (
          <div key={sup.id} className="card-enterprise p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <StatusBadge status={sup.status} />
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1">{sup.name}</h3>
              <span className="font-mono text-[11px] text-blue-600 font-semibold">{sup.id}</span>

              {/* Accreditation */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[11px] mb-0.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" /> Accreditation:
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{sup.accreditation_details || 'ISO/IEC 17025:2017'}</p>
              </div>

              {/* Services */}
              <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                {sup.calibration_services || 'Dimensional, pressure, thermal and force calibration services.'}
              </p>

              {/* Contact Details */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                {sup.contact_name && (
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span>Contact:</span> {sup.contact_name}
                  </div>
                )}
                {sup.contact_email && (
                  <div className="flex items-center gap-2 text-slate-600 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {sup.contact_email}
                  </div>
                )}
                {sup.contact_phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {sup.contact_phone}
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {sup.address}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleOpenEvents(sup)}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Calibration Events ({sup.total_events || 0}) <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {permissions.isAdmin && (
                <button
                  onClick={() => handleOpenEdit(sup)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                  title="Edit Vendor"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Edit Vendor: ${currentSupId}` : 'Register New Calibration Supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Metrology Services Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Accreditation Details (ISO 17025 / NVLAP / A2LA)</label>
            <input
              type="text"
              placeholder="e.g. A2LA Certificate #2491.01 (Exp: 2028-06-30)"
              value={formData.accreditation_details}
              onChange={(e) => setFormData({ ...formData, accreditation_details: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Calibration Services Provided</label>
            <textarea
              rows="2"
              placeholder="Dimensional, pressure, thermal, electrical, mass metrology..."
              value={formData.calibration_services}
              onChange={(e) => setFormData({ ...formData, calibration_services: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Save Vendor Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Events Modal */}
      <Modal
        isOpen={eventsModalOpen}
        onClose={() => setEventsModalOpen(false)}
        title={`Calibration Events by ${selectedSupplier?.name}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <strong>Accreditation:</strong> {selectedSupplier?.accreditation_details}
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Event ID</th>
                  <th className="pb-2">Asset ID</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Technician</th>
                  <th className="pb-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSupplier?.associated_calibration_events?.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-mono text-blue-600 font-medium">{ev.id}</td>
                    <td className="py-2.5 font-mono text-slate-800">{ev.asset_id}</td>
                    <td className="py-2.5 text-slate-600">{ev.calibration_date}</td>
                    <td className="py-2.5 text-slate-600">{ev.technician}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        ev.pass_fail_result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ev.pass_fail_result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
