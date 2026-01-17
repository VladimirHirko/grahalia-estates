import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    "use server";

    const password = String(formData.get("password") || "");
    const expected = process.env.ADMIN_PASSWORD || "";

    if (!expected) {
      throw new Error("ADMIN_PASSWORD is not set in environment.");
    }

    if (password !== expected) {
      // просто возвращаемся на логин (можно позже добавить сообщение)
      redirect("/admin/login");
    }

    // В Next.js 15/16 cookies() — async
    const cookieStore = await cookies();
    cookieStore.set("admin", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    redirect("/admin");
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Admin Login</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Enter the admin password to continue.
      </p>

      <form action={login}>
        <label style={{ display: "block", marginBottom: 8 }}>Password</label>
        <input
          name="password"
          type="password"
          required
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            marginBottom: 12,
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #111",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </form>

      <p style={{ opacity: 0.6, marginTop: 16, fontSize: 13 }}>
        (Local dev simple auth. We’ll upgrade later if needed.)
      </p>
    </main>
  );
}
