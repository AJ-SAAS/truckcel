// app/onboarding/driver/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─── Paste ALL of Claude's DriverOnboarding code here ────────────────────────
// const STEPS = [...], function Label(...), function Input(...), etc.
// all Step components (StepAccount, StepCompany, StepTruck, StepDocuments, StepRoutes, StepDone)
// and finally export default function DriverOnboarding() { ... }

// (You can copy from your earlier message — it's the long code with 6 steps)

export default function DriverOnboardingPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data()?.role : null;

      if (role !== "driver") {
        router.push("/");
        return;
      }

      setAuthorized(true);
    };

    checkAccess();
  }, [router]);

  if (!authorized) {
    return <div style={{ padding: "100px", textAlign: "center", fontSize: "20px" }}>
      Checking access... (redirecting if not authorized)
    </div>;
  }

  return <DriverOnboarding />;  // ← Claude's component
}