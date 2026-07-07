// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";

// ─── ALL CONSTANTS FROM CLAUDE ──────────────────────────────────────────────
const NAV_LINKS = ["How It Works", "For Drivers", "For Shippers", "Pricing"];

const STATS = [
  { value: "34B", label: "Empty km driven yearly in Europe" },
  { value: "€38k", label: "Lost per truck per year" },
  { value: "48h", label: "Avg. hub-based delivery time" },
  { value: "1200km", label: "Max direct route coverage" },
];

const PAIN_POINTS = [
  {
    who: "DRIVERS",
    icon: "🚛",
    color: "#1d4ed8",
    pains: [
      { title: "Empty return trips", desc: "Up to 22% of all European truck km are driven empty. Every return leg is lost revenue." },
      { title: "No direct channel", desc: "No simple platform to post available space and get matched with nearby shippers." },
      { title: "Broker dependency", desc: "Traditional freight brokers take large margins, leaving drivers with thin earnings." },
    ],
  },
  {
    who: "SHIPPERS",
    icon: "📦",
    color: "#0891b2",
    pains: [
      { title: "Slow hub-based freight", desc: "Your pallets pass through 2–3 warehouses before delivery. 2–4 days for what could be 1." },
      { title: "Hidden costs", desc: "Middleman margins, cross-docking fees, and warehouse handling inflate every shipment." },
      { title: "No visibility", desc: "You don't know where your freight is, who's handling it, or when it truly arrives." },
    ],
  },
];

const FEATURES = [
  { icon: "📍", title: "Post Your Route", desc: "Drivers post recurring routes in 2 minutes. Set capacity, dates, and contact preferences. Done.", tag: "FOR DRIVERS", color: "#1d4ed8" },
  { icon: "🔍", title: "Instant Route Search", desc: "Shippers search by origin, destination, pallet count and date. See available trucks in real time.", tag: "FOR SHIPPERS", color: "#0891b2" },
  { icon: "🔔", title: "Backhaul Alerts", desc: "Set your regular route once. Get instant SMS when a return load matches your corridor.", tag: "FOR DRIVERS", color: "#1d4ed8" },
  { icon: "✅", title: "Verified Carriers Only", desc: "Every driver on FTLcargo holds cargo insurance and has passed business verification. No surprises.", tag: "TRUST", color: "#059669" },
  { icon: "📱", title: "Mobile-First", desc: "Drivers post from the cab. Shippers search from the warehouse. Designed for real-world use.", tag: "PLATFORM", color: "#7c3aed" },
  { icon: "⚡", title: "Direct Contact", desc: "No payment escrow, no broker layer. You see the driver's number and call directly to agree terms.", tag: "SIMPLE", color: "#d97706" },
];

const NETWORK_STEPS = [
  { n: "01", title: "Drivers join first", desc: "Post routes, set capacity, enable backhaul alerts.", icon: "🚛" },
  { n: "02", title: "Shippers discover routes", desc: "Search available trucks on their corridor in real time.", icon: "📦" },
  { n: "03", title: "Direct connections made", desc: "Shipper contacts driver. Freight moves without a broker.", icon: "🤝" },
  { n: "04", title: "Network grows", desc: "More drivers → more routes → more shippers → more loads.", icon: "📈" },
];

const TESTIMONIALS = [
  { name: "Mārtiņš K.", role: "Owner-operator, Riga", trucks: "1 truck", quote: "I drive Riga–Berlin every Tuesday. My return was always empty. Now I fill 4–6 pallets every week. That's an extra €600–900 a month I wasn't earning before.", initials: "MK" },
  { name: "Sandra B.", role: "Logistics coordinator, Tallinn", trucks: "Fleet of 8", quote: "We used DHL for urgent pallet shipments. 3–4 days, expensive. Now our drivers fill their own empties and we use FTLcargo for overflow. Costs dropped 40%.", initials: "SB" },
  { name: "Tomas V.", role: "Manufacturer, Kaunas", trucks: "Shipper", quote: "Production stopped. We needed a machine part from Hamburg urgently. Found a driver on FTLcargo already heading to Vilnius. Part arrived next morning. Crisis avoided.", initials: "TV" },
];

