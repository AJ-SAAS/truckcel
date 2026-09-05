// components/LocationAutocomplete.tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface Suggestion {
  city: string;
  country: string;
  lat: number;
  lng: number;
  fullText: string;
}

interface LocationAutocompleteProps {
  placeholder?: string;
  value: string; // display text, e.g. "Riga, Latvia"
  onSelect: (loc: Suggestion) => void;
  hasError?: boolean;
  pinColor?: string;
}

export default function LocationAutocomplete({
  placeholder = "Search for a city",
  value,
  onSelect,
  hasError = false,
  pinColor = "#3b82f6",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local text in sync if parent value changes externally (e.g. swap button)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = async (text: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        text
      )}.json?access_token=${token}&types=place&limit=6`;

      const res = await fetch(url);
      const data = await res.json();

      const results: Suggestion[] = (data.features || []).map((f: any) => {
        const countryCtx = f.context?.find((c: any) => c.id.startsWith("country"));
        return {
          city: f.text,
          country: countryCtx?.text || "",
          lat: f.center[1],
          lng: f.center[0],
          fullText: f.place_name,
        };
      });

      setSuggestions(results);
    } catch (err) {
      console.error("Geocoding error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(`${s.city}, ${s.country}`);
    setShowDropdown(false);
    setSuggestions([]);
    onSelect(s);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: pinColor }}>
          📍
        </span>
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "12px 16px 12px 38px",
            border: hasError ? "1.5px solid #ef4444" : "1px solid #d1d5db",
            borderRadius: 8,
            fontSize: 16,
            background: hasError ? "#fef2f2" : "white",
          }}
        />
      </div>

      {showDropdown && (suggestions.length > 0 || loading) && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 20,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af" }}>Searching...</div>
          ) : (
            suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(s)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  background: "white",
                  border: "none",
                  borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <span style={{ color: "#9ca3af" }}>📍</span>
                <span>
                  <strong>{s.city}</strong>
                  <span style={{ color: "#9ca3af" }}>, {s.country}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}