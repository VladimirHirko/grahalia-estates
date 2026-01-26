"use client";

import { useEffect, useState } from "react";
import styles from "./CookieConsent.module.css";
import {
  CookieConsent,
  getDefaultConsent,
  hasMadeChoice,
  readConsent,
  writeConsent,
} from "@/app/lib/cookies/consent";

type Dict = {
  bannerText: string;
  acceptAll: string;
  rejectAll: string;
  manage: string;

  modalTitle: string;
  modalText: string;

  necessaryTitle: string;
  necessaryDesc: string;

  analyticsTitle: string;
  analyticsDesc: string;

  marketingTitle: string;
  marketingDesc: string;

  save: string;
  close: string;
};

export default function CookieConsentUI({
  t,
  openKey,
}: {
  t?: Dict;          // ✅ делаем безопасно
  openKey?: number;
}) {
  // ✅ если словаря нет — не ломаем сайт
  if (!t) return null;

  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setVisible(!hasMadeChoice());

    const current = readConsent();
    if (current) {
      setAnalytics(!!current.analytics);
      setMarketing(!!current.marketing);
    }
  }, []);

  useEffect(() => {
    if (openKey === undefined) return;

    const current = readConsent();
    if (current) {
      setAnalytics(!!current.analytics);
      setMarketing(!!current.marketing);
    } else {
      const d = getDefaultConsent();
      setAnalytics(!!d.analytics);
      setMarketing(!!d.marketing);
    }

    setModalOpen(true);
    setVisible(false);
  }, [openKey]);

  const acceptAll = () => {
    writeConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      updatedAt: Date.now(),
    });
    setAnalytics(true);
    setMarketing(true);
    setVisible(false);
    setModalOpen(false);
  };

  const rejectAll = () => {
    writeConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      updatedAt: Date.now(),
    });
    setAnalytics(false);
    setMarketing(false);
    setVisible(false);
    setModalOpen(false);
  };

  const save = () => {
    writeConsent({
      necessary: true,
      analytics,
      marketing,
      updatedAt: Date.now(),
    });
    setVisible(false);
    setModalOpen(false);
  };

  return (
    <>
      {/* Banner */}
      {visible ? (
        <div className={styles.banner} role="region" aria-label="Cookie banner">
          <div className={styles.bannerInner}>
            <div className={styles.text}>{t.bannerText}</div>

            <div className={styles.actions}>
              <button
                className="btn btnGhost"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                {t.manage}
              </button>

              <button className="btn btnGhost" type="button" onClick={rejectAll}>
                {t.rejectAll}
              </button>

              <button className="btn btnPrimary" type="button" onClick={acceptAll}>
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal */}
      {modalOpen ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={t.modalTitle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{t.modalTitle}</div>
              <button
                className={styles.close}
                type="button"
                onClick={() => setModalOpen(false)}
              >
                {t.close}
              </button>
            </div>

            <div className={styles.modalText}>{t.modalText}</div>

            <div className={styles.rows}>
              {/* Necessary */}
              <div className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>{t.necessaryTitle}</div>
                  <div className={styles.rowNote}>{t.necessaryDesc}</div>
                </div>
                <div className={styles.locked}>On</div>
              </div>

              {/* Analytics */}
              <div className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>{t.analyticsTitle}</div>
                  <div className={styles.rowNote}>{t.analyticsDesc}</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>

              {/* Marketing */}
              <div className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>{t.marketingTitle}</div>
                  <div className={styles.rowNote}>{t.marketingDesc}</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className="btn btnGhost" type="button" onClick={rejectAll}>
                {t.rejectAll}
              </button>
              <button className="btn btnPrimary" type="button" onClick={save}>
                {t.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