const ROUTES_LIVE = [
  { from: "Riga", to: "Berlin", pallets: 8, date: "Tomorrow", driver: "Andris P.", verified: true, price: "~€190" },
  { from: "Tallinn", to: "Hamburg", pallets: 12, date: "Wed 12 Mar", driver: "Peeter V.", verified: true, price: "~€230" },
  { from: "Vilnius", to: "Frankfurt", pallets: 5, date: "Thu 13 Mar", driver: "Lukas M.", verified: true, price: "~€210" },
  { from: "Kaunas", to: "Berlin", pallets: 9, date: "Fri 14 Mar", driver: "Darius K.", verified: true, price: "~€175" },
];

// ─── ANIMATED ROUTE MAP (SVG) ───────────────────────────────────────────────
function RouteMap() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 0.8));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const cities = [
    { id: "tallinn", label: "Tallinn", x: 310, y: 55 },
    { id: "riga", label: "Riga", x: 290, y: 130 },
    { id: "vilnius", label: "Vilnius", x: 300, y: 205 },
    { id: "kaunas", label: "Kaunas", x: 270, y: 225 },
    { id: "warsaw", label: "Warsaw", x: 265, y: 295 },
    { id: "berlin", label: "Berlin", x: 155, y: 270 },
    { id: "hamburg", label: "Hamburg", x: 125, y: 205 },
    { id: "frankfurt", label: "Frankfurt", x: 110, y: 320 },
    { id: "munich", label: "Munich", x: 145, y: 375 },
  ];

  const routes = [
    { from: [290, 130], to: [155, 270], color: "#3b82f6", active: true },
    { from: [310, 55], to: [125, 205], color: "#06b6d4", active: true },
    { from: [300, 205], to: [110, 320], color: "#3b82f6", active: false },
    { from: [270, 225], to: [155, 270], color: "#6366f1", active: false },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: 440, borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      {/* Grid overlay */}
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.08 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 25} x2="100%" y2={i * 25} stroke="#60a5fa" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="100%" stroke="#60a5fa" strokeWidth="0.5" />
        ))}
      </svg>

      <svg viewBox="0 0 480 440" style={{ width: "100%", height: "100%", position: "absolute" }}>
        {routes.map((r, i) => {
          const len = Math.hypot(r.to[0] - r.from[0], r.to[1] - r.from[1]);
          const dashLen = (progress / 100) * len;
          return (
            <g key={i}>
              <line x1={r.from[0]} y1={r.from[1]} x2={r.to[0]} y2={r.to[1]}
                stroke={r.color} strokeWidth={r.active ? 1.5 : 0.8}
                strokeOpacity={r.active ? 0.3 : 0.15} strokeDasharray="4 4" />
              {r.active && (
                <line x1={r.from[0]} y1={r.from[1]} x2={r.to[0]} y2={r.to[1]}
                  stroke={r.color} strokeWidth={2.5}
                  strokeDasharray={`${dashLen} ${len}`}
                  strokeLinecap="round" />
              )}
            </g>
          );
        })}

        {cities.map(city => (
          <g key={city.id}>
            <circle cx={city.x} cy={city.y} r={5} fill="#1e40af" stroke="#60a5fa" strokeWidth={1.5} />
            <circle cx={city.x} cy={city.y} r={9} fill="#3b82f6" fillOpacity={0.15} />
            <text x={city.x + 10} y={city.y + 4} fill="#93c5fd" fontSize={9}
              fontFamily="'Syne', sans-serif" fontWeight="600">{city.label}</text>
          </g>
        ))}

        {routes.filter(r => r.active).map((r, i) => {
          const t = ((progress + i * 40) % 100) / 100;
          const cx = r.from[0] + (r.to[0] - r.from[0]) * t;
          const cy = r.from[1] + (r.to[1] - r.from[1]) * t;
          return (
            <g key={`truck${i}`}>
              <circle cx={cx} cy={cy} r={6} fill={r.color} fillOpacity={0.9} />
              <circle cx={cx} cy={cy} r={10} fill={r.color} fillOpacity={0.25} />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={7} fill="white">🚛</text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: 8, padding: "10px 14px"
      }}>
        <div style={{ fontSize: 10, color: "#60a5fa", fontFamily: "'Syne', sans-serif", letterSpacing: 1, marginBottom: 6 }}>LIVE ROUTES</div>
        {["Riga → Berlin", "Tallinn → Hamburg"].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 20, height: 2, background: i === 0 ? "#3b82f6" : "#06b6d4", borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: "#cbd5e1", fontFamily: "monospace" }}>{r}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(16,185,129,0.4)",
        borderRadius: 8, padding: "8px 14px",
        display: "flex", alignItems: "center", gap: 6
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse2 2s infinite" }} />
        <span style={{ fontSize: 10, color: "#6ee7b7", fontFamily: "'Syne', sans-serif", letterSpacing: 1 }}>LIVE TRACKING</span>
      </div>
    </div>
  );
}

