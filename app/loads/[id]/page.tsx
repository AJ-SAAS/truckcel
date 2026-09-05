// app/loads/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import {
  MapPin,
  Package,
  Truck,
  Clock,
  ArrowLeft,
  ImageIcon,
  Check,
  ArrowRight,
  Camera,
  X,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

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
  podImageUrl?: string;
  podUploadedAt?: any;
  podReceivedBy?: string;
}

interface DriverInfo {
  fullName?: string;
  companyName?: string;
  truckType?: string;
  cargoInsured?: boolean;
  insuranceProvider?: string;
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
  success: "#16a34a",
  successBg: "#f0fdf4",
  successText: "#15803d",
  danger: "#dc2626",
  warningBg: "#fffbeb",
  warningText: "#b45309",
};

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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: 16,
        padding: 24,
        border: `1px solid ${theme.border}`,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      {icon}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{label}</p>
      <div style={{ fontSize: 14, fontWeight: 500, color: theme.textPrimary }}>{value}</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <p style={{ fontWeight: 500, color: theme.textPrimary }}>
            This load was cancelled by the shipper.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, marginBottom: 20 }}>
        Shipment timeline
      </h2>

      <div>
        {TIMELINE_STEPS.map((step, i) => {
          const isDone = step.statuses.includes(load.status);
          const isLast = i === TIMELINE_STEPS.length - 1;
          const ts = timestampFor[step.key];

          return (
            <div key={step.key} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isDone ? "#16a34a" : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <Check size={14} color="white" />
                  ) : (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9ca3af" }} />
                  )}
                </div>
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 28,
                      background: isDone ? "#16a34a" : "#e5e7eb",
                    }}
                  />
                )}
              </div>

              <div style={{ paddingBottom: 24 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: isDone ? theme.textPrimary : theme.textMuted,
                    marginBottom: 2,
                  }}
                >
                  {step.label}
                </p>
                {isDone && ts && (
                  <p style={{ fontSize: 12, color: theme.textMuted }}>{formatTimestamp(ts)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ProofOfDeliverySection({ load }: { load: Shipment }) {
  if (!load.podImageUrl) return null;
  return (
    <Section>
      <SectionHeading icon={<Camera size={18} color={theme.success} />}>
        Proof of delivery
      </SectionHeading>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "#f1f5f9",
          marginBottom: 12,
        }}
      >
        <img
          src={load.podImageUrl}
          alt="Proof of delivery"
          style={{ width: "100%", maxHeight: 400, objectFit: "contain" }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13, color: theme.textMuted }}>
        {load.podUploadedAt && <span>Uploaded {formatTimestamp(load.podUploadedAt)}</span>}
        {load.podReceivedBy && <span>Received by: {load.podReceivedBy}</span>}
      </div>
    </Section>
  );
}

function CarrierSection({ driver }: { driver: DriverInfo }) {
  const isInsured = !!driver.cargoInsured;
  return (
    <Section>
      <SectionHeading icon={<Truck size={18} color={theme.textMuted} />}>
        Carrier
      </SectionHeading>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: theme.textPrimary, margin: 0 }}>
            {driver.fullName || "Driver"}
          </p>
          {driver.companyName && (
            <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>{driver.companyName}</p>
          )}
        </div>

        {isInsured ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: theme.successBg,
              color: theme.successText,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            Cargo insured
            {driver.insuranceProvider ? ` · ${driver.insuranceProvider}` : ""}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: theme.warningBg,
              color: theme.warningText,
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ShieldQuestion size={14} />
            Insurance not confirmed
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 10 }}>
        Insurance status is self-declared by the carrier.
      </p>
    </Section>
  );
}

