const express = require('express');
const router = express.Router();

const geolocationController = require('../controllers/geolocationController');
const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');

router.post("/request-deactivation-otp", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['add'] }]), geolocationController.deactivation_otp);

router.get("/countries", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }, { unique_code: 'ADM_LOC', permissions: ['view'] }]), geolocationController.get_countries);
router.get("/get-countries", check_auth, geolocationController.get_countries);
router.get("/get-states", check_auth, geolocationController.get_states);
router.get("/get-districts", check_auth, geolocationController.get_districts);
router.get("/active-countries", check_auth, geolocationController.get_active_countries);
router.post("/country", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }, { unique_code: 'ADM_LOC', permissions: ['view'] }]), geolocationController.get_country);
router.post("/activate-country", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.activate_country);
router.post("/deactivate-country", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.deactivate_country);

router.post("/states", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }, { unique_code: 'ADM_LOC', permissions: ['view'] }]), geolocationController.get_states);
router.post("/active-states", check_auth, geolocationController.get_active_states);
router.post("/state", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }, { unique_code: 'ADM_LOC', permissions: ['view'] }]), geolocationController.get_state);
router.post("/activate-state", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.activate_state);
router.post("/deactivate-state", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.deactivate_state);

router.post("/districts", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }, { unique_code: 'ADM_LOC', permissions: ['view'] }]), geolocationController.get_districts);
router.post("/active-districts", check_auth, geolocationController.get_active_districts);
router.post("/district", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }, { unique_code: 'ADM_LOC', permissions: ['view'] }, { unique_code: 'ADM_CLUSTER_SETUP', permissions: ['view'] }]), geolocationController.get_district);
router.post("/activate-district", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.activate_district);
router.post("/deactivate-district", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.deactivate_district);

router.get("/urban-cities/:district_id", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }]), geolocationController.get_urban_cities);
router.post("/add-urban-cities", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['add'] }]), geolocationController.add_urban_cities);
router.post("/exclude-urban-city", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.exclude_urban_city);
router.get("/excluded-urban-cities", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }]), geolocationController.get_excluded_urban_cities);
router.delete("/excluded-urban-city/:city_id", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.delete_excluded_urban_city);

router.get("/rural-cities/:urban_city_id", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }]), geolocationController.get_rural_cities);
router.post("/add-rural-cities", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['add'] }]), geolocationController.add_rural_cities);
router.post("/exclude-rural-city", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.exclude_rural_city);
router.get("/excluded-rural-cities", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['view'] }]), geolocationController.get_excluded_rural_cities);
router.delete("/excluded-rural-city/:city_id", check_auth, check_permissions([{ unique_code: 'ADM_SETUP_LOC', permissions: ['edit'] }]), geolocationController.delete_excluded_rural_city);

router.post("/add-cluster", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['add'] }]), geolocationController.add_cluster);
router.get("/clusters/:state_id", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['view'] }]), geolocationController.get_clusters);
router.post("/assign-district-to-cluster", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['edit'] }]), geolocationController.assign_district_to_cluster);
router.post("/reassign-district-to-another-cluster-otp", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['edit'] }]), geolocationController.reassign_district_to_another_cluster_otp);
router.post("/reassign-district-to-another-cluster", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['edit'] }]), geolocationController.reassign_district_to_another_cluster);
router.get("/delete-cluster-otp/:cluster_id/:state_id", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['delete'] }]), geolocationController.delete_cluster_otp);
router.delete("/delete-cluster", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['delete'] }]), geolocationController.delete_cluster);
router.put("/edit-cluster-name", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['edit'] }]), geolocationController.edit_cluster_name);
router.get("/zones/:cluster_id", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['view'] }]), geolocationController.get_zones_by_cluster);
router.post("/add-zone", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['add'] }]), geolocationController.add_zone);
router.delete("/delete-zone/:zone_id", check_auth, check_permissions([{ unique_code: 'ADM_CLUSTER_SETUP', permissions: ['delete'] }]), geolocationController.delete_zone);

module.exports = router;