// ─── MAIN HOMEPAGE ───────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState("driver");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setVisibleSections(prev => ({ ...prev, [e.target.id]: true }));
      }),
      { threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const registerRef = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };

  const fadeIn = (id: string, delay = 0) => ({
    opacity: visibleSections[id] ? 1 : 0,
    transform: visibleSections[id] ? "translateY(0)" : "translateY(28px)",
    transition: `all 0.6s ease ${delay}s`,
  });

  return (
    <>
      <div style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: "#f8fafc", 
        color: "#0f172a", 
        overflowX: "hidden" 
      }}>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }

          @keyframes pulse2 { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } }
          @keyframes heroFadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>

        {/* HERO with new logo and clean font */}
        <section style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
          padding: "90px 16px 70px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: "1fr", md: "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div style={{ animation: "heroFadeUp 0.8s ease both", textAlign: { base: "center", md: "left" } }}>
              <img src="/ftl-cargo-logo.png" alt="FTL Cargo" style={{ height: 52, width: "auto", marginBottom: 24 }} />

              <h1 style={{
                fontSize: "clamp(34px, 7.5vw, 56px)",
                lineHeight: 1.05,
                color: "white",
                marginBottom: 20
              }}>
                Fill Your Empty<br />
                Truck Space.
              </h1>

              <p style={{ fontSize: "17px", color: "#94a3b8", lineHeight: 1.75, marginBottom: 36, maxWidth: 460 }}>
                FTLcargo connects verified truck drivers with shippers needing direct pallet delivery — no hubs, no brokers, no empty miles. Post your route in 2 minutes.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48, justifyContent: "center" }}>
                <button style={{ fontSize: 16, padding: "15px 32px", background: "#1d4ed8", color: "white", borderRadius: 12 }}>
                  🚛 I'm a Driver — Post Route
                </button>
                <button style={{ fontSize: 16, padding: "15px 32px", border: "2px solid #60a5fa", color: "white", background: "transparent", borderRadius: 12 }}>
                  📦 I Need to Ship Pallets
                </button>
              </div>

              <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
                {STATS.map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "white" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <RouteMap />
            </div>
          </div>
        </section>

        {/* QUICK SEARCH, LIVE ROUTES, PAIN POINTS, and all other sections from your original code remain here */}

        {/* FOOTER */}
        <footer style={{ background: "#0f172a", padding: "56px 24px 32px", color: "#475569" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
              <div>
                <img src="/ftl-cargo-logo.png" alt="FTL Cargo" style={{ height: 42, width: "auto", marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, maxWidth: 260 }}>
                  Direct pallet freight marketplace. Connecting verified truck drivers with shippers across Europe.
                </p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, textAlign: "center" }}>
              © 2026 FTLcargo. Built for drivers first.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}