// app/my-loads/page.tsx
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
import { ArrowLeft, Pencil, XCircle, Eye, Package, Plus } from "lucide-react";

interface Shipment {
  id: string;
  pickupCity: string;
  deliveryCity: string;
  pickupDate?: string;
  cargoType?: string;
  budgetUSD?: number;
  status: string;
  shipperId: string;
  carrierId?: string;
}

const CARGO_LABELS: Record<string, string> = {
  general: "General Freight",
  perishable: "Perishable / Food",
  hazmat: "Hazardous Materials",
  oversized: "Oversized / Heavy",
  automotive: "Automotive",
  electronics: "Electronics",
  construction: "Construction Materials",
  other: "Other",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  open: { bg: "#ecfdf5", color: "#047857" },
  matched: { bg: "#eff6ff", color: "#1d4ed8" },
  in_transit: { bg: "#fffbeb", color: "#b45309" },
  delivered: { bg: "#f1f5f9", color: "#475569" },
  cancelled: { bg: "#fef2f2", color: "#b91c1c" },
};

const theme = {
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  page: "#f8fafc",
  surface: "#ffffff",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  accent: "#2563eb",
  accentText: "#1d4ed8",
};

export default function MyLoadsPage() {
  const router = useRouter();
  const [loads, setLoads] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const q = query(
        collection(db, "shipments"),
        where("shipperId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Shipment[];
          setLoads(data);
          setLoading(false);
        },
        (error) => {
          console.error("My Loads listener error:", error);
          setLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleCancel = async (loadId: string) => {
    const confirmed = window.confirm(
      "Cancel this load? Drivers will no longer be able to see or accept it."
    );
    if (!confirmed) return;

    setCancellingId(loadId);
    try {
      await updateDoc(doc(db, "shipments", loadId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to cancel load. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.page, fontFamily: theme.font, paddingBottom: 48 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 20px" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            color: theme.textSecondary,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.textPrimary, marginBottom: 6 }}>
              My Loads
            </h1>
            <p style={{ color: theme.textSecondary, fontSize: 14, maxWidth: 520 }}>
              View, edit, or cancel the loads you've posted. Loads can only be edited or cancelled while they're still Open.
            </p>
          </div>

          <button
            onClick={() => router.push("/post-load")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              background: theme.accent,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Post new load
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: theme.textMuted, fontSize: 14 }}>
            Loading your loads...
          </div>
        ) : loads.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              background: theme.surface,
              borderRadius: 16,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Package size={36} color={theme.textMuted} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, color: theme.textPrimary, marginBottom: 8 }}>
              You haven't posted any loads yet
            </p>
            <p style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 24 }}>
              Post your first load to start getting matched with carriers.
            </p>
            <button
              onClick={() => router.push("/post-load")}
              style={{
                padding: "12px 24px",
                background: theme.accent,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Post your first load
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loads.map((load) => {
              const isOpen = load.status === "open";
              const statusStyle = STATUS_STYLES[load.status] || STATUS_STYLES.delivered;

              return (
                <div
                  key={load.id}
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 14,
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary }}>
                        {load.pickupCity}{" "}
                        <span style={{ color: theme.accent }}>→</span> {load.deliveryCity}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {load.status.replace("_", " ")}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: theme.textSecondary }}>
                      <span>{CARGO_LABELS[load.cargoType || ""] || load.cargoType || "—"}</span>
                      <span>Pickup: {load.pickupDate || "—"}</span>
                      {load.budgetUSD && <span style={{ fontWeight: 500, color: theme.accentText }}>€{load.budgetUSD}</span>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => router.push(`/loads/${load.id}`)}
                      title="View"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: `1px solid ${theme.border}`,
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: theme.textSecondary,
                      }}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => isOpen && router.push(`/my-loads/edit/${load.id}`)}
                      disabled={!isOpen}
                      title={isOpen ? "Edit" : "Locked — driver already assigned"}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: `1px solid ${theme.border}`,
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isOpen ? "pointer" : "not-allowed",
                        color: theme.textSecondary,
                        opacity: isOpen ? 1 : 0.35,
                      }}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => isOpen && handleCancel(load.id)}
                      disabled={!isOpen || cancellingId === load.id}
                      title={isOpen ? "Cancel Load" : "Locked — driver already assigned"}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: "1px solid #fecaca",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isOpen ? "pointer" : "not-allowed",
                        color: "#ef4444",
                        opacity: isOpen ? 1 : 0.35,
                      }}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}