// src/components/UniversalMap.jsx
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useEffect, useRef } from "react";

export default function UniversalMap({
  center,
  zoom = 5,
  markers = [],
  boundaries = [],
  onMapLoad,
  onBoundaryClick,
  onBoundaryMouseOver,
  onBoundaryMouseOut,
  mapOptions = {},
  containerStyle = { width: "100%", height: "100%" },
}) {
  const mapRef = useRef(null);
  const polygonRefs = useRef([]);

  // Draw markers + boundaries and fit bounds
  useEffect(() => {
    if (!mapRef.current) return;

    clearPolygons();
    boundaries.forEach((item) => drawBoundary(item));

    // Fit map to all boundaries if provided
    try {
      if (typeof google === "undefined" || !google.maps) return;
      
      const bounds = new google.maps.LatLngBounds();
      boundaries.forEach((b) => {
        const paths = extractPaths(b.geometry);
        paths.forEach((path) => {
          path.forEach((ring) => {
            ring.forEach((coord) => {
              bounds.extend(coord);
            });
          });
        });
      });
      if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds);
    } catch (err) {
      // ignore fit bounds errors — google not loaded or invalid geometry
    }
  }, [boundaries]);

  const clearPolygons = () => {
    polygonRefs.current.forEach((p) => p.setMap(null));
    polygonRefs.current = [];
  };

  const extractPaths = (geometry) => {
    if (!geometry?.coordinates) return [];

    const { type, coordinates } = geometry;
    const result = [];

    if (type === "Polygon") { 
      result.push(coordinates.map(ring => ring.map(([lng, lat]) => ({ lat: parseFloat(lat), lng: parseFloat(lng) }))));
    } else if (type === "MultiPolygon") {
      coordinates.forEach(polygonCoordinates =>
        result.push(polygonCoordinates.map(ring => ring.map(([lng, lat]) => ({ lat: parseFloat(lat), lng: parseFloat(lng) }))))
      );
    }

    return result;
  };

  const drawBoundary = ({ id, geometry, level, color }) => {
    if (typeof google === "undefined" || !google.maps) return;

    const paths = extractPaths(geometry);
    const map = mapRef.current;

    if (!paths.length) return;

    const colorConfig = {
      country: { color: "#27ae60", zIndex: 1 }, 
      state: { color: "#2980b9", zIndex: 2 },   
      district: { color: "#8e44ad", zIndex: 3 }, 
      urban: { color: "#e67e22", zIndex: 4 },    
    };

    paths.forEach((path) => {
      const polygon = new google.maps.Polygon({ 
        paths: path,
        strokeColor: color || colorConfig[level]?.color || "#e74c3c",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: color || colorConfig[level]?.color || "#e74c3c",
        fillOpacity: 0.35,
        zIndex: colorConfig[level]?.zIndex || 3,
        map,
      });

      polygonRefs.current.push(polygon);
      if (onBoundaryClick) {
        polygon.addListener("click", () => onBoundaryClick({ id: id || null, level, geometry }));
      }
      if (onBoundaryMouseOver) {
        polygon.addListener("mouseover", () => onBoundaryMouseOver({ id: id || null, level, geometry }));
      }
      if (onBoundaryMouseOut) {
        polygon.addListener("mouseout", () => onBoundaryMouseOut({ id: id || null, level, geometry }));
      }
    });
  };

  useEffect(() => {
    return () => clearPolygons();
  }, []);

  useEffect(() => {
    if (mapRef.current && center?.lat && center?.lng) {
      try {
        mapRef.current.panTo(center);
      } catch (err) {
        // ignore
      }
    }
  }, [center]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={(map) => {
        mapRef.current = map;
        onMapLoad?.(map);

        if (boundaries && boundaries.length && typeof google !== "undefined" && google.maps) {
          clearPolygons();
          boundaries.forEach((item) => drawBoundary(item));
          try {
            const bounds = new google.maps.LatLngBounds();
            boundaries.forEach((b) => {
              const paths = extractPaths(b.geometry);
              paths.forEach((path) => {
                path.forEach((ring) => {
                  ring.forEach((coord) => {
                    bounds.extend(coord);
                  });
                });
              });
            });
            if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds);
          } catch (err) {
            /* ignore */
          }
        }
      }}
      options={{
        gestureHandling: "cooperative",
        disableDefaultUI: true,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 20,
        ...mapOptions,
      }}
    >
      {markers.map((m, i) => {
        const pos = { lat: +m.lat, lng: +m.lng };
        let icon = undefined;

        const svgPin = (color, isSelected = false) => {
          const strokeColor = isSelected ? '#427BD6' : 'none';
          const strokeWidth = isSelected ? '2' : '0';
          return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 24 24' fill='${color}' stroke='${strokeColor}' stroke-width='${strokeWidth}'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/><circle cx='12' cy='9' r='2.5' fill='white'/></svg>`
          )}`;
        };

        const status = (m && m.status) ? m.status.toString().toLowerCase() : 'included';
        const isSelected = m?.isSelected || false;

        const size = (typeof google !== 'undefined' && google.maps) 
          ? new google.maps.Size(isSelected ? 32 : 28, isSelected ? 46 : 40) 
          : undefined;

        if (status === 'included' || status === 'inside') {
          icon = { url: svgPin('#2ecc71', isSelected), ...(size ? { scaledSize: size } : {}), ...(isSelected ? { anchor: new (typeof google !== 'undefined' && google.maps ? google.maps.Point : Object)(16, 40) } : {}) };
        } else if (status === 'near') {
          icon = { url: svgPin('#f1c40f', isSelected), ...(size ? { scaledSize: size } : {}), ...(isSelected ? { anchor: new (typeof google !== 'undefined' && google.maps ? google.maps.Point : Object)(16, 40) } : {}) };
        } else if (status === 'excluded' || status === 'far' || status === 'skipped') {
          icon = { url: svgPin('#e74c3c', isSelected), ...(size ? { scaledSize: size } : {}), ...(isSelected ? { anchor: new (typeof google !== 'undefined' && google.maps ? google.maps.Point : Object)(16, 40) } : {}) };
        } else {
          icon = { url: svgPin('#3498db', isSelected), ...(size ? { scaledSize: size } : {}), ...(isSelected ? { anchor: new (typeof google !== 'undefined' && google.maps ? google.maps.Point : Object)(16, 40) } : {}) };
        }

        return (
          <Marker 
            key={i} 
            position={pos} 
            icon={icon}
            onClick={m?.onClick}
            zIndex={isSelected ? 999 : 1}
          />
        );
      })}
    </GoogleMap>
  );
}
