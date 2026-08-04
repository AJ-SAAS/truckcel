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
import { ArrowLeft, ArrowRight, Clock, Scale, Package, Truck, Inbox } from "lucide-react";

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
  general: "General freight",
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

  // Auth + real-time loads
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

  // Apply filters
  useEffect(() => {
    let result = [...loads];

    if (filterFrom) {
      result = result.filter((l) => l.pickupCity.toLowerCase().includes(filterFrom.toLowerCase()));
    }
    if (filterTo) {
      result = result.filter((l) => l.deliveryCity.toLowerCase().includes(filterTo.toLowerCase()));
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
    <div className="min-h-screen bg-white font-sans">
      {/* Top navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 hover:text-gray-800 flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="font-medium text-lg text-gray-900">Browse loads</h1>
          </div>

          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{filteredLoads.length}</span> loads available
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-gray-50 rounded-xl p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
              <input
                type="text"
                placeholder="e.g. Riga"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
              <input
                type="text"
                placeholder="e.g. Berlin"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Cargo type</label>
              <select
                value={filterCargo}
                onChange={(e) => setFilterCargo(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
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
                className="mt-auto h-[42px] text-sm text-gray-500 hover:text-gray-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Load cards */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading available loads...</div>
        ) : filteredLoads.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900">No loads found</p>
            <p className="text-gray-500 text-sm mt-1">Try changing your filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLoads.map((load) => (
              <div
                key={load.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                      {load.pickupCity}
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      {load.deliveryCity}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {load.pickupDate}
                      </div>
                      {load.weightKg && (
                        <div className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5" />
                          {load.weightKg.toLocaleString()} kg
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {load.budgetUSD ? (
                      <div className="text-2xl font-medium text-blue-600">€{load.budgetUSD}</div>
                    ) : (
                      <div className="text-gray-400 text-sm">Negotiable</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {load.cargoType && (
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      <Package className="w-3 h-3" />
                      {CARGO_LABELS[load.cargoType] || load.cargoType}
                    </span>
                  )}
                  {load.truckType && (
                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      <Truck className="w-3 h-3" />
                      {load.truckType}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-5">
                  <button
                    onClick={() => router.push(`/loads/${load.id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    View details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleAcceptLoad(load.id)}
                    disabled={acceptingId === load.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
                  >
                    {acceptingId === load.id ? "Accepting..." : "Accept load"}
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