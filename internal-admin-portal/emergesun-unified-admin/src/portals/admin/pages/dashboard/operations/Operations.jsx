import { Route, Routes, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import Loader from "@/components/Loader";
import { PermissionGuard } from "@/components/PermissionGuard";

const CompanyWarehouses = lazy(() => import("./CompanyWarehouses"));
const ManufacturingBrands = lazy(() => import("./ManufacturingBrands"));
const CompanySaaSProducts = lazy(() => import("./CompanySaaSProducts"));

export default function Operations() {
    return (
        <Routes>
            <Route path='/company-warehouses/*' element={
                <PermissionGuard requiredUniqueId="ADM_WAREHOUSES">
                    <Suspense fallback={<Loader text='Load Compnany Warehouses...' />}>
                        <CompanyWarehouses moduleUniqueId="ADM_WAREHOUSES" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path='/manufacturing-brands/*' element={
                <PermissionGuard requiredUniqueId="ADM_MFG_BRANDS">
                    <Suspense fallback={<Loader text='Load Manufacturing Brands...' />}>
                        <ManufacturingBrands moduleUniqueId="ADM_MFG_BRANDS" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path='/company-saas-products/*' element={
                <PermissionGuard requiredUniqueId="ADM_SAAS_PRODS">
                    <Suspense fallback={<Loader text='Load Company SaaS Products...' />}>
                        <CompanySaaSProducts moduleUniqueId="ADM_SAAS_PRODS" />
                    </Suspense>
                </PermissionGuard>
            } />
            <Route path="/" element={<Navigate to="company-warehouses" replace />} />
            <Route path="*" element={<Navigate to="company-warehouses" replace />} />
        </Routes>
    )
}
