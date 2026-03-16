// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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

      alert("Logged in successfully! 🎉");

      // Redirect based on role
      if (role === "driver") {
        router.push("/onboarding/driver");
      } else if (role === "shipper") {
        router.push("/"); // temporary — change to /post-load or /search later
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
        Welcome back
      </h1>
      <p style={{
        color: "#64748b",
        textAlign: "center",
        marginBottom: "32px",
      }}>
        Log in to your Truckcel account
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

      <form onSubmit={handleLogin}>
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

        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Your password"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "16px",
            }}
          />
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
            transition: "background 0.2s",
          }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p style={{ marginTop: "24px", textAlign: "center", color: "#64748b" }}>
        Don't have an account?{" "}
        <a href="/register" style={{ color: "#1d4ed8", fontWeight: 600 }}>
          Sign up
        </a>
      </p>
    </div>
  );
}