import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExchangeAlt, FaShieldAlt, FaPlus, FaCheck, FaTimes, FaShippingFast, FaCheckCircle, FaTrash } from "react-icons/fa";

import Button from "../../components/Button";
import CustomInput from "../../components/CustomInput";
import Dropdown from "../../components/Dropdown";

const initialReplacements = [
  { id: 'REP-701', orderId: 'ORD-9843', serial: 'SN-TATA-540-00192', brand: 'Tata Solar', reason: 'Transit damage', status: 'Requested', date: '2026-05-18' },
  { id: 'REP-702', orderId: 'ORD-9845', serial: 'SN-WAA-550-9921', brand: 'Waaree', reason: 'Technical fault', status: 'Approved', date: '2026-05-19' },
  { id: 'REP-703', orderId: 'ORD-9842', serial: 'SN-SOL-50K-0021', brand: 'Solis', reason: 'Wrong product', status: 'Replaced', date: '2026-05-15' },
];

const brandOptions = [
  { value: 'Tata Solar', text: 'Tata Solar' },
  { value: 'Waaree', text: 'Waaree' },
  { value: 'Adani Solar', text: 'Adani Solar' },
  { value: 'Solis', text: 'Solis' }
];

const reasonOptions = [
  { value: 'Damaged', text: 'Damaged' },
  { value: 'Wrong product', text: 'Wrong product' },
  { value: 'Transit damage', text: 'Transit damage' },
  { value: 'Technical fault', text: 'Technical fault' },
  { value: 'Warranty replacement', text: 'Warranty replacement' }
];

export default function ProductReplacement() {
  const [replacements, setReplacements] = useState(initialReplacements);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [orderId, setOrderId] = useState('');
  const [serial, setSerial] = useState('');
  const [brand, setBrand] = useState('Tata Solar');
  const [reason, setReason] = useState('Damaged');
  const [warrantyChecked, setWarrantyChecked] = useState(false);
  const [warrantyValid, setWarrantyValid] = useState(null);

  const checkWarranty = () => {
    if (!serial.trim()) return;
    // Mock validation logic
    const isValid = serial.startsWith('SN-');
    setWarrantyValid(isValid);
    setWarrantyChecked(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId.trim() || !serial.trim() || !warrantyValid) {
      alert("Please validate serial warranty status before submitting!");
      return;
    }

    const newReq = {
      id: `REP-${704 + Math.floor(Math.random() * 90)}`,
      orderId,
      serial,
      brand,
      reason,
      status: 'Requested',
      date: new Date().toISOString().split('T')[0]
    };

    setReplacements([newReq, ...replacements]);
    setIsModalOpen(false);
    setOrderId('');
    setSerial('');
    setWarrantyChecked(false);
    setWarrantyValid(null);
  };

  const handleUpdateStatus = (id, nextStatus) => {
    setReplacements(replacements.map(r => r.id === id ? { ...r, status: nextStatus } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Product Replacement Workflow</h1>
          <p className="text-text-secondary">Validate warranty claims, process replacements against customer orders, and track pickup logistics</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          leftIcon={<FaPlus />}
        >
          New Replacement Request
        </Button>
      </div>

      {/* Replacement Claims Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border bg-bg/50">
          <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
            <FaExchangeAlt className="text-primary" />
            Active Claims & Return Statuses
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-bg text-text-secondary uppercase text-[10px] font-bold border-b border-border">
                <th className="p-4">Claim ID</th>
                <th className="p-4">Customer Order</th>
                <th className="p-4">Product Serial</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Logistics Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {replacements.map(r => (
                <tr key={r.id} className="hover:bg-primary/5 transition-all">
                  <td className="p-4 font-bold text-primary">{r.id}</td>
                  <td className="p-4 font-semibold text-text-primary">{r.orderId}</td>
                  <td className="p-4 font-mono text-xs text-text-secondary">{r.serial}</td>
                  <td className="p-4 text-text-secondary font-medium">{r.brand}</td>
                  <td className="p-4 text-text-secondary font-medium">{r.reason}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      r.status === 'Replaced' || r.status === 'Closed' ? 'bg-success/10 text-success border-success/20' :
                      r.status === 'Approved' || r.status === 'Material Picked' ? 'bg-primary/10 text-primary border-primary/20' :
                      'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex gap-2 justify-center">
                      {r.status === 'Requested' && (
                        <Button
                          onClick={() => handleUpdateStatus(r.id, 'Approved')}
                          variant="success"
                          size="sm"
                        >
                          Approve Claim
                        </Button>
                      )}
                      {r.status === 'Approved' && (
                        <Button
                          onClick={() => handleUpdateStatus(r.id, 'Material Picked')}
                          variant="primary"
                          size="sm"
                          leftIcon={<FaShippingFast />}
                        >
                          Pick Material
                        </Button>
                      )}
                      {r.status === 'Material Picked' && (
                        <Button
                          onClick={() => handleUpdateStatus(r.id, 'Out for Delivery')}
                          variant="warning"
                          size="sm"
                        >
                          Dispatch Replacement
                        </Button>
                      )}
                      {r.status === 'Out for Delivery' && (
                        <Button
                          onClick={() => handleUpdateStatus(r.id, 'Replaced')}
                          variant="success"
                          size="sm"
                          leftIcon={<FaCheckCircle />}
                        >
                          Confirm Replacement
                        </Button>
                      )}
                      {r.status === 'Replaced' && (
                        <Button
                          onClick={() => handleUpdateStatus(r.id, 'Closed')}
                          variant="secondary"
                          size="sm"
                        >
                          Close Ticket
                        </Button>
                      )}
                      {r.status === 'Closed' && (
                        <span className="text-xs text-text-muted">Ticket Closed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replacement Request Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <FaExchangeAlt className="text-primary" />
                  Request Replacement
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <CustomInput
                  label="Customer Order No"
                  placeholder="e.g. ORD-9843"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Dropdown
                    label="Brand"
                    value={brand}
                    onChange={(val) => setBrand(val)}
                    options={brandOptions}
                    className="w-full"
                  />
                  <Dropdown
                    label="Replacement Reason"
                    value={reason}
                    onChange={(val) => setReason(val)}
                    options={reasonOptions}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-2">Product Serial No</label>
                  <div className="flex items-end gap-2">
                    <CustomInput
                      placeholder="e.g. SN-TATA-540-0012"
                      value={serial}
                      onChange={(e) => {
                        setSerial(e.target.value);
                        setWarrantyChecked(false);
                        setWarrantyValid(null);
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={checkWarranty}
                      variant="outline"
                      size="md"
                      leftIcon={<FaShieldAlt />}
                      className="shrink-0"
                    >
                      Verify
                    </Button>
                  </div>
                  {warrantyChecked && (
                    <div className={`mt-2 text-xs font-semibold ${warrantyValid ? 'text-success' : 'text-danger'}`}>
                      {warrantyValid ? '✅ Warranty Verified: Serial Number is valid and covered.' : '❌ Invalid Serial Code: Serial must start with "SN-".'}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!warrantyValid}
                variant="primary"
                fullWidth
                leftIcon={<FaExchangeAlt />}
              >
                Submit Replacement Claim
              </Button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
