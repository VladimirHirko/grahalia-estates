"use client";

import { useEffect } from "react";

export default function RentFieldsToggle() {
  useEffect(() => {
    const deal = document.getElementById("dealType") as HTMLSelectElement | null;
    const rentWrap = document.getElementById("rentFields") as HTMLElement | null;
    if (!deal || !rentWrap) return;

    const rentInputs = Array.from(
      rentWrap.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-rent-input]")
    );

    const rentPrice = rentWrap.querySelector<HTMLInputElement>('input[name="rentPrice"]');
    const rentType = rentWrap.querySelector<HTMLSelectElement>('select[name="rentType"]');

    const apply = () => {
      const isRent = deal.value === "rent";

      // показываем/прячем блок
      rentWrap.style.display = isRent ? "block" : "none";

      // отключаем/включаем поля (чтобы не улетали лишние значения)
      for (const el of rentInputs) el.disabled = !isRent;

      // required только для rent
      if (rentPrice) rentPrice.required = isRent;
      if (rentType) rentType.required = isRent;
    };

    apply();
    deal.addEventListener("change", apply);
    return () => deal.removeEventListener("change", apply);
  }, []);

  return null;
}
