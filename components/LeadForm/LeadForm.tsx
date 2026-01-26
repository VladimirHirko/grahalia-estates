"use client";

import { useMemo, useState } from "react";
import styles from "./LeadForm.module.css";

type LeadFormProps = {
  lang: "en" | "es";
  pageUrl?: string;
  propertyId?: number | null;
  propertySlug?: string | null;
  title?: string;
  subtitle?: string;
};

type I18n = {
  titleDefault: string;
  subtitleDefault: string;

  name: string;
  phone: string;
  email: string;
  message: string;

  nameRequired: string;
  phoneRequired: string;
  emailRequired: string;

  messageHint: string; // подсказка под textarea
  messageMinError: string; // когда API возвращает Invalid message
  genericError: string;

  sending: string;
  send: string;
  sent: string;

  property: string;
  general: string;
};

const I18N: Record<LeadFormProps["lang"], I18n> = {
  en: {
    titleDefault: "Request details",
    subtitleDefault: "Leave your details and we will get back to you shortly.",

    name: "Your Name",
    phone: "Phone",
    email: "Email",
    message: "Message",

    nameRequired: "Name *",
    phoneRequired: "Phone *",
    emailRequired: "Email *",

    messageHint:
      "Tip: please enter at least 40 characters (more details = faster response).",
    messageMinError: "Please enter at least 40 characters in the message.",
    genericError: "Failed to send. Please try again.",

    sending: "Sending...",
    send: "Send Message",
    sent: "Sent ✅",

    property: "Property",
    general: "General inquiry",
  },
  es: {
    titleDefault: "Solicitar detalles",
    subtitleDefault: "Deja tus datos y nos pondremos en contacto contigo.",

    name: "Tu nombre",
    phone: "Teléfono",
    email: "Email",
    message: "Mensaje",

    nameRequired: "Nombre *",
    phoneRequired: "Teléfono *",
    emailRequired: "Email *",

    messageHint:
      "Consejo: introduce al menos 40 caracteres (más detalles = respuesta más rápida).",
    messageMinError: "Introduce al menos 40 caracteres en el mensaje.",
    genericError: "No se pudo enviar. Inténtalo de nuevo.",

    sending: "Enviando...",
    send: "Enviar mensaje",
    sent: "Enviado ✅",

    property: "Propiedad",
    general: "Consulta general",
  },
};

export default function LeadForm({
  lang,
  pageUrl,
  propertyId = null,
  propertySlug = null,
  title,
  subtitle,
}: LeadFormProps) {
  const t = I18N[lang];

  const resolvedPageUrl = useMemo(() => {
    if (pageUrl) return pageUrl;
    return "";
  }, [pageUrl]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [website, setWebsite] = useState(""); // honeypot

  // ✅ Правило: если человек начал писать сообщение — просим сделать его осмысленным (>= 40)
  const trimmedMessage = message.trim();
  const messageStarted = trimmedMessage.length > 0;
  const MIN_MESSAGE_LEN = 40;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);

    const source = propertySlug ? "property" : "contact";

    const currentUrl =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : resolvedPageUrl || "/";

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: trimmedMessage ? trimmedMessage : null,
      lang,
      page_url: currentUrl,
      property_id: propertyId ?? null,
      property_slug: propertySlug ?? null,
      source,
      website,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const apiError = String(data?.error ?? "");

        // ✅ Локализуем "Invalid message" (антиспам на сервере)
        if (apiError === "Invalid message") {
          setError(t.messageMinError);
        } else if (apiError) {
          setError(apiError);
        } else {
          setError(t.genericError);
        }

        return;
      }

      setOk(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.wrap} aria-label="Lead form">
      <div className={styles.head}>
        <h2 className={styles.title}>{title ?? t.titleDefault}</h2>
        <p className={styles.subtitle}>{subtitle ?? t.subtitleDefault}</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.grid}>
          {/* Honeypot (боты часто заполняют) */}
          <div
            style={{
              position: "absolute",
              left: "-10000px",
              top: "auto",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>

          <label className={styles.field}>
            <span className={styles.label}>{t.nameRequired}</span>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t.phoneRequired}</span>
            <input
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t.emailRequired}</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span className={styles.label}>{t.message}</span>
            <textarea
              className={styles.textarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              // ✅ подсказка + HTML-валидация (но мягкая: только если начал писать)
              minLength={messageStarted ? MIN_MESSAGE_LEN : undefined}
              required={messageStarted}
            />
            <div className={styles.hint} aria-live="polite">
              {t.messageHint}
            </div>
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.button} disabled={loading}>
            {loading ? t.sending : t.send}
          </button>

          {ok && <span className={styles.ok}>{t.sent}</span>}
          {error && <span className={styles.err}>{error}</span>}
        </div>
      </form>

      <div className={styles.meta}>
        {propertySlug ? (
          <span>
            {t.property}: {propertySlug}
          </span>
        ) : (
          <span>{t.general}</span>
        )}
      </div>
    </section>
  );
}
