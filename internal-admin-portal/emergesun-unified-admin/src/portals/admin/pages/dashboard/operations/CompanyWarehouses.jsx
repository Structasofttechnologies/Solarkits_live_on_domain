import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import RenderIfPermission from "@/components/PermissionCheck";
import Loader from "@/components/Loader";

const ViewWarehouses = lazy(() => import("./company-warehouses/ViewWarehouses"));
const AddWarehouse = lazy(() => import("./company-warehouses/AddWarehouse"));
const WarehouseProfileValidations = lazy(() => import("./company-warehouses/WarehouseProfileValidations"));
const ReviewWarehouseDetails = lazy(() => import("./company-warehouses/ReviewWarehouseDetails"));
const WarehouseDetails = lazy(() => import("./company-warehouses/WarehouseDetails"));


export default function CompanyWarehouses({ moduleUniqueId }) {
    return (
        <Routes>
            <Route path="/" element={
                <RenderIfPermission requiredUniqueId={moduleUniqueId} permission="view" fallback={<Navigate to="/admin-panel/home" replace />}>
                    <Suspense fallback={<Loader text='Load warehouses...' />}><ViewWarehouses moduleUniqueId={moduleUniqueId} /></Suspense>
                </RenderIfPermission>
            } />
            <Route path='/add-warehouse/*' element={
                <RenderIfPermission requiredUniqueId={moduleUniqueId} permission="view" fallback={<Navigate to="/admin-panel/home" replace />}>
                    <Suspense fallback={<Loader text='Load add warehouse page.' />}><AddWarehouse moduleUniqueId={moduleUniqueId} /></Suspense>
                </RenderIfPermission>
            } />
            <Route path='/edit-warehouse/:warehouseId/*' element={
                <RenderIfPermission requiredUniqueId={moduleUniqueId} permission="view" fallback={<Navigate to="/admin-panel/home" replace />}>
                    <Suspense fallback={<Loader text='Load edit warehouse page.' />}><AddWarehouse moduleUniqueId={moduleUniqueId} /></Suspense>
                </RenderIfPermission>
            } />
            <Route path='/:warehouseId/profile-validations/*' element={
                <RenderIfPermission requiredUniqueId={moduleUniqueId} permission="view" fallback={<Navigate to="/admin-panel/home" replace />}>
                    <Suspense fallback={<Loader text='Load warehouse profile setup.' />}><WarehouseProfileValidations moduleUniqueId={moduleUniqueId} /></Suspense>
                </RenderIfPermission>
            } />
            <Route path='/:warehouseId/review/*' element={
                <RenderIfPermission requiredUniqueId={moduleUniqueId} permission="view" fallback={<Navigate to="/admin-panel/home" replace />}>
                    <Suspense fallback={<Loader text='Load warehouse review page.' />}><ReviewWarehouseDetails moduleUniqueId={moduleUniqueId} /></Suspense>
                </RenderIfPermission>
            } />
            <Route path='/:warehouseId' element={
                <RenderIfPermission requiredUniqueId={moduleUniqueId} permission="view" fallback={<Navigate to="/admin-panel/home" replace />}>
                    <Suspense fallback={<Loader text='Load warehouse details page.' />}><WarehouseDetails moduleUniqueId={moduleUniqueId} /></Suspense>
                </RenderIfPermission>
            } />
        </Routes>
    )
}
