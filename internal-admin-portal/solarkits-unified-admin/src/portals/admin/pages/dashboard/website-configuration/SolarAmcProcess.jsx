import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { FiSave, FiRotateCcw, FiEye, FiCheckCircle, FiSmartphone, FiMonitor, FiLayers, FiPlus, FiTrash2, FiEdit2, FiList, FiX } from "react-icons/fi";
import { FileText, Calendar, TrendingUp, Clock } from "lucide-react";

const ICON_MAP = { FileText, Calendar, TrendingUp, Clock };

const DEFAULT = {
  processTitle: "How AMC Management Works",
  processSubtitle: "Simple steps to manage your solar maintenance contracts",
  processList: [
    { step: "1", title: "Create Contract", description: "Set up AMC contracts with terms, pricing, and coverage details",  icon: "FileText",   enabled: true },
    { step: "2", title: "Schedule Visits", description: "Plan preventive maintenance visits and inspections",               icon: "Calendar",   enabled: true },
    { step: "3", title: "Track Services",  description: "Monitor service execution and record maintenance activities",      icon: "TrendingUp", enabled: true },
    { step: "4", title: "Manage Renewals", description: "Automate contract renewals and customer communications",           icon: "Clock",      enabled: true }
  ],
  enableSection: true
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarAmcProcess() {
  const [formData, setFormData] = useState(DEFAULT);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [modalForm, setModalForm] = useState({ step: "", title: "", description: "", icon: "FileText", enabled: true });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/api/website/v1/amc/get?t=${Date.now()}`);
      if (data?.data) {
        setFormData(prev => {
          const merged = { ...prev };
          if (data.data.processTitle) merged.processTitle = data.data.processTitle;
          if (data.data.processSubtitle) merged.processSubtitle = data.data.processSubtitle;
          if (Array.isArray(data.data.processList) && data.data.processList.length > 0) {
            merged.processList = data.data.processList.map(item => ({
              ...item,
              enabled: item.enabled !== undefined ? item.enabled : true
            }));
          }
          if (data.data.enableProcessSection !== undefined && data.data.enableProcessSection !== null) merged.enableSection = data.data.enableProcessSection;
          return merged;
        });
      }
    } catch (e) { console.log("Using defaults:", e.message); }
    finally { setLoading(false); }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setSavedSuccess(false);
  };

  const handleSaveModal = e => {
    e.preventDefault();
    if (editingIdx !== null) {
      setFormData(prev => ({ ...prev, processList: prev.processList.map((p, i) => i === editingIdx ? { ...modalForm } : p) }));
    } else {
      setFormData(prev => ({ ...prev, processList: [...prev.processList, { ...modalForm, enabled: true }] }));
    }
    setIsModalOpen(false); setSavedSuccess(false);
  };

  const handleSubmit = async e => {
    e.preventDefault(); setIsSaving(true);
    try {
      await axios.patch(`${BASE_URL}/api/website/v1/amc/update`, { ...formData, enableProcessSection: formData.enableSection, lastUpdated: new Date().toLocaleDateString('en-IN') });
      setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) { alert("Save failed: " + err.message); }
    finally { setIsSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" /></div>;

  return (
    <div className="min-h-screen pb-12">
      <PageHeader title="AMC - How It Works" description="Configure the process steps section (How AMC Management Works)" />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-5">
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3">
              <h3 className="text-sm font-bold text-text flex items-center gap-2"><FiLayers className="text-primary" /> Section Headers</h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enableSection: !prev.enableSection }))}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.enableSection ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
              >
                <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.enableSection ? "bg-white/30" : "bg-border/60"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.enableSection ? "translate-x-4" : "translate-x-0"}`} />
                </span>
                <span className={`text-xs font-bold transition-colors duration-300 ${formData.enableSection ? "text-white" : "text-text/50"}`}>
                  {formData.enableSection ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>
            {[{ label: "Title", name: "processTitle" }, { label: "Subtitle", name: "processSubtitle" }].map(({ label, name }) => (
              <div key={name}>
                <label className="text-xs font-semibold text-text/80 block mb-1 uppercase tracking-wider">{label}</label>
                <input type="text" name={name} value={formData[name]} onChange={handleChange} required className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition" />
              </div>
            ))}
          </div>

          <div className="bg-bg/20 border border-border/40 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-border/25 mb-4">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-primary/10 text-primary"><FiList className="text-xl" /></div><div><h2 className="text-sm font-bold text-text">Process Steps</h2><p className="text-xs text-text/60">Step-by-step cards</p></div></div>
              <button type="button" onClick={() => { setEditingIdx(null); setModalForm({ step: String(formData.processList.length + 1), title: "", description: "", icon: "FileText" }); setIsModalOpen(true); }} className="flex items-center gap-1 text-xs text-white bg-primary font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer"><FiPlus /> Add</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border/60 bg-bg/60 text-text/50 uppercase font-black text-[10px]"><th className="py-3 px-3 text-center">#</th><th className="py-3 px-4">Step Title</th><th className="py-3 px-4">Description</th><th className="py-3 px-4">Icon</th><th className="py-3 px-4 text-center">Status</th><th className="py-3 px-4 text-center">Actions</th></tr></thead>
                <tbody className="divide-y divide-border/40">
                  {formData.processList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-primary">{p.step}</td>
                      <td className="py-3 px-4 font-bold text-text">{p.title}</td>
                      <td className="py-3 px-4 text-text/60 max-w-[180px] truncate">{p.description}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-bg/50 border border-border/40 rounded text-[10px]">{p.icon}</span></td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              processList: prev.processList.map((item, i) => i === idx ? { ...item, enabled: item.enabled === false ? true : false } : item)
                            }));
                            setSavedSuccess(false);
                          }}
                          className={`relative inline-flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 cursor-pointer select-none ${p.enabled !== false ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                        >
                          <span className={`relative inline-block w-6 h-3 rounded-full transition-colors duration-300 ${p.enabled !== false ? "bg-white/30" : "bg-border/60"}`}>
                            <span className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white shadow-sm transition-transform duration-300 ${p.enabled !== false ? "translate-x-3" : "translate-x-0"}`} />
                          </span>
                          <span className={`text-[9px] font-bold transition-colors duration-300 ${p.enabled !== false ? "text-white" : "text-text/50"}`}>
                            {p.enabled !== false ? "Enabled" : "Disabled"}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => { setEditingIdx(idx); setModalForm({ ...p }); setIsModalOpen(true); }} className="p-1.5 text-primary hover:bg-primary/10 border border-primary/20 rounded-lg transition cursor-pointer"><FiEdit2 className="text-xs" /></button>
                        <button type="button" onClick={() => { if (window.confirm("Delete?")) { setFormData(pr => ({ ...pr, processList: pr.processList.filter((_, i) => i !== idx) })); setSavedSuccess(false); } }} className="p-1.5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition cursor-pointer"><FiTrash2 className="text-xs" /></button>
                      </div></td>
                    </tr>
                  ))}
                  {formData.processList.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-text/50">No steps yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/20">
            <button type="button" onClick={() => { if (window.confirm("Reset?")) { setFormData(DEFAULT); setSavedSuccess(false); } }} className="px-5 py-2.5 rounded-xl border border-border/70 text-text/80 hover:bg-bg/40 font-bold text-sm transition flex items-center gap-2 cursor-pointer"><FiRotateCcw /> Reset</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 transition flex items-center gap-2 disabled:opacity-55 cursor-pointer"><FiSave /> {isSaving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>

        <div className="lg:col-span-5">
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xl sticky top-6">
            <div className="flex items-center justify-between border-b border-border/25 pb-4 mb-5">
              <h3 className="text-sm font-bold text-text flex items-center gap-2"><FiEye className="text-primary" /> Live Preview</h3>
              <div className="flex items-center bg-bg/50 border border-border/50 rounded-lg p-0.5">
                <button onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded-md transition ${previewMode === "desktop" ? "bg-card text-primary shadow" : "text-text/60"}`}><FiMonitor className="text-sm" /></button>
                <button onClick={() => setPreviewMode("mobile")} className={`p-1.5 rounded-md transition ${previewMode === "mobile" ? "bg-card text-primary shadow" : "text-text/60"}`}><FiSmartphone className="text-sm" /></button>
              </div>
            </div>
            <div className="flex justify-center bg-bg/35 border border-border/30 rounded-xl p-4 overflow-hidden">
              <div className={`bg-white text-gray-800 overflow-hidden shadow-inner ${previewMode === "mobile" ? "w-[340px] min-h-[360px]" : "w-full min-h-[280px]"}`}>
                <div className="p-5 text-center">
                  <h2 className="text-sm font-extrabold text-gray-800">{formData.processTitle}</h2>
                  <p className="text-[9px] text-gray-500 mt-1">{formData.processSubtitle}</p>
                  <div className={`mt-4 grid gap-3 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                    {formData.processList.slice(0, 4).map((p, i) => {
                      const Icon = ICON_MAP[p.icon] || FileText;
                      return (
                        <div key={i} className="bg-white border border-gray-100 p-3 rounded-xl text-center shadow-sm relative">
                          <span className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-50 text-orange-500 font-bold text-[9px]">{p.step}</span>
                          <Icon className="w-6 h-6 text-blue-600 mx-auto mb-1 mt-2" />
                          <h3 className="font-bold text-gray-800 text-[9px]">{p.title}</h3>
                          <p className="text-[8px] text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-text/50 hover:text-text p-1.5 rounded-lg cursor-pointer"><FiX /></button>
              <h3 className="text-lg font-extrabold text-text mb-4">{editingIdx !== null ? "Edit Step" : "Add Step"}</h3>
              <form onSubmit={handleSaveModal} className="space-y-4">
                <div><label className="block text-xs font-bold text-text mb-1.5">Step Number</label><input type="text" value={modalForm.step} onChange={e => setModalForm(p => ({ ...p, step: e.target.value }))} required className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition" /></div>
                <div><label className="block text-xs font-bold text-text mb-1.5">Title <span className="text-rose-500">*</span></label><input type="text" value={modalForm.title} onChange={e => setModalForm(p => ({ ...p, title: e.target.value }))} required className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition" /></div>
                <div><label className="block text-xs font-bold text-text mb-1.5">Description <span className="text-rose-500">*</span></label><textarea rows={3} value={modalForm.description} onChange={e => setModalForm(p => ({ ...p, description: e.target.value }))} required className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none" /></div>
                <div><label className="block text-xs font-bold text-text mb-1.5">Icon</label>
                  <select value={modalForm.icon} onChange={e => setModalForm(p => ({ ...p, icon: e.target.value }))} className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition cursor-pointer">
                    {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="pt-3 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-border/60 text-text/70 text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer">{editingIdx !== null ? "Save" : "Add"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {savedSuccess && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-6 right-6 z-55 flex items-center gap-3 bg-green-550 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/10">
            <FiCheckCircle className="text-xl" /><div><h4 className="font-bold text-sm">Process Steps Saved</h4><p className="text-xs text-white/90">Updated successfully</p></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
