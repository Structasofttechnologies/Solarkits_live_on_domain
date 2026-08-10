import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import ToggleButton from "@/components/ToggleButton";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import { setAlert } from "@/features/alert.slice";
import {
  FiShield,
  FiGrid,
  FiSearch,
  FiClock,
  FiBriefcase,
  FiLayers,
  FiUserCheck,
  FiCornerDownRight,
  FiAlertCircle,
  FiSave,
  FiArrowLeft,
  FiFile,
  FiMapPin,
  FiChevronDown,
  FiChevronRight,
  FiPlus as FiPlusIcon,
  FiSettings,
  FiGlobe
} from "react-icons/fi";
import PageHeader from "@/components/PageHeader";
import DropdownWithSearchInput from "@/components/DropdownWithSearchInput";


export default function RoleDetails({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: role_id } = useParams();
  const API = import.meta.env.VITE_API_URL;

  const [viewRole, setViewRole] = useState(null);
  const [viewRoleLoading, setViewRoleLoading] = useState(true);
  const [allPanels, setAllPanels] = useState([]);
  const [allLevels, setAllLevels] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [activeCountrySaaSProducts, setActiveCountrySaaSProducts] = useState(null);
  const [selectedModuleLevelId, setSelectedModuleLevelId] = useState("");

  const getPanelsWithProducts = async () => {
    try {
      const res = await axios.get(`${API}/panels?unique_id=${moduleUniqueId}&req_for=view`, {
        headers: authHeaderObj()
      });
      setAllPanels(res.data.data || []);
    } catch (error) {
      console.error("Error loading panels with products:", error);
    }
  };

  const getLevels = async () => {
    try {
      const res = await axios.get(`${API}/roles/levels?unique_id=${moduleUniqueId}&req_for=view`, {
        headers: authHeaderObj()
      });
      setAllLevels(res.data.data || []);
    } catch (error) {
      console.error("Error loading levels:", error);
    }
  };

  const getActiveCountries = async () => {
    try {
      const res = await axios.get(`${API}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`, {
        headers: authHeaderObj()
      });
      setCountries(res.data.countries || []);
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  };

  const getActiveCountrySaaSProducts = async (countryId) => {
    try {
      const res = await axios.get(`${API}/roles/country-saas-products/${countryId}?unique_id=${moduleUniqueId}&req_for=view`, {
        headers: authHeaderObj()
      });
      setActiveCountrySaaSProducts(res.data.data || []);
    } catch (error) {
      console.error("Error loading country active SaaS products:", error);
      setActiveCountrySaaSProducts([]);
    }
  };

  const getRoleDetails = async (id) => {
    setViewRoleLoading(true);
    try {
      const res = await axios.get(`${API}/roles/${id}?unique_id=${moduleUniqueId}&req_for=view`, {
        headers: authHeaderObj()
      });
      setViewRole(res.data.data);
    } catch (error) {
      console.error("Error fetching role details:", error);
      dispatch(
        setAlert({
          type: "error",
          message: error.response?.data?.message || "Failed to load role details.",
          duration: 4000
        })
      );
      if (error.response?.status === 404) {
        navigate('/admin-panel/settings/role-settings/role-based-access-control');
      }
    } finally {
      setViewRoleLoading(false);
    }
  };

  useEffect(() => {
    getPanelsWithProducts();
    getActiveCountries();
    getLevels();
    if (role_id) getRoleDetails(role_id);
  }, [role_id]);

  useEffect(() => {
    if (viewRole) {
      if (viewRole.level_id) {
        setSelectedModuleLevelId(viewRole.level_id.toString());
      }
      if (viewRole.department_level === 'country') {
        if (viewRole.country_id) {
          setSelectedCountryId(viewRole.country_id);
        } else if (viewRole.department_country_ids && viewRole.department_country_ids.length > 0) {
          const isValidSelected = viewRole.department_country_ids.some(
            cId => cId?.toString() === selectedCountryId?.toString()
          );
          if (!isValidSelected) {
            setSelectedCountryId(viewRole.department_country_ids[0]);
          }
        }
      } else {
        setSelectedCountryId(null);
        setActiveCountrySaaSProducts(null);
      }
    }
  }, [viewRole]);

  useEffect(() => {
    if (selectedCountryId) {
      getActiveCountrySaaSProducts(selectedCountryId);
    } else {
      setActiveCountrySaaSProducts(null);
    }
  }, [selectedCountryId]);

  const [allModules, setAllModules] = useState([]);
  const [assignedModules, setAssignedModules] = useState([]);
  const [unassignedModules, setUnassignedModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [savingModules, setSavingModules] = useState(false);
  const [unassignConfirmation, setUnassignConfirmation] = useState({
    isOpen: false,
    module: null,
    otp: "",
    isLoading: false,
    otpMode: false,
    message: ""
  });

  const loadModules = async () => {
    if (!viewRole) return;
    const level_id = selectedModuleLevelId || viewRole.level_id;
    
    let panel_id = viewRole.panels && viewRole.panels.length > 0
      ? viewRole.panels.map(p => p.id).join(',')
      : viewRole.panel_id;

    if (viewRole.name === 'Super Admin') {
      if (allPanels.length === 0 || allLevels.length === 0) return; // Wait for panels and levels to load
      panel_id = allPanels.map(p => p.id || p._id).join(',');
    }

    if (!level_id || !panel_id) return;
    setModulesLoading(true);
    try {
      let modules = [];
      if (viewRole.name === 'Super Admin') {
        const requests = allLevels.map(l => 
          axios.get(`${API}/modules/${l.id || l._id}/${panel_id}?unique_id=${moduleUniqueId}&req_for=view`, {
            headers: authHeaderObj(),
          })
        );
        const responses = await Promise.all(requests);
        responses.forEach(res => {
          modules.push(...(res.data.data || []));
        });
      } else {
        const res = await axios.get(`${API}/modules/${level_id}/${panel_id}?unique_id=${moduleUniqueId}&req_for=view`, {
          headers: authHeaderObj(),
        });
        modules = res.data.data || [];
      }

      // Filter modules by role panels and saas products bounds
      const filteredModules = viewRole.name === 'Super Admin'
        ? modules 
        : (!viewRole.panels || viewRole.panels.length === 0)
          ? modules
          : modules.filter(m => {
              const mPanelId = (m.panel_id?._id || m.panel_id)?.toString();
              const rolePanel = viewRole.panels?.find(p => p.id?.toString() === mPanelId);
              if (!rolePanel) return false;

              if (m.dashboard_context === 'product') {
                const mProdId = (m.saas_product_id?._id || m.saas_product_id || m.dashboard_type_id?._id || m.dashboard_type_id)?.toString();
                
                // If there is an active country SaaS products filter, check if product is active
                if (selectedCountryId && activeCountrySaaSProducts) {
                  if (!activeCountrySaaSProducts.includes(mProdId)) {
                    return false;
                  }
                }
                
                return rolePanel.saas_product_ids?.some(spId => spId?.toString() === mProdId);
              }

              return true; // default dashboard context modules are always allowed if the panel is assigned
            });

      // map assigned modules by module_id
      const assignedMap = {};
      if (viewRole.is_system) {
        // System role has full permissions on all filtered modules
        filteredModules.forEach(m => {
          assignedMap[m.id] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
        });
      } else {
        (viewRole.assigned_modules || []).forEach(a => {
          assignedMap[a.module_id || a.id] = a;
        });
      }

      // Separate assigned and unassigned modules
      const assigned = [];
      const unassigned = [];
      const mappedAll = [];

      filteredModules.forEach(m => {
        const assigned_module = assignedMap[m.id];
        const mappedNode = {
          id: m.id,
          name: m.name || m.module_name || m.module_label || m.title || m.display_name || m.name,
          can_view: assigned_module ? !!assigned_module.can_view : false,
          can_add: assigned_module ? !!assigned_module.can_add : false,
          can_edit: assigned_module ? !!assigned_module.can_edit : false,
          can_delete: assigned_module ? !!assigned_module.can_delete : false,
          isAssigned: !!assigned_module,
          raw: m,
          parent_id: m.parent_id || m.parent_module_id,
          parent_module_name: m.parent_module_name
        };

        mappedAll.push(mappedNode);

        if (assigned_module) {
          assigned.push(mappedNode);
        } else {
          unassigned.push(mappedNode);
        }
      });

      setAllModules(mappedAll);
      setAssignedModules(assigned);
      setUnassignedModules(unassigned);
    } catch (err) {
      console.error('Error fetching modules:', err);
      dispatch(setAlert({ type: 'error', message: 'Failed to load modules.', duration: 4000 }));
    } finally {
      setModulesLoading(false);
    }
  };

  // Search State
  const [assignedSearchQuery, setAssignedSearchQuery] = useState("");
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState("");

  useEffect(() => {
    loadModules();
  }, [viewRole, activeCountrySaaSProducts, allPanels, allLevels, selectedCountryId, selectedModuleLevelId]);

  const togglePermission = (moduleId, permissionKey) => {
    const moduleToUpdate = assignedModules.find(m => m.id === moduleId);
    if (!moduleToUpdate) return;

    const newValue = !moduleToUpdate[permissionKey];

    // If enabling a permission, check if parent has it enabled
    if (newValue) {
      if (moduleToUpdate.parent_id) {
        const parentModule = assignedModules.find(m => m.id === moduleToUpdate.parent_id);
        if (parentModule && !parentModule[permissionKey]) {
          dispatch(setAlert({
            type: 'warning',
            message: `Cannot enable '${permissionKey.replace('can_', '')}' permission. Parent module '${parentModule.name}' does not have this permission.`,
            duration: 5000
          }));
          return;
        }
      }
    }

    setAssignedModules(prev => {
      const newAssignedModules = [...prev];
      const moduleIndex = newAssignedModules.findIndex(m => m.id === moduleId);
      if (moduleIndex > -1) {
        newAssignedModules[moduleIndex] = { ...newAssignedModules[moduleIndex], [permissionKey]: newValue };
      }

      // If disabling a permission, cascade to children
      if (!newValue) {
        const childrenMap = {};
        newAssignedModules.forEach(m => {
          if (m.parent_id) {
            if (!childrenMap[m.parent_id]) childrenMap[m.parent_id] = [];
            childrenMap[m.parent_id].push(m.id);
          }
        });

        const queue = [moduleId];
        while (queue.length > 0) {
          const currentId = queue.shift();
          (childrenMap[currentId] || []).forEach(childId => {
            const childIndex = newAssignedModules.findIndex(m => m.id === childId);
            if (childIndex > -1 && newAssignedModules[childIndex][permissionKey]) {
              newAssignedModules[childIndex] = { ...newAssignedModules[childIndex], [permissionKey]: false };
              queue.push(childId);
            }
          });
        }
      }
      return newAssignedModules;
    });
  };

  const handleAssignModule = async (moduleId) => {
    if (!role_id || !moduleId) return;

    const module = allModules.find(m => m.id === moduleId);
    if (module) {
      const parentId = module.parent_id || module.parent_module_id;
      if (parentId) {
        const isParentAssigned = assignedModules.some(m => m.id === parentId);
        if (!isParentAssigned) {
          dispatch(setAlert({ type: 'warning', message: 'Parent module must be assigned first.', duration: 4000 }));
          return;
        }
      }
    }

    setSavingModules(true);
    try {
      await axios.post(`${API}/roles/assign-module/${role_id}/${moduleId}?unique_id=${moduleUniqueId}&req_for=add`, {}, { headers: authHeaderObj() });
      dispatch(setAlert({ type: 'success', message: 'Module assigned successfully', duration: 3000 }));
      // refresh role details
      await getRoleDetails(role_id);
    } catch (err) {
      console.error('Error assigning module:', err);
      dispatch(setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to assign module.', duration: 4000 }));
    } finally {
      setSavingModules(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!role_id) return;
    setSavingModules(true);
    try {
      await axios.put(`${API}/roles/module-permission/${role_id}?unique_id=${moduleUniqueId}&req_for=edit`, { modules: assignedModules }, { headers: authHeaderObj() });
      dispatch(setAlert({ type: 'success', message: 'Module permissions updated successfully', duration: 3000 }));
      // refresh role details
      await getRoleDetails(role_id);
    } catch (err) {
      console.error('Error saving permissions:', err);
      dispatch(setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update permissions.', duration: 4000 }));
    } finally {
      setSavingModules(false);
    }
  };

  const handleUnassignClick = (moduleId) => {
    const module = assignedModules.find(m => m.id === moduleId);

    // Find descendants
    const childrenMap = {};
    allModules.forEach(m => {
      const pid = m.raw?.parent_id || m.parent_id;
      if (pid) {
        if (!childrenMap[pid]) childrenMap[pid] = [];
        childrenMap[pid].push(m.id);
      }
    });

    const descendants = [];
    const queue = [moduleId];
    while (queue.length > 0) {
      const current = queue.shift();
      if (childrenMap[current]) {
        childrenMap[current].forEach(cid => {
          descendants.push(cid);
          queue.push(cid);
        });
      }
    }

    const assignedIds = new Set(assignedModules.map(m => m.id));
    const assignedDescendants = descendants.filter(d => assignedIds.has(d));

    let message = "Are you sure you want to unassign this module? This action requires OTP verification.";
    if (assignedDescendants.length > 0) {
      message = `Warning: This module has ${assignedDescendants.length} assigned child module(s). Unassigning it will automatically unassign all child modules. This action requires OTP verification.`;
    }

    setUnassignConfirmation({
      isOpen: true,
      module: module,
      otp: "",
      isLoading: false,
      otpMode: false,
      message: message
    });
  };

  const handleConfirmUnassignStep1 = async () => {
    if (!unassignConfirmation.module) return;

    setUnassignConfirmation(prev => ({ ...prev, isLoading: true }));
    try {
      await axios.post(`${API}/roles/send-otp-unassign-module?unique_id=${moduleUniqueId}&req_for=edit`, {
        role_id: role_id,
        module_id: unassignConfirmation.module.id
      }, { headers: authHeaderObj() });

      dispatch(setAlert({ type: 'success', message: 'OTP sent to your email', duration: 3000 }));

      // Switch to OTP mode
      setUnassignConfirmation(prev => ({
        ...prev,
        otpMode: true,
        isLoading: false,
        otp: ""
      }));
    } catch (err) {
      console.error('Error sending OTP:', err);
      dispatch(setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to send OTP.', duration: 4000 }));
      setUnassignConfirmation(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleConfirmUnassignStep2 = async (otp) => {
    if (!role_id || !unassignConfirmation.module?.id || !otp) {
      dispatch(setAlert({ type: 'error', message: 'OTP is required', duration: 3000 }));
      return;
    }

    setUnassignConfirmation(prev => ({ ...prev, isLoading: true }));
    try {
      await axios.post(`${API}/roles/unassign-module/${role_id}?unique_id=${moduleUniqueId}&req_for=edit`, {
        module_id: unassignConfirmation.module.id,
        otp: otp
      }, { headers: authHeaderObj() });

      dispatch(setAlert({ type: 'success', message: 'Module unassigned successfully', duration: 3000 }));
      setUnassignConfirmation({
        isOpen: false,
        module: null,
        otp: "",
        isLoading: false,
        otpMode: false,
        message: ""
      });
      // refresh role details
      await getRoleDetails(role_id);
    } catch (err) {
      console.error('Error unassigning module:', err);
      dispatch(setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to unassign module.', duration: 4000 }));
    } finally {
      setUnassignConfirmation(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelUnassign = () => {
    setUnassignConfirmation({
      isOpen: false,
      module: null,
      otp: "",
      isLoading: false,
      otpMode: false,
      message: ""
    });
  };

  // Search and Filter Logic
  const filteredUnassignedModules = unassignedModules.filter(module =>
    module.name.toLowerCase().includes(unassignedSearchQuery.toLowerCase())
  );

  const filteredAssignedModules = assignedModules.filter(module =>
    module.name.toLowerCase().includes(assignedSearchQuery.toLowerCase())
  );

  // --- Tree Rendering Logic ---

  const buildGroupedTree = (flatModules) => {
    if (!viewRole) return [];

    const roots = [];
    const rolePanels = viewRole.name === 'Super Admin' 
      ? allPanels.map(p => ({
          id: p.id || p._id,
          name: p.name,
          saas_product_ids: p.products?.map(prod => prod.id || prod._id) || []
        }))
      : (viewRole.panels || []);
    
    rolePanels.forEach(panel => {
      const panelNode = {
        id: `panel-${panel.id}`,
        name: panel.name,
        isPanelNode: true,
        panel_id: panel.id,
        children: []
      };

      const panelModules = flatModules.filter(m => {
        const mPanelId = (m.raw?.panel_id?._id || m.raw?.panel_id || m.panel_id)?.toString();
        return mPanelId === panel.id?.toString();
      });

      // Group panelModules by level_id dynamically
      const modulesByLevel = {};
      panelModules.forEach(m => {
        const lvlId = (m.raw?.level_id?._id || m.raw?.level_id || m.level_id)?.toString() || 'unknown';
        if (!modulesByLevel[lvlId]) {
          modulesByLevel[lvlId] = [];
        }
        modulesByLevel[lvlId].push(m);
      });

      Object.entries(modulesByLevel).forEach(([lvlId, levelModules]) => {
        const levelObj = allLevels.find(l => (l.id || l._id)?.toString() === lvlId);
        const levelName = levelObj ? levelObj.name : (lvlId === viewRole.level_id?.toString() ? viewRole.level_name : 'Level');

        const levelNode = {
          id: `level-${panel.id}-${lvlId}`,
          name: levelName,
          isLevelNode: true,
          panel_id: panel.id,
          children: []
        };

        // 1. Build module map and nest parent/children within levelModules
        const moduleMap = {};
        levelModules.forEach(m => {
          moduleMap[m.id] = { ...m, children: [] };
        });

        const rootModules = [];
        levelModules.forEach(m => {
          const parentId = m.parent_id || m.raw?.parent_module_id?._id || m.raw?.parent_module_id || m.raw?.parent_id;
          if (parentId && moduleMap[parentId]) {
            moduleMap[parentId].children.push(moduleMap[m.id]);
          } else {
            rootModules.push(moduleMap[m.id]);
          }
        });

        // 2. Handle default context root modules
        const defaultModules = rootModules.filter(m => m.raw?.dashboard_context !== 'product');
        const defaultNode = {
          id: `default-${panel.id}-${lvlId}`,
          name: "Default Dashboard Context",
          isProductNode: true,
          panel_id: panel.id,
          children: defaultModules
        };
        levelNode.children.push(defaultNode);

        // 3. Handle product context modules grouped by product
        const productIds = (panel.saas_product_ids || []).filter(prodId => {
          if (selectedCountryId && activeCountrySaaSProducts) {
            return activeCountrySaaSProducts.includes(prodId.toString());
          }
          return true;
        });
        productIds.forEach(prodId => {
          const panelObj = allPanels.find(p => (p.id || p._id)?.toString() === panel.id?.toString());
          const prodObj = panelObj?.products?.find(p => (p.id || p._id)?.toString() === prodId?.toString());
          const prodName = prodObj ? `${prodObj.name} Product Context` : `Product ${prodId} Product Context`;

          const productNode = {
            id: `product-${panel.id}-${lvlId}-${prodId}`,
            name: prodName,
            isProductNode: true,
            productId: prodId,
            panel_id: panel.id,
            children: []
          };

          const productModules = rootModules.filter(m => {
            const mProdId = (m.raw?.saas_product_id?._id || m.raw?.saas_product_id || m.raw?.dashboard_type_id?._id || m.raw?.dashboard_type_id || m.saas_product_id)?.toString();
            return m.raw?.dashboard_context === 'product' && mProdId === prodId?.toString();
          });

          productNode.children.push(...productModules);
          levelNode.children.push(productNode);
        });

        if (levelNode.children.length > 0) {
          panelNode.children.push(levelNode);
        }
      });

      roots.push(panelNode);
    });

    return roots;
  };

  const ModuleTreeItem = ({ node, depth = 0, type = "assigned" }) => {
    const isPanel = !!node.isPanelNode;
    const isProduct = !!node.isProductNode;
    const isLevel = !!node.isLevelNode;
    const isModule = !isPanel && !isProduct && !isLevel;

    const [isExpanded, setIsExpanded] = useState(
      depth < 3 || !!assignedSearchQuery || !!unassignedSearchQuery
    );
    const hasChildren = node.children && node.children.length > 0;

    const nodeType = isPanel ? 'panel' : isLevel ? 'level' : isProduct ? 'architecture' : 'module';
    const icons = {
      panel:        <FiGrid size={16} />,
      level:        <FiMapPin size={14} />,
      architecture: <FiSettings size={14} />,
      module:       <FiFile size={14} />
    };
    const colors = {
      panel:        'text-primary bg-primary/10 border-primary/20',
      level:        'text-amber-500 bg-amber-500/10 border-amber-500/20',
      architecture: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      module:       'text-text-muted bg-surface/50 border-border'
    };
    const typeLabels = { 
      panel:        'Panel', 
      level:        'Level', 
      architecture: 'Context', 
      module:       'Module' 
    };

    return (
      <div className="space-y-2">
        <div
          className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
            isExpanded && hasChildren
              ? 'bg-surface border-border shadow-sm shadow-primary/5'
              : 'bg-transparent border-transparent hover:bg-surface/40'
          }`}
          style={{ marginLeft: `${depth * 28}px` }}
        >
          {depth > 0 && (
            <div className="absolute left-[-18px] top-1/2 -translate-y-1/2 w-4 h-px bg-border group-hover:bg-primary/40 transition-colors" />
          )}

          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(v => !v)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                isExpanded
                  ? 'bg-primary text-white scale-105 shadow-primary/20'
                  : 'bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30'
              }`}
            >
              {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
            </div>
          )}

          {/* Type Icon */}
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner shrink-0 ${colors[nodeType]}`}>
            {icons[nodeType]}
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-text-primary text-sm capitalize tracking-tight leading-none group-hover:text-primary transition-colors truncate">
              {node.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-black text-text-muted capitalize tracking-[0.2em] leading-none px-1.5 py-0.5 rounded bg-bg border border-border">
                {typeLabels[nodeType]}
              </span>
            </div>
          </div>

          {/* Module Actions */}
          {isModule && (
            <div className="flex items-center gap-3 shrink-0">
              {type === 'assigned' ? (
                !node.isAssigned ? (
                  <span className="text-[9px] font-black text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Parent (Unassigned)
                  </span>
                ) : (
                  <>
                    <div className="hidden sm:flex items-center gap-4">
                      {[['can_view', 'View', true], ['can_add', 'Add', false], ['can_edit', 'Edit', false], ['can_delete', 'Delete', false]].map(([perm, label, locked]) => (
                        <div key={perm} className="flex flex-col items-center gap-1">
                          <span className="text-[8px] text-text-muted uppercase font-black tracking-widest">{label}</span>
                          <ToggleButton
                            checked={!!node[perm]}
                            onChange={() => togglePermission(node.id, perm)}
                            disabled={locked || !!viewRole?.is_protected}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                    {!viewRole?.is_protected && (
                      <Button onClick={() => handleUnassignClick(node.id)} variant="danger" size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Unassign
                      </Button>
                    )}
                  </>
                )
              ) : (
                node.isAssigned ? (
                  <span className="text-[9px] font-black text-success bg-success/5 border border-success/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    Assigned
                  </span>
                ) : (
                  !viewRole?.is_protected && (
                    <Button onClick={() => handleAssignModule(node.id)} loading={savingModules} variant="primary" size="sm"
                      leftIcon={<FiPlusIcon />} className="bg-linear-120 from-primary to-primary-end">
                      Assign
                    </Button>
                  )
                )
              )}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="relative">
            <div
              className="absolute top-0 bottom-4 w-px bg-gradient-to-b from-border/60 via-border/40 to-transparent"
              style={{ left: `${depth * 28 + 13.5}px` }}
            />
            <div className="space-y-2 py-1">
              {node.children.map(child => (
                <ModuleTreeItem key={child.id} node={child} depth={depth + 1} type={type} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getFilteredTree = (flatList, query, isAssignedTree) => {
    const groupedTree = buildGroupedTree(flatList, isAssignedTree);
    if (!query) return groupedTree;

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const filteredChildren = filterNodes(node.children);
        const matchesSearch = node.name.toLowerCase().includes(query.toLowerCase());

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    };

    return filterNodes(groupedTree);
  };



  if (viewRoleLoading) return <Loader text="Loading role details..." />;
  if (!viewRole) {
    return (
      <div className="min-h-screen">
        <div className="card shadow-sm p-8 text-center">
          <div className="w-20 h-20 rounded-xl bg-linear-to-br from-primary to-primary-end flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-white text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Role Not Found</h2>
          <p className="text-text-secondary mb-6">The role you are looking for does not exist or could not be loaded.</p>
          <Button 
            onClick={() => navigate('/admin-panel/settings/role-settings/role-based-access-control')} 
            variant="primary"
            leftIcon={<FiArrowLeft />}
            className="bg-linear-120 from-primary to-primary-end"
          >
            Back to Roles List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={viewRole.name}
        subtitle="View and manage role permissions and module assignments"
        icon={FiShield}
        showBackButton={true}
        onBackClick={() => navigate('/admin-panel/settings/role-settings/role-based-access-control')}
        breadcrumbOverrides={{ [role_id]: viewRole.name }}
        stats={[
          { label: "Assigned", value: assignedModules.length, description: "Modules" },
          { label: "Available", value: unassignedModules.length, description: "To assign" },
          { label: "Department", value: viewRole.department_name, description: "Organization" },
          { label: "Level", value: viewRole.level_name, description: "Hierarchy" }
        ]}
      />

      {/* Role Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary">Department</h3>
          </div>
          <p className="text-text-primary text-lg font-medium">{viewRole.department_name}</p>
        </div>

        <div className="card shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
              <FiLayers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary">Level</h3>
          </div>
          <p className="text-text-primary text-lg font-medium capitalize">{viewRole.level_name}</p>
        </div>

        <div className="card shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
              <FiUserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary">Parent Role</h3>
          </div>
          <p className="text-text-primary text-lg font-medium">{viewRole.parent_role_name || 'No Parent Role'}</p>
        </div>

        <div className="card shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
              <FiCornerDownRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary">Inherits Modules</h3>
          </div>
          <p className="text-text-primary text-lg font-medium">{viewRole.access_modules_by_parent ? 'Yes' : 'No'}</p>
        </div>

        {viewRole.department_level === 'country' && (
          <div className="card shadow-sm p-6 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
                <FiGlobe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-text-primary">Geographical Country Scope</h3>
            </div>
            {viewRole.country_id ? (
              <div>
                <p className="text-text-primary text-lg font-medium">
                  {countries.find(c => (c.id || c._id)?.toString() === viewRole.country_id?.toString())?.name || 'Specific Country'}
                </p>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 block">
                  Restricted Role Scope
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">
                  Universal Country Role (Select country to filter SaaS products)
                </span>
                <DropdownWithSearchInput
                  options={countries
                    .filter(c => viewRole.department_country_ids?.includes(c.id || c._id))
                    .map(c => ({ value: c.id || c._id, text: c.name }))
                  }
                  value={selectedCountryId}
                  onChange={setSelectedCountryId}
                  placeholder="Select country..."
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        <div className="card shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
              <FiGrid className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-text-primary">Authorized Panel Scopes</h3>
          </div>
          <div className="flex flex-col gap-3">
            {(() => {
              const displayPanels = viewRole.name === 'Super Admin' 
                ? allPanels.map(p => ({
                    id: p.id || p._id,
                    name: p.name,
                    saas_product_ids: p.products?.map(prod => prod.id || prod._id) || []
                  }))
                : (viewRole.panels || []);

              if (displayPanels.length > 0) {
                return displayPanels.map(panel => {
                  const panelObj = allPanels.find(p => (p.id || p._id)?.toString() === panel.id?.toString());
                  const productNames = panel.saas_product_ids?.map(spId => {
                    const prod = panelObj?.products?.find(p => (p.id || p._id)?.toString() === spId?.toString());
                    return prod ? prod.name : null;
                  }).filter(Boolean);

                  return (
                    <div key={panel.id} className="flex flex-col gap-1.5 p-3 rounded-2xl border border-border bg-linear-to-r from-primary/5 to-transparent">
                      <span className="text-sm font-semibold text-text-primary capitalize flex items-center gap-1.5">
                        <FiGrid className="text-primary w-4 h-4" />
                        {panel.name}
                      </span>
                      {productNames && productNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-5">
                          {productNames.map(name => (
                            <span key={name} className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded-md border border-success/20 capitalize">
                              {name} Product
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              }

              return <span className="text-text-muted text-sm font-medium">None</span>;
            })()}
          </div>
        </div>
      </div>

      {/* Unassigned Modules Section */}
      {!modulesLoading && (
        <div className="card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="p-5">
            <div className="flex justify-end mb-4">
              <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <FiClock size={10} />
                Available modules
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
                <FiGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Available Modules</h3>
                <p className="text-text-secondary text-sm">Modules that can be assigned to this role</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                {filteredUnassignedModules.length} Available
              </span>
            </div>

            {/* Level Selector Dropdown */}
            {(() => {
              const roleLevelObj = allLevels.find(l => (l.id || l._id)?.toString() === viewRole?.level_id?.toString());
              const roleScopePriority = roleLevelObj ? roleLevelObj.scope_priority : 1;
              const filteredLevelsForAssign = allLevels.filter(l => l.scope_priority >= roleScopePriority);

              if (viewRole && viewRole.name !== 'Super Admin' && filteredLevelsForAssign.length > 1) {
                return (
                  <div className="mb-6 flex flex-col gap-1.5 p-4 rounded-2xl bg-surface-hover/20 border border-border/50">
                    <label className="text-xs font-black text-text-muted uppercase tracking-wider">Select Module Level</label>
                    <div className="w-full sm:w-64">
                      <DropdownWithSearchInput
                        options={filteredLevelsForAssign.map(l => ({ value: (l.id || l._id).toString(), text: l.name.toUpperCase() }))}
                        value={selectedModuleLevelId}
                        onChange={(val) => setSelectedModuleLevelId(val)}
                        placeholder="Select module level..."
                        className="w-full font-semibold"
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="relative mb-6">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary z-10" size={16} />
              <input
                type="text"
                value={unassignedSearchQuery}
                onChange={(e) => setUnassignedSearchQuery(e.target.value)}
                placeholder="Search available modules..."
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>

            {filteredUnassignedModules.length > 0 ? (
              <div className="space-y-2">
                {getFilteredTree(allModules, unassignedSearchQuery, false).map(node => (
                  <ModuleTreeItem key={node.id} node={node} type="unassigned" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-secondary border-2 border-dashed border-border rounded-xl">
                <FiGrid className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                <p className="text-lg font-medium">
                  {unassignedModules.length === 0 ? "All modules are assigned" : "No modules match your search"}
                </p>
                <p className="text-sm mt-1">
                  {unassignedModules.length === 0 
                    ? "No more modules available for this role" 
                    : "Try adjusting your search query"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assigned Modules Section */}
      <div className="card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="p-5">
          <div className="flex justify-end mb-4">
            <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
              <FiClock size={10} />
              Manage permissions
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Assigned Modules</h3>
              <p className="text-text-secondary text-sm">Configure permissions for assigned modules</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              {filteredAssignedModules.length} Assigned
            </span>
          </div>

          {modulesLoading ? (
            <div className="py-12"><Loader text="Loading modules..." /></div>
          ) : (
            <>
              <div className="relative mb-6">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary z-10" size={16} />
                <input
                  type="text"
                  value={assignedSearchQuery}
                  onChange={(e) => setAssignedSearchQuery(e.target.value)}
                  placeholder="Search assigned modules..."
                  className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>

              {filteredAssignedModules.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {getFilteredTree(allModules, assignedSearchQuery, true).map(node => (
                      <ModuleTreeItem key={node.id} node={node} type="assigned" />
                    ))}
                  </div>

                  {!viewRole?.is_protected && (
                    <div className="flex justify-end mt-6 pt-4 border-t border-border">
                      <Button 
                        onClick={handleSavePermissions} 
                        loading={savingModules} 
                        variant="primary"
                        size="lg"
                        leftIcon={<FiSave />}
                        className="bg-linear-120 from-primary to-primary-end shadow-lg hover:shadow-xl"
                      >
                        {savingModules ? 'Saving...' : 'Save Permissions'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-text-secondary border-2 border-dashed border-border rounded-xl">
                  <FiShield className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                  <p className="text-lg font-medium">
                    {assignedModules.length === 0 ? "No modules assigned" : "No assigned modules match your search"}
                  </p>
                  <p className="text-sm mt-1">
                    {assignedModules.length === 0 
                      ? "Assign modules from the Available Modules section above" 
                      : "Try adjusting your search query"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Unassign Module Confirmation Popup */}
      <ConfirmationPopup
        isOpen={unassignConfirmation.isOpen}
        title={unassignConfirmation.otpMode ? `Verify OTP: ${unassignConfirmation.module?.name}` : `Unassign Module: ${unassignConfirmation.module?.name}`}
        message={unassignConfirmation.otpMode ? "Please enter the OTP sent to your email to confirm module unassignment." : unassignConfirmation.message}
        mode={unassignConfirmation.otpMode ? "otp" : "text"}
        variant="warning"
        onConfirm={unassignConfirmation.otpMode ? handleConfirmUnassignStep2 : handleConfirmUnassignStep1}
        onCancel={handleCancelUnassign}
        confirmText={unassignConfirmation.otpMode ? "Confirm Unassign" : "Send OTP"}
        cancelText={unassignConfirmation.otpMode ? "Cancel" : "No, Keep"}
        otp={unassignConfirmation.otp}
        onOtpChange={(otp) => setUnassignConfirmation(prev => ({ ...prev, otp }))}
        isLoading={unassignConfirmation.isLoading}
      />
    </div>
  );
}