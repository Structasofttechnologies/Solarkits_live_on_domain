import { useEffect, useState, useMemo } from "react";
import Dropdown from "@/Components/Dropdown";
import Button from "@/Components/Button";
import { FiChevronDown, FiChevronUp, FiFilter } from "react-icons/fi";

const options = {
  pricePerKw: [
    { text: "All Price/kW", value: "all" },
    { text: "₹0-25,000/kW", value: "0-25000" },
    { text: "₹25,000-50,000/kW", value: "25000-60000" },
    { text: "₹50,000-75,000/kW", value: "50000-75000" },
    { text: "₹75,000-50,000/kW", value: "75000-100000" },
    { text: "Above ₹100,000/kW", value: "100000+" },
  ],
  wattPerPanel: [
    { text: "All Wattages", value: "all" },
    { text: "Below 300W", value: "under-300" },
    { text: "300-400W", value: "300-400" },
    { text: "400-600W", value: "400-600" },
    { text: "500-600W", value: "500-600" },
    { text: "Above 600W", value: "600+" },
  ],
  warranty: [
    { text: "All Warranties", value: "all" },
    { text: "1-5 years", value: "1-5" },
    { text: "5-10 years", value: "5-10" },
    { text: "10-15 years", value: "10-15" },
    { text: "15-20 years", value: "15-20" },
    { text: "20+ years", value: "20+" },
  ],
  efficiency: [
    { text: "All Efficiency", value: "all" },
    { text: "Below 15%", value: "under-15" },
    { text: "15-18%", value: "15-18" },
    { text: "18-20%", value: "18-20" },
    { text: "20-22%", value: "20-22" },
    { text: "Above 22%", value: "22+" },
  ],
  batteryCapacity: [
    { text: "All Capacities", value: "all" },
    { text: "Below 2 kWh", value: "under-2" },
    { text: "2-5 kWh", value: "2-5" },
    { text: "5-10 kWh", value: "5-10" },
    { text: "10-20 kWh", value: "10-20" },
    { text: "Above 20 kWh", value: "20+" },
  ],
  inverterCapacity: [
    { text: "All Capacities", value: "all" },
    { text: "Below 1 kW", value: "under-1" },
    { text: "1-3 kW", value: "1-3" },
    { text: "3-5 kW", value: "3-5" },
    { text: "5-10 kW", value: "5-10" },
    { text: "Above 10 kW", value: "10+" },
  ],
};

