import React from "react";
import { useSelector, useDispatch } from "react-redux";
import PageHeader from "../components/PageHeader";
import { FaUser, FaBuilding, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaGlobe, FaEdit, FaShieldAlt, FaAward, FaPlus, FaTrashAlt, FaTimes } from "react-icons/fa";
import Button from "../components/Button";
import { supplier_api } from "../features/supplier.api";
import { set_supplier } from "../features/auth.slice";

export default function Profile() {
  const { supplier } = useSelector((state) => state.auth_slice);
  const dispatch = useDispatch();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [brandName, setBrandName] = React.useState(supplier?.brand_name || '');
  const [brandLogo, setBrandLogo] = React.useState(supplier?.brand_logo || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (supplier) {
      setBrandName(supplier.brand_name || '');
      setBrandLogo(supplier.brand_logo || '');
    }
  }, [supplier]);

  const handleUpdateProfile = async () => {
    if (!brandName.trim()) {
      setError("Brand name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await supplier_api.update_profile({
        brand_name: brandName,
        brand_logo: brandLogo
      });
      dispatch(set_supplier(data.supplier));
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const isStateMatch = (stateName, locState, locAddress) => {
    if (!stateName) return false;
    const a = stateName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (locState && String(locState) !== 'undefined') {
        const b = String(locState).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (a.includes(b) || b.includes(a)) return true;
    }
    if (locAddress) {
        const addr = String(locAddress).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (addr.includes(a)) return true;
    }
    return false;
  };

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const supplierData = {
    name: supplier?.brand_name || supplier?.company_name || 'EmergeSun Partner',
    role: 'Authorized Solar Partner',
    company: supplier?.company_name || 'EmergeSun Partner',
    email: supplier?.email || 'N/A',
    phone: supplier?.phone ? `${supplier.phone_code || '+91'} ${supplier.phone}` : 'N/A',
    location: supplier?.office_locations?.[0]?.address || supplier?.office_location?.address || 'N/A',
    bio: 'Dedicated solar ecosystem provider. Focused on sustainable energy growth and logistics coverage.'
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Supplier Profile" 
        subtitle="Manage your public identity and business credentials." 
        icon={FaUser}
        actions={
          <Button 
            variant="primary" 
            className="rounded-xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-lg shadow-primary/20" 
            leftIcon={<FaEdit />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-8 bg-surface border-border flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-primary/5" />
            
            <div className="relative mt-8">
              {supplier?.brand_logo ? (
                <div className="w-32 h-32 rounded-3xl bg-surface border-4 border-surface shadow-xl flex items-center justify-center overflow-hidden">
                  <img src={supplier.brand_logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-surface border-4 border-surface shadow-xl flex items-center justify-center text-5xl text-primary font-black">
                  {supplierData.name.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-success text-white flex items-center justify-center shadow-lg border-2 border-surface">
                <FaAward />
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <h3 className="text-2xl font-black text-text-primary tracking-tight">{supplierData.name}</h3>
              <p className="text-sm font-bold text-primary uppercase tracking-widest">{supplierData.role}</p>
              <div className="pt-2">
                {isOnline ? (
                  <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                    Online
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-danger/10 text-danger text-[10px] font-black uppercase tracking-widest border border-danger/20 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-danger rounded-full"></span>
                    Offline
                  </span>
                )}
              </div>
            </div>

            <div className="w-full mt-8 pt-8 border-t border-border space-y-4">
              <div className="flex items-center gap-4 text-sm font-semibold text-text-secondary">
                <FaEnvelope className="text-primary/60 shrink-0" />
                <span className="truncate">{supplierData.email}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold text-text-secondary">
                <FaPhoneAlt className="text-primary/60 shrink-0" />
                <span>{supplierData.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6 bg-surface border-border">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-6">Network Status</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-text-secondary">Trust Score</span>
                <span className="text-sm font-black text-success tracking-tighter italic">9.8 / 10</span>
              </div>
              <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-success w-[98%] shadow-[0_0_8px_rgba(22,163,74,0.4)]" />
              </div>
              <p className="text-[10px] text-text-muted font-bold leading-relaxed">
                Your trust score is based on fulfillment speed and product quality ratings from the EmergeSun network.
              </p>
            </div>
          </div>
        </div>

        {/* Details & Documents */}
        <div className="lg:col-span-2 space-y-8">
          {/* Business Info */}
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-8 flex items-center gap-2">
              <FaBuilding className="text-primary" /> Business Intelligence
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Brand Name</p>
                <p className="text-sm font-bold text-text-primary">{supplier?.brand_name || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Company Legal Name</p>
                <p className="text-sm font-bold text-text-primary">{supplier?.company_name || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Registered PAN</p>
                <p className="text-sm font-bold text-text-primary uppercase">{supplier?.gst_list?.[0]?.pan_number || supplier?.pan_number || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Coverage States</p>
                <p className="text-sm font-bold text-text-primary">
                  {supplier?.states && supplier.states.length > 0 ? supplier.states.join(', ') : 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2 space-y-2 pt-4">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Professional Bio</p>
                <p className="text-sm font-medium text-text-secondary leading-relaxed italic">
                  "{supplierData.bio}"
                </p>
              </div>
            </div>
          </div>

          {/* Coverage Offices & State-wise Locations */}
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-8 flex items-center gap-2">
              <FaMapMarkerAlt className="text-primary" /> Coverage Offices & Locations
            </h3>
            
            <div className="space-y-6">
              {supplier?.states && supplier.states.length > 0 ? (
                supplier.states.map(stateName => {
                  const offices = (supplier.office_locations || []).filter(off => 
                    isStateMatch(stateName, off.state, off.address)
                  );
                  return (
                    <div key={stateName} className="space-y-2.5 border-b border-border/40 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                          {stateName}
                        </span>
                        <span className="text-[10px] text-text-muted font-bold">
                          {offices.length} office{offices.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="pl-3 border-l-2 border-border/40 space-y-2">
                        {offices.length > 0 ? (
                          offices.map((off, oIdx) => (
                            <div key={oIdx} className="text-xs font-semibold text-text-secondary leading-relaxed text-left flex items-start gap-2">
                              <span className="text-text-muted mt-1 shrink-0">•</span>
                              <span>{off.address}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-text-muted italic block text-left">No office locations configured for this state.</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-text-secondary text-left italic">No coverage states configured.</p>
              )}
            </div>
          </div>

          {/* Verified Documents */}
          <div className="card p-8 bg-surface border-border">
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-8 flex items-center gap-2">
              <FaShieldAlt className="text-success" /> Verified Credentials
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplier?.gst_list && supplier.gst_list.length > 0 ? (
                supplier.gst_list.map((gst, idx) => (
                  <div key={idx} className="p-5 bg-surface-hover/30 rounded-2xl border border-border flex items-center justify-between group hover:border-success/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center text-lg">
                        <FaAward />
                      </div>
                      <div>
                        <p className="text-xs font-black text-text-primary uppercase tracking-tight">GSTIN: {gst.gst_number}</p>
                        <p className="text-[10px] text-text-secondary font-bold uppercase">State: {gst.state}</p>
                        <p className="text-[10px] text-text-muted font-semibold">PAN: {gst.pan_number}</p>
                        <p className="text-[10px] text-success font-bold uppercase mt-1">Verified</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 bg-surface-hover/30 rounded-2xl border border-border flex items-center justify-between col-span-2">
                  <p className="text-sm font-semibold text-text-secondary">No GST / PAN credentials registered.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="relative bg-linear-120 from-primary to-primary-end p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Edit Brand Profile</h3>
                <p className="text-xs text-white/70 font-semibold">Change your brand name or logo below.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer p-1"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {error && (
                <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Read Only - Legal Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-surface-hover/30 rounded-2xl border border-border/60 text-xs font-semibold">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-black mb-1">Company Legal Name</p>
                  <p className="text-text-primary truncate">{supplier?.company_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-black mb-1">Registered PAN</p>
                  <p className="text-text-primary uppercase">{supplier?.gst_list?.[0]?.pan_number || supplier?.pan_number || 'N/A'}</p>
                </div>
              </div>

              {/* Brand Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Brand Name *</label>
                <input 
                  type="text" 
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-surface-hover/20 text-text-primary text-sm font-semibold focus:outline-none focus:border-primary/50 focus:bg-surface transition-all"
                  placeholder="e.g. EmergeSun Solar"
                  required
                />
              </div>

              {/* Brand Logo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Brand Logo *</label>
                <div className="flex items-center gap-4">
                  {brandLogo ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-border bg-white flex items-center justify-center group/logo">
                      <img src={brandLogo} alt="Logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setBrandLogo('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer border-none"
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-surface-hover/20">
                      <FaPlus className="text-text-muted" size={16} />
                      <span className="text-[10px] font-bold text-text-muted uppercase mt-1">Upload</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setBrandLogo(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="flex-1 text-xs text-text-muted font-medium">
                    Recommended: Square image, transparent background (PNG or JPG)
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border/60 flex justify-end gap-3 bg-surface-hover/10">
              <Button 
                variant="ghost" 
                className="font-black uppercase tracking-widest text-xs h-12 px-6" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="font-black uppercase tracking-widest text-xs h-12 px-8 shadow-lg shadow-primary/20" 
                onClick={handleUpdateProfile}
                loading={loading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
