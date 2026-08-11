import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "./components/Loader";
import RenderIfPermission from "./components/PermissionCheck";
import { Navigate } from "react-router-dom";

const LocationOverview = lazy(() => import("./LocationOverview"));
const SetupLocation = lazy(() => import("./setup-location/SetupLocation"));
const ClusterSetup = lazy(() => import("./ClusterSetup"));

export default function LocationSetting() {
  return (
    <Routes>
      <Route
        path="/location-overview"
        element={
          <RenderIfPermission
            requiredUniqueId="ADM_LOC"
            permission="view"
            fallback={<Navigate to="/" replace />}
          >
            <Suspense fallback={<Loader />}> 
              <LocationOverview moduleUniqueId="ADM_LOC" />
            </Suspense>
          </RenderIfPermission>
        }
      />

      <Route
        path="/setup-location/*"
        element={
          <RenderIfPermission
            requiredUniqueId="ADM_SETUP_LOC"
            permission="view"
            fallback={<Navigate to="/" replace />}
          >
            <Suspense fallback={<Loader />}> 
              <SetupLocation moduleUniqueId="ADM_SETUP_LOC" />
            </Suspense>
          </RenderIfPermission>
        }
      />

      <Route
        path="/cluster-setup/*"
        element={
          <RenderIfPermission
            requiredUniqueId="ADM_CLUSTER_SETUP"
            permission="view"
            fallback={<Navigate to="/" replace />}
          >
            <Suspense fallback={<Loader />}> 
              <ClusterSetup moduleUniqueId="ADM_CLUSTER_SETUP" />
            </Suspense>
          </RenderIfPermission>
        }
      />

      <Route path="/" element={<Navigate to="location-overview" replace />} />
      <Route path="*" element={<Navigate to="location-overview" replace />} />
    </Routes>
  );
}
