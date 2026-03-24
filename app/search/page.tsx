"use client";

import { useEffect, useState } from "react";
import { getShipments, acceptShipment } from "@/lib/firestore";
import { auth } from "@/lib/firebase";

export default function SearchPage() {
  const [loads, setLoads] = useState<any[]>([]);

  useEffect(() => {
    const fetchLoads = async () => {
      const data = await getShipments();
      setLoads(data);
    };

    fetchLoads();
  }, []);

  const handleAccept = async (id: string) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Login required");
      return;
    }

    await acceptShipment(id, user.uid);
    alert("Load accepted 🚛");
  };

  return (
    <div>
      <h1>Available Loads</h1>

      {loads
        .filter((l) => l.status === "NEW")
        .map((load) => (
          <div key={load.id}>
            <p>{load.pickupCity} → {load.deliveryCity}</p>

            <button onClick={() => handleAccept(load.id)}>
              Accept
            </button>
          </div>
        ))}
    </div>
  );
}