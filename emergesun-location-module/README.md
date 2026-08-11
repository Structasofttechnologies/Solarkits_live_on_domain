# 🌍 Standalone Geolocation & Location Settings Module (`emergesun-location-module`)

This module provides a complete, decoupled, and production-ready **Location Management System** extracted from the main platform. It allows managing country, state, and district activations, urban/rural city boundaries & exclusions, Google Maps boundary polygon rendering, and multi-district cluster & zone setups with OTP authorizations.

---

## 📁 Directory Structure

```text
emergesun-location-module/
├── frontend/                     # React Frontend Components & Pages
│   ├── components/               # Shared Reusable UI Components
│   │   ├── Button.jsx
│   │   ├── ConfirmationPopup.jsx
│   │   ├── CustomFilePicker.jsx
│   │   ├── CustomInput.jsx
│   │   ├── Dropdown.jsx
│   │   ├── DropdownWithSearchInput.jsx
│   │   ├── IconButton.jsx
│   │   ├── Loader.jsx
│   │   ├── MultiSelectDropdownWithSearchInput.jsx
│   │   ├── PageHeader.jsx
│   │   ├── Pagination.jsx
│   │   ├── PermissionCheck.jsx
│   │   ├── SearchInputWithDropdown.jsx
│   │   ├── UniversalMap.jsx    # Google Maps boundary & marker renderer
│   │   └── authHeader.js        # JWT Token bearer authorization header
│   └── location-settings/        # Location Feature Pages
│       ├── LocationOverview.jsx  # Page 1: Location Overview & Maps
│       ├── ClusterSetup.jsx      # Page 3: District Clusters & Zones
│       ├── LocationSetting.jsx   # React Router index for location pages
│       └── setup-location/       # Page 2: Location Setup Sub-module
│           ├── SetupLocation.jsx # Country & State Tab Router
│           ├── ActiveCountries.jsx
│           ├── ActiveState.jsx
│           ├── ActiveDistricts.jsx
│           ├── UrbanCities.jsx   # Excel upload, map boundary validation
│           ├── RuralCities.jsx   # Rural city uploads under urban centers
│           └── cities-components/
│               ├── ExcludedPointsList.jsx
│               ├── IncludedCitiesTable.jsx
│               ├── MapSection.jsx
│               ├── OutsideBoundaryPoints.jsx
│               ├── SavedCities.jsx
│               ├── SingleCityForm.jsx
│               └── UploadCard.jsx
├── backend/                      # Node.js / Express Standalone API
│   ├── config/
│   │   └── databases.js          # Mongoose DB connection manager
│   ├── controllers/
│   │   └── geolocationController.js # 33 API Endpoint Handlers
│   ├── middlewares/
│   │   ├── check.auth.js         # JWT Token Auth middleware
│   │   └── check.permissions.js  # Dynamic RBAC middleware
│   ├── models/
│   │   ├── geolocation_db/       # MongoDB Schemas (Countries, States, Districts, Cities, Clusters, Zones)
│   │   ├── boundary_db/          # GeoJSON Polygon / MultiPolygon Boundaries
│   │   └── user_db/              # CMS Users & OTP verification schema
│   ├── routes/
│   │   └── geolocationRoutes.js  # Express Router definition
│   ├── utils/
│   │   └── nodemailer.js         # OTP Mailer Utility
│   ├── package.json
│   └── server.js                 # Standalone Express Server
├── .env.example                  # Environment configuration template
└── README.md                     # Integration & Usage Guide
```

---

## ⚡ 1. Frontend Integration Guide

### Step 1: Copy the `frontend` folder
Copy the `frontend` folder into your target React project's `src` folder (e.g. `src/modules/location/`).

### Step 2: Install Frontend Dependencies
Run the following command in your React project root:

```bash
npm install axios @react-google-maps/api read-excel-file react-icons react-country-flag react-router-dom
```

### Step 3: Configure Environment Variables
Add these to your project's `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

### Step 4: Import Pages into your Router

```jsx
import { Route, Routes } from "react-router-dom";
import LocationOverview from "./location-settings/LocationOverview";
import SetupLocation from "./location-settings/setup-location/SetupLocation";
import ClusterSetup from "./location-settings/ClusterSetup";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/location-overview" element={<LocationOverview />} />
      <Route path="/setup-location/*" element={<SetupLocation />} />
      <Route path="/cluster-setup/*" element={<ClusterSetup />} />
    </Routes>
  );
}
```