export default function LoadDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [load, setLoad] = useState<Shipment | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [isCarrier, setIsCarrier] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Proof of delivery panel state
  const [showPodPanel, setShowPodPanel] = useState(false);
  const [podFile, setPodFile] = useState<File | null>(null);
  const [podReceivedBy, setPodReceivedBy] = useState("");
  const [podError, setPodError] = useState("");

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

          // Fetch the assigned carrier's info once a driver is matched
          if (data.carrierId) {
            const driverSnap = await getDoc(doc(db, "drivers", data.carrierId));
            if (driverSnap.exists()) {
              setDriver(driverSnap.data() as DriverInfo);
            }
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

  const handlePodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPodFile(e.target.files[0]);
      setPodError("");
    }
  };

  const handleConfirmDelivery = async () => {
    if (!load || !uid) return;

    if (!podFile) {
      setPodError("A proof of delivery photo is required before marking this load as delivered.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const fileName = `${Date.now()}-${podFile.name.replace(/\s+/g, "-")}`;
      const storageRef = ref(storage, `pod/${load.id}/${fileName}`);
      await uploadBytes(storageRef, podFile);
      const podImageUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "shipments", load.id), {
        status: "delivered",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        podImageUrl,
        podUploadedAt: serverTimestamp(),
        podReceivedBy: podReceivedBy.trim() || null,
      });

      await updateDoc(doc(db, "drivers", uid), {
        completedTrips: increment(1),
      });

      await refreshLoad();
      setShowPodPanel(false);
      setPodFile(null);
      setPodReceivedBy("");
    } catch (err) {
      console.error(err);
      setPodError("Failed to mark as delivered. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font,
        }}
      >
        <p style={{ color: theme.textMuted, fontSize: 14 }}>Loading load details...</p>
      </div>
    );
  }

  if (!load) return null;

  const hasImages = load.imageUrls && load.imageUrls.length > 0;
  const isAssignedDriver = isCarrier && load.carrierId === uid;

  return (
    <div style={{ minHeight: "100vh", background: theme.page, fontFamily: theme.font, paddingBottom: 60 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px" }}>
        <button
          onClick={() => router.back()}
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
          Back
        </button>

        {/* Header */}
        <Section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: theme.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {load.pickupCity}
                <ArrowRight size={18} color={theme.accent} />
                {load.deliveryCity}
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: theme.textSecondary,
                }}
              >
                <Clock size={15} />
                Pickup: {load.pickupDate || "Flexible"}
              </div>
            </div>

            {load.budgetUSD && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: theme.accentText }}>
                  €{load.budgetUSD}
                </div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2, textTransform: "capitalize" }}>
                  {load.paymentTerms?.replace("_", " ")}
                </div>
              </div>
            )}
          </div>
        </Section>

        {load.status !== "open" && <ShipmentTimeline load={load} />}

        {/* Carrier + insurance badge — shown once a driver is assigned */}
        {load.status !== "open" && driver && <CarrierSection driver={driver} />}

        {/* Proof of delivery — shown once delivered */}
        <ProofOfDeliverySection load={load} />

        {/* Cargo photos */}
        <Section>
          <SectionHeading icon={<ImageIcon size={18} color={theme.textMuted} />}>
            Cargo photos
          </SectionHeading>

          {hasImages ? (
            <>
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#f1f5f9",
                  marginBottom: 12,
                }}
              >
                <img
                  src={activeImage ?? load.imageUrls![0]}
                  alt="Cargo"
                  style={{ width: "100%", maxHeight: 400, objectFit: "contain" }}
                />
              </div>

              {load.imageUrls!.length > 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  {load.imageUrls!.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      style={{
                        borderRadius: 8,
                        overflow: "hidden",
                        border: activeImage === url ? `2px solid ${theme.accent}` : "2px solid transparent",
                        padding: 0,
                        cursor: "pointer",
                        background: "none",
                      }}
                    >
                      <img
                        src={url}
                        alt={`Cargo ${i + 1}`}
                        style={{ width: "100%", height: 72, objectFit: "cover", display: "block" }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: theme.textMuted, fontSize: 14 }}>No photos were provided for this load.</p>
          )}
        </Section>

        {/* Cargo info */}
        <Section>
          <SectionHeading icon={<Package size={18} color={theme.textMuted} />}>
            Cargo information
          </SectionHeading>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field
              label="Cargo type"
              value={CARGO_LABELS[load.cargoType || ""] || load.cargoType || "—"}
            />
            <Field label="Weight" value={`${load.weightKg?.toLocaleString() || "—"} kg`} />
            <Field label="Pallets" value={load.pallets || "—"} />
            <Field
              label="Preferred truck"
              value={<span style={{ textTransform: "capitalize" }}>{load.truckType || "Any"}</span>}
            />
          </div>

          {load.cargoDescription && (
            <div style={{ marginTop: 22 }}>
              <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Description</p>
              <p style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 1.6 }}>
                {load.cargoDescription}
              </p>
            </div>
          )}
        </Section>

        {/* Route & instructions */}
        <Section>
          <SectionHeading icon={<MapPin size={18} color={theme.textMuted} />}>
            Route and instructions
          </SectionHeading>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field
              label="Pickup"
              value={
                <>
                  {load.pickupCity}
                  {load.pickupAddress && (
                    <span style={{ display: "block", color: theme.textSecondary, fontWeight: 400, marginTop: 2 }}>
                      {load.pickupAddress}
                    </span>
                  )}
                </>
              }
            />
            <Field
              label="Delivery"
              value={
                <>
                  {load.deliveryCity}
                  {load.deliveryAddress && (
                    <span style={{ display: "block", color: theme.textSecondary, fontWeight: 400, marginTop: 2 }}>
                      {load.deliveryAddress}
                    </span>
                  )}
                </>
              }
            />

            {load.specialInstructions && (
              <div>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Special instructions</p>
                <p style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 1.6 }}>
                  {load.specialInstructions}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Actions */}
        {isCarrier && load.status === "open" && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{
                padding: "13px 32px",
                background: accepting ? "#93c5fd" : theme.accent,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                cursor: accepting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Check size={16} />
              {accepting ? "Accepting..." : "Accept this load"}
            </button>
          </div>
        )}

        {isAssignedDriver && load.status === "matched" && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              onClick={handleStartTrip}
              disabled={updatingStatus}
              style={{
                padding: "13px 32px",
                background: updatingStatus ? "#93c5fd" : theme.accent,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                cursor: updatingStatus ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Truck size={16} />
              {updatingStatus ? "Starting..." : "Start trip"}
            </button>
          </div>
        )}

        {/* Mark delivered trigger — assigned driver, in transit, panel not yet open */}
        {isAssignedDriver && load.status === "in_transit" && !showPodPanel && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button
              onClick={() => setShowPodPanel(true)}
              style={{
                padding: "13px 32px",
                background: theme.success,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Check size={16} />
              Mark delivered
            </button>
          </div>
        )}

        {/* Proof of delivery upload panel */}
        {isAssignedDriver && load.status === "in_transit" && showPodPanel && (
          <Section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Camera size={18} color={theme.success} />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>
                  Confirm delivery
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowPodPanel(false);
                  setPodFile(null);
                  setPodError("");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 18, lineHeight: 1.6 }}>
              A photo is required to confirm this load was delivered. This protects both you and the shipper.
            </p>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                Delivery photo <span style={{ color: theme.danger }}>*</span>
              </p>
              {podFile ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={URL.createObjectURL(podFile)}
                    alt="POD preview"
                    style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => setPodFile(null)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      background: theme.danger,
                      color: "white",
                      borderRadius: "50%",
                      border: "none",
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePodFileChange}
                    style={{ display: "none" }}
                    id="pod-photo"
                  />
                  <label
                    htmlFor="pod-photo"
                    style={{
                      border: `2px dashed ${theme.border}`,
                      borderRadius: 12,
                      padding: 28,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Camera size={32} color={theme.textMuted} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary, margin: 0 }}>
                      Take or upload a photo
                    </p>
                    <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                      Show the delivered cargo at its destination
                    </p>
                  </label>
                </>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>Received by (optional)</p>
              <input
                type="text"
                value={podReceivedBy}
                onChange={(e) => setPodReceivedBy(e.target.value)}
                placeholder="Name of the person who received the cargo"
                style={{
                  width: "100%",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: theme.font,
                }}
              />
            </div>

            {podError && (
              <p style={{ fontSize: 13, color: theme.danger, marginBottom: 14 }}>{podError}</p>
            )}

            <button
              onClick={handleConfirmDelivery}
              disabled={updatingStatus}
              style={{
                width: "100%",
                padding: "13px 24px",
                background: updatingStatus ? "#93c5fd" : theme.success,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                cursor: updatingStatus ? "not-allowed" : "pointer",
              }}
            >
              {updatingStatus ? "Confirming..." : "Confirm delivery"}
            </button>
          </Section>
        )}

        {load.status === "delivered" && !load.podImageUrl && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <div
              style={{
                padding: "12px 24px",
                background: theme.successBg,
                color: theme.successText,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Check size={16} />
              Delivered
            </div>
          </div>
        )}
      </div>
    </div>
  );
}