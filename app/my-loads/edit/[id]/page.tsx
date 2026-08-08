// app/my-loads/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import {
  MapPin,
  Package,
  Truck,
  ArrowLeft,
  ImagePlus,
  X,
} from "lucide-react";

const loadSchema = z.object({
  pickupCity: z.string().min(2, "Pickup city is required"),
  pickupAddress: z.string().optional(),
  deliveryCity: z.string().min(2, "Delivery city is required"),
  deliveryAddress: z.string().optional(),
  pickupDate: z.string().min(1, "Pickup date is required"),
  deliveryDate: z.string().optional(),
  cargoType: z.string().min(1, "Please select cargo type"),
  cargoDescription: z.string().optional(),
  weightKg: z.coerce.number().min(1, "Weight must be at least 1 kg"),
  pallets: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().min(0).optional()
  ),
  truckType: z.string().optional(),
  budgetUSD: z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().min(0).optional()
  ),
  paymentTerms: z.enum(["on_delivery", "upfront", "net_30"]),
  specialInstructions: z.string().optional(),
});

type LoadForm = z.infer<typeof loadSchema>;

const TRUCK_TYPES = [
  { value: "", label: "Any truck type" },
  { value: "semi-truck", label: "Semi-Truck (18 Wheeler)" },
  { value: "box-truck", label: "Box Truck" },
  { value: "flatbed", label: "Flatbed" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "tanker", label: "Tanker" },
];

const CARGO_TYPES = [
  { value: "", label: "Select cargo type" },
  { value: "general", label: "General Freight" },
  { value: "perishable", label: "Perishable / Food" },
  { value: "hazmat", label: "Hazardous Materials" },
  { value: "oversized", label: "Oversized / Heavy" },
  { value: "automotive", label: "Automotive" },
  { value: "electronics", label: "Electronics" },
  { value: "construction", label: "Construction Materials" },
  { value: "other", label: "Other" },
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
};

