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

const TRUCK_TYPES = [
  { value: "semi-truck", label: "Semi-Truck", icon: "🚛", desc: "18 wheeler" },
  { value: "box-truck", label: "Box Truck", icon: "🚚", desc: "Enclosed cargo" },
  { value: "flatbed", label: "Flatbed", icon: "🛻", desc: "Open platform" },
  { value: "refrigerated", label: "Refrigerated", icon: "❄️", desc: "Temp-controlled" },
];

// Validates the current step's data and returns a map of field -> error message.
// An empty object means the step is valid and it's OK to advance.
function validateStep(stepIndex: number, data: any): Record<string, string> {
  const errors: Record<string, string> = {};

  if (stepIndex === 0) {
    if (!data.fullName?.trim()) errors.fullName = "Full name is required";
    if (!data.phone?.trim()) errors.phone = "Phone number is required";
    if (!data.licenseNumber?.trim()) errors.licenseNumber = "License number is required";
  }

  if (stepIndex === 1) {
    if (!data.companyName?.trim()) errors.companyName = "Company name is required";
  }

  if (stepIndex === 2) {
    if (!data.truckType) errors.truckType = "Please select a truck type";
    if (!data.licensePlate?.trim()) errors.licensePlate = "License plate is required";
    if (!data.capacity || Number(data.capacity) <= 0) errors.capacity = "Max capacity is required";
  }

  if (stepIndex === 3) {
    if (!data.licenseFront) errors.licenseFront = "Front of license is required";
    if (!data.licenseBack) errors.licenseBack = "Back of license is required";
    if (!data.insurance) errors.insurance = "Insurance certificate is required";
  }

  if (stepIndex === 4) {
    if (!data.primaryFrom?.trim()) errors.primaryFrom = "Pickup city is required";
    if (!data.primaryTo?.trim()) errors.primaryTo = "Delivery city is required";
  }

  return errors;
}

// Helper Components
function Label({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: "#374151" }}>
      {children} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{message}</p>;
}

function Input({ type = "text", placeholder, value, onChange, required = false, hasError = false }: any) {
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
        border: hasError ? "1.5px solid #ef4444" : "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 16,
        background: hasError ? "#fef2f2" : "white",
      }}
    />
  );
}

// Step Components
function StepAccount({ data, onUpdate, errors }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Account Setup</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Full Name</Label>
        <Input placeholder="Enter your full name" value={data.fullName || ""} onChange={(e: any) => onUpdate({ ...data, fullName: e.target.value })} required hasError={!!errors.fullName} />
        <ErrorText message={errors.fullName} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Phone Number</Label>
        <Input type="tel" placeholder="+371 123 4567" value={data.phone || ""} onChange={(e: any) => onUpdate({ ...data, phone: e.target.value })} required hasError={!!errors.phone} />
        <ErrorText message={errors.phone} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>License Number</Label>
        <Input placeholder="Enter your driver's license number" value={data.licenseNumber || ""} onChange={(e: any) => onUpdate({ ...data, licenseNumber: e.target.value })} required hasError={!!errors.licenseNumber} />
        <ErrorText message={errors.licenseNumber} />
      </div>
    </div>
  );
}

function StepCompany({ data, onUpdate, errors }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Company Details</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Company Name</Label>
        <Input placeholder="Enter your company name" value={data.companyName || ""} onChange={(e: any) => onUpdate({ ...data, companyName: e.target.value })} required hasError={!!errors.companyName} />
        <ErrorText message={errors.companyName} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label>Tax ID / EIN</Label>
        <Input placeholder="Enter tax ID" value={data.taxId || ""} onChange={(e: any) => onUpdate({ ...data, taxId: e.target.value })} />
      </div>
    </div>
  );
}

