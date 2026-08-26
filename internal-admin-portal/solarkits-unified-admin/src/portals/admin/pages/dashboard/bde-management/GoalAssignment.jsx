import React, { useState, useEffect } from 'react';
import {
  FaBullseye,
  FaSearch,
  FaPlus,
  FaChartLine,
} from 'react-icons/fa';
import { bdeApi } from '../../../api/bdeApi';
import Loader from '../../../components/Loader';
import GoalModal from './GoalModal';

export default function GoalAssignment({ moduleUniqueId = 'ADM_BDE_MGMT' }) {
  const [bdes, setBdes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBde, setSelectedBde] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBdes();
  }, []);

  const fetchBdes = async () => {
    try {
      setLoading(true);
      const res = await bdeApi.listBdes({ limit: 50 }, moduleUniqueId);
      setBdes(res.data || []);
    } catch (err) {
      console.error('Failed to load BDEs for goal assignment', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBdes = bdes.filter(b =>
    b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.bde_id?.toLowerCase().includes(search.toLowerCase()) ||
    b.state_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">BDE Goal & Target Assignments</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Set quarterly and monthly franchisee signup targets and operational store goals for each BDE.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <FaSearch className="text-slate-400 text-sm ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by BDE name, ID, or assigned state..."
          className="w-full bg-transparent text-slate-900 text-sm font-medium focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="py-20"><Loader text="Loading goal assignments..." /></div>
      ) : filteredBdes.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-xs">
          No BDE executives found matching search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBdes.map(b => (
            <div
              key={b.id || b._id}
              className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0575B8] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{b.bde_id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    b.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{b.full_name}</h3>
                <p className="text-xs text-slate-500 truncate font-medium">{b.state_name || 'Unassigned Territory'}</p>

                {/* Target Metric Placeholders */}
                <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Monthly Signups:</span>
                    <span className="font-bold text-[#0575B8]">Target Tracked</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Quarterly Signups:</span>
                    <span className="font-bold text-indigo-700">Target Tracked</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Store Setups:</span>
                    <span className="font-bold text-emerald-700">Active</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedBde(b);
                  setModalOpen(true);
                }}
                className="w-full py-2.5 bg-blue-50 hover:bg-[#0575B8] text-[#0575B8] hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FaBullseye /> Set & Update Goals
              </button>
            </div>
          ))}
        </div>
      )}

      <GoalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bde={selectedBde}
        onSuccess={fetchBdes}
      />
    </div>
  );
}
