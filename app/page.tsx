"use client"; // Important: page must also be a client component because it uses Header + Map

import Header from "../components/Header";
import Map from "../components/Map";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      <Header />
      <main className="flex-1 w-full p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 text-center">
          Map of Trips
        </h2>
        <Map />
      </main>
    </div>
  );
}