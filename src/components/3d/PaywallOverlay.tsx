"use client";

import { Lock } from "lucide-react";

/**
 * Friendly overlay shown when a tenant's view limit is reached.
 */
export default function PaywallOverlay() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Lock size={40} color="#00aaff" />
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>
        View-Limit erreicht
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.6)",
          maxWidth: 400,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Dieses Exhibit hat das monatliche View-Limit erreicht.
        Bitte kontaktieren Sie den Anbieter oder versuchen Sie es später erneut.
      </p>

      <div style={{ marginTop: 40 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Powered by 3D-Snap
        </span>
      </div>
    </div>
  );
}
