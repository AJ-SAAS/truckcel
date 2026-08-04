// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ── Design tokens ────────────────────────────────────────────────────────
// Same values as app/dashboard/page.tsx — keep these two files in sync,
// or better, move this into a shared /lib/theme.ts and import it everywhere.
const theme = {
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  page: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accentText: "#1d4ed8",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    fontSize: 15,
    color: theme.textPrimary,
    fontFamily: theme.font,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
    fontSize: 14,
    color: theme.textPrimary,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.page,
        fontFamily: theme.font,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "32px 28px",
          background: theme.surface,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: theme.textPrimary,
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Join FTLcargo
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 28 }}>
          Start earning or shipping smarter today
        </p>

        {error && (
          <p
            style={{
              color: theme.danger,
              background: theme.dangerBg,
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 18,
              textAlign: "center",
              fontSize: 13,
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>I am a...</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
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
                    padding: "10px 12px",
                    border: `1px solid ${role === option.value ? theme.accent : theme.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    color: theme.textPrimary,
                    background: role === option.value ? "#eff6ff" : theme.surface,
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
              padding: "11px",
              background: loading ? "#93b4f0" : theme.accent,
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: theme.font,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 22, textAlign: "center", color: theme.textSecondary, fontSize: 14 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: theme.accentText, fontWeight: 500, textDecoration: "none" }}>
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}