"use client";

import { useEffect } from "react";

export default function RentFieldsSync() {
  useEffect(() => {
    const sel = document.getElementById("dealType") as HTMLSelectElement | null;
    const box = document.getElementById("rentFields") as HTMLDivElement | null;

    if (!sel || !box) return;

    const sync = () => {
      const isRent = (sel.value || "").toLowerCase() === "rent";

      // show/hide block
      box.style.display = isRent ? "" : "none";

      // disable/enable inputs so Sale не отправлял rent-поля
      const inputs = box.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "[data-rent-input]"
      );
      inputs.forEach((i) => {
        i.disabled = !isRent;
      });
    };

    sel.addEventListener("change", sync);
    sync(); // initial

    return () => sel.removeEventListener("change", sync);
  }, []);

  return null;
}
