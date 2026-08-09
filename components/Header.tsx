// components/Header.tsx
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
        background: "#ffffff",
        borderBottom: "1px solid #e7e8ea",
        height: 84,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: "#111214",
        }}
      >
        <img
          src="/ftl-cargo-logo.jpg"
          alt="FTLcargo"
          style={{ height: 40, width: "auto" }}
        />
        {/* Optional text next to logo – remove if your logo already has the name */}
        {/* <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
            FTLcargo
          </div>
          <div style={{ fontSize: 10, color: "#777b80", marginTop: 1 }}>
            Direct freight across Europe
          </div>
        </div> */}
      </Link>

      {/* Right side actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {user ? (
          <>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                background: "#f4f5f6",
                borderRadius: 999,
                color: "#111214",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
            >
              Dashboard
            </Link>

            <div
              style={{
                fontSize: 13,
                color: "#777b80",
                fontWeight: 500,
              }}
            >
              {user.email?.split("@")[0]}
            </div>

            <button
              onClick={handleSignOut}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "1px solid #e7e8ea",
                borderRadius: 999,
                color: "#ef4444",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{
                color: "#111214",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                padding: "10px 16px",
              }}
            >
              Sign in
            </Link>

            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 22px",
                background: "#111214",
                color: "#ffffff",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                transition: "transform 0.15s ease, background 0.15s ease",
              }}
            >
              Get started
              <span style={{ fontSize: 14 }}>→</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}