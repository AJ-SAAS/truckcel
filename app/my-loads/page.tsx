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
import { ArrowLeft, Pencil, XCircle, Eye } from "lucide-react";

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

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700",
  matched: "bg-blue-50 text-blue-700",
  in_transit: "bg-amber-50 text-amber-700",
  delivered: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
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
          console.error("🚨 My Loads listener error:", error);
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
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Loads</h1>
        <p className="text-slate-600 mb-8">
          View, edit, or cancel the loads you've posted. Loads can only be edited or
          cancelled while they're still Open — once a driver accepts, the details are locked.
        </p>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading your loads...</div>
        ) : loads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-xl font-medium">You haven't posted any loads yet</p>
            <button
              onClick={() => router.push("/post-load")}
              className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700"
            >
              Post Your First Load
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {loads.map((load) => {
              const isOpen = load.status === "open";
              return (
                <div
                  key={load.id}
                  className="bg-white border rounded-2xl p-6 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                      {load.pickupCity} <span className="text-blue-600">→</span> {load.deliveryCity}
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                          STATUS_STYLES[load.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {load.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                      <span>{CARGO_LABELS[load.cargoType || ""] || load.cargoType || "—"}</span>
                      <span>Pickup: {load.pickupDate || "—"}</span>
                      {load.budgetUSD && <span>€{load.budgetUSD}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/loads/${load.id}`)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => isOpen && router.push(`/my-loads/edit/${load.id}`)}
                      disabled={!isOpen}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isOpen ? "Edit" : "Locked — driver already assigned"}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => isOpen && handleCancel(load.id)}
                      disabled={!isOpen || cancellingId === load.id}
                      className="p-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isOpen ? "Cancel Load" : "Locked — driver already assigned"}
                    >
                      <XCircle className="w-4 h-4" />
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