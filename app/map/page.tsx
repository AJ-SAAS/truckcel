"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface Shipment {
  id: string;
  pickupCity: string;
  deliveryCity: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  status: string;
  cargoType?: string;
  weightKg?: number;
  budgetUSD?: number;
  pickupDate?: string;
  shipperId?: string;
  carrierId?: string;
}

// City → rough coordinates for Baltic/Europe routes
const CITY_COORDS: Record<string, [number, number]> = {
  "riga": [24.1052, 56.9496],
  "tallinn": [24.7535, 59.4370],
  "vilnius": [25.2799, 54.6892],
  "kaunas": [23.9030, 54.8985],
  "berlin": [13.4050, 52.5200],
  "hamburg": [9.9937, 53.5511],
  "frankfurt": [8.6821, 50.1109],
  "munich": [11.5820, 48.1351],
  "warsaw": [21.0122, 52.2297],
  "prague": [14.4378, 50.0755],
  "amsterdam": [4.9041, 52.3676],
  "paris": [2.3522, 48.8566],
  "london": [-0.1276, 51.5074],
  "stockholm": [18.0686, 59.3293],
  "helsinki": [24.9384, 60.1699],
  "copenhagen": [12.5683, 55.6761],
  "oslo": [10.7522, 59.9139],
  "vienna": [16.3738, 48.2082],
  "brussels": [4.3517, 50.8503],
  "zurich": [8.5417, 47.3769],
};

function getCoordsForCity(city: string): [number, number] | null {
  const key = city.toLowerCase().trim().split(",")[0].trim();
  return CITY_COORDS[key] ?? null;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  matched: "#10b981",
  in_transit: "#f59e0b",
  delivered: "#6b7280",
};

