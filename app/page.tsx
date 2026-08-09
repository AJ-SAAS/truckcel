// app/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="page-shell">
      {/* NAV */}
      <div className="container">
        <nav className="nav">
          <div className="brand" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            <img
              src="/ftl-cargo-logo.jpg"
              alt="FTLcargo"
              style={{ height: 42, width: "auto" }}
            />
          </div>

          <div className="nav-links">
            <a className="active" href="#">
              Home
            </a>
            <a href="#shippers">Shippers</a>
            <a href="#carriers">Carriers</a>
            <a href="#how">How it works</a>
            <a href="#trust">Trust</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="nav-actions">
            <a className="icon-button" href="tel:+0000000000" aria-label="Call FTLcargo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 .14 4.22 2 2 0 0 1 2.13 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
            <button className="button button-light" onClick={() => router.push("/register")}>
              Get a quote <span>→</span>
            </button>
          </div>
        </nav>
      </div>

      <main>
        {/* HERO */}
        <section className="hero" id="shippers">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              214 routes with open capacity
            </div>

            <h1>
              Freight that
              <br />
              <span>goes direct.</span>
              <span className="muted">No warehouse. No detour.</span>
            </h1>

            <div className="proof">
              <div className="avatars">
                <div className="avatar">MK</div>
                <div className="avatar">SB</div>
                <div className="avatar">TV</div>
              </div>
              <div>
                <strong>850+ verified carriers</strong>
                <span>Already moving across Europe</span>
              </div>
            </div>

            <p className="hero-lead">
              FTLcargo matches your shipment with a verified truck already heading your way.
              Point-to-point freight that fills empty legs instead of adding another warehouse stop.
            </p>

            <div className="hero-actions">
              <button className="button button-dark" onClick={() => router.push("/register")}>
                Get a freight quote <span>→</span>
              </button>
              <a className="button button-light" href="#how">
                <span className="play">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                How it works
              </a>
            </div>

            <div className="hero-benefits">
              <div className="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="7" width="13" height="9" rx="1" />
                  <path d="M14 10h4l3 3v3h-7z" />
                  <circle cx="6" cy="18" r="1.6" />
                  <circle cx="17" cy="18" r="1.6" />
                </svg>
                <span>Point-to-point road freight</span>
              </div>
              <div className="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <span>Verified carriers & cargo</span>
              </div>
              <div className="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 2h8l5 5v15H6z" />
                  <path d="M14 2v5h5" />
                  <path d="M9 13h6M9 17h6" />
                </svg>
                <span>Digital documents</span>
              </div>
              <div className="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 21s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z" />
                  <circle cx="12" cy="9" r="2.3" />
                </svg>
                <span>Direct to destination</span>
              </div>
            </div>

            <div className="hero-nav">
              <div className="hero-counter">
                <strong>01</strong> / 04
              </div>
              <div className="hero-arrows">
                <button className="round-button" aria-label="Previous">
                  ←
                </button>
                <button className="round-button" aria-label="Next">
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/hero-freight.jpg"
              alt="FTLcargo direct freight across Europe"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
              loading="eager"
              fetchPriority="high"
            />

            <div className="visual-tag">
              <div className="tag-icon">✓</div>
              <div>
                <strong>850+ verified carriers</strong>
                <span>Already moving across Europe</span>
              </div>
            </div>

            <div className="process">
              <div className="process-item">
                <span className="process-num">01</span>
                <span className="process-label">Post shipment</span>
                <span className="process-arrow">→</span>
              </div>
              <div className="process-item">
                <span className="process-num">02</span>
                <span className="process-label">Match carrier</span>
                <span className="process-arrow">→</span>
              </div>
              <div className="process-item">
                <span className="process-num">03</span>
                <span className="process-label">Direct pickup</span>
                <span className="process-arrow">→</span>
              </div>
              <div className="process-item">
                <span className="process-num">04</span>
                <span className="process-label">Delivered</span>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="section" id="how">
          <div className="container">
            <div className="section-header">
              <div className="section-kicker">THE FTLcargo MODEL</div>
              <h2>Don't move freight through a network when one truck can move it direct.</h2>
              <p>
                We connect shippers to existing truck capacity. That means fewer handoffs, less
                handling and better use of trucks already on the road.
              </p>
            </div>

            <div className="comparison">
              <div className="compare-col">
                <div className="compare-title">Traditional freight</div>
                <div className="compare-row">
                  <strong>Shipment</strong>
                  <span>→ warehouse → transfer → warehouse → delivery</span>
                </div>
                <div className="compare-row">
                  <strong>Capacity</strong>
                  <span>Booked independently from the route</span>
                </div>
                <div className="compare-row">
                  <strong>Handoffs</strong>
                  <span>Multiple touch points add time and risk</span>
                </div>
                <div className="compare-row">
                  <strong>Cost</strong>
                  <span>More infrastructure and intermediaries</span>
                </div>
              </div>

              <div className="compare-col">
                <div className="compare-title">With FTLcargo</div>
                <div className="compare-row">
                  <strong>Shipment</strong>
                  <span>→ truck → destination</span>
                </div>
                <div className="compare-row">
                  <strong>Capacity</strong>
                  <span>Matched to a truck already going your way</span>
                </div>
                <div className="compare-row">
                  <strong>Handoffs</strong>
                  <span>One carrier. One journey. Direct delivery.</span>
                </div>
                <div className="compare-row">
                  <strong>Cost</strong>
                  <span>Turn existing empty capacity into useful capacity</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section section-tight">
          <div className="container">
            <div className="section-header">
              <div className="section-kicker">HOW IT WORKS</div>
              <h2>One shipment. One truck. One direct journey.</h2>
            </div>

            <div className="how-grid">
              <div className="how-step">
                <div className="how-num">01</div>
                <h3>Post your shipment</h3>
                <p>Origin, destination, weight and pickup date. Keep it simple.</p>
              </div>
              <div className="how-step">
                <div className="how-num">02</div>
                <h3>Find existing capacity</h3>
                <p>We look for verified carriers already travelling in your direction.</p>
              </div>
              <div className="how-step">
                <div className="how-num">03</div>
                <h3>Confirm the carrier</h3>
                <p>Review the carrier, route and shipment details before booking.</p>
              </div>
              <div className="how-step">
                <div className="how-num">04</div>
                <h3>Deliver direct</h3>
                <p>Your freight stays on the truck instead of taking an unnecessary detour.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FOR CARRIERS */}
        <section className="section section-tight" id="carriers">
          <div className="container">
            <div className="carrier">
              <div>
                <div className="section-kicker">FOR CARRIERS</div>
                <h2>Turn empty miles into revenue.</h2>
                <p>
                  You're already going there. Take compatible freight with you. Choose shipments
                  that fit your route, capacity and schedule — and make the return leg work harder.
                </p>
                <button className="button button-dark" onClick={() => router.push("/register")}>
                  Join as a carrier <span>→</span>
                </button>

                <div className="stats">
                  <div className="stat">
                    <strong>850+</strong>
                    <span>Verified carriers</span>
                  </div>
                  <div className="stat">
                    <strong>214</strong>
                    <span>Open routes this week</span>
                  </div>
                </div>
              </div>

              <div className="capacity">
                <div className="capacity-head">
                  <span>BER → AMS · 610 KM</span>
                  <span>5T CAPACITY</span>
                </div>

                <div className="capacity-row">
                  <div className="capacity-label">
                    <strong>Typical return leg</strong>
                    <span>22% loaded</span>
                  </div>
                  <div className="bar">
                    <div className="fill fill-old" />
                  </div>
                </div>

                <div className="capacity-row">
                  <div className="capacity-label">
                    <strong>Matched with FTLcargo</strong>
                    <span style={{ color: "var(--blue)" }}>91% loaded</span>
                  </div>
                  <div className="bar">
                    <div className="fill fill-match" />
                  </div>
                </div>

                <div className="capacity-note">Illustrative example based on a Berlin–Amsterdam route.</div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="section section-tight" id="trust">
          <div className="container">
            <div className="section-header">
              <div className="section-kicker">TRUST & SAFETY</div>
              <h2>Direct doesn't mean unchecked.</h2>
              <p>Business-critical freight still needs accountability at every step.</p>
            </div>

            <div className="trust-grid">
              <div className="trust-card">
                <div className="trust-icon">✓</div>
                <h3>Verified carriers</h3>
                <p>Carriers are verified before they can take shipments through the platform.</p>
              </div>
              <div className="trust-card">
                <div className="trust-icon">⌁</div>
                <h3>Live shipment visibility</h3>
                <p>Know where your freight is from pickup through delivery.</p>
              </div>
              <div className="trust-card">
                <div className="trust-icon">▣</div>
                <h3>Digital proof of delivery</h3>
                <p>Every delivery has a digital record, so the handoff is documented.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="quote">
          <div className="container">
            <div className="cta-inner">
              <h2>
                Your freight has somewhere to go.
                <br />
                <span>So does an empty truck.</span>
              </h2>
              <p>
                Put them together. FTLcargo connects shipments with verified trucks already moving
                across the Baltics and Europe.
              </p>
              <div className="cta-actions">
                <button className="button button-dark" onClick={() => router.push("/register")}>
                  Get a freight quote <span>→</span>
                </button>
                <button className="button button-light" onClick={() => router.push("/register")}>
                  Join as a carrier
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="contact">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand">
                <img
                  src="/ftl-cargo-logo.jpg"
                  alt="FTLcargo"
                  style={{ height: 36, width: "auto", filter: "brightness(0) invert(1)" }}
                />
              </div>
              <p>
                Point-to-point freight across Europe. Matching shippers with verified carriers and
                putting empty truck capacity to work.
              </p>
            </div>

            <div className="footer-cols">
              <div className="footer-col">
                <h4>Platform</h4>
                <a href="#shippers">For shippers</a>
                <a href="#carriers">For carriers</a>
                <a href="#how">How it works</a>
                <a href="#trust">Trust & safety</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Contact</a>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 FTLcargo</span>
            <span>Built for direct freight</span>
          </div>
        </div>
      </footer>
    </div>
  );
}