function StepTruck({ data, onUpdate, errors }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Truck Information</h2>

      <div style={{ marginBottom: 8 }}>
        <Label required>Truck Type</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
          {TRUCK_TYPES.map((truck) => {
            const isSelected = data.truckType === truck.value;
            return (
              <button
                key={truck.value}
                type="button"
                onClick={() => onUpdate({ ...data, truckType: truck.value })}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "20px 12px",
                  borderRadius: 12,
                  border: isSelected
                    ? "2px solid #3b82f6"
                    : errors.truckType
                    ? "2px solid #ef4444"
                    : "2px solid #e5e7eb",
                  background: isSelected ? "#eff6ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
                <span style={{ fontSize: 32 }}>{truck.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{truck.label}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{truck.desc}</span>
              </button>
            );
          })}
        </div>
        <ErrorText message={errors.truckType} />
      </div>

      <div style={{ marginBottom: 24, marginTop: 24 }}>
        <Label required>License Plate</Label>
        <Input placeholder="License plate number" value={data.licensePlate || ""} onChange={(e: any) => onUpdate({ ...data, licensePlate: e.target.value })} required hasError={!!errors.licensePlate} />
        <ErrorText message={errors.licensePlate} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Max Capacity (kg)</Label>
        <Input type="number" placeholder="24000" value={data.capacity || ""} onChange={(e: any) => onUpdate({ ...data, capacity: e.target.value })} required hasError={!!errors.capacity} />
        <ErrorText message={errors.capacity} />
      </div>
    </div>
  );
}

function StepDocuments({ data, onUpdate, errors }: any) {
  const fileInputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: 12,
    border: hasError ? "2px dashed #ef4444" : "2px dashed #d1d5db",
    borderRadius: 8,
    background: hasError ? "#fef2f2" : "white",
  });

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Required Documents</h2>

      <div style={{ marginBottom: 24 }}>
        <Label required>Driver's License (Front)</Label>
        <input type="file" accept="image/*" onChange={(e) => onUpdate({ ...data, licenseFront: e.target.files?.[0] || null })} style={fileInputStyle(!!errors.licenseFront)} />
        {data.licenseFront && <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6 }}>✓ {data.licenseFront.name}</p>}
        <ErrorText message={errors.licenseFront} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label required>Driver's License (Back)</Label>
        <input type="file" accept="image/*" onChange={(e) => onUpdate({ ...data, licenseBack: e.target.files?.[0] || null })} style={fileInputStyle(!!errors.licenseBack)} />
        {data.licenseBack && <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6 }}>✓ {data.licenseBack.name}</p>}
        <ErrorText message={errors.licenseBack} />
      </div>

      <div style={{ marginBottom: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "16px 0 0" }}>
          CMR insurance — shippers will see this on your load listings, so it's worth filling in.
        </p>
      </div>

      <div style={{ marginBottom: 24, marginTop: 16 }}>
        <Label required>Insurance Certificate</Label>
        <input type="file" accept="image/*,.pdf" onChange={(e) => onUpdate({ ...data, insurance: e.target.files?.[0] || null })} style={fileInputStyle(!!errors.insurance)} />
        {data.insurance && <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6 }}>✓ {data.insurance.name}</p>}
        <ErrorText message={errors.insurance} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label>Insurance Provider</Label>
        <Input placeholder="e.g. Balcia Insurance" value={data.insuranceProvider || ""} onChange={(e: any) => onUpdate({ ...data, insuranceProvider: e.target.value })} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label>CMR Policy Number</Label>
        <Input placeholder="Enter your CMR policy number" value={data.insurancePolicyNumber || ""} onChange={(e: any) => onUpdate({ ...data, insurancePolicyNumber: e.target.value })} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!data.cargoInsured}
            onChange={(e) => onUpdate({ ...data, cargoInsured: e.target.checked })}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: 14, color: "#374151" }}>
            I confirm I currently hold valid CMR insurance
          </span>
        </label>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, marginLeft: 28 }}>
          Self-declared for now. Shippers will see a "CMR insured" badge based on this.
        </p>
      </div>
    </div>
  );
}

