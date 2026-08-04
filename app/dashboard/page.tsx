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
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ClipboardList,
  CircleDot,
  Truck,
  CircleCheck,
  Star,
  Plus,
  Folder,
  Search,
  Map,
  ArrowRight,
  Package,
} from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────────────
// Single source of truth for the shared visual language across Shipper and
// Carrier views. Change a value here, both dashboards update together.
const theme = {
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  page: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderLight: "#f1f5f9",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  accent: "#2563eb",
  accentText: "#1d4ed8",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: "#eff6ff", color: "#1d4ed8", label: "Open" },
  matched: { bg: "#f0fdf4", color: "#15803d", label: "Matched" },
  in_transit: { bg: "#fffbeb", color: "#b45309", label: "In transit" },
  delivered: { bg: "#f0fdf4", color: "#15803d", label: "Delivered" },
  cancelled: { bg: "#fef2f2", color: "#b91c1c", label: "Cancelled" },
};

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

// ── Shared UI primitives ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status?.toLowerCase()] ?? {
    bg: theme.surfaceMuted,
    color: theme.textSecondary,
    label: status || "Unknown",
  };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        width: "fit-content",
      }}
    >
      {s.label}
    </span>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: theme.surfaceMuted,
        borderRadius: 10,
        padding: "16px 18px",
      }}
    >
      <div style={{ color: iconColor || theme.textSecondary, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: theme.textPrimary }}>{value}</div>
      <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PrimaryButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 18px",
        height: 38,
        background: theme.accent,
        color: "#ffffff",
        border: "none",
        borderRadius: 8,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function SecondaryButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 18px",
        height: 38,
        background: theme.surface,
        color: theme.textPrimary,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Route({ from, to }: { from: string; to: string }) {
  return (
    <span style={{ fontWeight: 500, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
      {from}
      <ArrowRight size={13} color={theme.textMuted} />
      {to}
    </span>
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

    const unsub = onSnapshot(
      q,
      (snap) => {
        setShipments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shipment)));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading shipments:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const stats = {
    total: shipments.length,
    open: shipments.filter((s) => s.status === "open").length,
    inTransit: shipments.filter((s) => s.status === "in_transit" || s.status === "matched").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard icon={<ClipboardList size={18} />} label="Total loads posted" value={stats.total} />
        <StatCard icon={<CircleDot size={18} />} iconColor={theme.accentText} label="Open, awaiting driver" value={stats.open} />
        <StatCard icon={<Truck size={18} />} iconColor="#b45309" label="In transit" value={stats.inTransit} />
        <StatCard icon={<CircleCheck size={18} />} iconColor="#15803d" label="Delivered" value={stats.delivered} />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <PrimaryButton icon={<Plus size={16} />} onClick={() => router.push("/post-load")}>
          Post new load
        </PrimaryButton>
        <SecondaryButton icon={<Folder size={16} />} onClick={() => router.push("/my-loads")}>
          My loads
        </SecondaryButton>
      </div>

      <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, color: theme.textPrimary, margin: 0 }}>Your shipments</h2>
          <span
            onClick={() => router.push("/my-loads")}
            style={{
              fontSize: 13,
              color: theme.accentText,
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Manage all <ArrowRight size={14} />
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Package size={32} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <p style={{ color: theme.textSecondary, marginBottom: 18, fontSize: 14 }}>
              No loads posted yet. Post your first load to get matched with a driver.
            </p>
            <PrimaryButton icon={<Plus size={16} />} onClick={() => router.push("/post-load")}>
              Post a load
            </PrimaryButton>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: 12,
                padding: "10px 20px",
                background: theme.surfaceMuted,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              {["Route", "Cargo", "Pickup date", "Budget", "Status"].map((h) => (
                <span key={h} style={{ fontSize: 12, fontWeight: 500, color: theme.textMuted }}>
                  {h}
                </span>
              ))}
            </div>

            {shipments.map((s, i) => (
              <div
                key={s.id}
                onClick={() => router.push(`/loads/${s.id}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  gap: 12,
                  padding: "14px 20px",
                  borderBottom: i < shipments.length - 1 ? `1px solid ${theme.borderLight}` : "none",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <Route from={s.pickupCity} to={s.deliveryCity} />
                <div style={{ fontSize: 13, color: theme.textSecondary, textTransform: "capitalize" }}>
                  {s.cargoType || "—"}
                </div>
                <div style={{ fontSize: 13, color: theme.textSecondary }}>{s.pickupDate || "—"}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: theme.accentText }}>
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

// ── DRIVER / CARRIER DASHBOARD ──────────────────────────────────────────────
function DriverDashboard({ uid }: { uid: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [myLoads, setMyLoads] = useState<Shipment[]>([]);
  const [openLoads, setOpenLoads] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const myQ = query(collection(db, "shipments"), where("carrierId", "==", uid), orderBy("createdAt", "desc"));
        const mySnap = await getDocs(myQ);
        setMyLoads(mySnap.docs.map((d) => ({ id: d.id, ...d.data() } as Shipment)));

        const openQ = query(collection(db, "shipments"), where("status", "==", "open"), orderBy("createdAt", "desc"));
        const openSnap = await getDocs(openQ);
        setOpenLoads(openSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Shipment)).slice(0, 5));
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
    active: myLoads.filter((s) => s.status === "in_transit" || s.status === "matched").length,
    open: openLoads.length,
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard icon={<CircleCheck size={18} />} iconColor="#15803d" label="Completed trips" value={stats.completed} />
        <StatCard
          icon={<Star size={18} />}
          iconColor="#b45309"
          label="Rating"
          value={stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
          sub="out of 5.0"
        />
        <StatCard icon={<Truck size={18} />} iconColor={theme.accentText} label="Active loads" value={stats.active} />
        <StatCard icon={<ClipboardList size={18} />} label="Open loads nearby" value={stats.open} sub="tap to browse" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <PrimaryButton icon={<Search size={16} />} onClick={() => router.push("/browse-loads")}>
          Browse available loads
        </PrimaryButton>
        <SecondaryButton icon={<Map size={16} />} onClick={() => router.push("/map")}>
          View route map
        </SecondaryButton>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: theme.textPrimary, margin: 0 }}>My active loads</h2>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>Loading...</div>
          ) : myLoads.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>No active loads yet.</div>
          ) : (
            myLoads.slice(0, 5).map((s, i) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < myLoads.length - 1 ? `1px solid ${theme.borderLight}` : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Route from={s.pickupCity} to={s.deliveryCity} />
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{s.pickupDate || "No date"}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))
          )}
        </div>

        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 500, color: theme.textPrimary, margin: 0 }}>Open loads near you</h2>
            <span
              onClick={() => router.push("/browse-loads")}
              style={{
                fontSize: 13,
                color: theme.accentText,
                cursor: "pointer",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              See all <ArrowRight size={14} />
            </span>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>Loading...</div>
          ) : openLoads.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>No open loads right now.</div>
          ) : (
            openLoads.map((s, i) => (
              <div
                key={s.id}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < openLoads.length - 1 ? `1px solid ${theme.borderLight}` : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Route from={s.pickupCity} to={s.deliveryCity} />
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
                    {s.weightKg ? `${s.weightKg} kg` : ""} {s.weightKg ? "·" : ""} {s.pickupDate || "Flexible"}
                  </div>
                </div>
                {s.budgetUSD ? (
                  <span style={{ fontWeight: 500, color: theme.accentText, fontSize: 15 }}>€{s.budgetUSD}</span>
                ) : (
                  <span style={{ fontSize: 13, color: theme.textMuted }}>Negotiable</span>
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

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.page,
          fontFamily: theme.font,
        }}
      >
        <div style={{ textAlign: "center", color: theme.textSecondary }}>
          <Truck size={28} color={theme.textMuted} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.page, fontFamily: theme.font }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: theme.textPrimary, margin: 0 }}>
            {userData?.role === "driver" ? "Carrier dashboard" : "Shipper dashboard"}
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
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