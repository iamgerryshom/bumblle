import React from "react";

export default function Maintenance() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>🛠️</div>

        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            color: "#111827",
          }}
        >
          Scheduled Maintenance
        </h1>

        <p
          style={{
            marginTop: "16px",
            fontSize: "16px",
            color: "#6b7280",
            lineHeight: "1.6",
          }}
        >
          We are currently performing critical system maintenance to improve
          reliability and performance.
        </p>

        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            lineHeight: "1.6",
          }}
        >
          During this time, some features may be unavailable.
          Please check back shortly.
        </p>

        <div
          style={{
            marginTop: "30px",
            padding: "12px",
            backgroundColor: "#eff6ff",
            borderRadius: "8px",
            color: "#2563eb",
            fontWeight: "bold",
          }}
        >
          Expected Downtime: Approximately 30 minutes
        </div>

        <p
          style={{
            marginTop: "25px",
            fontSize: "14px",
            color: "#9ca3af",
          }}
        >
          Thank you for your patience.
        </p>
      </div>
    </div>
  );
}