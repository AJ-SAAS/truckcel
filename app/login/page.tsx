// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data()?.role : null;

      // Redirect based on role
      if (role === "driver" || role === "shipper") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setError("Incorrect email or password");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts — try again later");
      } else {
        setError(err.message || "Login failed. Please try again.");
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
        {/* Logo / Brand */}
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
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.textPrimary,
              marginBottom: 6,
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>
            Log in to your FTLcargo account
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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: theme.textPrimary,
                marginBottom: 6,
              }}
            >
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

          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: theme.textPrimary,
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            color: theme.textSecondary,
            fontSize: 14,
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            style={{ color: theme.accentText, fontWeight: 600, textDecoration: "none" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}