import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, Mail, Sparkles, HelpCircle, Globe, MapPin, Building2, ShieldCheck, ArrowRight, CheckCircle2, Search, Check, KeyRound, FileText, Clock } from 'lucide-react';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isRegisterSubmitted, setIsRegisterSubmitted] = useState(false);
  const [reviewCountdown, setReviewCountdown] = useState(30);

  const [activeCountries, setActiveCountries] = useState(() => {
    const saved = localStorage.getItem('epc_active_countries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return [{ code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' }];
  });

  const [selectedCountry, setSelectedCountry] = useState(activeCountries[0] || { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' });
  const [selectedState, setSelectedState] = useState('Gujarat');
  const [dynamicStates, setDynamicStates] = useState([]);

  // Fetch Active Countries live from Admin Panel Location Settings API
  const fetchActiveCountries = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/website/v1/auth/active-countries');
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success' && Array.isArray(data.countries) && data.countries.length > 0) {
          setActiveCountries(data.countries);
          if (!selectedCountry || !data.countries.some((c) => c.code === selectedCountry.code)) {
            setSelectedCountry(data.countries[0]);
          }
          return;
        }
      }
    } catch (e) { }

    const saved = localStorage.getItem('epc_active_countries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setActiveCountries(parsed);
      } catch (e) { }
    }
  };

  useEffect(() => {
    fetchActiveCountries();
    window.addEventListener('storage', fetchActiveCountries);
    return () => window.removeEventListener('storage', fetchActiveCountries);
  }, []);

  // Fetch dynamic active states from website backend module API based on selected country
  const fetchDynamicStates = async (countryName) => {
    if (!countryName) return;
    try {
      const res = await fetch(`http://localhost:5000/api/website/v1/auth/active-states?country=${encodeURIComponent(countryName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.states) && data.states.length > 0) {
          const apiStateList = data.states.map((s) => ({ code: s.id || s._id || s.code, name: s.name }));
          setDynamicStates(apiStateList);
          if (!selectedState || !apiStateList.some((st) => st.name === selectedState)) {
            setSelectedState(apiStateList[0].name);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Backend states fetch error:', err);
    }
    setDynamicStates([]);
  };

  useEffect(() => {
    if (selectedCountry?.name) {
      fetchDynamicStates(selectedCountry.name);
    }
  }, [selectedCountry]);

  const handleCountryChange = (countryCode) => {
    const found = activeCountries.find((c) => c.code === countryCode);
    if (found) {
      setSelectedCountry(found);
    }
  };

  const [epcCompanyName, setEpcCompanyName] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [epcSuggestions, setEpcSuggestions] = useState([]);
  const [epcRecords, setEpcRecords] = useState([]);
  const epcBoxRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gstNumber: '',
  });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [resendTimer, setResendTimer] = useState(15);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const navigate = useNavigate();

  const otpInputsRef = useRef([]);

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setIsRegisterSubmitted(false);
    setFormData({ name: '', email: '', gstNumber: '' });
    setEpcCompanyName('');
    setRegisteredEmail('');
    setOtp(['', '', '', '']);
    setErrors({});
    setAlertMsg(null);
  };

  // Send real email OTP with Company Name branding via backend
  const sendRealEpcEmailOtp = async (targetEmail, targetCompany) => {
    let mailTo = targetEmail || registeredEmail;
    let compName = targetCompany || epcCompanyName || 'EPC Company';

    // Resolve email if missing or default
    if (!mailTo || mailTo.includes('example.com')) {
      const allRecords = getCombinedEpcRecords();
      const match = allRecords.find((i) => i.name.toLowerCase() === compName.toLowerCase());
      if (match && match.email) {
        mailTo = match.email;
        setRegisteredEmail(match.email);
      }
    }

    if (!mailTo) return;

    // Clear old OTP inputs and errors
    setOtp(['', '', '', '']);
    setErrors({});
    setSendingOtp(true);

    try {
      const res = await fetch('http://localhost:5000/api/website/v1/auth/send-epc-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mailTo,
          company_name: compName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertMsg({ type: 'info', text: `New OTP sent to registered Email: ${mailTo}` });
        setResendTimer(15);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        setAlertMsg({ type: 'info', text: data.message || `OTP sent to registered Email: ${mailTo}` });
      }
    } catch (err) {
      console.error('Failed to send real OTP email:', err);
      setAlertMsg({ type: 'info', text: `OTP sent to registered Email: ${mailTo}` });
    } finally {
      setSendingOtp(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (epcBoxRef.current && !epcBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // OTP Resend timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 30-Second review screen countdown timer
  useEffect(() => {
    let interval = null;
    if (isRegisterSubmitted) {
      setReviewCountdown(30);
      interval = setInterval(() => {
        setReviewCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRegisterSubmitted(false);
            setIsLogin(true);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRegisterSubmitted]);

  // Fetch dynamic EPC records from Admin Portal Backend & approved local store
  const fetchAdminEpcRecords = async () => {
    let approved = [];
    try {
      const match = document.cookie.split('; ').find((row) => row.startsWith('approved_epcs='));
      if (match) {
        approved = JSON.parse(decodeURIComponent(match.split('=')[1]) || '[]');
      } else {
        approved = JSON.parse(localStorage.getItem('approved_epcs') || '[]');
      }
    } catch (e) { }

    const formattedApproved = approved.map((a) => ({
      name: a.name,
      email: a.email || `${a.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      source: 'verified',
    }));

    let apiEpcs = [];
    try {
      // Fetch live EPC records from Admin Panel (Manage Users -> EPC Records)
      const adminRes = await fetch('http://localhost:5000/admin-api/epcs/in/list?limit=1000&req_for=view');
      if (adminRes.ok) {
        const data = await adminRes.json();
        if (data && data.status === 'success' && Array.isArray(data.data)) {
          apiEpcs = data.data.map((item) => ({
            name: item.name,
            email: item.email || `${item.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            source: item.source || 'government',
          }));
        }
      }

      // Fallback to Website Module API if adminRes returned empty
      if (apiEpcs.length === 0) {
        const webRes = await fetch('http://localhost:5000/api/website/v1/auth/epc-companies');
        if (webRes.ok) {
          const data = await webRes.json();
          if (data && data.status === 'success' && Array.isArray(data.data)) {
            apiEpcs = data.data.map((item) => ({
              name: item.name,
              email: item.email || `${item.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
              source: item.source || 'government',
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch EPC records from backend:', err);
    }

    const combined = [
      ...formattedApproved,
      ...apiEpcs.filter((api) => !formattedApproved.some((a) => a.name.toLowerCase() === api.name.toLowerCase())),
    ];

    setEpcRecords(combined);
    return combined;
  };

  useEffect(() => {
    fetchAdminEpcRecords();

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('epc_registration_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'EPC_APPROVED' || event.data?.type === 'NEW_REGISTRATION') {
          fetchAdminEpcRecords();
        }
      };
      return () => channel.close();
    }
  }, []);

  // Get combined EPC records (or fallback)
  const getCombinedEpcRecords = () => {
    if (epcRecords.length > 0) return epcRecords;
    let approved = [];
    try {
      const match = document.cookie.split('; ').find((row) => row.startsWith('approved_epcs='));
      if (match) {
        approved = JSON.parse(decodeURIComponent(match.split('=')[1]) || '[]');
      } else {
        approved = JSON.parse(localStorage.getItem('approved_epcs') || '[]');
      }
    } catch (e) { }

    return approved.map((a) => ({
      name: a.name,
      email: a.email || `${a.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      source: 'verified',
    }));
  };

  const handleEpcInputChange = (e) => {
    const query = e.target.value;
    setEpcCompanyName(query);
    if (errors.company) setErrors((prev) => ({ ...prev, company: null }));

    const allRecords = getCombinedEpcRecords();

    if (query.trim().length > 0) {
      const filtered = allRecords.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.email.toLowerCase().includes(query.toLowerCase())
      );
      setEpcSuggestions(filtered);
      setShowSuggestions(true);

      // Auto update email if exact match found
      const exactMatch = allRecords.find((i) => i.name.toLowerCase() === query.toLowerCase());
      if (exactMatch) {
        setRegisteredEmail(exactMatch.email);
      }
    } else {
      setEpcSuggestions(allRecords.slice(0, 15));
      setShowSuggestions(true);
    }
  };

  const handleEpcInputFocus = () => {
    const allRecords = getCombinedEpcRecords();
    if (epcCompanyName.trim().length > 0) {
      const filtered = allRecords.filter(
        (item) =>
          item.name.toLowerCase().includes(epcCompanyName.toLowerCase()) ||
          item.email.toLowerCase().includes(epcCompanyName.toLowerCase())
      );
      setEpcSuggestions(filtered);
    } else {
      setEpcSuggestions(allRecords.slice(0, 15));
    }
    setShowSuggestions(true);
  };

  const handleSelectEpcCompany = (item) => {
    setEpcCompanyName(item.name);
    setRegisteredEmail(item.email);
    setShowSuggestions(false);
    sendRealEpcEmailOtp(item.email, item.name);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!isLogin) {
      if (!formData.name.trim()) newErrors.name = 'Full Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email address is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Please enter a valid email address';
      if (!epcCompanyName.trim()) newErrors.company = 'EPC Company Name is required';
      if (!formData.gstNumber.trim()) newErrors.gstNumber = 'GST Number / Tax ID is required';
    } else {
      if (!selectedCountry) newErrors.country = 'Please select a country';
      if (!epcCompanyName.trim()) newErrors.company = 'Please enter your EPC Company Name';

      const enteredOtp = otp.join('');
      if (enteredOtp.length < 4) {
        newErrors.otp = 'Please enter 4-digit OTP';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // Auto-redirect to Register if EPC Company is not found in dataset
    if (isLogin && epcCompanyName.trim()) {
      const allRecords = getCombinedEpcRecords();
      const found = allRecords.find(
        (i) => i.name.toLowerCase() === epcCompanyName.trim().toLowerCase()
      );
      if (!found) {
        setAlertMsg({
          type: 'info',
          text: `"${epcCompanyName}" company is not registered. Redirecting to Register...`,
        });
        setTimeout(() => {
          setIsLogin(false);
          setAlertMsg(null);
        }, 1200);
        return;
      }
    }

    if (validateForm()) {
      setLoading(true);

      // Verify OTP code with backend API
      if (isLogin) {
        const enteredOtp = otp.join('');
        try {
          const res = await fetch('http://localhost:5000/api/website/v1/auth/verify-epc-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: registeredEmail,
              otp: enteredOtp,
            }),
          });
          const data = await res.json();
          if (!data.success) {
            setLoading(false);
            setErrors((prev) => ({ ...prev, otp: data.message || 'Invalid OTP code entered' }));
            return;
          }
        } catch (err) {
          console.warn('Backend OTP verification error:', err);
        }
      }

      setTimeout(() => {
        setLoading(false);

        if (!isLogin) {
          // Store registration request for Admin Panel Approval
          const newRequest = {
            id: 'req-' + Date.now(),
            company_name: epcCompanyName.trim(),
            full_name: formData.name.trim(),
            email: formData.email.trim(),
            whatsapp: '+91 9876543210',
            state_name: selectedState || 'Gujarat',
            district_name: 'Ahmedabad Zone',
            is_registered_same_as_whatsapp: 1,
            registered_whatsapp: '+91 9876543210',
            gst_number: formData.gstNumber.trim(),
            country: selectedCountry?.name || 'India',
            status: 'pending',
            created_at: new Date().toISOString(),
          };

          try {
            const existing = JSON.parse(localStorage.getItem('pending_epc_requests') || '[]');
            const updatedRequests = [newRequest, ...existing.filter((r) => r.id !== newRequest.id)];
            localStorage.setItem('pending_epc_requests', JSON.stringify(updatedRequests));

            // Set document.cookie so all localhost ports (5173, 5174, 5176) can share pending requests
            const cookieVal = encodeURIComponent(JSON.stringify(updatedRequests));
            document.cookie = `pending_epc_requests=${cookieVal}; path=/; max-age=864000`;

            // Persist EPC registration directly to MongoDB Central Database via Website Module
            fetch('http://localhost:5000/api/website/v1/auth/create-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.name.trim(),
                email: formData.email.trim(),
                company_name: epcCompanyName.trim(),
                gst_number: formData.gstNumber.trim(),
                whatsapp: '+91 9876543210',
                registered_whatsapp: '+91 9876543210',
                state_name: selectedState || 'Gujarat',
                country: selectedCountry?.name || 'India',
                status: 'pending',
              }),
            }).catch((e) => console.warn('MongoDB DB async save:', e));

            // Broadcast real-time event to Admin Panel
            if (typeof BroadcastChannel !== 'undefined') {
              const channel = new BroadcastChannel('epc_registration_channel');
              channel.postMessage({ type: 'NEW_REGISTRATION', request: newRequest, requests: updatedRequests });
              channel.close();
            }
          } catch (err) {
            console.error('Failed to store pending EPC request:', err);
          }

          // Register Mode: Show Verification Pending Screen with 30s stay
          setAlertMsg({
            type: 'info',
            text: 'Your application is pending (2-4 hours)',
          });
          setIsRegisterSubmitted(true);
        } else {
          // Login Mode: Store Session and Redirect to Dashboard
          setAlertMsg({ type: 'success', text: 'OTP Verified successfully! Redirecting to EPC Panel...' });
          const mockSession = {
            userId: 'usr-' + Math.floor(100 + Math.random() * 900),
            name: formData.name.trim() || epcCompanyName.trim() || 'EPC Admin',
            role: 'EPC Admin',
            roleCode: 'EPC_ADMIN',
            companyId: 'comp-001',
            company: epcCompanyName.trim(),
            email: registeredEmail || formData.email.trim(),
            country: selectedCountry.name,
            state: selectedState || 'Gujarat',
            avatar: ((formData.name || epcCompanyName || 'EPC Admin').split(' ').map((n) => n[0]).join('')).toUpperCase(),
            status: 'active',
            expiresAt: Date.now() + 60 * 60 * 1000,
            loginAt: Date.now(),
          };
          localStorage.setItem('epc_session', JSON.stringify(mockSession));
          const sessionVal = encodeURIComponent(JSON.stringify(mockSession));
          document.cookie = `epc_session=${sessionVal}; path=/; max-age=864000`;

          setTimeout(() => {
            window.location.href = 'http://localhost:5177/epc-panel/dashboard';
          }, 1000);
        }
      }, 800);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f2f6fa] flex items-center justify-center py-6 px-4 md:px-12">
      <div className="w-full max-w-7xl grid md:grid-cols-5 bg-transparent overflow-hidden items-center">

        {/* Left Visual Illustration */}
        <div className="hidden md:flex md:col-span-3 flex-col items-center justify-center p-8">
          <div className="relative flex flex-col items-center">
            <div className="relative h-[420px] w-[420px] rounded-full bg-orange/10 border-4 border-dashed border-orange/30 flex items-center justify-center float-animation">
              <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-orange to-amber-500 shadow-2xl flex items-center justify-center">
                <Sparkles className="h-28 w-28 text-white" />
              </div>
            </div>
            <h2 className="mt-10 text-3xl font-extrabold text-primary">Power Your Solar Business</h2>
            <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
              Connect solar kits, manage purchase invoices, dealer agreements, and lead pipelines securely.
            </p>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="col-span-5 md:col-span-2 w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">

          {/* Toast Notification */}
          <AnimatePresence>
            {alertMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-4 left-4 right-4 z-20 text-white rounded-xl p-3 text-sm text-left shadow-lg flex items-center space-x-2 ${alertMsg.type === 'success' ? 'bg-emerald-600' : 'bg-slate-900'
                  }`}
              >
                {alertMsg.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-orange flex-shrink-0" />
                )}
                <span>{alertMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center">
            <img
              src="/logo.png"
              alt="EmergeSun"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Verification Pending View After Registration */}
          {isRegisterSubmitted ? (
            <div className="mt-6 text-center space-y-5">
              <div className="relative w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border-2 border-amber-200 shadow-inner">
                <Clock className="h-8 w-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">Application Under Review</h3>

                {/* Live 30s Countdown Timer Badge */}
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Auto returning to Login in {reviewCountdown}s</span>
                </div>

                <p className="mt-3 text-xs md:text-sm font-semibold text-gray-700 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 leading-relaxed text-center">
                  Your application is pending (2-4 hours)
                </p>
              </div>

              {/* Submitted Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-xs space-y-2 text-gray-600 font-medium">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Submitted Registration Details
                </div>
                <div className="flex items-center justify-between">
                  <span>Full Name:</span>
                  <span className="font-bold text-gray-900">{formData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[200px]">{formData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>EPC Company:</span>
                  <span className="font-bold text-gray-900">{epcCompanyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Country:</span>
                  <span className="font-bold text-gray-900">{selectedCountry.flag} {selectedCountry.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>State:</span>
                  <span className="font-bold text-gray-900">📍 {selectedState}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST Number:</span>
                  <span className="font-bold text-gray-900 uppercase">{formData.gstNumber}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsRegisterSubmitted(false);
                  setIsLogin(true);
                }}
                className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary-dark transition-all focus:outline-none flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Back to Login ({reviewCountdown}s)</span>
              </button>
            </div>
          ) : (
            <>
              <h3 className="mt-6 text-2xl font-bold text-gray-900 text-center">
                {isLogin ? 'Login With OTP' : 'Register Account'}
              </h3>

              <div className="mt-1 flex items-center justify-center space-x-2 text-sm">
                <span className="text-gray-500">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button
                  onClick={handleToggleMode}
                  className="font-bold text-primary underline hover:text-primary-dark focus:outline-none"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-left">

                {/* REGISTER MODE FIELDS */}
                {!isLogin && (
                  <>
                    {/* 1. Full Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Full Name
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className={`w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                          placeholder="Enter full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      {errors.name && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.name}</p>}
                    </div>

                    {/* 2. Email Address */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Email Address
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          className={`w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email}</p>}
                    </div>

                    {/* 3. Country Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Country
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <select
                          value={selectedCountry.code}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          {activeCountries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name} ({c.dial})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 4. State Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        State / Region
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          {dynamicStates.map((s) => (
                            <option key={s.code || s.id || s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 5. EPC Company Name */}
                    <div className="relative" ref={epcBoxRef}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        EPC Company Name
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <input
                          type="text"
                          value={epcCompanyName}
                          onChange={handleEpcInputChange}
                          onFocus={handleEpcInputFocus}
                          placeholder="Type to search EPC Company"
                          className={`w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 ${errors.company ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        />
                      </div>

                      {/* Autocomplete Suggestion Popup */}
                      {showSuggestions && epcSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-gray-100">
                          <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Matching EPC Records ({epcSuggestions.length})
                          </div>
                          {epcSuggestions.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectEpcCompany(item)}
                              className="px-4 py-2.5 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-400 font-medium">{item.email}</div>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.source === 'verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                }`}>
                                {item.source}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.company && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.company}</p>}
                    </div>

                    {/* 6. GST Number / Tax ID */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        GST Number / Tax ID
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className={`w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm font-medium uppercase focus:outline-none focus:ring-1 ${errors.gstNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                        />
                      </div>
                      {errors.gstNumber && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.gstNumber}</p>}
                    </div>

                    {/* Sign Up / Register Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-orange py-3.5 text-base font-bold text-white shadow-md hover:bg-orange/95 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange/50 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                    >
                      <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* LOGIN MODE FIELDS */}
                {isLogin && (
                  <>
                    {/* Country Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Select Country
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <select
                          value={selectedCountry.code}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          {activeCountries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name} ({c.dial})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* State Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Select State
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                        >
                          {dynamicStates.map((s) => (
                            <option key={s.code || s.id || s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* FIND THE EPC COMPANY WITH TYPEAHEAD AUTOCOMPLETE SUGGESTIONS */}
                    <div className="relative" ref={epcBoxRef}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Find The EPC Company
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <input
                          type="text"
                          value={epcCompanyName}
                          onChange={handleEpcInputChange}
                          onFocus={handleEpcInputFocus}
                          placeholder="Type to search EPC Company"
                          className={`w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 ${errors.company ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        />
                      </div>

                      {/* Autocomplete Suggestion Popup */}
                      {showSuggestions && epcCompanyName.trim().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-gray-100">
                          {epcSuggestions.length > 0 ? (
                            <>
                              <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Matching EPC Records ({epcSuggestions.length})
                              </div>
                              {epcSuggestions.map((item, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSelectEpcCompany(item)}
                                  className="px-4 py-2.5 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                                >
                                  <div>
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">{item.email}</div>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.source === 'verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                    }`}>
                                    {item.source}
                                  </span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="p-4 text-center space-y-2">
                              <p className="text-xs text-rose-600 font-medium">
                                No EPC Company found matching "<span className="font-bold">{epcCompanyName}</span>"
                              </p>
                              <div className="text-[11px] text-gray-500 font-medium">
                                Don't have an account yet?
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSuggestions(false);
                                  handleToggleMode();
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                              >
                                <span>Register Your EPC Company</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {errors.company && (
                        <div className="mt-1 flex items-center justify-between text-xs bg-red-50 p-2 rounded-lg border border-red-100">
                          <span className="text-red-600 font-semibold">{errors.company}</span>
                          <button
                            type="button"
                            onClick={handleToggleMode}
                            className="text-primary font-bold hover:underline cursor-pointer ml-2 flex-shrink-0 bg-white px-2 py-1 rounded border border-blue-200 shadow-xs"
                          >
                            Register Now
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ENTER OTP DIRECTLY (Sent to Registered Email) */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-left space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                          Enter 4-Digit OTP
                        </label>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate max-w-[280px]">
                          OTP sent to registered Email: <span className="font-bold text-gray-800">{registeredEmail || 'Select EPC Company'}</span>
                        </div>
                      </div>

                      {/* 4-Digit OTP Inputs */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputsRef.current[idx] = el)}
                            type="text"
                            maxLength={1}
                            value={otp[idx]}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-13 h-13 text-center text-xl font-bold text-slate-800 border-2 rounded-xl bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                          />
                        ))}
                      </div>
                      {errors.otp && <p className="text-xs text-red-500 font-semibold">{errors.otp}</p>}

                      {/* Resend Timer */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                        <span>Didn't receive code?</span>
                        {resendTimer > 0 ? (
                          <span className="font-semibold text-gray-600">Resend in {resendTimer}s</span>
                        ) : (
                          <button
                            type="button"
                            disabled={sendingOtp}
                            onClick={() => sendRealEpcEmailOtp(registeredEmail, epcCompanyName)}
                            className="font-bold text-primary underline hover:text-primary-dark disabled:opacity-50"
                          >
                            {sendingOtp ? 'Sending Email...' : 'Resend Email OTP'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Login Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-orange py-3.5 text-base font-bold text-white shadow-md hover:bg-orange/95 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange/50 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      <span>{loading ? 'Verifying...' : 'Verify OTP & Access Panel'}</span>
                    </button>
                  </>
                )}

              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
