"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { MapPin, Package, Truck, DollarSign, Clock, ArrowLeft, ImageIcon, Check } from "lucide-react";

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
  imageUrls?: string[];
  createdAt?: any;
  matchedAt?: any;
  startedAt?: any;
  completedAt?: any;
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

const TIMELINE_STEPS = [
  { key: "posted", label: "Posted", statuses: ["open", "matched", "in_transit", "delivered"] },
  { key: "matched", label: "Driver accepted", statuses: ["matched", "in_transit", "delivered"] },
  { key: "in_transit", label: "In transit", statuses: ["in_transit", "delivered"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
];

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function ShipmentTimeline({ load }: { load: Shipment }) {
  const timestampFor: Record<string, any> = {
    posted: load.createdAt,
    matched: load.matchedAt,
    in_transit: load.startedAt,
    delivered: load.completedAt,
  };

  if (load.status === "cancelled") {
    return (
      <div className="bg-white rounded-3xl p-8 shadow border border-slate-100 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <p className="font-medium text-slate-700">This load was cancelled by the shipper.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow border border-slate-100 mb-8">
      <h2 className="text-xl font-semibold mb-6">Shipment timeline</h2>
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const isDone = step.statuses.includes(load.status);
          const isLast = i === TIMELINE_STEPS.length - 1;
          const ts = timestampFor[step.key];
          return (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isDone ? "bg-green-600" : "bg-slate-200"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[28px] ${isDone ? "bg-green-600" : "bg-slate-200"}`} />
                )}
              </div>
              <div className="pb-8">
                <p className={`font-medium ${isDone ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                {isDone && ts && (
                  <p className="text-xs text-slate-400 mt-0.5">{formatTimestamp(ts)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoadDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [load, setLoad] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [isCarrier, setIsCarrier] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

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
          const data = { id: docSnap.id, ...docSnap.data() } as Shipment;
          setLoad(data);
          if (data.imageUrls && data.imageUrls.length > 0) {
            setActiveImage(data.imageUrls[0]);
          }
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

  const refreshLoad = async () => {
    if (!id) return;
    const docSnap = await getDoc(doc(db, "shipments", id as string));
    if (docSnap.exists()) {
      setLoad({ id: docSnap.id, ...docSnap.data() } as Shipment);
    }
  };

  const handleAccept = async () => {
    if (!uid || !load) return;

    setAccepting(true);
    try {
      await updateDoc(doc(db, "shipments", load.id), {
        status: "matched",
        carrierId: uid,
        matchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await refreshLoad();
      alert("🎉 Load accepted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to accept load. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  const handleStartTrip = async () => {
    if (!load) return;
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, "shipments", load.id), {
        status: "in_transit",
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await refreshLoad();
    } catch (err) {
      console.error(err);
      alert("Failed to update trip status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!load || !uid) return;
    const confirmed = window.confirm("Mark this load as delivered? This can't be undone.");
    if (!confirmed) return;

    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, "shipments", load.id), {
        status: "delivered",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Bump the driver's completed trip count
      await updateDoc(doc(db, "drivers", uid), {
        completedTrips: increment(1),
      });

      await refreshLoad();
    } catch (err) {
      console.error(err);
      alert("Failed to mark as delivered. Please try again.");
    } finally {
      setUpdatingStatus(false);
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

  const hasImages = load.imageUrls && load.imageUrls.length > 0;
  const isAssignedDriver = isCarrier && load.carrierId === uid;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
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

        {/* Shipment Timeline — shown once a driver is assigned */}
        {load.status !== "open" && <ShipmentTimeline load={load} />}

        {/* Cargo Photos */}
        <div className="bg-white rounded-3xl p-8 shadow border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Cargo Photos</h2>
          </div>

          {hasImages ? (
            <>
              <div className="rounded-2xl overflow-hidden bg-slate-100 mb-4">
                <img
                  src={activeImage ?? load.imageUrls![0]}
                  alt="Cargo"
                  className="w-full max-h-[420px] object-contain"
                />
              </div>
              {load.imageUrls!.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {load.imageUrls!.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`rounded-xl overflow-hidden border-2 ${
                        activeImage === url ? "border-blue-600" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt={`Cargo ${i + 1}`} className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm">No photos were provided for this load.</p>
          )}
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

        {/* Accept Button — only for undecided open loads */}
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

        {/* Start Trip — assigned driver, matched but not yet started */}
        {isAssignedDriver && load.status === "matched" && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleStartTrip}
              disabled={updatingStatus}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl disabled:bg-gray-400 transition flex items-center gap-2"
            >
              <Truck className="w-5 h-5" />
              {updatingStatus ? "Starting..." : "Start Trip"}
            </button>
          </div>
        )}

        {/* Mark Delivered — assigned driver, in transit */}
        {isAssignedDriver && load.status === "in_transit" && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleMarkDelivered}
              disabled={updatingStatus}
              className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-2xl disabled:bg-gray-400 transition flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {updatingStatus ? "Updating..." : "Mark Delivered"}
            </button>
          </div>
        )}

        {/* Delivered confirmation */}
        {load.status === "delivered" && (
          <div className="flex justify-center mt-8">
            <div className="px-8 py-4 bg-green-50 text-green-700 rounded-2xl font-semibold flex items-center gap-2">
              <Check className="w-5 h-5" />
              Delivered
            </div>
          </div>
        )}
      </div>
    </div>
  );
}