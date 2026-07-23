// app/onboarding/driver/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { uploadDriverFile } from "@/lib/uploadDriverFile";

const STEPS = [
  { id: "account", title: "Account Setup", desc: "Basic information" },
  { id: "company", title: "Company Details", desc: "Business information" },
  { id: "truck", title: "Truck Information", desc: "Vehicle details" },
  { id: "documents", title: "Required paperwork", desc: "Upload your documents" },
  { id: "routes", title: "Preferred Routes", desc: "Your regular routes" },
  { id: "done", title: "Complete!", desc: "Ready to start" }
];

// Helper Components
function Label({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#374151" }}>
      {children} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );
}

function Input({ type = "text", placeholder, value, onChange, required = false }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={{
        width: "100%",
        padding: "12px 16px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 16,
        background: "white",
      }}
    />
  );
}

// Step Components
function StepAccount({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Account Setup</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Full Name</Label>
        <Input placeholder="Enter your full name" value={data.fullName || ""} onChange={(e: any) => onUpdate({ ...data, fullName: e.target.value })} required />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Phone Number</Label>
        <Input type="tel" placeholder="+371 123 4567" value={data.phone || ""} onChange={(e: any) => onUpdate({ ...data, phone: e.target.value })} required />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>License Number</Label>
        <Input placeholder="Enter your driver's license number" value={data.licenseNumber || ""} onChange={(e: any) => onUpdate({ ...data, licenseNumber: e.target.value })} required />
      </div>
    </div>
  );
}

function StepCompany({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Company Details</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Company Name</Label>
        <Input placeholder="Enter your company name" value={data.companyName || ""} onChange={(e: any) => onUpdate({ ...data, companyName: e.target.value })} required />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label>Tax ID / EIN</Label>
        <Input placeholder="Enter tax ID" value={data.taxId || ""} onChange={(e: any) => onUpdate({ ...data, taxId: e.target.value })} />
      </div>
    </div>
  );
}

function StepTruck({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Truck Information</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Truck Type</Label>
        <select value={data.truckType || ""} onChange={(e: any) => onUpdate({ ...data, truckType: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 8 }}>
          <option value="">Select truck type</option>
          <option value="semi-truck">Semi-Truck</option>
          <option value="box-truck">Box Truck</option>
          <option value="flatbed">Flatbed</option>
          <option value="refrigerated">Refrigerated</option>
        </select>
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>License Plate</Label>
        <Input placeholder="License plate number" value={data.licensePlate || ""} onChange={(e: any) => onUpdate({ ...data, licensePlate: e.target.value })} required />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Max Capacity (kg)</Label>
        <Input type="number" placeholder="24000" value={data.capacity || ""} onChange={(e: any) => onUpdate({ ...data, capacity: e.target.value })} required />
      </div>
    </div>
  );
}

function StepDocuments({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Required Documents</h2>
      
      <div style={{ marginBottom: 24 }}>
        <Label required>Driver's License (Front)</Label>
        <input type="file" accept="image/*" onChange={(e) => onUpdate({ ...data, licenseFront: e.target.files?.[0] || null })} style={{ width: "100%", padding: 12, border: "2px dashed #d1d5db", borderRadius: 8 }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label required>Driver's License (Back)</Label>
        <input type="file" accept="image/*" onChange={(e) => onUpdate({ ...data, licenseBack: e.target.files?.[0] || null })} style={{ width: "100%", padding: 12, border: "2px dashed #d1d5db", borderRadius: 8 }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label required>Insurance Certificate</Label>
        <input type="file" accept="image/*,.pdf" onChange={(e) => onUpdate({ ...data, insurance: e.target.files?.[0] || null })} style={{ width: "100%", padding: 12, border: "2px dashed #d1d5db", borderRadius: 8 }} />
      </div>
    </div>
  );
}

function StepRoutes({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Preferred Routes</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Primary Route</Label>
        <div style={{ display: "flex", gap: 12 }}>
          <Input placeholder="From" value={data.primaryFrom || ""} onChange={(e: any) => onUpdate({ ...data, primaryFrom: e.target.value })} />
          <span style={{ alignSelf: "center" }}>→</span>
          <Input placeholder="To" value={data.primaryTo || ""} onChange={(e: any) => onUpdate({ ...data, primaryTo: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function StepDone() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 700 }}>Welcome to Truckcel!</h2>
      <p style={{ color: "#6b7280", marginTop: 16 }}>Your profile is under review. We'll notify you once approved.</p>
    </div>
  );
}

// Main Component
export default function DriverOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/login");
      else setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final Step - Save everything
    if (!user) {
      alert("Please log in again");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dataToSave: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        companyName: formData.companyName,
        truckType: formData.truckType,
        licensePlate: formData.licensePlate,
        capacityKg: Number(formData.capacity) || 0,
        primaryFrom: formData.primaryFrom,
        primaryTo: formData.primaryTo,
        status: "pending_review",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Upload files using the helper
      if (formData.licenseFront) {
        dataToSave.licenseFrontUrl = await uploadDriverFile(formData.licenseFront, "license");
      }
      if (formData.licenseBack) {
        dataToSave.licenseBackUrl = await uploadDriverFile(formData.licenseBack, "license");
      }
      if (formData.insurance) {
        dataToSave.insuranceUrl = await uploadDriverFile(formData.insurance, "insurance");
      }

      await setDoc(doc(db, "drivers", user.uid), dataToSave, { merge: true });

      alert("✅ Onboarding completed successfully!");
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Onboarding Error:", err);
      setError(err.message || "Failed to save data");
      alert("Something went wrong. Check console (F12) for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const CurrentStepComponent = [StepAccount, StepCompany, StepTruck, StepDocuments, StepRoutes, StepDone][currentStep];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        
        {/* Progress */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((step, idx) => (
              <div key={step.id} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontWeight: 600, color: idx <= currentStep ? "#3b82f6" : "#9ca3af" }}>
                  {idx + 1}. {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "40px 32px" }}>
          <CurrentStepComponent data={formData} onUpdate={setFormData} />
        </div>

        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={handleBack} disabled={currentStep === 0 || loading} style={{ padding: "12px 28px", border: "1px solid #d1d5db", borderRadius: 8 }}>
            Back
          </button>
          <button 
            onClick={handleNext} 
            disabled={loading}
            style={{ padding: "12px 32px", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontWeight: 600 }}
          >
            {loading ? "Saving..." : currentStep === STEPS.length - 1 ? "Complete Setup" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}