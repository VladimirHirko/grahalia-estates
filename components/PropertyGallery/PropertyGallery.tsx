"use client";

import { useState } from "react";
import GalleryModal from "@/components/GalleryModal/GalleryModal";
import styles from "./PropertyGallery.module.css";

type ImageItem = {
  url: string;
  isCover?: boolean;
};

export default function PropertyGallery({ images }: { images: ImageItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function next() {
    setIndex((i) => (i + 1) % images.length);
  }

  const coverIndex = images.findIndex((i) => i.isCover);
  const cover = coverIndex >= 0 ? images[coverIndex] : images[0];

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.coverWrap}>
          <img
            src={cover.url}
            className={styles.cover}
            onClick={() => openAt(coverIndex >= 0 ? coverIndex : 0)}
          />
        </div>

        <div className={styles.thumbs}>
          {images.map((img, i) => (
            <img
              key={`${img.url}-${i}`}
              src={img.url}
              className={styles.thumb}
              onClick={() => openAt(i)}
            />
          ))}
        </div>
      </div>

      {open && (
        <GalleryModal
          images={images}
          index={index}
          onClose={() => setOpen(false)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
