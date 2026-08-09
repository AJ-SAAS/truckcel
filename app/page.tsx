// app/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="page-shell">
      <style jsx global>{`
        :root {
          --page: #e5e8ec;
          --surface: #fff;
          --soft: #f4f5f6;
          --soft-2: #eceeef;
          --ink: #111214;
          --muted: #777b80;
          --faint: #a2a5a9;
          --line: #e7e8ea;
          --blue: #4c7df0;
          --blue-soft: #edf2ff;
          --radius-xl: 34px;
          --radius-lg: 24px;
          --radius-md: 16px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--page);
          color: var(--ink);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        img { display: block; max-width: 100%; }

        .page-shell {
          max-width: 1480px;
          margin: 22px auto 0;
          background: var(--surface);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 18px 60px rgba(20, 25, 35, 0.07);
        }

        .container {
          width: min(100% - 72px, 1240px);
          margin: 0 auto;
        }

        /* NAV */
        .nav {
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
        }
        .nav-links a {
          color: var(--muted);
          font-size: 12px;
          font-weight: 500;
          padding: 10px 15px;
          border-radius: 999px;
          transition: 0.18s ease;
        }
        .nav-links a:hover { color: var(--ink); }
        .nav-links a.active {
          color: #fff;
          background: var(--ink);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-button {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--soft);
        }
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 46px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: 0.18s ease;
          cursor: pointer;
        }
        .button-dark {
          background: var(--ink);
          color: #fff;
        }
        .button-dark:hover {
          transform: translateY(-1px);
          background: #000;
        }
        .button-light {
          background: #fff;
          border-color: var(--line);
        }
        .button-light:hover {
          border-color: #bfc2c6;
        }

        /* HERO */
        .hero {
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          min-height: 690px;
          gap: 34px;
          padding: 18px 18px 18px 38px;
        }
        .hero-copy {
          display: flex;
          flex-direction: column;
          padding: 54px 0 0;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: max-content;
          color: var(--blue);
          background: var(--blue-soft);
          border-radius: 999px;
          padding: 7px 12px 7px 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--blue);
        }
        .hero h1 {
          max-width: 650px;
          margin: 20px 0 16px;
          font-size: clamp(48px, 5.1vw, 70px);
          line-height: 0.99;
          letter-spacing: -0.055em;
          font-weight: 700;
        }
        .hero h1 .muted {
          display: block;
          color: #b0b3b7;
        }
        .hero-lead {
          max-width: 450px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.65;
        }
        .hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 25px;
        }
        .play {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--ink);
        }
        .proof {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 0;
        }
        .avatars { display: flex; }
        .avatar {
          width: 30px;
          height: 30px;
          margin-left: -7px;
          border: 2px solid #fff;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #d8dadd;
          color: #666a6f;
          font-size: 9px;
          font-weight: 700;
        }
        .avatar:first-child { margin-left: 0; }
        .proof strong { display: block; font-size: 13px; }
        .proof span {
          display: block;
          color: var(--muted);
          font-size: 10px;
          margin-top: 2px;
        }

        .hero-benefits {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: auto;
          padding: 28px 0 4px;
          border-top: 1px solid var(--line);
        }
        .benefit svg {
          width: 19px;
          height: 19px;
          margin-bottom: 10px;
        }
        .benefit span {
          display: block;
          max-width: 115px;
          color: #686c71;
          font-size: 10.5px;
          line-height: 1.4;
          font-weight: 500;
        }

        .hero-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 22px;
        }
        .hero-counter {
          color: var(--muted);
          font-size: 11px;
        }
        .hero-counter strong { color: var(--ink); }
        .hero-arrows { display: flex; gap: 7px; }
        .round-button {
          width: 32px;
          height: 32px;
          border: 1px solid var(--line);
          border-radius: 50%;
          background: #fff;
          display: grid;
          place-items: center;
          color: var(--ink);
          cursor: pointer;
        }

        /* HERO VISUAL */
        .hero-visual {
          position: relative;
          min-height: 650px;
          border-radius: 28px;
          overflow: hidden;
          background:
            radial-gradient(circle at 72% 22%, rgba(255, 255, 255, 0.8), transparent 25%),
            linear-gradient(145deg, #dce4ec 0%, #c9d2dd 48%, #e9ecee 100%);
        }
        .hero-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .image-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
          color: #69717b;
          font-size: 13px;
          line-height: 1.5;
          background:
            radial-gradient(circle at 70% 22%, rgba(255, 255, 255, 0.75), transparent 24%),
            linear-gradient(145deg, #dbe4ed, #cbd4de 48%, #e8ebed);
        }
        .image-placeholder strong {
          display: block;
          color: #22262b;
          font-size: 16px;
          margin-bottom: 5px;
        }
        .hero-image-loaded .image-placeholder { display: none; }
        .visual-tag {
          position: absolute;
          top: 22px;
          right: 22px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 30px rgba(25, 35, 50, 0.08);
        }
        .visual-tag .tag-icon {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: var(--soft);
        }
        .visual-tag strong { display: block; font-size: 11px; }
        .visual-tag span {
          display: block;
          color: var(--muted);
          font-size: 9px;
          margin-top: 2px;
        }

        .process {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 20px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 14px 16px;
          border-radius: 17px;
          background: rgba(17, 18, 20, 0.66);
          backdrop-filter: blur(12px);
        }
        .process-item {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .process-num {
          color: rgba(255, 255, 255, 0.45);
          font-size: 9px;
          font-weight: 700;
        }
        .process-label {
          color: #fff;
          font-size: 10px;
          font-weight: 600;
        }
        .process-arrow {
          color: rgba(255, 255, 255, 0.4);
          margin-left: auto;
        }

        /* SECTIONS */
        .section { padding: 112px 0; }
        .section-tight { padding-top: 0; }
        .section-header {
          max-width: 650px;
          margin-bottom: 42px;
        }
        .section-kicker {
          color: var(--blue);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 13px;
        }
        .section h2 {
          font-size: clamp(32px, 3.5vw, 46px);
          line-height: 1.05;
          letter-spacing: -0.045em;
          font-weight: 700;
        }
        .section-header p {
          margin-top: 14px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.65;
          max-width: 570px;
        }

        /* COMPARISON */
        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid var(--line);
          border-radius: 24px;
          overflow: hidden;
        }
        .compare-col { padding: 34px; }
        .compare-col:first-child { background: #f3f4f5; }
        .compare-col:last-child { background: #fff; }
        .compare-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin-bottom: 28px;
        }
        .compare-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 17px 0;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .compare-row strong { font-size: 13px; }
        .compare-row span {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.45;
        }

        /* HOW */
        .how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--line);
          border-radius: 22px;
          overflow: hidden;
        }
        .how-step {
          background: #fff;
          padding: 30px 26px 32px;
        }
        .how-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--ink);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .how-step h3 {
          font-size: 14px;
          margin-bottom: 8px;
        }
        .how-step p {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        /* CARRIER */
        .carrier {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 72px;
          align-items: center;
        }
        .carrier p {
          max-width: 470px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.65;
          margin: 15px 0 24px;
        }
        .stats {
          display: flex;
          gap: 34px;
          margin-top: 30px;
        }
        .stat strong {
          display: block;
          font-size: 22px;
          letter-spacing: -0.03em;
        }
        .stat span {
          display: block;
          color: var(--muted);
          font-size: 10px;
          margin-top: 4px;
        }

        .capacity {
          padding: 30px;
          border-radius: 24px;
          background: #f1f2f3;
        }
        .capacity-head {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          color: var(--muted);
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 27px;
        }
        .capacity-row { margin-bottom: 23px; }
        .capacity-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 9px;
        }
        .capacity-label strong { font-size: 12px; }
        .capacity-label span {
          font-size: 11px;
          font-weight: 700;
        }
        .bar {
          height: 13px;
          border-radius: 99px;
          background: #dedfe1;
          overflow: hidden;
        }
        .fill {
          height: 100%;
          border-radius: 99px;
        }
        .fill-old {
          width: 22%;
          background: #bfc1c5;
        }
        .fill-match {
          width: 91%;
          background: linear-gradient(90deg, #111 0 24%, var(--blue) 24% 100%);
        }
        .capacity-note {
          color: #9a9da1;
          font-size: 10px;
        }

        /* TRUST */
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .trust-card {
          padding: 28px;
          border-radius: 20px;
          background: #f2f3f4;
        }
        .trust-icon {
          width: 38px;
          height: 38px;
          border: 1px solid #d7d9dc;
          border-radius: 11px;
          display: grid;
          place-items: center;
          margin-bottom: 22px;
          font-size: 16px;
        }
        .trust-card h3 {
          font-size: 14px;
          margin-bottom: 8px;
        }
        .trust-card p {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        /* CTA */
        .cta { padding: 0 0 112px; }
        .cta-inner {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          background: var(--ink);
          color: #fff;
          text-align: center;
          padding: 76px 30px;
        }
        .cta-inner:after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          right: -150px;
          top: -220px;
          border-radius: 50%;
          background: rgba(76, 125, 240, 0.13);
        }
        .cta h2 {
          position: relative;
          z-index: 1;
          font-size: clamp(34px, 4vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.05em;
        }
        .cta h2 span { color: #777b80; }
        .cta p {
          position: relative;
          z-index: 1;
          max-width: 460px;
          margin: 15px auto 0;
          color: #9b9ea2;
          font-size: 13px;
          line-height: 1.6;
        }
        .cta-actions {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 28px;
        }
        .cta .button-dark {
          background: #fff;
          color: var(--ink);
        }
        .cta .button-light {
          background: transparent;
          color: #fff;
          border-color: #45474b;
        }

        /* FOOTER */
        footer {
          background: var(--ink);
          color: #9b9da1;
          padding: 52px 0 25px;
        }
        .footer-top {
          display: flex;
          justify-content: space-between;
          gap: 50px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-brand { max-width: 300px; }
        .footer-brand p {
          font-size: 11px;
          line-height: 1.65;
          margin-top: 15px;
        }
        .footer-cols {
          display: flex;
          gap: 70px;
        }
        .footer-col h4 {
          color: #666a70;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .footer-col a {
          display: block;
          font-size: 11px;
          margin-bottom: 9px;
        }
        .footer-col a:hover { color: #fff; }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          padding-top: 20px;
          color: #666a70;
          font-size: 10px;
        }

        /* RESPONSIVE */
        @media (max-width: 1050px) {
          .nav-links { display: none; }
          .hero {
            grid-template-columns: 1fr;
            padding: 18px;
          }
          .hero-copy { padding: 35px 20px 0; }
          .hero-visual { min-height: 520px; }
          .hero-benefits { margin-top: 55px; }
          .carrier {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
        @media (max-width: 760px) {
          .page-shell {
            margin-top: 0;
            border-radius: 0;
          }
          .container {
            width: min(100% - 40px, 1240px);
          }
          .nav { height: 74px; }
          .nav-actions .icon-button { display: none; }
          .hero { padding: 0 0 15px; }
          .hero-copy { padding: 35px 20px 0; }
          .hero h1 { font-size: 46px; }
          .hero-benefits {
            grid-template-columns: 1fr 1fr;
            gap: 25px 18px;
          }
          .hero-visual {
            border-radius: 20px;
            min-height: 470px;
          }
          .process {
            grid-template-columns: 1fr 1fr;
          }
          .comparison {
            grid-template-columns: 1fr;
          }
          .how-grid,
          .trust-grid {
            grid-template-columns: 1fr;
          }
          .section { padding: 80px 0; }
          .cta { padding-bottom: 80px; }
          .cta-inner { padding: 60px 22px; }
          .cta-actions { flex-wrap: wrap; }
          .footer-top { flex-direction: column; }
          .footer-cols { gap: 45px; }
          .footer-bottom {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>

      {/* NAV */}
      <div className="container">
        <nav className="nav">
          {/* Real logo */}
          <div className="brand" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            <img
              src="/ftl-cargo-logo.png"
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
              onLoad={(e) => e.currentTarget.parentElement?.classList.add("hero-image-loaded")}
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />

            <div className="image-placeholder">
              <div>
                <strong>Hero image goes here</strong>
                Upload your custom freight image as <code>hero-freight.jpg</code> in the public folder.
              </div>
            </div>

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
              {/* Real logo (white version for dark footer) */}
              <div className="brand">
                <img
                  src="/ftl-cargo-logo.png"
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