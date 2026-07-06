"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MapPin, Package, Truck, DollarSign, ArrowLeft, ImagePlus, X } from "lucide-react";

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
  pallets: z.preprocess((value) => (value === "" || value == null ? undefined : Number(value)), z.number().min(0).optional()),
  truckType: z.string().optional(),
  budgetUSD: z.preprocess((value) => (value === "" || value == null ? undefined : Number(value)), z.number().min(0).optional()),
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

export default function PostLoadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<LoadForm | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<LoadForm>({
    resolver: zodResolver(loadSchema) as Resolver<LoadForm>,
    defaultValues: { paymentTerms: "on_delivery" },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 photos
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (loadId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of images) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const storageRef = ref(storage, `loads/${loadId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const onSubmit: SubmitHandler<LoadForm> = async (data) => {
    const user = auth.currentUser;
    if (!user) {
      alert("❌ You are not logged in. Please refresh and log in again.");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "shipments"), {
        ...data,
        shipperId: user.uid,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (images.length > 0) {
        const imageUrls = await uploadImages(docRef.id);
        console.log("✅ Photos uploaded:", imageUrls);
      }

      console.log("✅ Load posted successfully!");
      setSubmittedData(data);
      setSuccess(true);
      reset({ paymentTerms: "on_delivery" });
      setImages([]);

    } catch (err: any) {
      console.error("🚨 Post Load Error:", err);
      alert(`Failed to post load:\n${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    const formData = submittedData ?? watch();
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-xl">
          <div className="text-7xl mb-6">🚛</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Load Posted Successfully!</h2>
          <p className="text-slate-600 mb-8">
            Your shipment from <strong>{formData?.pickupCity}</strong> to{" "}
            <strong>{formData?.deliveryCity}</strong> is now live.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setSuccess(false)}
              className="px-8 py-3.5 border border-slate-300 rounded-2xl font-semibold hover:bg-slate-50"
            >
              Post Another Load
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <h1 className="text-4xl font-bold text-slate-900 mb-2">Post a New Load</h1>
        <p className="text-slate-600 mb-10">Fill in the shipment details. Carriers will be able to see and bid on it.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Route Section */}
          <div className="bg-white rounded-3xl p-8 shadow border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Route Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Pickup City <span className="text-red-500">*</span></label>
                <input {...register("pickupCity")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="e.g. Riga, Latvia" />
                {errors.pickupCity && <p className="text-red-500 text-sm mt-1">{errors.pickupCity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery City <span className="text-red-500">*</span></label>
                <input {...register("deliveryCity")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="e.g. Berlin, Germany" />
                {errors.deliveryCity && <p className="text-red-500 text-sm mt-1">{errors.deliveryCity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pickup Address</label>
                <input {...register("pickupAddress")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="Street address (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Address</label>
                <input {...register("deliveryAddress")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="Street address (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pickup Date <span className="text-red-500">*</span></label>
                <input type="date" {...register("pickupDate")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" />
                {errors.pickupDate && <p className="text-red-500 text-sm mt-1">{errors.pickupDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Delivery Date</label>
                <input type="date" {...register("deliveryDate")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" />
              </div>
            </div>
          </div>

          {/* Cargo Section */}
          <div className="bg-white rounded-3xl p-8 shadow border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-semibold">Cargo Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Cargo Type <span className="text-red-500">*</span></label>
                <select {...register("cargoType")} className="w-full border border-slate-300 rounded-2xl px-4 py-3">
                  {CARGO_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                {errors.cargoType && <p className="text-red-500 text-sm mt-1">{errors.cargoType.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg) <span className="text-red-500">*</span></label>
                <input type="number" {...register("weightKg")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="8000" />
                {errors.weightKg && <p className="text-red-500 text-sm mt-1">{errors.weightKg.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pallets</label>
                <input type="number" {...register("pallets")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="6" />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Cargo Description</label>
              <textarea {...register("cargoDescription")} className="w-full border border-slate-300 rounded-2xl px-4 py-3 min-h-[100px]" placeholder="Describe the goods..." />
            </div>
          </div>

          {/* Truck & Payment */}
          <div className="bg-white rounded-3xl p-8 shadow border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold">Truck & Payment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Truck Type</label>
                <select {...register("truckType")} className="w-full border border-slate-300 rounded-2xl px-4 py-3">
                  {TRUCK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Budget (USD)</label>
                <input type="number" {...register("budgetUSD")} className="w-full border border-slate-300 rounded-2xl px-4 py-3" placeholder="1200" />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-3">Payment Terms</label>
              <div className="flex flex-wrap gap-6">
                {[
                  { value: "on_delivery", label: "On Delivery" },
                  { value: "upfront", label: "Upfront" },
                  { value: "net_30", label: "Net 30" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={option.value} {...register("paymentTerms")} className="accent-blue-600" />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-3xl p-8 shadow border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">Special Instructions</h2>
            </div>
            <textarea
              {...register("specialInstructions")}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 min-h-[110px]"
              placeholder="Loading hours, contact person, fragile items, etc."
            />
          </div>

          {/* Cargo Photos */}
          <div className="bg-white rounded-3xl p-8 shadow border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <ImagePlus className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">Cargo Photos (Recommended)</h2>
            </div>

            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" id="cargo-photos" />
            <label htmlFor="cargo-photos" className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400">
              <ImagePlus className="w-12 h-12 text-slate-400 mb-3" />
              <p className="font-medium">Upload photos of the cargo</p>
              <p className="text-sm text-slate-500 mt-1">Max 5 images • Helps carriers understand the load</p>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mt-6">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover rounded-xl" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={() => router.back()} className="px-8 py-3.5 border border-slate-300 rounded-2xl font-semibold hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-semibold disabled:bg-blue-400 hover:bg-blue-700 transition">
              {loading ? "Posting Load..." : "Post Load →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}