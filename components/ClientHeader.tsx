"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ClientHeader() {
  const pathname = usePathname();

  // Hide global header on the homepage
  if (pathname === "/") {
    return null;
  }

  return <Header />;
}