import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import ProjectSignupsStatus from "./ProjectSignupsStatus";
import ProjectOrderStatus from "./ProjectOrderStatus";
import EpcCatalogue from "./EpcCatalogue";
import PreconfiguredComboKit from "./PreconfiguredComboKit";

export default function Dashboard() {
  const { user, isAuthenticated } = useSelector((state) => state.auth_slice);
  
  const isFranchiseeEpc = Boolean(
    isAuthenticated && (
      user?.reseller?.business_name ||
      user?.reseller ||
      user?.onboarding_source === 'reseller' ||
      user?.onboarding_source === 'franchisee' ||
      user?.onboarded_by_reseller_id ||
      user?.primary_reseller_id
    )
  );

  return (
    <Routes>
      <Route index element={isFranchiseeEpc ? <EpcCatalogue /> : <PreconfiguredComboKit />} />
      <Route path="/catalogue" element={<EpcCatalogue />} />
      <Route path="/signup-status" element={<ProjectSignupsStatus />} />
      <Route path="/order-status" element={<ProjectOrderStatus />} />
      <Route path="*" element={isFranchiseeEpc ? <EpcCatalogue /> : <PreconfiguredComboKit />} />
    </Routes>
  );
}
