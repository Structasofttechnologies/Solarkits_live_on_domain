import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import Loader from "@/components/Loader"
import { PermissionGuard } from "../../../components/PermissionGuard";

const ComboKits = lazy(() => import("./combo-kits/ComboKits"));
const CustomizeKits = lazy(() => import("./customize-kits/CustomizeKits"));
const BulkComboKits = lazy(() => import("./bulk-combo-kits/BulkComboKits"));
const WarehouseBulkConfig = lazy(() => import("./bulk-combo-kits/WarehouseBulkConfig"));
const ComboKitVariants = lazy(() => import("./combo-kit-variants/ComboKitVariants"));
const BosKitManager = lazy(() => import("./bos-kits/BosKitManager"));

function ComboKitConfigurations() {
    return (
        <Routes>
            <Route path="/bos-kits" element={
                <Suspense fallback={<Loader text="Loading BOS Kit Configurations..." />}>
                    <BosKitManager />
                </Suspense>
            } />
            <Route path="/combo-kits" element={
                <PermissionGuard requiredUniqueId="ADM_COMBO_KITS">
                    <Suspense fallback={<Loader text="Loading content..." />}>
                        <ComboKits moduleUniqueId="ADM_COMBO_KITS" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path="/customize-kits" element={
                <PermissionGuard requiredUniqueId="ADM_CUSTOMIZE_KITS">
                    <Suspense fallback={<Loader text="Loading content..." />}>
                        <CustomizeKits moduleUniqueId="ADM_CUSTOMIZE_KITS" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path="/bulk-combo-kits" element={
                <PermissionGuard requiredUniqueId="ADM_BULK_COMBO">
                    <Suspense fallback={<Loader text="Loading Bulk Combo Kits..." />}>
                        <BulkComboKits moduleUniqueId="ADM_BULK_COMBO" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path="/bulk-combo-kits/:warehouseId" element={
                <PermissionGuard requiredUniqueId="ADM_BULK_COMBO">
                    <Suspense fallback={<Loader text="Loading Warehouse Bulk Configuration..." />}>
                        <WarehouseBulkConfig moduleUniqueId="ADM_BULK_COMBO" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path="/combo-kit-variants" element={
                <PermissionGuard requiredUniqueId="ADM_COMBO_KIT_VARIANTS">
                    <Suspense fallback={<Loader text="Loading Combo Kit Variants..." />}>
                        <ComboKitVariants moduleUniqueId="ADM_COMBO_KIT_VARIANTS" />
                    </Suspense>
                </PermissionGuard>
            } />
        </Routes>
    )
}

export default ComboKitConfigurations