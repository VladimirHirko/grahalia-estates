"use client";

import { useState } from "react";
import styles from "@/components/Contact/Contact.module.css";

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

type Props = {
  lang: "en" | "es";
  propertyId?: number | null;
  propertySlug?: string | null;

  title: string;
  subtitle: string;

  labels: {
    name: string;
    phone: string;
    email: string;
    message: string;
    send: string;

    namePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;

    // ✅ новые строки
    messageHint: string; // подсказка под textarea
    errInvalidMessage: string; // локализация ошибки "Invalid message"

    sending: string;
    sent: string;
    errRequired: string;
    errEmail: string;
    errFailed: string;

    // опционально (если хочешь локализацию внизу формы)
    propertyLabel?: string; // "Property"
    generalLabel?: string;  // "General inquiry"
  };
};

export default function LeadContactForm({
  lang,
  propertyId = null,
  propertySlug = null,
  title,
  subtitle,
  labels,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [website, setWebsite] = useState(""); // honeypot

  const MIN_MESSAGE_LEN = 15;
  const cleanMessage = message.trim();
  const messageStarted = cleanMessage.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanPhone || !cleanEmail) {
      setError(labels.errRequired);
      return;
    }
    if (!isEmail(cleanEmail)) {
      setError(labels.errEmail);
      return;
    }

    // ✅ Мягкое правило: если начали писать сообщение — пусть будет >= 40
    if (messageStarted && cleanMessage.length < MIN_MESSAGE_LEN) {
      setError(labels.errInvalidMessage);
      return;
    }

    const source = propertySlug ? "property" : "contact";

    const currentUrl =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : `/${lang}`;

    const payload = {
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      message: cleanMessage ? cleanMessage : null,
      lang,
      page_url: currentUrl,
      property_id: propertyId ?? null,
      property_slug: propertySlug ?? null,
      source,
      website,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const apiError = String(data?.error ?? "");

        // ✅ локализуем антиспам-ответ
        if (apiError === "Invalid message") {
          setError(labels.errInvalidMessage);
        } else {
          setError(apiError || labels.errFailed);
        }
        return;
      }

      setOk(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setError(labels.errFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section__head">
        <h2 className="sectionTitle">
          <span className="sectionTitleText">{title}</span>
        </h2>
        <p className="section__kicker">{subtitle}</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row}>
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              {labels.name}
            </label>
            <input
              className={styles.input}
              id="name"
              name="name"
              placeholder={labels.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              {labels.phone}
            </label>
            <input
              className={styles.input}
              id="phone"
              name="phone"
              placeholder={labels.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            {labels.email}
          </label>
          <input
            className={styles.input}
            id="email"
            name="email"
            placeholder={labels.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="message">
            {labels.message}
          </label>
          <textarea
            className={styles.textarea}
            id="message"
            name="message"
            placeholder={labels.messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            // ✅ HTML-валидация (мягкая)
            minLength={messageStarted ? MIN_MESSAGE_LEN : undefined}
            required={messageStarted}
            aria-describedby="messageHint"
          />
          <div id="messageHint" style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            {labels.messageHint}
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? labels.sending : labels.send}
          </button>
          {ok ? <span className={styles.okText}>{labels.sent}</span> : null}
          {error ? <span className={styles.errText}>{error}</span> : null}
        </div>

        <div className={styles.footerText} style={{ marginTop: 10, opacity: 0.7 }}>
          {propertySlug
            ? `${labels.propertyLabel ?? "Property"}: ${propertySlug}`
            : labels.generalLabel ?? "General inquiry"}
        </div>
      </form>
    </div>
  );
}
