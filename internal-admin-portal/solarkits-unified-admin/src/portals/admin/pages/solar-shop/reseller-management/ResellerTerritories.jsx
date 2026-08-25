import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiAlertCircle,
  FiLoader,
  FiCheck,
  FiX,
  FiGlobe,
  FiMap,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_TERRITORY";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/reseller-mgmt/territories${endpoint}`, headers: authHeaderObj(), data });

const SOURCE_BADGES = {
  admin_override: { label: "Admin Override", bg: "bg-danger-soft",  text: "text-danger",  icon: FiShield },
  admin_assigned: { label: "Admin Assigned", bg: "bg-info-soft",    text: "text-primary", icon: FiUserCheck },
  plan:           { label: "Plan Default",   bg: "bg-success-soft", text: "text-success", icon: FiCheck },
  gst_derived:    { label: "GST Address",    bg: "bg-warning-soft text-warning", text: "text-warning", icon: FiMapPin },
};

function SourceBadge({ source }) {
  const cfg = SOURCE_BADGES[source] || SOURCE_BADGES.admin_assigned;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border border-current/20`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function AssignTerritoryModal({ resellers = [], onClose, onAssigned }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    reseller_id:      "",
    territory_level:  "district",
    country_id:       "",
    state_id:         "",
    district_id:      "",
    source:           "admin_override",
    override_reason:  "",
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [saving, setSaving] = useState(false);

  // Auto pre-fill address from selected reseller
  useEffect(() => {
    if (!form.reseller_id) return;
    const sel = (resellers || []).find((r) => r.id === form.reseller_id || r._id === form.reseller_id);
    if (sel && sel.address) {
      const addr = sel.address;
      setForm((f) => ({
        ...f,
        country_id: addr.country_id || f.country_id,
        state_id: addr.state_id || f.state_id,
        district_id: addr.district_id || f.district_id,
        territory_level: addr.district_id ? "district" : addr.state_id ? "state" : f.territory_level,
      }));
    }
  }, [form.reseller_id, resellers]);

  // Fetch Countries
  useEffect(() => {
    axios.get(`${API_BASE}/geolocation/get-countries`, { headers: authHeaderObj() })
      .then((res) => {
        const list = res.data?.countries || res.data?.data || [];
        if (res.data?.status === "success" && Array.isArray(list)) {
          setCountries(list);
          if (list.length > 0) setForm((f) => ({ ...f, country_id: list[0].id || list[0]._id }));
        } else {
          setCountries([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setCountries([]);
      });
  }, []);

  // Fetch States when Country changes
  useEffect(() => {
    if (!form.country_id) return;
    axios.get(`${API_BASE}/geolocation/get-states?country_id=${form.country_id}`, { headers: authHeaderObj() })
      .then((res) => {
        const list = res.data?.states || res.data?.data || [];
        if (res.data?.status === "success" && Array.isArray(list)) {
          setStates(list);
        } else {
          setStates([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setStates([]);
      });
  }, [form.country_id]);

  // Fetch Districts when State changes
  useEffect(() => {
    if (!form.state_id) return;
    axios.get(`${API_BASE}/geolocation/get-districts?state_id=${form.state_id}`, { headers: authHeaderObj() })
      .then((res) => {
        const list = res.data?.districts || res.data?.data || [];
        if (res.data?.status === "success" && Array.isArray(list)) {
          setDistricts(list);
        } else {
          setDistricts([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setDistricts([]);
      });
  }, [form.state_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reseller_id || !form.country_id) return;
    setSaving(true);

    try {
      const payload = {
        territory_level: form.territory_level,
        country_id:      form.country_id,
        state_id:        form.territory_level !== "country" ? form.state_id : undefined,
        district_id:     form.territory_level === "district" ? form.district_id : undefined,
        source:          form.source,
        override_reason: form.override_reason.trim() || undefined,
      };

      const res = await apiFetch("post", `/assign/${form.reseller_id}?req_for=add&unique_id=${MODULE_UID}`, payload);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Territory assigned successfully!" }));
        onAssigned();
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Assignment failed" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Assignment failed" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Assign Reseller Territory</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Select Reseller */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Reseller <span className="text-danger">*</span></label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.reseller_id}
              onChange={(e) => setForm({ ...form, reseller_id: e.target.value })}
              required
            >
              <option value="">Select Reseller...</option>
              {(resellers || []).map((r) => (
                <option key={r.id} value={r.id}>{r.business_name} ({r.email})</option>
              ))}
            </select>
          </div>

          {/* Scope Level */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Territory Scope Level <span className="text-danger">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: "district", label: "District Level", icon: FiMapPin },
                { level: "state",    label: "State Level",    icon: FiMap },
                { level: "country",  label: "Country Level",  icon: FiGlobe },
              ].map((item) => {
                const Icon = item.icon;
                const sel = form.territory_level === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setForm({ ...form, territory_level: item.level })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                      sel ? "border-primary bg-info-soft text-primary" : "border-border bg-bg text-text-secondary hover:border-primary/30"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Pickers */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Country <span className="text-danger">*</span></label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.country_id}
              onChange={(e) => setForm({ ...form, country_id: e.target.value, state_id: "", district_id: "" })}
              required
            >
              {(countries || []).map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {form.territory_level !== "country" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">State <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.state_id}
                onChange={(e) => setForm({ ...form, state_id: e.target.value, district_id: "" })}
                required
              >
                <option value="">Select State...</option>
                {(states || []).map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {form.territory_level === "district" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">District <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.district_id}
                onChange={(e) => setForm({ ...form, district_id: e.target.value })}
                required
              >
                <option value="">Select District...</option>
                {(districts || []).map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Assignment Source Type</label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="admin_override">Admin Override (Highest Priority)</option>
              <option value="admin_assigned">Admin Assigned</option>
              <option value="plan">Plan Default</option>
              <option value="gst_derived">GST Address Default</option>
            </select>
          </div>

          {/* Override Reason */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Override Reason (Optional)</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Granted exclusive territory expansion for Q3"
              value={form.override_reason}
              onChange={(e) => setForm({ ...form, override_reason: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.reseller_id || !form.country_id}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <FiLoader className="animate-spin" size={16} /> : null}
              Assign Territory
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResellerTerritories({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [resellers, setResellers] = useState([]);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(false);

  // Load Resellers list for dropdown
  useEffect(() => {
    axios.get(`${API_BASE}/reseller-mgmt/list?req_for=view&unique_id=${MODULE_UID}&limit=100`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success" && Array.isArray(res.data?.data)) {
          setResellers(res.data.data);
          if (res.data.data.length > 0) setSelectedResellerId(res.data.data[0].id);
        } else {
          setResellers([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setResellers([]);
      });
  }, []);

  // Fetch territories for selected reseller
  const fetchTerritories = useCallback(async () => {
    if (!selectedResellerId) return;
    setLoading(true);
    try {
      const res = await apiFetch("get", `/list/${selectedResellerId}?req_for=view&unique_id=${MODULE_UID}`);
      if (res.data?.status === "success" && Array.isArray(res.data?.data)) {
        setTerritories(res.data.data);
      } else {
        setTerritories([]);
      }
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load territories" }));
      setTerritories([]);
    } finally {
      setLoading(false);
    }
  }, [selectedResellerId, dispatch]);

  useEffect(() => {
    fetchTerritories();
  }, [fetchTerritories]);

  const handleDeleteTerritory = async (territoryId) => {
    if (!window.confirm("Are you sure you want to remove this territory authorization?")) return;
    try {
      const res = await apiFetch("delete", `/delete/${territoryId}?req_for=delete&unique_id=${MODULE_UID}`);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Territory removed successfully" }));
        fetchTerritories();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Delete failed" }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiMapPin className="text-primary" /> Reseller Territory Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Assign district, state, or country-level sales boundaries and manage precedence assignment rules
          </p>
        </div>

        <button
          onClick={() => setAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20"
        >
          <FiPlus size={16} /> Assign Territory
        </button>
      </div>

      {/* Reseller Selector Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
        <label className="text-sm font-semibold text-text-secondary whitespace-nowrap">Select Reseller Partner:</label>
        <select
          className="max-w-md px-3.5 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={selectedResellerId}
          onChange={(e) => setSelectedResellerId(e.target.value)}
        >
          <option value="all">🌐 All Resellers (View System-Wide Assignments)</option>
          {(resellers || []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.business_name} ({r.email}) — Mode: {r.commercial_mode}
            </option>
          ))}
        </select>
      </div>

      {/* Territories Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-sm gap-2">
            <FiLoader className="animate-spin text-primary" size={18} /> Loading territory authorizations...
          </div>
        ) : (territories || []).length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">
            <FiAlertCircle className="mx-auto mb-2 text-warning" size={24} />
            No explicit territory rules assigned for this reseller. System defaults to registered GST state boundary.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg text-text-muted text-xs uppercase tracking-wider text-left">
                  <th className="px-6 py-3.5 font-semibold">Reseller Partner</th>
                  <th className="px-6 py-3.5 font-semibold">Scope Level</th>
                  <th className="px-6 py-3.5 font-semibold">Location Name</th>
                  <th className="px-6 py-3.5 font-semibold">Precedence Source</th>
                  <th className="px-6 py-3.5 font-semibold">Override Reason</th>
                  <th className="px-6 py-3.5 font-semibold">Assigned Date</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(territories || []).map((t) => {
                  const r = t.reseller || (resellers || []).find((res) => res.id === t.reseller_id);
                  const scopeLevel = t.scope_level || t.territory_level || "district";
                  return (
                    <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 font-bold text-text-primary">
                        {r ? r.business_name : "General System"}
                        <div className="text-xs font-normal text-text-muted">{r ? r.email : ""}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg border border-border text-xs font-bold uppercase tracking-wider text-text-secondary">
                          {scopeLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{t.location_name}</td>
                      <td className="px-6 py-4"><SourceBadge source={t.precedence_source} /></td>
                      <td className="px-6 py-4 text-text-secondary text-xs">{t.override_reason || "—"}</td>
                      <td className="px-6 py-4 text-text-muted text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteTerritory(t.id)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors"
                          title="Remove Territory Authorization"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <AssignTerritoryModal
          resellers={resellers}
          onClose={() => setAssignModal(false)}
          onAssigned={fetchTerritories}
        />
      )}
    </div>
  );
}
