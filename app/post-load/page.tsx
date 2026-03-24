"use client";

import { useState } from "react";
import { createShipment } from "@/lib/firestore";
import { auth } from "@/lib/firebase";

export default function PostLoadPage() {
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in");
      return;
    }

    await createShipment({
      pickupCity: pickup,
      deliveryCity: delivery,
      shipperId: user.uid,
    });

    alert("Shipment posted 🚛");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={(e) => setPickup(e.target.value)} placeholder="Pickup" />
      <input onChange={(e) => setDelivery(e.target.value)} placeholder="Delivery" />
      <button type="submit">Post Load</button>
    </form>
  );
}