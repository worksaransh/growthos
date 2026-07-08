"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b1326", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "#dbe2fd", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Critical error</h2>
          <p style={{ color: "#c7c4d7", fontSize: 14, marginBottom: 24 }}>{error.message || "The application encountered a fatal error."}</p>
          <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #c0c1ff, #ddb7ff)", color: "#0b1326", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
