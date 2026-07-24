"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav
      style={{
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 32px",
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* NEW FTL CARGO LOGO */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
        <img 
          src="/ftl-cargo-logo.png" 
          alt="FTL Cargo" 
          style={{ height: 42, width: "auto" }} 
        />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {user ? (
          <>
            <Link
              href="/dashboard"
              style={{
                padding: "8px 16px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                color: "#1d4ed8",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              📊 Dashboard
            </Link>
            <span style={{ fontSize: 14, color: "#475569" }}>
              Welcome, {user.email?.split("@")[0]}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                padding: "8px 16px",
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#ef4444",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
            <Link
              href="/register"
              style={{
                padding: "10px 20px",
                background: "#1d4ed8",
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}