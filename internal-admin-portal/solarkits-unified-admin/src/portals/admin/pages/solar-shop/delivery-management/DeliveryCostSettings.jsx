import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../features/alert.slice';
import {
  FaSlidersH,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxes,
  FaWarehouse,
  FaFilter,
  FaFileExcel,
  FaDownload,
  FaUpload,
  FaTruck,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaFileCsv,
  FaEdit,
  FaSearch,
} from 'react-icons/fa';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import CustomInput from '../../../components/CustomInput';
import Drawer from '../../../components/Drawer';
import Dialog from '../../../components/Dialog';
import Loader from '../../../components/Loader';
import { deliveryApi } from '../../../api/deliveryApi';
import readXlsxFile from 'read-excel-file';
import axios from 'axios';
import { authHeaderObj } from '../../../app/authHeader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DeliveryCostSettings() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('benchmarks'); // 'benchmarks' | 'kit_rules'

  // Data states
  const [benchmarks, setBenchmarks] = useState([]);
  const [kitRules, setKitRules] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [vehicleMasters, setVehicleMasters] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [kits, setKits] = useState([]);
  const [kitWeights, setKitWeights] = useState({});
  const [loading, setLoading] = useState(false);

  // Hierarchy Filter States for Kit Rule Drawer
  const [industryTypes, setIndustryTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [systemTypes, setSystemTypes] = useState([]);
  const [projectRanges, setProjectRanges] = useState([]);

  const [selectedIndustryType, setSelectedIndustryType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProjectRange, setSelectedProjectRange] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('');

  // Bulk Selection & Edit States (Benchmarks)
  const [selectedBenchmarkIds, setSelectedBenchmarkIds] = useState([]);
  const [editingBenchmarkId, setEditingBenchmarkId] = useState(null);

  // Filters & Search (Kit Rules)
  const [ruleSearchQuery, setRuleSearchQuery] = useState('');
  const [selectedOrderTypeFilter, setSelectedOrderTypeFilter] = useState('');

  // Bulk Selection & Edit States (Kit Rules)
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [editingRuleId, setEditingRuleId] = useState(null);

  // Benchmark Drawer States
  const [benchDrawerOpen, setBenchDrawerOpen] = useState(false);
  const [entryMode, setEntryMode] = useState('bulk_sheet'); // 'bulk_sheet' | 'single'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsingSheet, setIsParsingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  const [benchForm, setBenchForm] = useState({
    service_provider_id: '',
    warehouse_id: '',
    vehicle_master_id: '',
    state_id: '',
    district_id: '',
    benchmark_cost: '',
    gst_applicable: true,
    gst_rate: 18,
    free_delivery_eligible: false,
    effective_date: new Date().toISOString().split('T')[0],
  });

  // Kit Rule Drawer
  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    kit_id: '',
    order_type: 'loose_order',
    number_of_kits: 1,
    vehicle_master_id: '',
    total_delivery_cost: '',
    per_kit_delivery_cost: '',
    free_delivery: false,
  });

  const showAlert = (message, type = 'success') => {
    dispatch(setAlert({ type, message }));
  };

  const getCleanId = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return String(val._id || val.id || '');
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes, vRes, indRes, catRes, pRes] = await Promise.all([
        deliveryApi.getBenchmarks({
          warehouse_id: selectedWarehouse || null,
          service_provider_id: selectedProviderFilter || null,
        }),
        deliveryApi.getKitRules(),
        deliveryApi.getVehicleMasters(),
        deliveryApi.getIndustryTypes().catch(() => ({ data: [] })),
        deliveryApi.getCategories().catch(() => ({ data: [] })),
        deliveryApi.getServiceProviders().catch(() => ({ data: [] })),
      ]);

      if (bRes.status === 'success') setBenchmarks(bRes.data || []);
      if (rRes.status === 'success') setKitRules(rRes.data || []);
      if (vRes.status === 'success') setVehicleMasters(vRes.data || []);
      if (indRes?.status === 'success' || Array.isArray(indRes?.data)) setIndustryTypes(indRes.data || []);
      if (catRes?.status === 'success' || Array.isArray(catRes?.data)) setCategories(catRes.data || []);
      if (pRes?.status === 'success' || Array.isArray(pRes?.data)) setServiceProviders(pRes.data || []);

      // Load company warehouses, states & kit weights from existing APIs
      const [whRes, stRes, fetchedKits, kwRes] = await Promise.all([
        deliveryApi.getWarehouses().catch(() => ({ data: [] })),
        deliveryApi.getStates().catch(() => ({ data: [] })),
        deliveryApi.getComboKits().catch(() => []),
        deliveryApi.getComboKitWeights().catch(() => ({ data: [] })),
      ]);

      setWarehouses(whRes.data || []);
      setStates(stRes.data || stRes.states || []);
      setKits(Array.isArray(fetchedKits) ? fetchedKits : (fetchedKits?.data || []));

      const wMap = {};
      (kwRes?.data || []).forEach((w) => {
        const kId = String(w.kit_id?._id || w.kit_id || '');
        if (kId) wMap[kId] = Number(w.total_kit_weight_kg || 0);
      });
      setKitWeights(wMap);
    } catch (err) {
      console.error(err);
      showAlert('Failed to load delivery settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedWarehouse, selectedProviderFilter]);

  // Cascading hierarchy handlers
  const handleIndustryChange = async (indId) => {
    setSelectedIndustryType(indId);
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedType('');
    setSelectedProjectRange('');
    setCategories([]);
    setSubcategories([]);
    setSystemTypes([]);
    setProjectRanges([]);

    try {
      const res = await deliveryApi.getCategories(indId || null);
      setCategories(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategoryChange = async (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('');
    setSelectedType('');
    setSelectedProjectRange('');
    setSubcategories([]);
    setSystemTypes([]);
    setProjectRanges([]);

    if (catId) {
      try {
        const res = await deliveryApi.getSubcategories(catId);
        setSubcategories(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubcategoryChange = async (subId) => {
    setSelectedSubcategory(subId);
    setSelectedType('');
    setSelectedProjectRange('');
    setSystemTypes([]);
    setProjectRanges([]);

    if (subId) {
      try {
        const res = await deliveryApi.getSystemTypes(subId);
        setSystemTypes(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleTypeChange = async (typeId) => {
    setSelectedType(typeId);
    setSelectedProjectRange('');
    setProjectRanges([]);

    if (typeId) {
      try {
        const res = await deliveryApi.getProjectRanges(typeId);
        setProjectRanges(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleProjectRangeChange = (rangeId) => {
    setSelectedProjectRange(rangeId);
  };

  const clearHierarchyFilters = () => {
    setSelectedIndustryType('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedType('');
    setSelectedProjectRange('');
    setSubcategories([]);
    setSystemTypes([]);
    setProjectRanges([]);
    deliveryApi.getCategories().then(res => setCategories(res.data || []));
  };

  // Dynamic filter for combo kits based on cascading selections
  const filteredKits = useMemo(() => {
    if (!kits || !Array.isArray(kits)) return [];
    return kits.filter((k) => {
      // 1. Industry Type
      const kitIndId = getCleanId(k.solar_kit_id?.category_id?.industry_type_id?._id || k.solar_kit_id?.category_id?.industry_type_id);
      const matchInd = !selectedIndustryType || kitIndId === selectedIndustryType;

      // 2. Category
      const kitCatId = getCleanId(k.solar_kit_id?.category_id);
      const matchCat = !selectedCategory || kitCatId === selectedCategory;

      // 3. Subcategory
      const kitSubId = getCleanId(k.solar_kit_id?.subcategory_id);
      const matchSub = !selectedSubcategory || kitSubId === selectedSubcategory;

      // 4. System Type
      const kitTypeId = getCleanId(k.solar_kit_id?.type_id);
      const matchType = !selectedType || kitTypeId === selectedType;

      // 5. Project Range
      const kitRangeId = getCleanId(k.project_range_id);
      const matchRange = !selectedProjectRange || kitRangeId === selectedProjectRange;

      return matchInd && matchCat && matchSub && matchType && matchRange;
    });
  }, [kits, selectedIndustryType, selectedCategory, selectedSubcategory, selectedType, selectedProjectRange]);

  // Multi-Field Search Filter across State, District, Price, Warehouse, Vendor, Vehicle
  const filteredBenchmarks = useMemo(() => {
    if (!benchmarks || !Array.isArray(benchmarks)) return [];
    if (!searchQuery.trim()) return benchmarks;

    const q = searchQuery.toLowerCase().trim();
    return benchmarks.filter((b) => {
      const stateName = (b.state_id?.name || '').toLowerCase();
      const districtName = (b.district_id?.name || '').toLowerCase();
      const costStr = String(b.benchmark_cost || '').toLowerCase();
      const whCode = (b.warehouse_id?.warehouse_code || '').toLowerCase();
      const whName = (b.warehouse_id?.name || '').toLowerCase();
      const whAddress = (b.warehouse_id?.address || '').toLowerCase();
      const whCity = (b.warehouse_id?.city || '').toLowerCase();
      const vendorName = (b.service_provider_id?.name || '').toLowerCase();
      const vendorCode = (b.service_provider_id?.provider_code || '').toLowerCase();
      const vehicleName = (b.vehicle_master_id?.name || '').toLowerCase();
      const vehicleMake = (b.vehicle_master_id?.brand_make || '').toLowerCase();

      return (
        stateName.includes(q) ||
        districtName.includes(q) ||
        costStr.includes(q) ||
        whCode.includes(q) ||
        whName.includes(q) ||
        whAddress.includes(q) ||
        whCity.includes(q) ||
        vendorName.includes(q) ||
        vendorCode.includes(q) ||
        vehicleName.includes(q) ||
        vehicleMake.includes(q)
      );
    });
  }, [benchmarks, searchQuery]);

  // Bulk Selection Handlers
  const isAllSelected = useMemo(() => {
    if (filteredBenchmarks.length === 0) return false;
    return filteredBenchmarks.every((b) => selectedBenchmarkIds.includes(b._id));
  }, [filteredBenchmarks, selectedBenchmarkIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredBenchmarks.map((b) => b._id));
      setSelectedBenchmarkIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const currentSet = new Set(selectedBenchmarkIds);
      filteredBenchmarks.forEach((b) => currentSet.add(b._id));
      setSelectedBenchmarkIds(Array.from(currentSet));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedBenchmarkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedBenchmarkIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedBenchmarkIds.length} selected benchmark(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await deliveryApi.bulkDeleteBenchmarks(selectedBenchmarkIds);
      showAlert(res.message || `Successfully deleted ${selectedBenchmarkIds.length} benchmarks.`);
      setSelectedBenchmarkIds([]);
      await loadInitialData();
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Failed to delete selected benchmarks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Safe Kit Dropdown List for Kit Drawer (ensures currently edited kit is selectable)
  const availableKitsForDropdown = useMemo(() => {
    if (!ruleForm.kit_id) return filteredKits;
    const exists = filteredKits.some((k) => getCleanId(k) === ruleForm.kit_id);
    if (!exists) {
      const matchInAll = kits.find((k) => getCleanId(k) === ruleForm.kit_id);
      if (matchInAll) return [matchInAll, ...filteredKits];
    }
    return filteredKits;
  }, [filteredKits, ruleForm.kit_id, kits]);

  // Kit-Wise Rules Filter & Search
  const filteredKitRules = useMemo(() => {
    if (!kitRules || !Array.isArray(kitRules)) return [];
    let list = kitRules;

    if (selectedOrderTypeFilter) {
      list = list.filter((r) => r.order_type === selectedOrderTypeFilter);
    }

    if (ruleSearchQuery.trim()) {
      const q = ruleSearchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const kitName = (r.kit_id?.name || '').toLowerCase();
        const orderType = (r.order_type || '').toLowerCase().replace(/_/g, ' ');
        const vehicleName = (r.vehicle_master_id?.name || '').toLowerCase();
        const minQty = String(r.number_of_kits || '').toLowerCase();
        const totalCost = String(r.total_delivery_cost || '').toLowerCase();
        const perKitCost = String(r.per_kit_delivery_cost || '').toLowerCase();
        const isFree = r.free_delivery ? 'yes free' : 'no';

        const kId = getCleanId(r.kit_id);
        const unitWt = kitWeights[kId] || 0;
        const totalWt = unitWt > 0 ? unitWt * Number(r.number_of_kits || 1) : Number(r.shipment_weight_kg || r.total_weight_kg || 0);
        const weightStr = `${totalWt} kg`.toLowerCase();

        return (
          kitName.includes(q) ||
          orderType.includes(q) ||
          vehicleName.includes(q) ||
          minQty.includes(q) ||
          weightStr.includes(q) ||
          totalCost.includes(q) ||
          perKitCost.includes(q) ||
          isFree.includes(q)
        );
      });
    }

    return list;
  }, [kitRules, ruleSearchQuery, selectedOrderTypeFilter, kitWeights]);

  // Bulk Selection Handlers for Kit Rules
  const isAllRulesSelected = useMemo(() => {
    if (filteredKitRules.length === 0) return false;
    return filteredKitRules.every((r) => selectedRuleIds.includes(r._id));
  }, [filteredKitRules, selectedRuleIds]);

  const handleToggleSelectAllRules = () => {
    if (isAllRulesSelected) {
      const filteredIds = new Set(filteredKitRules.map((r) => r._id));
      setSelectedRuleIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const currentSet = new Set(selectedRuleIds);
      filteredKitRules.forEach((r) => currentSet.add(r._id));
      setSelectedRuleIds(Array.from(currentSet));
    }
  };

  const handleToggleSelectRule = (id) => {
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteKitRules = async () => {
    if (selectedRuleIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRuleIds.length} selected policy rule(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await deliveryApi.bulkDeleteKitRules(selectedRuleIds);
      showAlert(res.message || `Successfully deleted ${selectedRuleIds.length} policy rules.`);
      setSelectedRuleIds([]);
      await loadInitialData();
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Failed to delete selected policy rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBenchmarkDrawer = () => {
    setEditingBenchmarkId(null);
    setBenchForm({
      service_provider_id: '',
      warehouse_id: '',
      vehicle_master_id: '',
      state_id: '',
      district_id: '',
      benchmark_cost: '',
      gst_applicable: true,
      gst_rate: 18,
      free_delivery_eligible: false,
      effective_date: new Date().toISOString().split('T')[0],
    });
    setEntryMode('bulk_sheet');
    setUploadedFileName('');
    setParsedRows([]);
    setSheetError('');
    setDistricts([]);
    setBenchDrawerOpen(true);
  };

  // Open Edit Modal prefilled with benchmark data
  const handleOpenEditModal = async (benchmark) => {
    const stateId = getCleanId(benchmark.state_id);
    const districtId = getCleanId(benchmark.district_id);

    setEditingBenchmarkId(benchmark._id);
    setBenchForm({
      service_provider_id: getCleanId(benchmark.service_provider_id),
      warehouse_id: getCleanId(benchmark.warehouse_id),
      vehicle_master_id: getCleanId(benchmark.vehicle_master_id),
      state_id: stateId,
      district_id: districtId,
      benchmark_cost: benchmark.benchmark_cost !== undefined && benchmark.benchmark_cost !== null ? benchmark.benchmark_cost : '',
      gst_applicable: benchmark.gst_applicable !== undefined ? benchmark.gst_applicable : true,
      gst_rate: benchmark.gst_rate !== undefined ? benchmark.gst_rate : 18,
      free_delivery_eligible: !!benchmark.free_delivery_eligible,
      effective_date: benchmark.effective_date
        ? new Date(benchmark.effective_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });

    setEntryMode('single');
    setUploadedFileName('');
    setParsedRows([]);
    setSheetError('');

    if (stateId) {
      try {
        const res = await deliveryApi.getDistricts(stateId);
        setDistricts(res.data || res.districts || []);
      } catch (err) {
        console.error(err);
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }

    setBenchDrawerOpen(true);
  };

  // Load districts when state changes in benchmark form
  const handleStateChange = async (stateId) => {
    setBenchForm((prev) => ({ ...prev, state_id: stateId, district_id: '' }));
    setParsedRows([]);
    setUploadedFileName('');
    setSheetError('');
    if (!stateId) {
      setDistricts([]);
      return;
    }
    try {
      const res = await deliveryApi.getDistricts(stateId);
      setDistricts(res.data || res.districts || []);
    } catch {
      setDistricts([]);
    }
  };

  // Download prefilled CSV template with state districts
  const handleDownloadTemplate = () => {
    if (!benchForm.state_id || districts.length === 0) {
      showAlert('Please select a State first to download its districts template.', 'error');
      return;
    }
    const selectedState = states.find((s) => s._id === benchForm.state_id);
    const stateName = selectedState ? selectedState.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'State';

    const header = ['District Name', 'Benchmark Transport Cost (₹)'];
    const csvRows = [header.join(',')];

    districts.forEach((d) => {
      csvRows.push(`"${d.name.replace(/"/g, '""')}",""`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Delivery_Benchmark_Template_${stateName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Smart sheet parser for .xlsx, .xls and .csv
  const parseUploadedFile = async (file) => {
    if (!file) return;
    if (!benchForm.state_id || districts.length === 0) {
      showAlert('Please choose State first before uploading sheet.', 'error');
      return;
    }

    setIsParsingSheet(true);
    setSheetError('');
    setUploadedFileName(file.name);

    try {
      let rawRows = [];
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      if (isCsv) {
        const text = await file.text();
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        rawRows = lines.map((line) => {
          const pattern = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches = [];
          let match;
          while ((match = pattern.exec(line)) && match[0] !== '') {
            let val = match[1] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1).replace(/""/g, '"');
            }
            matches.push(val.trim());
            if (pattern.lastIndex >= line.length) break;
          }
          return matches;
        });
      } else {
        rawRows = await readXlsxFile(file);
      }

      if (!rawRows || rawRows.length === 0) {
        setSheetError('The uploaded file contains no data.');
        setParsedRows([]);
        return;
      }

      // Check header row vs data
      const headerRow = rawRows[0].map((c) => (c || '').toString().toLowerCase().trim());

      let districtColIdx = headerRow.findIndex(
        (h) =>
          h.includes('district') ||
          h.includes('dist') ||
          h.includes('zilla') ||
          h.includes('city') ||
          h.includes('location') ||
          h.includes('destination') ||
          h.includes('name')
      );
      let costColIdx = headerRow.findIndex(
        (h) =>
          h.includes('cost') ||
          h.includes('benchmark') ||
          h.includes('rate') ||
          h.includes('price') ||
          h.includes('amount') ||
          h.includes('delivery') ||
          h.includes('transport')
      );

      if (districtColIdx === -1) districtColIdx = 0;
      if (costColIdx === -1) costColIdx = 1;
      if (costColIdx === districtColIdx && rawRows[0].length > 1) {
        costColIdx = districtColIdx === 0 ? 1 : 0;
      }

      const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

      const dataRows = rawRows.slice(1);
      const parsed = dataRows
        .map((row, idx) => {
          const rawDistrict = (row[districtColIdx] || '').toString().trim();
          const rawCostStr = (row[costColIdx] || '').toString().replace(/[₹,\s]/g, '').trim();
          const costNum = parseFloat(rawCostStr);

          if (!rawDistrict && isNaN(costNum)) return null;

          const normRaw = normalize(rawDistrict);
          let matched = districts.find((d) => normalize(d.name) === normRaw);
          if (!matched && normRaw) {
            matched = districts.find(
              (d) => normRaw.includes(normalize(d.name)) || normalize(d.name).includes(normRaw)
            );
          }

          return {
            tempId: `row-${idx}-${Date.now()}`,
            raw_name: rawDistrict,
            district_id: matched?._id || '',
            district_name: matched?.name || rawDistrict || `District #${idx + 1}`,
            benchmark_cost: !isNaN(costNum) && costNum >= 0 ? costNum : '',
            is_matched: !!matched,
            status: matched
              ? (!isNaN(costNum) && costNum > 0 ? 'ready' : 'missing_cost')
              : 'unmatched',
          };
        })
        .filter(Boolean);

      if (parsed.length === 0) {
        setSheetError('No district rows could be extracted from this sheet.');
      }
      setParsedRows(parsed);
    } catch (err) {
      console.error('File parsing error:', err);
      setSheetError(`Failed to read file: ${err.message}`);
    } finally {
      setIsParsingSheet(false);
    }
  };

  const handleUpdateParsedRowCost = (tempId, newCost) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.tempId === tempId) {
          const num = parseFloat(newCost);
          return {
            ...r,
            benchmark_cost: newCost,
            status: r.is_matched ? (num > 0 ? 'ready' : 'missing_cost') : 'unmatched',
          };
        }
        return r;
      })
    );
  };

  const handleRemoveParsedRow = (tempId) => {
    setParsedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const handleSaveBulkBenchmarks = async (e) => {
    e.preventDefault();
    if (!benchForm.service_provider_id) {
      showAlert('Please select Transport Vendor.', 'error');
      return;
    }
    if (!benchForm.warehouse_id) {
      showAlert('Please select Company Warehouse.', 'error');
      return;
    }
    if (!benchForm.vehicle_master_id) {
      showAlert('Please select Vehicle Type.', 'error');
      return;
    }
    if (!benchForm.state_id) {
      showAlert('Please select State.', 'error');
      return;
    }

    const validRows = parsedRows.filter((r) => r.district_id && Number(r.benchmark_cost) > 0);
    if (validRows.length === 0) {
      showAlert('No valid district rows with transport cost found in the sheet to save.', 'error');
      return;
    }

    setIsSavingBulk(true);
    try {
      const payload = {
        service_provider_id: benchForm.service_provider_id,
        warehouse_id: benchForm.warehouse_id,
        vehicle_master_id: benchForm.vehicle_master_id,
        state_id: benchForm.state_id,
        gst_applicable: benchForm.gst_applicable,
        gst_rate: benchForm.gst_rate,
        free_delivery_eligible: benchForm.free_delivery_eligible,
        effective_date: benchForm.effective_date,
        benchmarks: validRows.map((r) => ({
          district_id: r.district_id,
          benchmark_cost: Number(r.benchmark_cost),
        })),
      };

      const res = await deliveryApi.bulkCreateBenchmarks(payload);
      showAlert(res.message || `Successfully saved benchmarks for ${validRows.length} districts.`);
      setBenchDrawerOpen(false);
      loadInitialData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to save benchmarks', 'error');
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleSaveSingleBenchmark = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (
      !benchForm.service_provider_id ||
      !benchForm.warehouse_id ||
      !benchForm.vehicle_master_id ||
      !benchForm.state_id ||
      !benchForm.district_id ||
      benchForm.benchmark_cost === '' ||
      benchForm.benchmark_cost === null
    ) {
      showAlert('Please fill in all benchmark fields (Vendor, Warehouse, Vehicle, State, District, Cost).', 'error');
      return;
    }

    try {
      if (editingBenchmarkId) {
        await deliveryApi.updateBenchmark(editingBenchmarkId, benchForm);
        showAlert('Benchmark transport cost updated successfully.');
      } else {
        await deliveryApi.createBenchmark(benchForm);
        showAlert('Benchmark transport cost configured successfully.');
      }
      setBenchDrawerOpen(false);
      setEditingBenchmarkId(null);
      loadInitialData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to save benchmark', 'error');
    }
  };

  const handleDeleteBenchmark = async (id) => {
    if (!window.confirm('Delete this benchmark cost?')) return;
    try {
      await deliveryApi.deleteBenchmark(id);
      showAlert('Benchmark deleted.');
      setSelectedBenchmarkIds((prev) => prev.filter((item) => item !== id));
      loadInitialData();
    } catch (err) {
      showAlert('Failed to delete benchmark', 'error');
    }
  };

  const handleOpenCreateRuleDrawer = () => {
    setEditingRuleId(null);
    clearHierarchyFilters();
    setRuleForm({
      kit_id: '',
      order_type: 'loose_order',
      number_of_kits: 1,
      vehicle_master_id: '',
      total_delivery_cost: '',
      per_kit_delivery_cost: '',
      free_delivery: false,
    });
    setRuleDrawerOpen(true);
  };

  const handleOpenEditRuleModal = (rule) => {
    setEditingRuleId(rule._id);
    clearHierarchyFilters();
    setRuleForm({
      kit_id: getCleanId(rule.kit_id),
      order_type: rule.order_type || 'loose_order',
      number_of_kits: rule.number_of_kits !== undefined ? rule.number_of_kits : 1,
      vehicle_master_id: getCleanId(rule.vehicle_master_id),
      total_delivery_cost: rule.total_delivery_cost !== undefined ? rule.total_delivery_cost : '',
      per_kit_delivery_cost: rule.per_kit_delivery_cost !== undefined ? rule.per_kit_delivery_cost : '',
      free_delivery: !!rule.free_delivery,
    });
    setRuleDrawerOpen(true);
  };

  const handleSaveKitRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.kit_id || !ruleForm.vehicle_master_id || !ruleForm.total_delivery_cost) {
      showAlert('Please select Kit, Vehicle, and Total Cost.', 'error');
      return;
    }

    const perKitCost = Number(ruleForm.number_of_kits) > 0
      ? Math.round(Number(ruleForm.total_delivery_cost) / Number(ruleForm.number_of_kits))
      : Number(ruleForm.total_delivery_cost);

    const unitWt = kitWeights[ruleForm.kit_id] || 0;
    const computedWeight = unitWt > 0 ? unitWt * (Number(ruleForm.number_of_kits) || 1) : 0;

    try {
      if (editingRuleId) {
        await deliveryApi.updateKitRule(editingRuleId, {
          ...ruleForm,
          per_kit_delivery_cost: perKitCost,
          shipment_weight_kg: computedWeight,
          total_weight_kg: computedWeight,
          industry_type_id: selectedIndustryType || null,
          project_type_id: selectedType || selectedCategory || null,
          project_subtype_id: selectedSubcategory || null,
        });
        showAlert('Kit delivery policy updated successfully.');
      } else {
        await deliveryApi.createKitRule({
          ...ruleForm,
          per_kit_delivery_cost: perKitCost,
          shipment_weight_kg: computedWeight,
          total_weight_kg: computedWeight,
          industry_type_id: selectedIndustryType || null,
          project_type_id: selectedType || selectedCategory || null,
          project_subtype_id: selectedSubcategory || null,
        });
        showAlert('Kit delivery policy created successfully.');
      }
      setRuleDrawerOpen(false);
      setEditingRuleId(null);
      clearHierarchyFilters();
      loadInitialData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to save rule', 'error');
    }
  };

  const handleDeleteKitRule = async (id) => {
    if (!window.confirm('Delete this kit rule?')) return;
    try {
      await deliveryApi.deleteKitRule(id);
      showAlert('Rule deleted.');
      setSelectedRuleIds((prev) => prev.filter((item) => item !== id));
      loadInitialData();
    } catch (err) {
      showAlert('Failed to delete rule', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Delivery Cost Settings"
        subtitle="Configure Warehouse-wise + Vehicle-wise + Geography-wise transport cost benchmarks & Kit purchase rules."
        icon={FaSlidersH}
        actions={
          activeTab === 'benchmarks' ? (
            <Button
              onClick={handleOpenBenchmarkDrawer}
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-white/90 font-semibold shadow-md px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              <FaPlus /> Set Transport Benchmark
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreateRuleDrawer}
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-white/90 font-semibold shadow-md px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              <FaPlus /> Add Kit Delivery Policy
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'benchmarks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Warehouse & Route Benchmarks ({filteredBenchmarks.length !== benchmarks.length ? `${filteredBenchmarks.length} / ${benchmarks.length}` : benchmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('kit_rules')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'kit_rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kit-Wise Purchase Policies ({filteredKitRules.length !== kitRules.length ? `${filteredKitRules.length} / ${kitRules.length}` : kitRules.length})
        </button>
      </div>

      {loading ? (
        <Loader text="Loading delivery cost settings..." />
      ) : activeTab === 'benchmarks' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar: Multi-field Search (State, District, Price, Warehouse, Vendor, Vehicle) + Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Real-time Multi-Field Search Bar */}
            <div className="relative flex-1 min-w-[260px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FaSearch className="text-sm" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by state, district, price, warehouse, vendor, vehicle..."
                className="w-full pl-10 pr-9 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Vendor Filter Dropdown */}
            <div className="flex items-center gap-2">
              <FaTruck className="text-blue-600 text-xs" />
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">Vendor:</label>
              <select
                value={selectedProviderFilter}
                onChange={(e) => setSelectedProviderFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white transition-colors"
              >
                <option value="">All Vendors</option>
                {serviceProviders.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name} ({sp.provider_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter Dropdown */}
            <div className="flex items-center gap-2">
              <FaWarehouse className="text-blue-600 text-xs" />
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">Warehouse:</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white transition-colors"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.warehouse_code} ({wh.address ? wh.address.slice(0, 25) + '...' : 'Main'})
                  </option>
                ))}
              </select>
            </div>

            {(selectedProviderFilter || selectedWarehouse || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProviderFilter('');
                  setSelectedWarehouse('');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 ml-auto cursor-pointer flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <FaTimes className="text-[10px]" /> Reset
              </button>
            )}
          </div>

          {/* Bulk Selection Action Bar */}
          {selectedBenchmarkIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {selectedBenchmarkIds.length}
                </div>
                <div>
                  <span className="text-sm font-bold text-blue-950">
                    {selectedBenchmarkIds.length} benchmark{selectedBenchmarkIds.length > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-xs text-blue-700 ml-2">
                    (out of {filteredBenchmarks.length} filtered)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedBenchmarkIds.length < filteredBenchmarks.length && (
                  <button
                    type="button"
                    onClick={() => setSelectedBenchmarkIds(filteredBenchmarks.map((b) => b._id))}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Select All ({filteredBenchmarks.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedBenchmarkIds([])}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <FaTrash className="text-[10px]" /> Delete Selected ({selectedBenchmarkIds.length})
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={isAllSelected ? 'Deselect all' : 'Select all visible'}
                    />
                  </th>
                  <th className="py-3 px-4">Transport Vendor</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Vehicle Type</th>
                  <th className="py-3 px-4">State & District</th>
                  <th className="py-3 px-4">Benchmark Transport Cost</th>
                  <th className="py-3 px-4">GST Applicable</th>
                  <th className="py-3 px-4">Free Delivery</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBenchmarks.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-500">
                      {searchQuery
                        ? `No delivery benchmarks found matching "${searchQuery}".`
                        : 'No delivery cost benchmarks configured yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredBenchmarks.map((b) => (
                    <tr
                      key={b._id}
                      className={`transition-colors ${
                        selectedBenchmarkIds.includes(b._id)
                          ? 'bg-blue-50/60 hover:bg-blue-50/90'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedBenchmarkIds.includes(b._id)}
                          onChange={() => handleToggleSelectRow(b._id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {b.service_provider_id?.name || 'All Vendors / Standard'}
                        </div>
                        {b.service_provider_id?.provider_code && (
                          <span className="inline-block text-[11px] font-mono px-2 py-0.5 mt-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                            {b.service_provider_id.provider_code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {b.warehouse_id?.warehouse_code || 'WH-01'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {b.vehicle_master_id?.name || 'Custom'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold text-slate-900 block">{b.district_id?.name || 'District'}</span>
                        <span className="text-slate-400 text-xs">{b.state_id?.name || 'State'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 text-base">
                        ₹{Number(b.benchmark_cost || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {b.gst_applicable ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                            Yes ({b.gst_rate}%)
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {b.free_delivery_eligible ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {b.effective_date ? new Date(b.effective_date).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Update Benchmark"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteBenchmark(b._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Benchmark"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kit-Wise Rules Tab */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Real-time Multi-Field Search Bar */}
            <div className="relative flex-1 min-w-[260px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FaSearch className="text-sm" />
              </div>
              <input
                type="text"
                value={ruleSearchQuery}
                onChange={(e) => setRuleSearchQuery(e.target.value)}
                placeholder="Search by kit name, order type, vehicle, cost..."
                className="w-full pl-10 pr-9 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
              {ruleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRuleSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Order Type Filter Dropdown */}
            <div className="flex items-center gap-2">
              <FaBoxes className="text-blue-600 text-xs" />
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">Order Type:</label>
              <select
                value={selectedOrderTypeFilter}
                onChange={(e) => setSelectedOrderTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white transition-colors"
              >
                <option value="">All Order Types</option>
                <option value="loose_order">Loose Order</option>
                <option value="trial_order">Trial Order</option>
                <option value="bulk_buy">Bulk Buy</option>
                <option value="po_order">PO Order</option>
              </select>
            </div>

            {(selectedOrderTypeFilter || ruleSearchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderTypeFilter('');
                  setRuleSearchQuery('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 ml-auto cursor-pointer flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <FaTimes className="text-[10px]" /> Reset
              </button>
            )}
          </div>

          {/* Bulk Selection Action Bar */}
          {selectedRuleIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {selectedRuleIds.length}
                </div>
                <div>
                  <span className="text-sm font-bold text-blue-950">
                    {selectedRuleIds.length} polic{selectedRuleIds.length > 1 ? 'ies' : 'y'} selected
                  </span>
                  <span className="text-xs text-blue-700 ml-2">
                    (out of {filteredKitRules.length} filtered)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedRuleIds.length < filteredKitRules.length && (
                  <button
                    type="button"
                    onClick={() => setSelectedRuleIds(filteredKitRules.map((r) => r._id))}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Select All ({filteredKitRules.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRuleIds([])}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteKitRules}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <FaTrash className="text-[10px]" /> Delete Selected ({selectedRuleIds.length})
                </button>
              </div>
            </div>
          )}

          {/* Kit Rules Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllRulesSelected}
                      onChange={handleToggleSelectAllRules}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={isAllRulesSelected ? 'Deselect all' : 'Select all visible'}
                    />
                  </th>
                  <th className="py-3 px-4">Kit</th>
                  <th className="py-3 px-4">Order Type</th>
                  <th className="py-3 px-4">Min Qty</th>
                  <th className="py-3 px-4">Shipment KG</th>
                  <th className="py-3 px-4">Vehicle Requirement</th>
                  <th className="py-3 px-4">Total Delivery Cost</th>
                  <th className="py-3 px-4">Per-Kit Cost</th>
                  <th className="py-3 px-4">Free Delivery</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKitRules.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-slate-500">
                      {ruleSearchQuery || selectedOrderTypeFilter
                        ? 'No kit delivery policies found matching your search.'
                        : 'No kit-wise delivery rules configured yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredKitRules.map((r) => (
                    <tr
                      key={r._id}
                      className={`transition-colors ${
                        selectedRuleIds.includes(r._id)
                          ? 'bg-blue-50/60 hover:bg-blue-50/90'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRuleIds.includes(r._id)}
                          onChange={() => handleToggleSelectRule(r._id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.kit_id?.name || 'Solar Kit'}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700">
                        {r.order_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono">{r.number_of_kits} kits</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {(() => {
                          const kId = getCleanId(r.kit_id);
                          const unitWt = kitWeights[kId] || 0;
                          const totalWt = unitWt > 0 ? unitWt * Number(r.number_of_kits || 1) : Number(r.shipment_weight_kg || r.total_weight_kg || 0);
                          return `${Number(totalWt || 0).toLocaleString()} KG`;
                        })()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.vehicle_master_id?.name || 'Any'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{r.total_delivery_cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                        ₹{r.per_kit_delivery_cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {r.free_delivery ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">Yes</span>
                        ) : (
                          <span className="text-xs text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRuleModal(r)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Policy"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteKitRule(r._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Policy"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Benchmark Centered Modal (Spacious & Centered) */}
      <Dialog
        isOpen={benchDrawerOpen}
        onClose={() => {
          setBenchDrawerOpen(false);
          setEditingBenchmarkId(null);
        }}
        title={editingBenchmarkId ? 'Update Delivery Cost Benchmark' : 'Set Delivery Cost Benchmark'}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              onClick={() => {
                setBenchDrawerOpen(false);
                setEditingBenchmarkId(null);
              }}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 text-sm rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            {entryMode === 'bulk_sheet' && !editingBenchmarkId ? (
              <Button
                type="button"
                onClick={handleSaveBulkBenchmarks}
                disabled={isSavingBulk || parsedRows.filter(r => r.district_id && Number(r.benchmark_cost) > 0).length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-md px-6 py-2 text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingBulk
                  ? 'Saving Benchmarks...'
                  : `Save Benchmarks (${parsedRows.filter(r => r.district_id && Number(r.benchmark_cost) > 0).length} Districts)`}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSaveSingleBenchmark}
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-md px-6 py-2 text-sm rounded-xl transition-all cursor-pointer"
              >
                {editingBenchmarkId ? 'Update Benchmark' : 'Save Benchmark'}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          {/* Top Form Fields: Transport Vendor, Warehouse, Vehicle Type, State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FaTruck className="text-blue-600" /> Transport Vendor *
              </label>
              <select
                value={benchForm.service_provider_id}
                onChange={(e) => setBenchForm({ ...benchForm, service_provider_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              >
                <option value="">-- Choose Vendor --</option>
                {serviceProviders.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name} ({sp.provider_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FaWarehouse className="text-blue-600" /> Warehouse *
              </label>
              <select
                value={benchForm.warehouse_id}
                onChange={(e) => setBenchForm({ ...benchForm, warehouse_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              >
                <option value="">-- Choose Warehouse --</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.warehouse_code} - {wh.address || 'Company WH'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Vehicle Type *
              </label>
              <select
                value={benchForm.vehicle_master_id}
                onChange={(e) => setBenchForm({ ...benchForm, vehicle_master_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicleMasters.map((vm) => (
                  <option key={vm._id} value={vm._id}>
                    {vm.name} ({vm.brand_make} • {vm.max_load_kg.toLocaleString()} KG)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Destination State *
              </label>
              <select
                value={benchForm.state_id}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              >
                <option value="">-- Choose State --</option>
                {states.map((st) => (
                  <option key={st._id} value={st._id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Switcher Tabs (Hidden when editing existing record) */}
          {!editingBenchmarkId ? (
            <div className="bg-slate-100 p-1 rounded-xl flex max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setEntryMode('bulk_sheet')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  entryMode === 'bulk_sheet'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaFileExcel className="text-emerald-600 text-sm" /> Bulk Upload District Sheet (Excel / CSV)
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  entryMode === 'single'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaEdit className="text-slate-500 text-sm" /> Manual Single District
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <FaEdit className="text-blue-600" /> Editing Delivery Cost Benchmark Record
              </span>
            </div>
          )}

          {/* Entry Mode 1: Bulk Sheet Upload */}
          {entryMode === 'bulk_sheet' ? (
            <div className="space-y-4 bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
              {/* Template Download & Help Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl text-xs">
                <div>
                  <div className="font-bold text-blue-900 text-sm flex items-center gap-2">
                    <FaDownload className="text-blue-600" /> Download Pre-filled State District Template
                  </div>
                  <div className="text-blue-700 mt-0.5">
                    {benchForm.state_id && districts.length > 0
                      ? `Pre-filled with all ${districts.length} official districts for ${states.find(s => s._id === benchForm.state_id)?.name || 'selected state'}. Fill the transport cost column and upload.`
                      : 'Select Destination State above to generate the pre-filled template with all districts.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={!benchForm.state_id || districts.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all cursor-pointer text-xs shrink-0"
                >
                  <FaDownload /> Download Template (.csv)
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Upload Filled Sheet (.xlsx, .xls, .csv)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="sheetUploadInput"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) parseUploadedFile(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                    disabled={!benchForm.state_id || isParsingSheet}
                  />
                  <label
                    htmlFor="sheetUploadInput"
                    className={`cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                      !benchForm.state_id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-sm">
                      <FaUpload />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-blue-600 hover:underline">Click to upload sheet</span>
                      <span className="text-slate-500 text-sm"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Supports Excel (.xlsx, .xls) and CSV format with columns: District Name & Delivery Cost (₹)
                    </p>
                    {uploadedFileName && (
                      <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs rounded-lg border border-emerald-200">
                        📄 Uploaded: {uploadedFileName}
                      </span>
                    )}
                  </label>
                </div>
                {!benchForm.state_id && (
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">
                    ⚠️ Please select a Destination State above to enable template download and sheet upload.
                  </p>
                )}
              </div>

              {/* Parsing Progress / Error */}
              {isParsingSheet && (
                <div className="text-center py-2 text-xs font-semibold text-blue-600 animate-pulse">
                  Parsing sheet and matching districts in real time...
                </div>
              )}
              {sheetError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500 flex-shrink-0 text-sm" />
                  <span>{sheetError}</span>
                </div>
              )}

              {/* Live Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-600 text-sm" /> District Rates Preview & Quick Edit
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-semibold">
                        Total Rows: {parsedRows.length}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        Matched: {parsedRows.filter(r => r.is_matched && r.benchmark_cost > 0).length}
                      </span>
                      {parsedRows.some(r => !r.is_matched || !r.benchmark_cost) && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          Needs Attention: {parsedRows.filter(r => !r.is_matched || !r.benchmark_cost).length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-sm divide-y divide-slate-100">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 sticky top-0 font-bold uppercase text-[10px] tracking-wider z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">District Name</th>
                          <th className="py-2.5 px-4">Transport Benchmark Cost (₹)</th>
                          <th className="py-2.5 px-4">Validation Status</th>
                          <th className="py-2.5 px-4 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={row.tempId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-slate-900 text-sm block">{row.district_name}</span>
                              {row.raw_name && row.raw_name !== row.district_name && (
                                <span className="text-[10px] text-slate-400 font-mono">Matched from: "{row.raw_name}"</span>
                              )}
                            </td>
                            <td className="py-2 px-4">
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-slate-400 font-semibold">₹</span>
                                <input
                                  type="number"
                                  value={row.benchmark_cost}
                                  onChange={(e) => handleUpdateParsedRowCost(row.tempId, e.target.value)}
                                  placeholder="0"
                                  className="w-36 pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              {row.is_matched && row.benchmark_cost > 0 ? (
                                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 w-fit border border-emerald-200">
                                  <FaCheck className="text-[9px]" /> Matched & Valid
                                </span>
                              ) : row.is_matched ? (
                                <span className="text-[11px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-bold w-fit block border border-amber-200">
                                  Missing Cost
                                </span>
                              ) : (
                                <span className="text-[11px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold w-fit block border border-red-200">
                                  Unrecognised District
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedRow(row.tempId)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove row"
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Entry Mode 2: Manual Single District */
            <div className="space-y-4 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  District *
                </label>
                <select
                  value={benchForm.district_id}
                  onChange={(e) => setBenchForm({ ...benchForm, district_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                >
                  <option value="">-- Choose District --</option>
                  {districts.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <CustomInput
                label="Benchmark Transport Cost (₹) *"
                type="number"
                placeholder="e.g. 5000"
                value={benchForm.benchmark_cost}
                onChange={(e) => setBenchForm({ ...benchForm, benchmark_cost: e.target.value })}
                required
              />
            </div>
          )}

          {/* Common Settings: GST, Free Delivery, Effective Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="gst_app"
                checked={benchForm.gst_applicable}
                onChange={(e) => setBenchForm({ ...benchForm, gst_applicable: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <label htmlFor="gst_app" className="text-xs font-bold text-slate-700 cursor-pointer">
                GST Applicable (18%)
              </label>
            </div>

            <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="free_del"
                checked={benchForm.free_delivery_eligible}
                onChange={(e) => setBenchForm({ ...benchForm, free_delivery_eligible: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <label htmlFor="free_del" className="text-xs font-bold text-slate-700 cursor-pointer">
                Free Delivery Eligible
              </label>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Effective Date</label>
              <input
                type="date"
                value={benchForm.effective_date}
                onChange={(e) => setBenchForm({ ...benchForm, effective_date: e.target.value })}
                className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Kit Rule Drawer */}
      <Drawer
        isOpen={ruleDrawerOpen}
        onClose={() => {
          setRuleDrawerOpen(false);
          setEditingRuleId(null);
          clearHierarchyFilters();
        }}
        title={editingRuleId ? 'Edit Kit Delivery Policy' : 'Configure Kit Delivery Policy'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveKitRule} className="p-6 space-y-4">
          {editingRuleId && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
              <span className="flex items-center gap-2">
                <FaEdit className="text-blue-600" />
                Editing Policy Rule
              </span>
              <span className="text-slate-500 font-normal">
                {kits.find((k) => getCleanId(k) === ruleForm.kit_id)?.name || 'Selected Kit'}
              </span>
            </div>
          )}

          {/* Cascading Hierarchy Filters Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaFilter className="text-blue-600" /> Filter Kits by Solar Hierarchy
              </span>
              {(selectedIndustryType || selectedCategory || selectedSubcategory || selectedType || selectedProjectRange) && (
                <button
                  type="button"
                  onClick={clearHierarchyFilters}
                  className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Industry Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Industry Type</label>
                <select
                  value={selectedIndustryType}
                  onChange={(e) => handleIndustryChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">All Industry Types</option>
                  {industryTypes.map((it) => (
                    <option key={it.id || it._id} value={it.id || it._id}>{it.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Subcategory */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">{selectedCategory ? "All Subcategories" : "Select Category first"}</option>
                  {subcategories.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. System Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">System Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  disabled={!selectedSubcategory}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">{selectedSubcategory ? "All System Types" : "Select Subcategory first"}</option>
                  {systemTypes.map((st) => (
                    <option key={st.subcategory_type_id || st.id || st._id} value={st.subcategory_type_id || st.id || st._id}>{st.name}</option>
                  ))}
                </select>
              </div>

              {/* 5. Project Range */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Project Range</label>
                <select
                  value={selectedProjectRange}
                  onChange={(e) => handleProjectRangeChange(e.target.value)}
                  disabled={!selectedType}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">{selectedType ? "All Ranges" : "Select System Type first"}</option>
                  {projectRanges.map((pr) => (
                    <option key={pr.id || pr._id} value={pr.id || pr._id}>
                      {pr.min_value} - {pr.max_value} {pr.unit_symbol || pr.unit_id?.symbol || "kW"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">ComboKit *</label>
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {availableKitsForDropdown.length} kits matching
              </span>
            </div>
            <select
              value={ruleForm.kit_id}
              onChange={(e) => setRuleForm({ ...ruleForm, kit_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              required
            >
              <option value="">-- Choose ComboKit ({availableKitsForDropdown.length} available) --</option>
              {availableKitsForDropdown.map((k) => (
                <option key={k._id} value={k._id}>
                  {k.name} ({k.capacity || k.solar_kit_id?.capacity || 0} kW)
                </option>
              ))}
            </select>
            {availableKitsForDropdown.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                No kits found matching the selected hierarchy filters. Try clearing or broadening some filters.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order Type *</label>
              <select
                value={ruleForm.order_type}
                onChange={(e) => setRuleForm({ ...ruleForm, order_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="loose_order">Loose Order</option>
                <option value="trial_order">Trial Order</option>
                <option value="bulk_buy">Bulk Buy</option>
                <option value="po_order">PO Order</option>
              </select>
            </div>

            <div>
              <CustomInput
                label="Number of Kits / Tier Qty *"
                type="number"
                placeholder="e.g. 10"
                value={ruleForm.number_of_kits}
                onChange={(e) => {
                  const qty = e.target.value;
                  const total = Number(ruleForm.total_delivery_cost) || 0;
                  const perKit = total && Number(qty) > 0 ? Math.round(total / Number(qty)) : '';
                  setRuleForm({ ...ruleForm, number_of_kits: qty, per_kit_delivery_cost: perKit });
                }}
                required
              />
              {ruleForm.kit_id && (
                <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                  <span>Shipment Weight:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {((kitWeights[ruleForm.kit_id] || 0) * (Number(ruleForm.number_of_kits) || 1)).toLocaleString()} KG
                  </span>
                  {kitWeights[ruleForm.kit_id] ? (
                    <span className="text-slate-400">
                      ({kitWeights[ruleForm.kit_id]} KG/kit)
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Requirement *</label>
            <select
              value={ruleForm.vehicle_master_id}
              onChange={(e) => setRuleForm({ ...ruleForm, vehicle_master_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicleMasters.map((vm) => (
                <option key={vm._id} value={vm._id}>{vm.name} ({vm.max_load_kg} KG)</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <CustomInput
              label="Total Delivery Cost (₹) *"
              type="number"
              placeholder="e.g. 8000"
              value={ruleForm.total_delivery_cost}
              onChange={(e) => {
                const total = e.target.value;
                const qty = Number(ruleForm.number_of_kits) || 1;
                const perKit = total && qty > 0 ? Math.round(Number(total) / qty) : '';
                setRuleForm({ ...ruleForm, total_delivery_cost: total, per_kit_delivery_cost: perKit });
              }}
              required
            />
            {ruleForm.total_delivery_cost && Number(ruleForm.number_of_kits) > 0 && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium pl-1">
                <span>Calculated Per-Kit Cost:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  ₹{Math.round(Number(ruleForm.total_delivery_cost) / Number(ruleForm.number_of_kits)).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="rule_free"
              checked={ruleForm.free_delivery}
              onChange={(e) => setRuleForm({ ...ruleForm, free_delivery: e.target.checked })}
              className="rounded text-blue-600 cursor-pointer"
            />
            <label htmlFor="rule_free" className="text-sm font-medium text-slate-700 cursor-pointer">Free Delivery (Yes/No)</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              onClick={() => {
                setRuleDrawerOpen(false);
                setEditingRuleId(null);
                clearHierarchyFilters();
              }}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 text-sm rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-md px-5 py-2 text-sm rounded-xl transition-all cursor-pointer"
            >
              {editingRuleId ? 'Update Policy Rule' : 'Save Policy Rule'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
