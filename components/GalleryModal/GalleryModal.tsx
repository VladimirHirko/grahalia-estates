"use client";

import { useEffect } from "react";
import styles from "./GalleryModal.module.css";

type ImageItem = {
  url: string;
};

type Props = {
  images: ImageItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function GalleryModal({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const img = images[index];

  // ⌨️ клавиатура
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <button className={styles.prev} onClick={onPrev}>‹</button>
        <button className={styles.next} onClick={onNext}>›</button>

        <img
          src={img.url}
          alt=""
          className={styles.image}
          draggable={false}
        />

        <div className={styles.counter}>
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
