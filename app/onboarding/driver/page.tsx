"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const STEPS = [
  { id: "account", title: "Account Setup", desc: "Basic information" },
  { id: "company", title: "Company Details", desc: "Business information" },
  { id: "truck", title: "Truck Information", desc: "Vehicle details" },
  { id: "documents", title: "Required paperwork", desc: "Upload your documents" },
  { id: "routes", title: "Preferred Routes", desc: "Your regular routes" },
  { id: "done", title: "Complete!", desc: "Ready to start" }
];

// ---------------------
// Helper Components
// ---------------------
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
        transition: "border-color 0.2s"
      }}
      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
    />
  );
}

// ---------------------
// Step Components
// ---------------------
function StepAccount({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: "#111827" }}>Account Setup</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Full Name</Label>
        <Input 
          placeholder="Enter your full name" 
          value={data.fullName || ""} 
          onChange={(e: any) => onUpdate({ ...data, fullName: e.target.value })} 
          required 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Phone Number</Label>
        <Input 
          type="tel" 
          placeholder="+1 (555) 123-4567" 
          value={data.phone || ""} 
          onChange={(e: any) => onUpdate({ ...data, phone: e.target.value })} 
          required 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>License Number</Label>
        <Input 
          placeholder="Enter your driver's license number" 
          value={data.licenseNumber || ""} 
          onChange={(e: any) => onUpdate({ ...data, licenseNumber: e.target.value })} 
          required 
        />
      </div>
    </div>
  );
}

function StepCompany({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: "#111827" }}>Company Details</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Company Name</Label>
        <Input 
          placeholder="Enter your company name" 
          value={data.companyName || ""} 
          onChange={(e: any) => onUpdate({ ...data, companyName: e.target.value })} 
          required 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label>Tax ID / EIN</Label>
        <Input 
          placeholder="Enter tax ID or EIN" 
          value={data.taxId || ""} 
          onChange={(e: any) => onUpdate({ ...data, taxId: e.target.value })} 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Business Address</Label>
        <Input 
          placeholder="Street address" 
          value={data.businessAddress || ""} 
          onChange={(e: any) => onUpdate({ ...data, businessAddress: e.target.value })} 
          required 
        />
      </div>
    </div>
  );
}

function StepTruck({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: "#111827" }}>Truck Information</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Truck Type</Label>
        <select 
          value={data.truckType || ""} 
          onChange={(e: any) => onUpdate({ ...data, truckType: e.target.value })} 
          required 
          style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 8 }}
        >
          <option value="">Select truck type</option>
          <option value="semi-truck">Semi-Truck (18 Wheeler)</option>
          <option value="box-truck">Box Truck</option>
          <option value="flatbed">Flatbed Truck</option>
          <option value="refrigerated">Refrigerated Truck</option>
          <option value="tanker">Tanker Truck</option>
        </select>
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>License Plate</Label>
        <Input 
          placeholder="Enter license plate number" 
          value={data.licensePlate || ""} 
          onChange={(e: any) => onUpdate({ ...data, licensePlate: e.target.value })} 
          required 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Maximum Capacity (kg)</Label>
        <Input 
          type="number" 
          placeholder="24000" 
          value={data.capacity || ""} 
          onChange={(e: any) => onUpdate({ ...data, capacity: e.target.value })} 
          required 
        />
      </div>
    </div>
  );
}

function StepDocuments({ data, onUpdate }: any) {
  const handleFileChange = (file: File | null, field: string) => 
    onUpdate({ ...data, [field]: file });

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: "#111827" }}>Required Documents</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Driver's License (Front)</Label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e: any) => handleFileChange(e.target.files?.[0] || null, "licenseFront")} 
          style={{ width: "100%", padding: 12, border: "2px dashed #d1d5db", borderRadius: 8, background: "#f9fafb" }} 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Driver's License (Back)</Label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e: any) => handleFileChange(e.target.files?.[0] || null, "licenseBack")} 
          style={{ width: "100%", padding: 12, border: "2px dashed #d1d5db", borderRadius: 8, background: "#f9fafb" }} 
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label required>Insurance Certificate</Label>
        <input 
          type="file" 
          accept="image/*,.pdf" 
          onChange={(e: any) => handleFileChange(e.target.files?.[0] || null, "insurance")} 
          style={{ width: "100%", padding: 12, border: "2px dashed #d1d5db", borderRadius: 8, background: "#f9fafb" }} 
        />
      </div>
    </div>
  );
}

