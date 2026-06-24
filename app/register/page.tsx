// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"driver" | "shipper" | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      setError("Please choose if you are a driver or shipper");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
      });

      alert("Account created! Welcome to Truckcel 🎉");

      // ✅ Fixed Redirect Logic
      if (role === "driver") {
        router.push("/onboarding/driver");   // or /dashboard if you don't have onboarding yet
      } else {
        router.push("/dashboard");           // Shipper goes straight to dashboard
      }
    } catch (err: any) {
      console.error("Sign-up error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak — use at least 6 characters");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "420px",
      margin: "80px auto",
      padding: "32px 24px",
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    }}>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: "28px",
        marginBottom: "8px",
        textAlign: "center",
      }}>
        Join Truckcel
      </h1>
      <p style={{
        color: "#64748b",
        textAlign: "center",
        marginBottom: "32px",
      }}>
        Start earning or shipping smarter today
      </p>

      {error && (
        <p style={{
          color: "#ef4444",
          background: "#fef2f2",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
        }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>I am a...</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="role"
                value="driver"
                checked={role === "driver"}
                onChange={() => setRole("driver")}
                style={{ accentColor: "#1d4ed8" }}
              />
              Driver / Truck owner
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="role"
                value="shipper"
                checked={role === "shipper"}
                onChange={() => setRole("shipper")}
                style={{ accentColor: "#1d4ed8" }}
              />
              Shipper / Company
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: loading ? "#a5b4fc" : "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: "24px", textAlign: "center", color: "#64748b" }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "#1d4ed8", fontWeight: 600 }}>
          Log in
        </a>
      </p>
    </div>
  );
}