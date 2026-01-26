"use client";

import { useMemo, useState } from "react";
import styles from "./Contact.module.css";

type ContactDict = {
  title: string;
  subtitle: string;

  form: {
    name: string;
    phone: string;
    email: string;
    message: string;
    send: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
  };

  info: {
    title: string;
    whatsapp: string;
    note: string;
  };

  footerRights: string;
};

type Props = {
  t: ContactDict;
  lang: "en" | "es"; // ✅ добавили
};

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export default function Contact({ t, lang }: Props) {
  const pageUrl = useMemo(() => {
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanPhone || !cleanEmail) {
      setError(lang === "es" ? "Rellena nombre, teléfono y email." : "Please fill name, phone and email.");
      return;
    }
    if (!isEmail(cleanEmail)) {
      setError(lang === "es" ? "Email no válido." : "Invalid email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          message: cleanMessage ? cleanMessage : null,
          lang,
          page_url: pageUrl || `/${lang}`,
          property_id: null,
          property_slug: null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || (lang === "es" ? "Error al enviar. Inténtalo de nuevo." : "Failed to send. Try again."));
        return;
      }

      setOk(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setError(lang === "es" ? "Error al enviar. Inténtalo de nuevo." : "Failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className={`section ${styles.section}`}>
      <div className="container">
        {/* Заголовок секции */}
        <div className="section__head">
          <h2 className="sectionTitle">
            <span className="sectionTitleText">{t.title}</span>
          </h2>
          <p className="section__kicker">{t.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {/* Form */}
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  {t.form.name}
                </label>
                <input
                  className={styles.input}
                  id="name"
                  name="name"
                  placeholder={t.form.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">
                  {t.form.phone}
                </label>
                <input
                  className={styles.input}
                  id="phone"
                  name="phone"
                  placeholder={t.form.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                {t.form.email}
              </label>
              <input
                className={styles.input}
                id="email"
                name="email"
                placeholder={t.form.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="message">
                {t.form.message}
              </label>
              <textarea
                className={styles.textarea}
                id="message"
                name="message"
                placeholder={t.form.messagePlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            <div className={styles.actionsRow}>
              <button className="btn btnPrimary" type="submit" disabled={loading}>
                {loading ? (lang === "es" ? "Enviando..." : "Sending...") : t.form.send}
              </button>

              {ok ? (
                <span className={styles.okText}>{lang === "es" ? "Enviado ✅" : "Sent ✅"}</span>
              ) : null}

              {error ? <span className={styles.errText}>{error}</span> : null}
            </div>
          </form>

          {/* Info */}
          <aside className={styles.info}>
            <div className={styles.infoCard}>
              <div className={styles.infoTitle}>{t.info.title}</div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>📞</span>
                <a className={styles.infoLink} href="tel:+34123456789">
                  +34 123 456 789
                </a>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>✉️</span>
                <a className={styles.infoLink} href="mailto:info@grahaliaestates.com">
                  info@grahaliaestates.com
                </a>
              </div>

              <div className={styles.divider} />

              <a className={`btn btnPrimary ${styles.waBtn}`} href="https://wa.me/34123456789" target="_blank" rel="noreferrer">
                {t.info.whatsapp}
              </a>

              <p className={`p ${styles.note}`}>{t.info.note}</p>
            </div>
          </aside>
        </div>

        
        
      </div>
    </section>
  );
}