function StepRoutes({ data, onUpdate }: any) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: "#111827" }}>Preferred Routes</h2>
      <div style={{ marginBottom: 24 }}>
        <Label required>Primary Route</Label>
        <div style={{ display: "flex", gap: 12 }}>
          <Input 
            placeholder="From city/country" 
            value={data.primaryFrom || ""} 
            onChange={(e: any) => onUpdate({ ...data, primaryFrom: e.target.value })} 
            required 
          />
          <span style={{ alignSelf: "center", color: "#6b7280" }}>→</span>
          <Input 
            placeholder="To city/country" 
            value={data.primaryTo || ""} 
            onChange={(e: any) => onUpdate({ ...data, primaryTo: e.target.value })} 
            required 
          />
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <Label>Secondary Route (Optional)</Label>
        <div style={{ display: "flex", gap: 12 }}>
          <Input 
            placeholder="From city/country" 
            value={data.secondaryFrom || ""} 
            onChange={(e: any) => onUpdate({ ...data, secondaryFrom: e.target.value })} 
          />
          <span style={{ alignSelf: "center", color: "#6b7280" }}>→</span>
          <Input 
            placeholder="To city/country" 
            value={data.secondaryTo || ""} 
            onChange={(e: any) => onUpdate({ ...data, secondaryTo: e.target.value })} 
          />
        </div>
      </div>
    </div>
  );
}

function StepDone() {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: "#111827" }}>Welcome to Truckcel!</h2>
      <p style={{ marginBottom: 32, color: "#6b7280" }}>
        Your application is being reviewed. We'll notify you once your account is activated.
      </p>
    </div>
  );
}

// ---------------------
// Main Onboarding Component
// ---------------------
function DriverOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  const stepComponents = [StepAccount, StepCompany, StepTruck, StepDocuments, StepRoutes, StepDone];

  // Improved upload function with unique filename
  const uploadFileToStorage = async (file: File, userId: string, folder: string) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleNext = async () => {
    if (currentStep < stepComponents.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step - save to Firebase
    const user = auth.currentUser;
    if (!user) {
      alert("You are not logged in. Please log in again.");
      return;
    }

    try {
      const dataToSave: any = {
        userId: user.uid,
        fullName: formData.fullName?.trim() || "",
        phone: formData.phone?.trim() || "",
        licenseNumber: formData.licenseNumber?.trim() || "",
        companyName: formData.companyName?.trim() || "",
        taxId: formData.taxId?.trim() || "",
        businessAddress: formData.businessAddress?.trim() || "",
        truckType: formData.truckType || "",
        licensePlate: formData.licensePlate?.trim() || "",
        capacityKg: Number(formData.capacity) || 0,
        primaryFrom: formData.primaryFrom?.trim() || "",
        primaryTo: formData.primaryTo?.trim() || "",
        secondaryFrom: formData.secondaryFrom?.trim() || "",
        secondaryTo: formData.secondaryTo?.trim() || "",
        rating: 0,
        completedTrips: 0,
        status: "pending_review",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Upload documents
      if (formData.licenseFront) {
        dataToSave.licenseFrontUrl = await uploadFileToStorage(
          formData.licenseFront, 
          user.uid, 
          "drivers/licenses"
        );
      }
      if (formData.licenseBack) {
        dataToSave.licenseBackUrl = await uploadFileToStorage(
          formData.licenseBack, 
          user.uid, 
          "drivers/licenses"
        );
      }
      if (formData.insurance) {
        dataToSave.insuranceUrl = await uploadFileToStorage(
          formData.insurance, 
          user.uid, 
          "drivers/insurance"
        );
      }

      // Save to Firestore
      await setDoc(doc(db, "drivers", user.uid), dataToSave, { merge: true });

      console.log("✅ Driver onboarding completed successfully!");
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Onboarding error:", err);
      alert("Something went wrong while saving your data. Please check the console (F12) for details.");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const CurrentStep = stepComponents[currentStep];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        
        {/* Progress Bar */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            {STEPS.map((step, idx) => (
              <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: 32, 
                  height: 32, 
                  borderRadius: "50%",
                  background: idx <= currentStep ? "#3b82f6" : "#d1d5db",
                  color: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: 14, 
                  fontWeight: 600, 
                  marginRight: 8
                }}>
                  {idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ 
                    flex: 1, 
                    height: 2, 
                    background: idx < currentStep ? "#3b82f6" : "#d1d5db", 
                    marginLeft: 8 
                  }} />
                )}
              </div>
            ))}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {STEPS[currentStep].title}
          </h1>
          <p style={{ color: "#6b7280" }}>{STEPS[currentStep].desc}</p>
        </div>

        {/* Current Step Content */}
        <div style={{ padding: "40px 32px" }}>
          <CurrentStep data={formData} onUpdate={setFormData} />
        </div>

        {/* Navigation Buttons */}
        <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <button 
            onClick={handleBack} 
            disabled={currentStep === 0} 
            style={{
              padding: "12px 24px", 
              border: "1px solid #d1d5db", 
              borderRadius: 8, 
              background: currentStep === 0 ? "#f3f4f6" : "white", 
              color: currentStep === 0 ? "#9ca3af" : "#374151", 
              cursor: currentStep === 0 ? "not-allowed" : "pointer", 
              fontWeight: 500
            }}
          >
            Back
          </button>
          
          <button 
            onClick={handleNext} 
            style={{
              padding: "12px 24px", 
              background: "#3b82f6", 
              color: "white", 
              border: "none", 
              borderRadius: 8, 
              fontWeight: 500, 
              cursor: "pointer"
            }}
          >
            {currentStep === stepComponents.length - 1 ? "Complete Setup" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverOnboarding;