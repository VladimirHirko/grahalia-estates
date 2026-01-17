import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
  return (
    <main style={{ maxWidth: 900, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Admin</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>✅ You are logged in. Next step: Properties CRUD.</p>

      <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          href="/admin/properties"
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #0E5E56",
            textDecoration: "none",
            color: "#0E5E56",
            fontWeight: 600,
          }}
        >
          Go to Properties →
        </Link>
      </div>
    </main>
  );
}
