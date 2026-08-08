// app/browse-loads/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Scale,
  Package,
  Truck,
  Inbox,
  Zap,
  Filter,
} from "lucide-react";

interface Shipment {
  id: string;
  pickupCity: string;
  deliveryCity: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupDate?: string;
  deliveryDate?: string;
  cargoType?: string;
  weightKg?: number;
  pallets?: number;
  truckType?: string;
  budgetUSD?: number;
  paymentTerms?: string;
  specialInstructions?: string;
  status: string;
  shipperId: string;
  createdAt?: any;
  urgent?: boolean;
}

const CARGO_LABELS: Record<string, string> = {
  general: "General freight",
  perishable: "Perishable",
  hazmat: "Hazardous",
  oversized: "Oversized",
  automotive: "Automotive",
  electronics: "Electronics",
  construction: "Construction",
  other: "Other",
};

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

function timeAgo(date: any) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function BrowseLoadsPage() {
  const router = useRouter();
  const [loads, setLoads] = useState<Shipment[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // Filters
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterCargo, setFilterCargo] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);

      const q = query(
        collection(db, "shipments"),
        where("status", "==", "open"),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Shipment[];

          setLoads(data);
          setFilteredLoads(data);
          setLoading(false);
        },
        (error) => {
          console.error("Browse loads listener error:", error);
          setLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    let result = [...loads];

    if (filterFrom) {
      result = result.filter((l) =>
        l.pickupCity.toLowerCase().includes(filterFrom.toLowerCase())
      );
    }
    if (filterTo) {
      result = result.filter((l) =>
        l.deliveryCity.toLowerCase().includes(filterTo.toLowerCase())
      );
    }
    if (filterCargo) {
      result = result.filter((l) => l.cargoType === filterCargo);
    }

    setFilteredLoads(result);
  }, [filterFrom, filterTo, filterCargo, loads]);

  const handleAcceptLoad = async (loadId: string) => {
    if (!uid) return;
    setAcceptingId(loadId);

    try {
      await updateDoc(doc(db, "shipments", loadId), {
        status: "matched",
        carrierId: uid,
        matchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.page, fontFamily: theme.font }}>
      {/* Top bar */}
      <div
        style={{
          background: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: theme.textSecondary,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
            <div style={{ width: 1, height: 18, background: theme.border }} />
            <h1 style={{ fontSize: 18, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>
              Browse loads
            </h1>
          </div>

          <div style={{ fontSize: 14, color: theme.textSecondary }}>
            <span style={{ fontWeight: 600, color: theme.textPrimary }}>
              {filteredLoads.length}
            </span>{" "}
            open loads
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px" }}>
        {/* Filters */}
        <div
          style={{
            background: theme.surfaceMuted,
            borderRadius: 14,
            padding: 20,
            marginBottom: 28,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: theme.textSecondary,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Filter size={15} />
            Filter loads
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
                From
              </label>
              <input
                type="text"
                placeholder="e.g. Riga, Tallinn..."
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                style={{
                  width: "100%",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
                To
              </label>
              <input
                type="text"
                placeholder="e.g. Berlin, Hamburg..."
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                style={{
                  width: "100%",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
                Cargo type
              </label>
              <select
                value={filterCargo}
                onChange={(e) => setFilterCargo(e.target.value)}
                style={{
                  width: "100%",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  outline: "none",
                  background: "white",
                }}
              >
                <option value="">All types</option>
                {Object.entries(CARGO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {(filterFrom || filterTo || filterCargo) && (
              <button
                onClick={() => {
                  setFilterFrom("");
                  setFilterTo("");
                  setFilterCargo("");
                }}
                style={{
                  height: 42,
                  padding: "0 16px",
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  fontSize: 13,
                  color: theme.textSecondary,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: theme.textMuted, fontSize: 14 }}>
            Loading available loads...
          </div>
        ) : filteredLoads.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: theme.surfaceMuted,
              borderRadius: 14,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Inbox size={32} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 500, color: theme.textPrimary, marginBottom: 4 }}>
              No loads found
            </p>
            <p style={{ fontSize: 14, color: theme.textSecondary }}>
              Try changing your filters or check back later
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredLoads.map((load) => (
              <div
                key={load.id}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 14,
                  padding: "18px 22px",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                  {/* Left side */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 17, fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
                        {load.pickupCity}
                        <ArrowRight size={15} color={theme.textMuted} />
                        {load.deliveryCity}
                      </div>

                      {load.urgent && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "#fffbeb",
                            color: "#b45309",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 20,
                          }}
                        >
                          <Zap size={11} /> Urgent
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: theme.textSecondary }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={13} />
                        {load.pickupDate || "Flexible"}
                      </div>
                      {load.weightKg && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Scale size={13} />
                          {load.weightKg.toLocaleString()} kg
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: theme.textMuted }}>
                        {timeAgo(load.createdAt)}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {load.cargoType && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: 20,
                          }}
                        >
                          <Package size={12} />
                          {CARGO_LABELS[load.cargoType] || load.cargoType}
                        </span>
                      )}
                      {load.truckType && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: theme.surfaceMuted,
                            color: theme.textSecondary,
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: 20,
                          }}
                        >
                          <Truck size={12} />
                          {load.truckType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ textAlign: "right", minWidth: 140 }}>
                    {load.budgetUSD ? (
                      <div style={{ fontSize: 22, fontWeight: 700, color: theme.accentText }}>
                        €{load.budgetUSD}
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: theme.textMuted }}>Negotiable</div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => handleAcceptLoad(load.id)}
                        disabled={acceptingId === load.id}
                        style={{
                          background: theme.accent,
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          padding: "10px 18px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: acceptingId === load.id ? "not-allowed" : "pointer",
                          opacity: acceptingId === load.id ? 0.7 : 1,
                        }}
                      >
                        {acceptingId === load.id ? "Accepting..." : "Accept load"}
                      </button>

                      <button
                        onClick={() => router.push(`/loads/${load.id}`)}
                        style={{
                          background: "transparent",
                          color: theme.accentText,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        View details <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}