---

## 🛠️ 2. Backend Integration Guide

### Step 1: Copy or Run Standalone Backend
If running as a separate microservice, navigate to `backend/`:

```bash
cd backend
npm install
npm run dev
```

### Step 2: Configure Backend Environment Variables
Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emergesun_location_db
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### Step 3: API Endpoints Overview
The backend exposes **33 REST API Endpoints** mounted at `/api/geolocation`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/geolocation/countries` | Overview metrics for countries |
| `GET` | `/api/geolocation/active-countries` | List of active countries |
| `POST` | `/api/geolocation/country` | Get detailed boundary & center for country |
| `POST` | `/api/geolocation/activate-country` | Activate country |
| `POST` | `/api/geolocation/deactivate-country` | Deactivate country with OTP |
| `POST` | `/api/geolocation/states` | Get states for country |
| `POST` | `/api/geolocation/active-states` | Get active states for country |
| `POST` | `/api/geolocation/state` | Get detailed state boundary |
| `POST` | `/api/geolocation/activate-state` | Activate state |
| `POST` | `/api/geolocation/deactivate-state` | Deactivate state with OTP |
| `POST` | `/api/geolocation/districts` | Get districts for state |
| `POST` | `/api/geolocation/active-districts` | Get active districts |
| `POST` | `/api/geolocation/district` | Get district details |
| `POST` | `/api/geolocation/activate-district` | Activate district |
| `POST` | `/api/geolocation/deactivate-district` | Deactivate district with OTP |
| `GET` | `/api/geolocation/urban-cities/:district_id` | Get urban cities for district |
| `POST` | `/api/geolocation/add-urban-cities` | Add urban cities (bulk Excel / single) |
| `POST` | `/api/geolocation/exclude-urban-city` | Exclude urban city point |
| `GET` | `/api/geolocation/excluded-urban-cities` | Get excluded urban cities |
| `DELETE` | `/api/geolocation/excluded-urban-city/:city_id` | Remove excluded urban city |
| `GET` | `/api/geolocation/rural-cities/:urban_city_id` | Get rural cities for urban city |
| `POST` | `/api/geolocation/add-rural-cities` | Add rural cities under urban center |
| `POST` | `/api/geolocation/exclude-rural-city` | Exclude rural city point |
| `GET` | `/api/geolocation/excluded-rural-cities` | Get excluded rural cities |
| `DELETE` | `/api/geolocation/excluded-rural-city/:city_id` | Remove excluded rural city |
| `GET` | `/api/geolocation/clusters/:state_id` | Get clusters for state |
| `POST` | `/api/geolocation/add-cluster` | Create new cluster with districts |
| `PUT` | `/api/geolocation/edit-cluster-name` | Rename cluster |
| `POST` | `/api/geolocation/assign-district-to-cluster` | Assign unassigned district to cluster |
| `POST` | `/api/geolocation/reassign-district-to-another-cluster-otp` | Request OTP for reassigning district |
| `POST` | `/api/geolocation/reassign-district-to-another-cluster` | Verify OTP & reassign district |
| `GET` | `/api/geolocation/delete-cluster-otp/:cluster_id/:state_id` | Request OTP for deleting cluster |
| `DELETE` | `/api/geolocation/delete-cluster` | Delete cluster after OTP verification |
| `GET` | `/api/geolocation/zones/:cluster_id` | Get zones in a cluster |
| `POST` | `/api/geolocation/add-zone` | Create a zone inside a cluster |
| `DELETE` | `/api/geolocation/delete-zone/:zone_id` | Delete a zone |

---

## 🌟 Key Features Built-in

1. **Decoupled Architecture**: All `@/...` path aliases and Redux slice dependencies removed. Toast notifications fallback automatically to lightweight alerts.
2. **Google Maps Polygons**: Supports boundary rendering for GeoJSON Polygon and MultiPolygon definitions.
3. **Ray-Casting Boundary Validation**: Ensures uploaded urban/rural city coordinates fall inside district boundaries before saving.
4. **Bulk Excel Upload**: Excel file reader integration for uploading thousands of city coordinates at once.
5. **OTP Security Workflow**: Critical actions (deactivating locations, reassigning districts, deleting clusters) mandate OTP email verification.
