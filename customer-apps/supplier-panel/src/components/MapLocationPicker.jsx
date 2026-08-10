import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "./LoadGoogleMaps";
import SearchInputWithDropdown from "./SearchInputWithDropdown";
import axios from "axios";

const svgPin = (color) => {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 24 24' fill='${color}'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/><circle cx='12' cy='9' r='2.5' fill='white'/></svg>`
  )}`;
};

export default function MapLocationPicker({ lat, lng, onSelect, visible, officeLocations = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const round6 = (n) => Number(n.toFixed(6));

  // ------------------------------------------
  // 🔍 Google Autocomplete REST API
  // ------------------------------------------
  const autocompleteServiceRef = useRef(null);

  const initAutocompleteService = () => {
    if (!autocompleteServiceRef.current && window.google) {
      const { AutocompleteService } = google.maps.places;
      autocompleteServiceRef.current = new AutocompleteService();
    }
  };

  const fetchGoogleSuggestions = async (input) => {
    return new Promise((resolve) => {
      if (!input.trim()) return resolve([]);

      initAutocompleteService();

      autocompleteServiceRef.current.getPlacePredictions(
        { input },
        (predictions, status) => {
          if (status !== "OK" || !predictions) return resolve([]);

          resolve(
            predictions.map((p) => ({
              value: p.place_id,
              text: p.description,
            }))
          );
        }
      );
    });
  };

  // ------------------------------------------
  // 🔍 Place Details API
  // ------------------------------------------
  const detailsServiceRef = useRef(null);

  const initDetailsService = () => {
    if (!detailsServiceRef.current && mapInstanceRef.current) {
      const { PlacesService } = google.maps.places;
      detailsServiceRef.current = new PlacesService(mapInstanceRef.current);
    }
  };

  const fetchPlaceDetails = async (placeId) => {
    return new Promise((resolve) => {
      initDetailsService();

      detailsServiceRef.current.getDetails(
        { placeId, fields: ["geometry", "formatted_address"] },
        (place, status) => {
          if (status !== "OK" || !place) return resolve(null);

          resolve({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address,
          });
        }
      );
    });
  };

  const getAddressDetails = async (lat, lng) => {
    try {
      const API = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API}`;

      const res = await axios.get(url);
      const data = res.data;

      if (!data.results || data.results.length === 0) {
        return { address: "", country: "", state: "", district: "", pincode: "" };
      }

      let country = "";
      let state = "";
      let district = "";
      let pincode = "";

      data.results.forEach((result) => {
        result.address_components.forEach((c) => {

          if (!country && c.types.includes("country")) {
            country = c.long_name;
          }

          if (!state && c.types.includes("administrative_area_level_1")) {
            state = c.long_name;
          }

          if (!district && c.types.includes("administrative_area_level_2")) {
            district = c.long_name;
          }

          if (!district && c.types.includes("administrative_area_level_3")) {
            district = c.long_name;
          }

          if (!pincode && c.types.includes("postal_code")) {
            pincode = c.long_name;
          }
        });
      });

      // FINAL fallback: take best address
      const address = data.results.find(r =>
        r.formatted_address && r.types.includes("street_address")
      )?.formatted_address ||
        data.results[0].formatted_address ||
        "";

      return {
        address,
        country,
        state,
        district,
        pincode,
      };

    } catch (err) {
      return { address: "", country: "", state: "", district: "", pincode: "" };
    }

  };

  useEffect(() => {
    if (!visible) return;

    const init = async () => {
      try {
        await loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

        const { Map } = await google.maps.importLibrary("maps");
        const { Marker } = await google.maps.importLibrary("marker");
        await google.maps.importLibrary("places");

        const initialPos = {
          lat: lat ? parseFloat(lat) : 20.5937,
          lng: lng ? parseFloat(lng) : 78.9629,
        };

        if (!mapInstanceRef.current) {
          const map = new Map(mapRef.current, {
            center: initialPos,
            zoom: lat && lng ? 12 : 5,
            gestureHandling: "cooperative",
          });

          map.setOptions({
            maxZoom: 20,
            minZoom: 3,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          });

          const marker = new Marker({
            position: initialPos,
            map,
            draggable: true,
            icon: {
              url: svgPin('#ef4444'),
              scaledSize: new google.maps.Size(28, 40),
              anchor: new google.maps.Point(14, 40)
            }
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
          setMapLoaded(true);

          // ================================
          // 📍 DRAG EVENT – update input
          // ================================
          marker.addListener("dragend", async () => {
            const pos = marker.getPosition();
            const newLat = round6(pos.lat());
            const newLng = round6(pos.lng());

            const details = await getAddressDetails(newLat, newLng);

            setSearchText(details.address);

            onSelect({
              lat: newLat,
              lng: newLng,
              ...details,
            });
          });

          // ================================
          // 🖱 MAP CLICK – update input
          // ================================
          map.addListener("click", async (e) => {
            const newLat = round6(e.latLng.lat());
            const newLng = round6(e.latLng.lng());

            marker.setPosition({ lat: newLat, lng: newLng });

            const details = await getAddressDetails(newLat, newLng);
            setSearchText(details.address);

            onSelect({
              lat: newLat,
              lng: newLng,
              ...details,
            });
          });
        }
      } catch (err) {
        console.error("Map load error:", err);
      }
    };

    init();
  }, [visible]);

  // ------------------------------------------
  // 🔍 Input typing
  // ------------------------------------------
  const handleInputChange = async (text) => {
    setSearchText(text);

    const suggestions = await fetchGoogleSuggestions(text);
    setSearchOptions(suggestions);
  };

  // ------------------------------------------
  // 🎯 When selecting suggestion (place_id)
  // ------------------------------------------
  const handleSelect = async (placeId) => {
    const place = await fetchPlaceDetails(placeId);
    if (!place) return;

    const newLat = round6(place.lat);
    const newLng = round6(place.lng);

    mapInstanceRef.current.setCenter({ lat: newLat, lng: newLng });
    markerRef.current.setPosition({ lat: newLat, lng: newLng });

    const details = await getAddressDetails(newLat, newLng);

    setSearchText(details.address);

    onSelect({
      lat: newLat,
      lng: newLng,
      ...details,
    });
  };

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !lat || !lng) return;

    const position = { lat, lng };

    // 👇 If marker exists → update
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      // 👇 If marker does NOT exist → create it
      const marker = new google.maps.Marker({
        position,
        map,
        draggable: true,
        icon: {
          url: svgPin('#ef4444'),
          scaledSize: new google.maps.Size(28, 40),
          anchor: new google.maps.Point(14, 40)
        }
      });
      markerRef.current = marker;
    }

    // 👇 Always center map on updated location
    map.setCenter(position);
  }, [lat, lng]);

  const addedMarkersRef = useRef([]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !visible) return;

    // Clear previous green markers
    addedMarkersRef.current.forEach(m => m.setMap(null));
    addedMarkersRef.current = [];

    // Draw new green markers
    if (officeLocations && Array.isArray(officeLocations)) {
      officeLocations.forEach(loc => {
        if (loc.lat && loc.lng) {
          const marker = new google.maps.Marker({
            position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
            map,
            title: loc.address || 'Office Location',
            icon: {
              url: svgPin('#10B981'),
              scaledSize: new google.maps.Size(28, 40),
              anchor: new google.maps.Point(14, 40)
            }
          });
          addedMarkersRef.current.push(marker);
        }
      });
    }
  }, [officeLocations, visible, mapLoaded]);

  return (
    <div className="w-full flex flex-col gap-3">
      <SearchInputWithDropdown
        label="Search Location"
        value={null}
        inputValue={searchText}
        onChange={handleSelect}
        onInputChange={handleInputChange}
        options={searchOptions}
        placeholder="Search location, address..."
        className="w-full"
      />

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: visible ? "400px" : "0px",
          borderRadius: "12px",
          border: visible ? "1px solid #ddd" : "none",
        }}
      />
    </div>
  );
}
