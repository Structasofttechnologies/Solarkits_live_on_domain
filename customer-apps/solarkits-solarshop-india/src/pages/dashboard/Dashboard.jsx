import { Route, Routes, Navigate } from "react-router-dom"
import ProjectSignupsStatus from "./ProjectSignupsStatus"
import ProjectOrderStatus from "./ProjectOrderStatus"
import EpcCatalogue from "./EpcCatalogue"

export default function Dashboard() {
    return (
        <Routes>
            <Route index element={<EpcCatalogue />} />
            <Route path='/catalogue' element={<EpcCatalogue />} />
            <Route path='/signup-status' element={<ProjectSignupsStatus />} />
            <Route path='/order-status' element={<ProjectOrderStatus />} />
            <Route path='*' element={<EpcCatalogue />} />
        </Routes>
    )
}
