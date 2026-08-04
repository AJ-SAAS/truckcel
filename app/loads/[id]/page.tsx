"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { MapPin, Package, Truck, Clock, ArrowLeft, ImageIcon, Check } from "lucide-react";

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
  general: "General freight",
  perishable: "Perishable / food",
  hazmat: "Hazardous materials",
  oversized: "Oversized / heavy",
  automotive: "Automotive",
  electronics: "Electronics",
  construction: "Construction materials",
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
    return (
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " +
      date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "";
  }
}

// Shared card wrapper so every section on this page carries the same
// radius, border, and padding.
function Section({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">{children}</div>;
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      {icon}
      <h2 className="text-base font-medium text-gray-900">{children}</h2>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
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
      <Section>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <p className="font-medium text-gray-700">This load was cancelled by the shipper.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <h2 className="text-base font-medium text-gray-900 mb-5">Shipment timeline</h2>
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const isDone = step.statuses.includes(load.status);
          const isLast = i === TIMELINE_STEPS.length - 1;
          const ts = timestampFor[step.key];
          return (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isDone ? "bg-green-600" : "bg-gray-200"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[26px] ${isDone ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
              <div className="pb-6">
                <p className={`text-sm font-medium ${isDone ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                {isDone && ts && <p className="text-xs text-gray-400 mt-0.5">{formatTimestamp(ts)}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
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
  const [notFound, setNotFound] = useState(false);

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
          setNotFound(true);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLoad();
  }, [id]);

  useEffect(() => {
    if (notFound) router.push("/browse-loads");
  }, [notFound, router]);

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
    } catch (err) {
      console.error(err);
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

      await updateDoc(doc(db, "drivers", uid), {
        completedTrips: increment(1),
      });

      await refreshLoad();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading load details...</p>
      </div>
    );
  }

  if (!load) return null;

  const hasImages = load.imageUrls && load.imageUrls.length > 0;
  const isAssignedDriver = isCarrier && load.carrierId === uid;

  return (
    <div className="min-h-screen bg-white pb-16 font-sans">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <Section>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-medium text-gray-900 flex items-center gap-3">
                {load.pickupCity} <span className="text-blue-600">→</span> {load.deliveryCity}
              </div>
              <div className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                Pickup: {load.pickupDate || "Flexible"}
              </div>
            </div>

            {load.budgetUSD && (
              <div className="text-right">
                <div className="text-3xl font-medium text-blue-600">€{load.budgetUSD}</div>
                <div className="text-sm text-gray-500 capitalize">{load.paymentTerms?.replace("_", " ")}</div>
              </div>
            )}
          </div>
        </Section>

        {load.status !== "open" && <ShipmentTimeline load={load} />}

        {/* Cargo photos */}
        <Section>
          <SectionHeading icon={<ImageIcon className="w-5 h-5 text-gray-400" />}>Cargo photos</SectionHeading>

          {hasImages ? (
            <>
              <div className="rounded-lg overflow-hidden bg-gray-50 mb-3">
                <img
                  src={activeImage ?? load.imageUrls![0]}
                  alt="Cargo"
                  className="w-full max-h-[420px] object-contain"
                />
              </div>
              {load.imageUrls!.length > 1 && (
                <div className="grid grid-cols-5 gap-2.5">
                  {load.imageUrls!.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`rounded-md overflow-hidden border-2 ${
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
            <p className="text-gray-400 text-sm">No photos were provided for this load.</p>
          )}
        </Section>

        {/* Cargo info */}
        <Section>
          <SectionHeading icon={<Package className="w-5 h-5 text-gray-400" />}>Cargo information</SectionHeading>

          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <Field label="Cargo type" value={CARGO_LABELS[load.cargoType || ""] || load.cargoType || "—"} />
            <Field label="Weight" value={`${load.weightKg?.toLocaleString() || "—"} kg`} />
            <Field label="Pallets" value={load.pallets || "—"} />
            <Field label="Preferred truck" value={<span className="capitalize">{load.truckType || "Any"}</span>} />
          </div>

          {load.cargoDescription && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-1.5">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{load.cargoDescription}</p>
            </div>
          )}
        </Section>

        {/* Route & instructions */}
        <Section>
          <SectionHeading icon={<MapPin className="w-5 h-5 text-gray-400" />}>Route and instructions</SectionHeading>

          <div className="space-y-5 text-sm">
            <Field
              label="Pickup"
              value={
                <>
                  {load.pickupCity}
                  {load.pickupAddress && <span className="block text-gray-500 font-normal">{load.pickupAddress}</span>}
                </>
              }
            />
            <Field
              label="Delivery"
              value={
                <>
                  {load.deliveryCity}
                  {load.deliveryAddress && (
                    <span className="block text-gray-500 font-normal">{load.deliveryAddress}</span>
                  )}
                </>
              }
            />

            {load.specialInstructions && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Special instructions</p>
                <p className="text-gray-700 leading-relaxed">{load.specialInstructions}</p>
              </div>
            )}
          </div>
        </Section>

        {/* Accept — undecided open loads */}
        {isCarrier && load.status === "open" && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {accepting ? "Accepting load..." : "Accept this load"}
            </button>
          </div>
        )}

        {/* Start trip — assigned driver, matched but not started */}
        {isAssignedDriver && load.status === "matched" && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleStartTrip}
              disabled={updatingStatus}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              {updatingStatus ? "Starting..." : "Start trip"}
            </button>
          </div>
        )}

        {/* Mark delivered — assigned driver, in transit */}
        {isAssignedDriver && load.status === "in_transit" && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleMarkDelivered}
              disabled={updatingStatus}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {updatingStatus ? "Updating..." : "Mark delivered"}
            </button>
          </div>
        )}

        {/* Delivered confirmation */}
        {load.status === "delivered" && (
          <div className="flex justify-center mt-6">
            <div className="px-6 py-3 bg-green-50 text-green-700 rounded-lg font-medium flex items-center gap-2 text-sm">
              <Check className="w-4 h-4" />
              Delivered
            </div>
          </div>
        )}
      </div>
    </div>
  );
}