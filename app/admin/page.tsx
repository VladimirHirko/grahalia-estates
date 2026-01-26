import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
  return (
    <main style={{ maxWidth: 900, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Admin</h1>
      <p style={{ margin: 10, opacity: 0.75 }}>✅ You are logged in. Next step: </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/admin/properties"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #0E5E56",
            background: "#fff",
            textDecoration: "none",
            color: "#0E5E56",
            fontWeight: 600,
          }}
        >
          Go to Properties →
        </Link>

        <Link
          href="/admin/leads"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #0E5E56",
            background: "#fff",
            textDecoration: "none",
            color: "#0E5E56",
            fontWeight: 600,
          }}
        >
          Go to Leads →
        </Link>
      </div>

    </main>
  );
}
