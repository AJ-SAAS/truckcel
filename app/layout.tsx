import type { Metadata } from "next";
import "./globals.css";
import ClientHeader from "@/components/ClientHeader";

export const metadata: Metadata = {
  title: "FTLcargo – Direct Freight Across Europe",
  description:
    "FTLcargo matches shipments with verified trucks already heading your way. Point-to-point freight across Europe, without unnecessary warehouse transfers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ClientHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}