export default function MapPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [role, setRole] = useState<"driver" | "shipper" | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState("");

  // Load auth + data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userRole = userSnap.data()?.role;
      setRole(userRole);

      // Load relevant shipments
      let q;
      if (userRole === "shipper") {
        q = query(collection(db, "shipments"), where("shipperId", "==", user.uid));
      } else {
        q = query(collection(db, "shipments"), where("status", "==", "open"));
      }
      const snap = await getDocs(q);
      setShipments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment)));
    });
    return () => unsub();
  }, [router]);

  // Init Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) { setMapError("Mapbox token not found. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local"); return; }

    // Dynamically import mapbox-gl
    import("mapbox-gl").then((mapboxgl) => {
      (mapboxgl as any).default.accessToken = token;
      const mapboxGL = (mapboxgl as any).default;

      const map = new mapboxGL.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [18, 55],
        zoom: 4.5,
      });

      map.on("load", () => {
        mapRef.current = map;
        setMapLoaded(true);
      });

      map.addControl(new mapboxGL.NavigationControl(), "top-right");
    }).catch(() => {
      setMapError("Failed to load Mapbox. Run: npm install mapbox-gl");
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Draw routes on map when data + map are ready
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || shipments.length === 0) return;
    const map = mapRef.current;

    import("mapbox-gl").then((mapboxgl) => {
      const mapboxGL = (mapboxgl as any).default;

      shipments.forEach((s, i) => {
        const fromCoords = getCoordsForCity(s.pickupCity);
        const toCoords = getCoordsForCity(s.deliveryCity);
        if (!fromCoords || !toCoords) return;

        const lineId = `route-${s.id}`;
        const color = STATUS_COLORS[s.status] ?? "#3b82f6";

        // Add route line
        if (!map.getSource(lineId)) {
          map.addSource(lineId, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [fromCoords, toCoords] },
              properties: {},
            },
          });
          map.addLayer({
            id: lineId,
            type: "line",
            source: lineId,
            paint: { "line-color": color, "line-width": 2.5, "line-opacity": 0.8, "line-dasharray": [2, 2] },
          });
        }

        // Add pickup marker
        const fromEl = document.createElement("div");
        fromEl.style.cssText = `width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;cursor:pointer;box-shadow:0 0 6px rgba(0,0,0,0.4)`;
        fromEl.title = `${s.pickupCity} → ${s.deliveryCity}`;
        fromEl.addEventListener("click", () => setSelected(s));
        new mapboxGL.Marker(fromEl).setLngLat(fromCoords).addTo(map);

        // Add delivery marker (smaller)
        const toEl = document.createElement("div");
        toEl.style.cssText = `width:10px;height:10px;background:${color};border:2px solid white;border-radius:3px;cursor:pointer;opacity:0.8`;
        toEl.addEventListener("click", () => setSelected(s));
        new mapboxGL.Marker(toEl).setLngLat(toCoords).addTo(map);
      });
    });
  }, [mapLoaded, shipments]);

  const CARGO_LABELS: Record<string, string> = {
    general: "General", perishable: "Perishable", hazmat: "Hazmat",
    oversized: "Oversized", automotive: "Automotive", electronics: "Electronics",
    construction: "Construction", other: "Other",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <div style={{ background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", padding: 0 }}>← Dashboard</button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)" }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "white" }}>🗺️ Route Map</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {/* Legend */}
            {[
              { color: "#3b82f6", label: "Open" },
              { color: "#10b981", label: "Matched" },
              { color: "#f59e0b", label: "In Transit" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: "flex", position: "relative", minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          {mapError ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
              <div style={{ textAlign: "center", color: "white", maxWidth: 400, padding: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>{mapError}</p>
                <code style={{ display: "block", marginTop: 16, background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 8, fontSize: 13, color: "#60a5fa" }}>
                  npm install mapbox-gl
                </code>
              </div>
            </div>
          ) : (
            <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
          )}

          {!mapLoaded && !mapError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", zIndex: 10 }}>
              <div style={{ textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                <p>Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: 320, background: "rgba(15,23,42,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", flexShrink: 0 }}>
          {/* Selected shipment detail */}
          {selected && (
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(59,130,246,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", letterSpacing: 0.5 }}>SELECTED SHIPMENT</span>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
                {selected.pickupCity} → {selected.deliveryCity}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selected.pickupDate && <div style={{ fontSize: 12, color: "#94a3b8" }}>📅 {selected.pickupDate}</div>}
                {selected.weightKg && <div style={{ fontSize: 12, color: "#94a3b8" }}>⚖️ {selected.weightKg.toLocaleString()} kg</div>}
                {selected.cargoType && <div style={{ fontSize: 12, color: "#94a3b8" }}>📦 {CARGO_LABELS[selected.cargoType] ?? selected.cargoType}</div>}
                {selected.budgetUSD ? <div style={{ fontSize: 14, color: "#60a5fa", fontWeight: 700 }}>💰 ${selected.budgetUSD}</div> : null}
              </div>
              <div style={{ marginTop: 12, display: "inline-block", background: STATUS_COLORS[selected.status] + "22", color: STATUS_COLORS[selected.status], padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {selected.status.replace("_", " ").toUpperCase()}
              </div>
              {role === "driver" && selected.status === "open" && (
                <button
                  onClick={() => router.push("/browse-loads")}
                  style={{ display: "block", width: "100%", marginTop: 14, padding: "10px", background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                >
                  Accept This Load →
                </button>
              )}
            </div>
          )}

          {/* Shipments list */}
          <div style={{ padding: "16px 20px 8px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5, marginBottom: 12 }}>
              {shipments.length} ROUTES ON MAP
            </div>
          </div>

          {shipments.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#475569", fontSize: 13 }}>
              No shipments to display.
            </div>
          ) : (
            shipments.map(s => {
              const hasCoords = getCoordsForCity(s.pickupCity) && getCoordsForCity(s.deliveryCity);
              return (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  style={{
                    padding: "12px 20px", cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: selected?.id === s.id ? "rgba(59,130,246,0.1)" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: hasCoords ? "white" : "#64748b", fontWeight: 600, fontSize: 13 }}>
                        {s.pickupCity} → {s.deliveryCity}
                        {!hasCoords && <span style={{ fontSize: 10, color: "#475569", marginLeft: 6 }}>(no coords)</span>}
                      </div>
                      {s.pickupDate && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.pickupDate}</div>}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[s.status] ?? "#64748b", flexShrink: 0 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}