function StepRoutes({ data, onUpdate, errors }: any) {
  const swapRoute = () => {
    onUpdate({ ...data, primaryFrom: data.primaryTo || "", primaryTo: data.primaryFrom || "" });
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Preferred Routes</h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>
        Tell us the route you drive most. We'll use this to show you backhaul loads that fit your way back — no more empty return trips.
      </p>

      <div style={{ marginBottom: 24 }}>
        <Label required>Primary Route</Label>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#3b82f6" }}>📍</span>
              <input
                placeholder="From city"
                value={data.primaryFrom || ""}
                onChange={(e: any) => onUpdate({ ...data, primaryFrom: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 38px",
                  border: errors.primaryFrom ? "1.5px solid #ef4444" : "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 16,
                  background: errors.primaryFrom ? "#fef2f2" : "white",
                }}
              />
            </div>
            <ErrorText message={errors.primaryFrom} />
          </div>

          <button
            type="button"
            onClick={swapRoute}
            title="Swap"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
              color: "#3b82f6",
              marginTop: 2,
            }}
          >
            ⇄
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#10b981" }}>📍</span>
              <input
                placeholder="To city"
                value={data.primaryTo || ""}
                onChange={(e: any) => onUpdate({ ...data, primaryTo: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 38px",
                  border: errors.primaryTo ? "1.5px solid #ef4444" : "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 16,
                  background: errors.primaryTo ? "#fef2f2" : "white",
                }}
              />
            </div>
            <ErrorText message={errors.primaryTo} />
          </div>
        </div>

        {data.primaryFrom && data.primaryTo && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 8,
              fontSize: 13,
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🚛</span>
            <span>
              <strong>{data.primaryFrom}</strong> → <strong>{data.primaryTo}</strong> — you'll see loads on this route first.
            </span>
          </div>
        )}
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
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
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

  const handleUpdate = (data: any) => {
    setFormData(data);
    // Clear errors for fields as they get filled in, so feedback feels responsive
    if (Object.keys(stepErrors).length > 0) {
      setStepErrors(validateStep(currentStep, data));
    }
  };

  const handleNext = async () => {
    // Steps before "done" (index 5) must pass validation first
    if (currentStep < STEPS.length - 1) {
      const errors = validateStep(currentStep, formData);
      if (Object.keys(errors).length > 0) {
        setStepErrors(errors);
        return;
      }
      setStepErrors({});
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
        insuranceProvider: formData.insuranceProvider || "",
        insurancePolicyNumber: formData.insurancePolicyNumber || "",
        cargoInsured: !!formData.cargoInsured,
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

  const handleBack = () => {
    setStepErrors({});
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const CurrentStepComponent = [StepAccount, StepCompany, StepTruck, StepDocuments, StepRoutes, StepDone][currentStep];
  const hasErrors = Object.keys(stepErrors).length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>

        {/* Progress */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>
              {Math.round((currentStep / (STEPS.length - 1)) * 100)}% complete
            </span>
          </div>

          {/* Track + fill */}
          <div style={{ position: "relative", height: 8, background: "#e2e8f0", borderRadius: 999, marginBottom: 20, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
                background: "linear-gradient(90deg, #3b82f6, #22d3ee)",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 6,
                      transition: "all 0.3s ease",
                      background: isDone ? "#3b82f6" : isCurrent ? "white" : "#e2e8f0",
                      color: isDone ? "white" : isCurrent ? "#3b82f6" : "#9ca3af",
                      border: isCurrent ? "2px solid #3b82f6" : "2px solid transparent",
                      boxShadow: isCurrent ? "0 0 0 4px rgba(59,130,246,0.15)" : "none",
                    }}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isDone || isCurrent ? "#1d4ed8" : "#9ca3af",
                      textAlign: "center",
                      lineHeight: 1.3,
                      maxWidth: 90,
                    }}
                  >
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "40px 32px" }}>
          {hasErrors && (
            <div
              style={{
                maxWidth: 500,
                margin: "0 auto 24px",
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                fontSize: 13,
                color: "#b91c1c",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>Please fill in the required fields highlighted below before continuing.</span>
            </div>
          )}
          <CurrentStepComponent data={formData} onUpdate={handleUpdate} errors={stepErrors} />
        </div>

        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={handleBack} disabled={currentStep === 0 || loading} style={{ padding: "12px 28px", border: "1px solid #d1d5db", borderRadius: 8, background: "white" }}>
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