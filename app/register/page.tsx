// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
      });

      if (role === "driver") {
        router.push("/onboarding/driver");
      } else {
        router.push("/dashboard");
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
    <div
      style={{
        minHeight: "100vh",
        background: theme.page,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: theme.font,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: theme.surface,
          borderRadius: 20,
          padding: "40px 36px",
          border: `1px solid ${theme.border}`,
          boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#111214",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              color: "white",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            FTL
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.textPrimary, marginBottom: 6 }}>
            Join FTLcargo
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>
            Start earning or shipping smarter today
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: "12px 14px",
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
              I am a...
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { value: "driver", label: "Driver / Truck owner" },
                { value: "shipper", label: "Shipper / Company" },
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    border: `1px solid ${role === option.value ? theme.accent : theme.border}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 14,
                    background: role === option.value ? "#eff6ff" : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value as "driver" | "shipper")}
                    style={{ accentColor: theme.accent }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#93c5fd" : theme.accent,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", color: theme.textSecondary, fontSize: 14 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: theme.accentText, fontWeight: 600, textDecoration: "none" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}