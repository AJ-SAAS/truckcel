// app/register/page.tsx
"use client";   // ← very important — this is a client component

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";   // ← @ = src/ or root

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"driver" | "shipper" | "">(""); // empty at start
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Please choose if you are a driver or shipper");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Save extra info (role + email) in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        // You can add more later: name, phone, companyName, verified: false, etc.
      });

      // Success → go to homepage or dashboard
      alert("Account created! Welcome 🎉");
      router.push("/"); // or "/dashboard" later
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h1>Sign Up for Truckcel</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSignUp}>
        <div>
          <label>Email</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", margin: "8px 0" }}
          />
        </div>

        <div>
          <label>Password</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: "100%", padding: "8px", margin: "8px 0" }}
          />
        </div>

        <div style={{ margin: "20px 0" }}>
          <p>I am a...</p>
          <label>
            <input
              type="radio"
              name="role"
              value="driver"
              checked={role === "driver"}
              onChange={() => setRole("driver")}
            />
            Driver / Truck owner
          </label><br />

          <label>
            <input
              type="radio"
              name="role"
              value="shipper"
              checked={role === "shipper"}
              onChange={() => setRole("shipper")}
            />
            Shipper / Company
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", background: "#0070f3", color: "white", border: "none" }}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}