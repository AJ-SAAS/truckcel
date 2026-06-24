"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { MapPin, Package, Truck, DollarSign, Clock, ArrowLeft } from "lucide-react";

interface Shipment {
  id: string;
  pickupCity: string;
  pickupAddress?: string;
  deliveryCity: string;
  deliveryAddress?: string;
  pickupDate?: string;
  deliveryDate?: string;
  cargoType?: string;
  cargoDescription?: string;
  weightKg?: number;
  pallets?: number;
  truckType?: string;
  budgetUSD?: number;
  paymentTerms?: string;
  specialInstructions?: string;
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

export default function LoadDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [load, setLoad] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [isCarrier, setIsCarrier] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "driver") {
        setIsCarrier(true);
      }
    });

    return () => unsub();
  }, [router]);

  // Fetch load details
  useEffect(() => {
    if (!id) return;

    const fetchLoad = async () => {
      try {
        const docRef = doc(db, "shipments", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLoad({ id: docSnap.id, ...docSnap.data() } as Shipment);
        } else {
          alert("Load not found");
          router.push("/browse-loads");
        }
      } catch (err) {
        console.error(err);
        alert("Error loading shipment details");
      } finally {
        setLoading(false);
      }
    };

    fetchLoad();
  }, [id, router]);

  const handleAccept = async () => {
    if (!uid || !load) return;

    setAccepting(true);
    try {
      await updateDoc(doc(db, "shipments", load.id), {
        status: "matched",
        carrierId: uid,
        updatedAt: serverTimestamp(),
      });

      alert("🎉 Load accepted successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to accept load. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading load details...</p>
      </div>
    );
  }

  if (!load) {
    return <p>Load not found.</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/browse-loads")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Loads
        </button>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 shadow border border-slate-100 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                {load.pickupCity} <span className="text-blue-600">→</span> {load.deliveryCity}
              </div>
              <div className="text-slate-500 mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pickup: {load.pickupDate || "Flexible"}
              </div>
            </div>

            {load.budgetUSD && (
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">€{load.budgetUSD}</div>
                <div className="text-sm text-slate-500">
                  {load.paymentTerms?.replace("_", " ")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cargo Info */}
        <div className="bg-white rounded-3xl p-8 shadow border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold">Cargo Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-xs text-slate-500 font-medium">CARGO TYPE</p>
              <p className="font-medium">{CARGO_LABELS[load.cargoType || ""] || load.cargoType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">WEIGHT</p>
              <p className="font-medium">{load.weightKg?.toLocaleString() || "—"} kg</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">PALLETS</p>
              <p className="font-medium">{load.pallets || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">PREFERRED TRUCK</p>
              <p className="font-medium capitalize">{load.truckType || "Any"}</p>
            </div>
          </div>

          {load.cargoDescription && (
            <div className="mt-8">
              <p className="text-xs text-slate-500 font-medium mb-2">DESCRIPTION</p>
              <p className="text-slate-700 leading-relaxed">{load.cargoDescription}</p>
            </div>
          )}
        </div>

        {/* Route & Instructions */}
        <div className="bg-white rounded-3xl p-8 shadow border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Route & Instructions</h2>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-500 font-medium">PICKUP</p>
              <p className="font-medium">{load.pickupCity}</p>
              {load.pickupAddress && <p className="text-slate-600">{load.pickupAddress}</p>}
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium">DELIVERY</p>
              <p className="font-medium">{load.deliveryCity}</p>
              {load.deliveryAddress && <p className="text-slate-600">{load.deliveryAddress}</p>}
            </div>

            {load.specialInstructions && (
              <div>
                <p className="text-xs text-slate-500 font-medium">SPECIAL INSTRUCTIONS</p>
                <p className="text-slate-700 leading-relaxed">{load.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Accept Button */}
        {isCarrier && load.status === "open" && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-2xl disabled:bg-gray-400 transition"
            >
              {accepting ? "Accepting Load..." : "✅ Accept This Load"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}