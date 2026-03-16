// lib/auth-helpers.ts
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function waitForUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getUserRole(uid: string): Promise<"driver" | "shipper" | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data()?.role || null;
    }
    return null;
  } catch (err) {
    console.error("Error fetching role:", err);
    return null;
  }
}