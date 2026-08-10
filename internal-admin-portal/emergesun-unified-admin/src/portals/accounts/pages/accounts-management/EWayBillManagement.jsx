import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaExchangeAlt, FaFilePdf, FaCheckCircle, FaExclamationTriangle, 
  FaPlus, FaSearch, FaWarehouse, FaTruck, FaRegFileAlt, FaLock
} from 'react-icons/fa';

const initialTransfers = [
  {
    transferId: "TRN-9091",
    origin: "Jaipur Main Hub (Master)",
    destination: "Sanganer Sub-Warehouse",
    dateSent: "2026-06-14",
    items: "Solar Panels - 100 Pcs",
    complianceStatus: "Compliant",
    ewayBillNo: "EWB-449102"
  },
  {
    transferId: "TRN-9092",
    origin: "Ahmedabad GIDC Hub (Master)",
    destination: "Jodhpur Local Branch",
    dateSent: "2026-06-15",
    items: "ACDC Cables - 20 Coils",
    complianceStatus: "Awaiting EWB",
    ewayBillNo: ""
  }
];

export default function EWayBillManagement() {
  const { selectedScope } = useSelector((state) => state.user_slice);
  const clusterName = selectedScope?.clusterName || "Selected Cluster";

  const [activeTab, setActiveTab] = useState('compliance'); // 'compliance', 'generate'
  const [transfers, setTransfers] = useState(initialTransfers);

  // Form states
  const [form, setForm] = useState({
    transporterName: '',
    vehicleNo: '',
    fromWarehouse: 'Jaipur Main Hub (Master)',
    toWarehouse: `${clusterName} Sub-Warehouse`,
    invoiceRef: '',
    value: '450000',
    itemDetails: ''
  });

  useEffect(() => {
    setForm(f => ({
      ...f,
      toWarehouse: `${clusterName} Sub-Warehouse`
    }));
  }, [clusterName]);

  const computedTransfers = transfers.map(t => ({
    ...t,
    destination: t.destination.includes("Sub-Warehouse") ? `${clusterName} Sub-Warehouse` : `${clusterName} Local Branch`,
  }));

  const [generatedEWB, setGeneratedEWB] = useState(null);

  const handleGenerateEWB = (e) => {
    e.preventDefault();
    const ewayNo = `EWB-${Math.floor(100000 + Math.random() * 900000)}`;
    const newEWB = {
      ewayBillNo: ewayNo,
      transporterName: form.transporterName,
      vehicleNo: form.vehicleNo,
      fromWarehouse: form.fromWarehouse,
      toWarehouse: form.toWarehouse,
      invoiceRef: form.invoiceRef || "INV-M-TRN",
      value: form.value,
      itemDetails: form.itemDetails || "Solar Components",
      dateGenerated: new Date().toISOString().split('T')[0]
    };

    // Update transfer list compliance
    setTransfers(transfers.map(t => 
      t.transferId === form.invoiceRef ? { ...t, complianceStatus: "Compliant", ewayBillNo: ewayNo } : t
    ));

    setGeneratedEWB(newEWB);
    setForm({
      transporterName: '',
      vehicleNo: '',
      fromWarehouse: 'Jaipur Main Hub (Master)',
      toWarehouse: 'Sanganer Sub-Warehouse',
      invoiceRef: '',
      value: '450000',
      itemDetails: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <FaExchangeAlt className="text-primary" />
            E-Way Bill & Compliance Management
          </h1>
          <p className="text-text-secondary text-sm">
            Generate tax-compliant E-Way bills for inter-warehouse stock transfers and verify dispatch document records.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex bg-card p-1 rounded-xl border border-border shadow-xs">
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'compliance' 
                ? 'gradient-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Transfer Compliance Log
          </button>
          <button
            onClick={() => {
              setActiveTab('generate');
              setGeneratedEWB(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'generate' 
                ? 'gradient-primary text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Generate E-Way Bill
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* COMPLIANCE LOG */}
        {activeTab === 'compliance' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="card overflow-hidden"
          >
            <div className="overflow-x-auto px-6 pb-6 pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg text-text-secondary uppercase text-[10px] font-bold border-b border-border">
                    <th className="p-4">Transfer Ref</th>
                    <th className="p-4">Origin Hub</th>
                    <th className="p-4">Destination Sub</th>
                    <th className="p-4">Material Details</th>
                    <th className="p-4">Transit compliance</th>
                    <th className="p-4">E-Way Bill No</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {computedTransfers.map((trn) => (
                    <tr key={trn.transferId} className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 font-bold text-primary">{trn.transferId}</td>
                      <td className="p-4 font-semibold text-text-primary">{trn.origin}</td>
                      <td className="p-4 font-semibold text-text-primary">{trn.destination}</td>
                      <td className="p-4 font-medium text-text-secondary">{trn.items}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          trn.complianceStatus === 'Compliant'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20 animate-pulse'
                        }`}>
                          {trn.complianceStatus}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-text-primary">
                        {trn.ewayBillNo || <span className="text-text-muted italic">Awaiting Generation</span>}
                      </td>
                      <td className="p-4 text-center">
                        {trn.complianceStatus === 'Compliant' ? (
                          <button className="px-3 py-1 bg-surface border border-border rounded-lg text-primary hover:bg-primary/5 text-[10px] font-bold">
                            Download PDF
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setForm({ ...form, invoiceRef: trn.transferId, itemDetails: trn.items });
                              setActiveTab('generate');
                            }}
                            className="px-3 py-1 gradient-primary text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95"
                          >
                            Assign EWB
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* GENERATOR */}
        {activeTab === 'generate' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form */}
            <form onSubmit={handleGenerateEWB} className="lg:col-span-2 card p-6 space-y-4">
              <h3 className="text-base font-bold text-text-primary border-b border-border pb-3 flex items-center gap-2">
                <FaRegFileAlt className="text-primary" />
                Inter-state E-Way Bill releasing form
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Transporter Name</label>
                  <input 
                    type="text" required placeholder="e.g. VRL Logistics Ltd"
                    value={form.transporterName}
                    onChange={e => setForm({...form, transporterName: e.target.value})}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Vehicle Registration No</label>
                  <input 
                    type="text" required placeholder="e.g. RJ-14-GB-9901"
                    value={form.vehicleNo}
                    onChange={e => setForm({...form, vehicleNo: e.target.value})}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase">From Warehouse (Consignor)</label>
                  <select 
                    value={form.fromWarehouse}
                    onChange={e => setForm({...form, fromWarehouse: e.target.value})}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:border-primary"
                  >
                    <option>Jaipur Main Hub (Master)</option>
                    <option>Ahmedabad GIDC Hub (Master)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase">To Warehouse (Consignee)</label>
                  <select 
                    value={form.toWarehouse}
                    onChange={e => setForm({...form, toWarehouse: e.target.value})}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                  >
                    <option>{clusterName} Sub-Warehouse</option>
                    <option>{clusterName} Local Branch</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Transfer ID / Invoice Reference</label>
                  <input 
                    type="text" required placeholder="e.g. TRN-9092"
                    value={form.invoiceRef}
                    onChange={e => setForm({...form, invoiceRef: e.target.value})}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Consignment Declared Value (₹)</label>
                  <input 
                    type="number" required
                    value={form.value}
                    onChange={e => setForm({...form, value: e.target.value})}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase">Item Details Summary</label>
                <input 
                  type="text" placeholder="e.g. Solar panels, cables"
                  value={form.itemDetails}
                  onChange={e => setForm({...form, itemDetails: e.target.value})}
                  className="w-full mt-1 p-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-primary text-white font-extrabold text-xs shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <FaLock className="text-xs" />
                Sign E-Way Bill Declaration
              </button>
            </form>

            {/* Generated E-Way Output */}
            <div className="space-y-4">
              {generatedEWB ? (
                <div className="card border border-primary/20 bg-primary/5 p-6 space-y-4 text-xs text-text-secondary animate-in fade-in duration-300">
                  <div className="flex justify-between items-center border-b border-border/70 pb-3">
                    <h4 className="font-bold text-sm text-primary uppercase">E-Way Bill Generated</h4>
                    <FaCheckCircle className="text-success text-lg" />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase block">EWB Code</span>
                      <strong className="text-text-primary text-sm font-mono tracking-wider block">{generatedEWB.ewayBillNo}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase block">Vehicle No</span>
                      <span className="font-semibold text-text-primary font-mono">{generatedEWB.vehicleNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase block">Consignor Address</span>
                      <span className="font-semibold text-text-primary">{generatedEWB.fromWarehouse}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase block">Consignee Address</span>
                      <span className="font-semibold text-text-primary">{generatedEWB.toWarehouse}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase block">Declared value</span>
                      <span className="font-semibold text-text-primary">₹{parseInt(generatedEWB.value).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/70 flex justify-center">
                    <button
                      onClick={() => alert("PDF downloaded successfully!")}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:brightness-105 transition-all flex items-center gap-1.5"
                    >
                      <FaFilePdf /> Download E-Way Bill PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-6 border border-dashed border-border bg-bg flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[300px]">
                  <FaRegFileAlt className="text-text-muted text-3xl" />
                  <h4 className="font-bold text-text-primary text-xs">Awaiting EWB release</h4>
                  <p className="text-[10px] text-text-secondary max-w-[200px] leading-relaxed">
                    Complete the Consignment details on the form to authorize and release the active E-Way bill key.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
