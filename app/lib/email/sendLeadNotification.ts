import nodemailer from "nodemailer";

type LeadMail = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  lang: string;
  pageUrl: string;
  propertyId?: number | null;
  propertySlug?: string | null;
  source?: string | null;
  createdAt?: string | null;
};

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function sendLeadNotification(lead: LeadMail) {
  // Если не настроено — тихо выходим (чтобы не ломать прод)
  if (!process.env.LEADS_NOTIFY_TO) return;

  const host = env("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const from = process.env.SMTP_FROM || user;
  const to = env("LEADS_NOTIFY_TO");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const subject = `New lead #${lead.id ?? "—"} — ${lead.name}`;

  const text =
`New lead received

Name: ${lead.name}
Phone: ${lead.phone}
Email: ${lead.email}
Lang: ${lead.lang}
Source: ${lead.source ?? "—"}
Page: ${lead.pageUrl}
Property: ${lead.propertySlug ?? "—"} (id: ${lead.propertyId ?? "—"})

Message:
${lead.message ?? "—"}
`;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}
