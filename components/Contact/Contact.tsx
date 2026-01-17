"use client";

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

export default function Contact({ t }: { t: ContactDict }) {
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
          <form
            className={styles.form}
            onSubmit={(e) => e.preventDefault()}
          >
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
              />
            </div>

            <button className="btn btnPrimary" type="submit">
              {t.form.send}
            </button>
          </form>

          {/* Info */}
          <aside className={styles.info}>
            <div className={styles.infoCard}>
              <div className={styles.infoTitle}>{t.info.title}</div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>📞</span>
                <a
                  className={styles.infoLink}
                  href="tel:+34123456789"
                >
                  +34 123 456 789
                </a>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>✉️</span>
                <a
                  className={styles.infoLink}
                  href="mailto:info@grahaliaestates.com"
                >
                  info@grahaliaestates.com
                </a>
              </div>

              <div className={styles.divider} />

              <a
                className={`btn btnPrimary ${styles.waBtn}`}
                href="https://wa.me/34123456789"
                target="_blank"
                rel="noreferrer"
              >
                {t.info.whatsapp}
              </a>

              <p className={`p ${styles.note}`}>
                {t.info.note}
              </p>
            </div>
          </aside>
        </div>

        <div className={styles.footerLine} />
        <div className={styles.footerText}>
          © {new Date().getFullYear()} Grahalia Estates · {t.footerRights}
        </div>
      </div>
    </section>
  );
}
