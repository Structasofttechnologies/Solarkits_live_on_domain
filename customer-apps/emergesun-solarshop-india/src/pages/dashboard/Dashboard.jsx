import { Route, Routes, Navigate } from "react-router-dom"
import ProjectSignupsStatus from "./ProjectSignupsStatus"
import ProjectOrderStatus from "./ProjectOrderStatus"

export default function Dashboard() {
    return (
        <Routes>
            <Route index element={<Navigate to="order-status" replace />} />
            <Route path='/signup-status' element={<ProjectSignupsStatus />} />
            <Route path='/order-status' element={<ProjectOrderStatus />} />
            <Route path='*' element={<Navigate to="order-status" replace />} />
        </Routes>
    )
}
