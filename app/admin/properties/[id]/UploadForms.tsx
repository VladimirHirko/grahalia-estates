"use client";

import { useState } from "react";

type Props = {
  propertyId: number;
};

export default function UploadForms({ propertyId }: Props) {
  const [imgLoading, setImgLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function uploadImages(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setImgLoading(true);

    const formEl = e.currentTarget;
    const input = formEl.elements.namedItem("files") as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      setMsg("Select at least one image");
      setImgLoading(false);
      return;
    }

    const fd = new FormData();
    for (const f of Array.from(input.files)) fd.append("files", f);

    const res = await fetch(`/api/admin/properties/${propertyId}/images`, {
      method: "POST",
      body: fd,
    });

    setImgLoading(false);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setMsg(`Images upload failed (${res.status}). ${text}`);
      return;
    }

    // обновляем страницу, чтобы увидеть новые фото
    window.location.reload();
  }

  async function uploadPlans(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setPdfLoading(true);

    const formEl = e.currentTarget;
    const input = formEl.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setMsg("Select a PDF file");
      setPdfLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`/api/admin/properties/${propertyId}/plans`, {
      method: "POST",
      body: fd,
    });

    setPdfLoading(false);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setMsg(`PDF upload failed (${res.status}). ${text}`);
      return;
    }

    window.location.reload();
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {msg ? (
        <div style={{ padding: 12, border: "1px solid #e2a3a3", borderRadius: 12, background: "#fff5f5" }}>
          {msg}
        </div>
      ) : null}

      <form onSubmit={uploadPlans} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input name="file" type="file" accept="application/pdf" />
        <button type="submit" disabled={pdfLoading} style={btnPrimary}>
          {pdfLoading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>

      <form onSubmit={uploadImages} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input name="files" type="file" accept="image/*" multiple />
        <button type="submit" disabled={imgLoading} style={btnPrimary}>
          {imgLoading ? "Uploading..." : "Upload images"}
        </button>
      </form>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #0E5E56",
  background: "#0E5E56",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