export default function KitFilters({
  availableKits,
  filters,
  setFilters,
  searchTerm = "",
  onSearchChange,
  showSidebar = false,
  clearFilters,
  filterKeys = [],
  expandedSections = { panel: true, inverter: false, battery: false },
  onToggleSection,
}) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const dynamicOptions = useMemo(() => {
    const makeUnique = (arr) =>
      Array.from(new Map(arr.map((item) => [item.value, item])).values());

    const panelBrands = [];
    const panelTechnologies = [];
    const inverterBrands = [];
    const inverterTypes = [];
    const batteryBrands = [];
    const batteryTypes = [];
    const panelWattagesSet = new Set();
    const panelWarrantiesSet = new Set();
    const inverterCapacitiesSet = new Set();

    availableKits?.forEach((kit) => {
      if (kit.panel?.brandName) panelBrands.push({ text: kit.panel.brandName, value: kit.panel.brandName.toLowerCase() });
      if (kit.panel?.technologyType) panelTechnologies.push({ text: kit.panel.technologyType, value: kit.panel.technologyType.toLowerCase() });
      if (kit.panel?.wattPerPanel) panelWattagesSet.add(Number(kit.panel.wattPerPanel));
      if (kit.panel?.warrantyYears) panelWarrantiesSet.add(Number(kit.panel.warrantyYears));
      if (kit.inverter?.brandName) inverterBrands.push({ text: kit.inverter.brandName, value: kit.inverter.brandName.toLowerCase() });
      if (kit.inverter?.type) inverterTypes.push({ text: kit.inverter.type, value: kit.inverter.type.toLowerCase() });
      if (kit.inverter?.capacityKW) inverterCapacitiesSet.add(Number(kit.inverter.capacityKW));
      if (kit.battery?.brandName) batteryBrands.push({ text: kit.battery.brandName, value: kit.battery.brandName.toLowerCase() });
      if (kit.battery?.type) batteryTypes.push({ text: kit.battery.type, value: kit.battery.type.toLowerCase() });
    });

    // Build dynamic exact-value options from real data
    const wattSorted = Array.from(panelWattagesSet).sort((a, b) => a - b);
    const dynamicWatts = wattSorted.length > 0
      ? [{ text: "All Wattages", value: "all" }, ...wattSorted.map((w) => ({ text: `${w}W`, value: String(w) }))]
      : options.wattPerPanel;

    const warrantySorted = Array.from(panelWarrantiesSet).sort((a, b) => a - b);
    const dynamicPanelWarranties = warrantySorted.length > 0
      ? [{ text: "All Warranties", value: "all" }, ...warrantySorted.map((w) => ({ text: `${w} years`, value: String(w) }))]
      : options.warranty;

    const capSorted = Array.from(inverterCapacitiesSet).sort((a, b) => a - b);
    const dynamicInverterCapacities = capSorted.length > 0
      ? [{ text: "All Capacities", value: "all" }, ...capSorted.map((c) => ({ text: `${c} kW`, value: String(c) }))]
      : options.inverterCapacity;

    return {
      panelBrands: [{ text: "All Brands", value: "all" }, ...makeUnique(panelBrands)],
      panelTechnologies: [{ text: "All Technologies", value: "all" }, ...makeUnique(panelTechnologies)],
      panelWattages: dynamicWatts,
      panelWarranties: dynamicPanelWarranties,
      inverterBrands: [{ text: "All Brands", value: "all" }, ...makeUnique(inverterBrands)],
      inverterTypes: [{ text: "All Types", value: "all" }, ...makeUnique(inverterTypes)],
      inverterCapacities: dynamicInverterCapacities,
      batteryBrands: [{ text: "All Brands", value: "all" }, ...makeUnique(batteryBrands)],
      batteryTypes: [{ text: "All Types", value: "all" }, ...makeUnique(batteryTypes)],
    };
  }, [availableKits]);

  const getActiveFiltersCount = useMemo(() => {
    const sectionFilters = {
      panel: ["panelBrand", "panelTechnology", "panelWattage", "panelWarranty", "panelEfficiency"],
      inverter: ["inverterBrand", "inverterType", "inverterCapacity", "inverterWarranty", "inverterEfficiency"],
      battery: ["batteryBrand", "batteryType", "batteryCapacity"],
    };
    const counts = {};
    Object.entries(sectionFilters).forEach(([section, keys]) => {
      counts[section] = keys.filter((key) => filters[key] && filters[key] !== "all").length;
    });
    return counts;
  }, [filters]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  useEffect(() => setLocalSearch(searchTerm), [searchTerm]);

  useEffect(() => {
    if (onSearchChange) {
      const timeout = setTimeout(() => onSearchChange(localSearch), 300);
      return () => clearTimeout(timeout);
    }
  }, [localSearch, onSearchChange]);

  const filterSections = [
    {
      title: "Panel",
      key: "panel",
      filters: [
        { label: "Brand", key: "panelBrand", options: dynamicOptions.panelBrands },
        { label: "Technology", key: "panelTechnology", options: dynamicOptions.panelTechnologies },
        { label: "Watt per Panel", key: "panelWattage", options: dynamicOptions.panelWattages },
        { label: "Panel Warranty", key: "panelWarranty", options: dynamicOptions.panelWarranties },
        { label: "Efficiency", key: "panelEfficiency", options: options.efficiency },
      ],
    },
    {
      title: "Inverter",
      key: "inverter",
      filters: [
        { label: "Brand", key: "inverterBrand", options: dynamicOptions.inverterBrands },
        { label: "Type", key: "inverterType", options: dynamicOptions.inverterTypes },
        { label: "Capacity", key: "inverterCapacity", options: dynamicOptions.inverterCapacities },
        { label: "Warranty", key: "inverterWarranty", options: options.warranty },
        { label: "Efficiency", key: "inverterEfficiency", options: options.efficiency },
      ],
    },
    {
      title: "Battery",
      key: "battery",
      filters: [
        { label: "Brand", key: "batteryBrand", options: dynamicOptions.batteryBrands },
        { label: "Type", key: "batteryType", options: dynamicOptions.batteryTypes },
        { label: "Capacity", key: "batteryCapacity", options: options.batteryCapacity },
      ],
    },
  ];

  return (
    <div className="space-y-2">
      {filterSections.map((section) => {
        const filtersToRender = section.filters.filter(
          (f) => !filterKeys.length || filterKeys.includes(f.key)
        );
        if (!filtersToRender.length) return null;

        const isExpanded = expandedSections[section.key];
        const activeCount = getActiveFiltersCount[section.key];

        return (
          <div key={section.title} className="border-b border-border last:border-b-0">
            <button
              onClick={() => onToggleSection?.(section.key)}
              className="flex items-center justify-between w-full px-4 py-2 hover:bg-surface-hover transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-text-primary text-left">{section.title}</h4>
                {activeCount > 0 && (
                  <span className="bg-primary text-text-inverse rounded-full w-5 h-5 text-xs flex items-center justify-center font-medium">
                    {activeCount}
                  </span>
                )}
              </div>
              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-2 space-y-2">
                {filtersToRender.map(({ label, key, options }) => (
                  <Dropdown
                    key={key}
                    label={label}
                    options={options}
                    value={filters[key] || "all"}
                    onChange={(val) => updateFilter(key, val)}
                    className="w-full"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {clearFilters && (
        <div className="p-4 border-t border-border mt-2">
          <Button onClick={clearFilters} variant="primary" size="md" fullWidth>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export { options };