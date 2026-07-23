// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ── Types ──────────────────────────────────────────────────────────────────
interface UserData { 
  role: "driver" | "shipper"; 
  email: string; 
}

interface Shipment {
  id: string; 
  pickupCity: string; 
  deliveryCity: string; 
  status: string;
  cargoType?: string; 
  weightKg?: number; 
  budgetUSD?: number;
  pickupDate?: string; 
  createdAt?: any; 
  carrierId?: string; 
  shipperId?: string;
}

interface DriverProfile {
  fullName?: string; 
  truckType?: string; 
  status?: string;
  completedTrips?: number; 
  rating?: number; 
  capacityKg?: number;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  open:       { bg: "#dbeafe", color: "#1d4ed8", label: "Open" },
  matched:    { bg: "#d1fae5", color: "#065f46", label: "Matched" },
  in_transit: { bg: "#fef3c7", color: "#92400e", label: "In Transit" },
  delivered:  { bg: "#f0fdf4", color: "#15803d", label: "Delivered" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status?.toLowerCase()] ?? { 
    bg: "#f3f4f6", 
    color: "#374151", 
    label: status || "Unknown" 
  };
  return (
    <span style={{ 
      background: s.bg, 
      color: s.color, 
      padding: "4px 10px", 
      borderRadius: 20, 
      fontSize: 12, 
      fontWeight: 600 
    }}>
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub }: { 
  icon: string; 
  label: string; 
  value: string | number; 
  sub?: string; 
}) {
  return (
    <div style={{ 
      background: "white", 
      borderRadius: 12, 
      padding: "20px 24px", 
      border: "1px solid #e5e7eb", 
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", fontFamily: "'Syne', sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── SHIPPER DASHBOARD ──────────────────────────────────────────────────────
function ShipperDashboard({ uid }: { uid: string }) {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "shipments"), 
      where("shipperId", "==", uid), 
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment));
      setShipments(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading shipments:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const stats = {
    total: shipments.length,
    open: shipments.filter(s => s.status === "open").length,
    inTransit: shipments.filter(s => s.status === "in_transit" || s.status === "matched").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard icon="📋" label="Total Loads Posted" value={stats.total} />
        <StatCard icon="🟢" label="Open / Awaiting Driver" value={stats.open} />
        <StatCard icon="🚛" label="In Transit" value={stats.inTransit} />
        <StatCard icon="✅" label="Delivered" value={stats.delivered} />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.push("/post-load")}
          style={{ 
            padding: "12px 24px", 
            background: "#1d4ed8", 
            color: "white", 
            border: "none", 
            borderRadius: 8, 
            fontWeight: 600, 
            cursor: "pointer", 
            fontSize: 15 
          }}
        >
          + Post New Load
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Your Shipments</h2>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>
              No loads posted yet. Post your first load to get matched with a driver.
            </p>
            <button 
              onClick={() => router.push("/post-load")} 
              style={{ 
                padding: "12px 24px", 
                background: "#1d4ed8", 
                color: "white", 
                border: "none", 
                borderRadius: 8, 
                fontWeight: 600, 
                cursor: "pointer" 
              }}
            >
              Post a Load
            </button>
          </div>
        ) : (
          <div>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", 
              gap: 12, 
              padding: "12px 24px", 
              background: "#f9fafb", 
              borderBottom: "1px solid #e5e7eb" 
            }}>
              {["Route", "Cargo", "Pickup Date", "Budget", "Status"].map(h => (
                <span key={h} style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  color: "#9ca3af", 
                  letterSpacing: 0.5 
                }}>
                  {h.toUpperCase()}
                </span>
              ))}
            </div>

            {shipments.map((s, i) => (
              <div 
                key={s.id} 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", 
                  gap: 12, 
                  padding: "16px 24px", 
                  borderBottom: i < shipments.length - 1 ? "1px solid #f1f5f9" : "none", 
                  alignItems: "center" 
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{s.pickupCity}</span>
                  <span style={{ color: "#3b82f6", margin: "0 6px" }}>→</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{s.deliveryCity}</span>
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize" }}>{s.cargoType || "—"}</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{s.pickupDate || "—"}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1d4ed8" }}>
                  {s.budgetUSD ? `€${s.budgetUSD}` : "—"}
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DRIVER DASHBOARD ───────────────────────────────────────────────────────
function DriverDashboard({ uid }: { uid: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [myLoads, setMyLoads] = useState<Shipment[]>([]);
  const [openLoads, setOpenLoads] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load driver profile
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "drivers", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          fullName: data.fullName,
          truckType: data.truckType,
          status: data.status,
          completedTrips: Number(data.completedTrips) || 0,
          rating: Number(data.rating) || 0,
          capacityKg: Number(data.capacityKg) || 0,
        });
      }
    });
    return () => unsub();
  }, [uid]);

  // Load shipments
  useEffect(() => {
    const loadShipments = async () => {
      try {
        const myQ = query(collection(db, "shipments"), where("carrierId", "==", uid), orderBy("createdAt", "desc"));
        const mySnap = await getDocs(myQ);
        setMyLoads(mySnap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment)));

        const openQ = query(collection(db, "shipments"), where("status", "==", "open"), orderBy("createdAt", "desc"));
        const openSnap = await getDocs(openQ);
        setOpenLoads(openSnap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment)).slice(0, 5));
      } catch (err) {
        console.error("Error loading loads:", err);
      } finally {
        setLoading(false);
      }
    };

    loadShipments();
  }, [uid]);

  const stats = {
    completed: profile?.completedTrips ?? 0,
    rating: profile?.rating ?? 0,
    active: myLoads.filter(s => s.status === "in_transit" || s.status === "matched").length,
    open: openLoads.length,
  };

  if (profile?.status === "pending_review") {
    return (
      <div style={{ background: "white", borderRadius: 12, padding: "48px 40px", textAlign: "center", border: "1px solid #e5e7eb", maxWidth: 600, margin: "40px auto" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16, color: "#111827" }}>Application Under Review</h2>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.7 }}>
          Hi {profile.fullName ? profile.fullName.split(" ")[0] : "there"},<br />
          Your driver profile is being reviewed. We will notify you soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard icon="✅" label="Completed Trips" value={stats.completed} />
        <StatCard icon="⭐" label="Rating" value={stats.rating > 0 ? stats.rating.toFixed(1) : "—"} sub="out of 5.0" />
        <StatCard icon="🚛" label="Active Loads" value={stats.active} />
        <StatCard icon="📋" label="Open Loads Available" value={stats.open} sub="tap to browse" />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <button 
          onClick={() => router.push("/browse-loads")} 
          style={{ padding: "12px 24px", background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
        >
          🔍 Browse Available Loads
        </button>
        <button 
          onClick={() => router.push("/map")} 
          style={{ padding: "12px 24px", border: "1px solid #d1d5db", borderRadius: 8, background: "white", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 15 }}
        >
          🗺️ View Route Map
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* My Active Loads */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>My Active Loads</h2>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : myLoads.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No active loads yet.</div>
          ) : (
            myLoads.slice(0, 5).map((s, i) => (
              <div key={s.id} style={{ padding: "14px 24px", borderBottom: i < myLoads.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.pickupCity} → {s.deliveryCity}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{s.pickupDate || "No date"}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))
          )}
        </div>

        {/* Open Loads Near You */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Open Loads Near You</h2>
            <span onClick={() => router.push("/browse-loads")} style={{ fontSize: 13, color: "#1d4ed8", cursor: "pointer", fontWeight: 600 }}>See all →</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : openLoads.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No open loads right now.</div>
          ) : (
            openLoads.map((s, i) => (
              <div key={s.id} style={{ padding: "14px 24px", borderBottom: i < openLoads.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.pickupCity} → {s.deliveryCity}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    {s.weightKg ? `${s.weightKg} kg` : ""} · {s.pickupDate || "Flexible"}
                  </div>
                </div>
                {s.budgetUSD ? (
                  <span style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 15 }}>€{s.budgetUSD}</span>
                ) : (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Negotiable</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserData(snap.data() as UserData);
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚛</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top Navigation */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #1d4ed8, #0891b2)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🚛</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#111827" }}>Truckcel</span>
            <span style={{ marginLeft: 12, background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, letterSpacing: 0.5 }}>
              {userData?.role?.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: "#6b7280" }}>{userData?.email}</span>
            <button 
              onClick={handleSignOut} 
              style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 7, background: "white", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", fontFamily: "'Syne', sans-serif" }}>
            {userData?.role === "driver" ? "Driver Dashboard" : "Shipper Dashboard"}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
            {userData?.role === "driver" 
              ? "Browse available loads and manage your active shipments." 
              : "Post loads and track your shipments in real time."}
          </p>
        </div>

        {uid && userData?.role === "shipper" && <ShipperDashboard uid={uid} />}
        {uid && userData?.role === "driver" && <DriverDashboard uid={uid} />}
      </div>
    </div>
  );
}