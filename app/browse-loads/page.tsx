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
  serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { MapPin, Truck, Package, Clock, DollarSign } from "lucide-react";

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
}

const CARGO_LABELS: Record<string, string> = {
  general: "General Freight",
  perishable: "Perishable",
  hazmat: "Hazardous",
  oversized: "Oversized",
  automotive: "Automotive",
  electronics: "Electronics",
  construction: "Construction",
  other: "Other",
};

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

  // Auth + Real-time Loads
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);

      // Real-time listener for open loads
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
          console.error("🚨 Browse Loads listener error:", error);
          setLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [router]);

  // Apply filters
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

      alert("✅ Load accepted! Check your dashboard.");
    } catch (err) {
      console.error(err);
      alert("Failed to accept load. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
            >
              ← Dashboard
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="font-semibold text-xl text-slate-900">Browse Loads</h1>
          </div>

          <div className="text-sm text-emerald-600 font-medium">
            {filteredLoads.length} loads available
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">FROM</label>
              <input
                type="text"
                placeholder="e.g. Riga"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">TO</label>
              <input
                type="text"
                placeholder="e.g. Berlin"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">CARGO TYPE</label>
              <select
                value={filterCargo}
                onChange={(e) => setFilterCargo(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                {Object.entries(CARGO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
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
                className="mt-auto h-12 text-red-600 hover:text-red-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Load Cards */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading available loads...</div>
        ) : filteredLoads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-xl font-medium">No loads found</p>
            <p className="text-slate-500 mt-2">Try changing your filters</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredLoads.map((load) => (
              <div
                key={load.id}
                className="bg-white border rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 text-xl font-semibold">
                      {load.pickupCity} <span className="text-blue-600">→</span> {load.deliveryCity}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {load.pickupDate}
                      </div>
                      {load.weightKg && (
                        <div>⚖️ {load.weightKg.toLocaleString()} kg</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {load.budgetUSD ? (
                      <div className="text-3xl font-bold text-blue-600">€{load.budgetUSD}</div>
                    ) : (
                      <div className="text-slate-400">Negotiable</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  {load.cargoType && (
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                      📦 {CARGO_LABELS[load.cargoType] || load.cargoType}
                    </span>
                  )}
                  {load.truckType && (
                    <span className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                      🚛 {load.truckType}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => router.push(`/loads/${load.id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Details →
                  </button>

                  <button
                    onClick={() => handleAcceptLoad(load.id)}
                    disabled={acceptingId === load.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl font-semibold transition"
                  >
                    {acceptingId === load.id ? "Accepting..." : "Accept Load"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}