export default function EditLoadPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoadForm>({
    resolver: zodResolver(loadSchema) as Resolver<LoadForm>,
  });

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  // Load existing shipment data
  useEffect(() => {
    if (!id || !uid) return;

    const fetchLoad = async () => {
      try {
        const docRef = doc(db, "shipments", id as string);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert("Load not found.");
          router.push("/my-loads");
          return;
        }

        const data = docSnap.data();

        if (data.shipperId !== uid) {
          alert("You don't have permission to edit this load.");
          router.push("/my-loads");
          return;
        }

        if (data.status !== "open") {
          alert("This load can no longer be edited — a driver has already accepted it.");
          router.push("/my-loads");
          return;
        }

        reset({
          pickupCity: data.pickupCity,
          pickupAddress: data.pickupAddress,
          deliveryCity: data.deliveryCity,
          deliveryAddress: data.deliveryAddress,
          pickupDate: data.pickupDate,
          deliveryDate: data.deliveryDate,
          cargoType: data.cargoType,
          cargoDescription: data.cargoDescription,
          weightKg: data.weightKg,
          pallets: data.pallets,
          truckType: data.truckType,
          budgetUSD: data.budgetUSD,
          paymentTerms: data.paymentTerms,
          specialInstructions: data.specialInstructions,
        });

        setExistingImageUrls(data.imageUrls || []);
      } catch (err) {
        console.error(err);
        alert("Error loading shipment.");
        router.push("/my-loads");
      } finally {
        setLoading(false);
      }
    };

    fetchLoad();
  }, [id, uid, reset, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalSlots = 5 - existingImageUrls.length;
      setNewImages((prev) => [...prev, ...newFiles].slice(0, Math.max(totalSlots, 0)));
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (loadId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of newImages) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const storageRef = ref(storage, `loads/${loadId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const onSubmit: SubmitHandler<LoadForm> = async (data) => {
    if (!id) return;
    setSaving(true);

    try {
      let finalImageUrls = [...existingImageUrls];

      if (newImages.length > 0) {
        const uploaded = await uploadNewImages(id as string);
        finalImageUrls = [...finalImageUrls, ...uploaded];
      }

      await updateDoc(doc(db, "shipments", id as string), {
        ...data,
        imageUrls: finalImageUrls,
        updatedAt: serverTimestamp(),
      });

      alert("Load updated successfully!");
      router.push("/my-loads");
    } catch (err: any) {
      console.error("Edit Load Error:", err);
      alert(`Failed to update load: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
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

  const totalPhotoCount = existingImageUrls.length + newImages.length;

  return (
    <div style={{ minHeight: "100vh", background: theme.page, fontFamily: theme.font, padding: "40px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <button
          onClick={() => router.push("/my-loads")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            color: theme.textSecondary,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} />
          Back to My Loads
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>
          Edit load
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 36 }}>
          Update the shipment details below. Changes are only allowed while the load is still Open.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Route */}
          <div
            style={{
              background: theme.surface,
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <MapPin size={20} color={theme.accent} />
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Route information</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Pickup city <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  {...register("pickupCity")}
                  placeholder="e.g. Riga"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                {errors.pickupCity && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.pickupCity.message}</p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Delivery city <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  {...register("deliveryCity")}
                  placeholder="e.g. Berlin"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                {errors.deliveryCity && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.deliveryCity.message}</p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Pickup address
                </label>
                <input
                  {...register("pickupAddress")}
                  placeholder="Street address (optional)"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Delivery address
                </label>
                <input
                  {...register("deliveryAddress")}
                  placeholder="Street address (optional)"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Pickup date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  {...register("pickupDate")}
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                {errors.pickupDate && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.pickupDate.message}</p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Estimated delivery date
                </label>
                <input
                  type="date"
                  {...register("deliveryDate")}
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cargo */}
          <div
            style={{
              background: theme.surface,
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <Package size={20} color="#d97706" />
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Cargo details</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Cargo type <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  {...register("cargoType")}
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                    background: "white",
                  }}
                >
                  {CARGO_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.cargoType && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.cargoType.message}</p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Weight (kg) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  {...register("weightKg")}
                  placeholder="8000"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                {errors.weightKg && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.weightKg.message}</p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Pallets
                </label>
                <input
                  type="number"
                  {...register("pallets")}
                  placeholder="6"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Cargo description
              </label>
              <textarea
                {...register("cargoDescription")}
                placeholder="Describe the goods..."
                style={{
                  width: "100%",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 14,
                  outline: "none",
                  minHeight: 90,
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Truck & Payment */}
          <div
            style={{
              background: theme.surface,
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <Truck size={20} color="#059669" />
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Truck & payment</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Preferred truck type
                </label>
                <select
                  {...register("truckType")}
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                    background: "white",
                  }}
                >
                  {TRUCK_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Your budget (€)
                </label>
                <input
                  type="number"
                  {...register("budgetUSD")}
                  placeholder="1200"
                  style={{
                    width: "100%",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                Payment terms
              </label>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { value: "on_delivery", label: "On delivery" },
                  { value: "upfront", label: "Upfront" },
                  { value: "net_30", label: "Net 30" },
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}
                  >
                    <input type="radio" value={option.value} {...register("paymentTerms")} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Special instructions */}
          <div
            style={{
              background: theme.surface,
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${theme.border}`,
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Special instructions</h2>
            <textarea
              {...register("specialInstructions")}
              placeholder="Loading hours, contact person, fragile items, etc."
              style={{
                width: "100%",
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 14,
                outline: "none",
                minHeight: 100,
                resize: "vertical",
              }}
            />
          </div>

          {/* Photos */}
          <div
            style={{
              background: theme.surface,
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <ImagePlus size={20} color="#7c3aed" />
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Cargo photos</h2>
            </div>

            {existingImageUrls.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 10 }}>
                  Current photos
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {existingImageUrls.map((url, index) => (
                    <div key={index} style={{ position: "relative" }}>
                      <img
                        src={url}
                        alt="cargo"
                        style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
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
                  ))}
                </div>
              </div>
            )}

            {totalPhotoCount < 5 && (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="cargo-photos"
                />
                <label
                  htmlFor="cargo-photos"
                  style={{
                    border: `2px dashed ${theme.border}`,
                    borderRadius: 14,
                    padding: "28px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <ImagePlus size={28} color={theme.textMuted} style={{ marginBottom: 10 }} />
                  <p style={{ fontWeight: 500, fontSize: 14 }}>Upload more photos</p>
                  <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                    Max 5 images total
                  </p>
                </label>
              </>
            )}

            {newImages.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 10 }}>
                  New photos to upload
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {newImages.map((file, index) => (
                    <div key={index} style={{ position: "relative" }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
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
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => router.push("/my-loads")}
              style={{
                padding: "12px 24px",
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                background: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 28px",
                background: saving ? "#93c5fd" : theme.accent,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}