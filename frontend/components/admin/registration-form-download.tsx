"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Businessman, SiteSettings } from "@/lib/types";

// The background is the association's own registration form (registration-form.pdf) rendered to
// an image at 1241x1755 (A4 @ 150dpi). It already contains the exact font, the watermark logo,
// the signatures, and all the printed labels. We only overlay the member's data on top, positioned
// with coordinates measured against that image — no flexbox, so html2canvas renders it cleanly.
const BG_W = 1241;
const BG_H = 1755;

export function RegistrationFormDownload({
  b,
  settings,
  photo,
}: {
  b: Businessman;
  settings: SiteSettings | null;
  photo: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 40) / BG_W));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const bn = (v?: string | null) => (v ? toBnDigits(v) : "");

  // [x, baseline-y, text] measured against the 1241x1755 background.
  const fields: [number, number, string][] = [
    [230, 588, `NBA-${bn(b.six_digit_id)}`],
    [235, 660, b.full_name || ""],
    [880, 660, bn(b.mobile_number)],
    [230, 694, b.father_name || ""],
    [770, 694, b.mother_name || ""],
    [335, 726, b.village || ""],
    [635, 726, b.post_office || ""],
    [975, 726, b.municipality_or_union || ""],
    [215, 760, b.upazila || ""],
    [665, 760, b.district || ""],
    [490, 794, b.current_business_name_address || ""],
    [245, 828, b.business_type || ""],
    [650, 828, bn(b.trade_license_no)],
    [925, 828, bn(b.tin_no)],
    [245, 862, b.market_name || ""],
    [780, 862, b.owner_name || ""],
    [310, 896, bn(b.ward_no)],
    [690, 896, bn(b.holding_no)],
    [340, 930, bn(b.nid_no)],
    [905, 930, b.blood_group || ""],
    [255, 964, b.nominee_name || ""],
    [770, 964, b.nominee_relation || ""],
    [310, 998, bn(b.nominee_mobile)],
  ];

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        imageTimeout: 20000,
        width: BG_W,
        height: BG_H,
        windowWidth: BG_W,
        windowHeight: BG_H,
      });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, "JPEG", 0, 0, pw, ph);
      pdf.save(`registration-form-${b.unique_id}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e9e7e2", paddingBottom: 40 }}>
      {/* Toolbar (not captured) */}
      <div
        style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #ddd" }}
        className="flex items-center justify-between px-4 py-3"
      >
        <Link
          href={`/admin/businessmen/${b.id}/edit`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> ফিরে যান
        </Link>
        <button
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড করুন"}
        </button>
      </div>

      {/* Scaled preview wrapper (reserves the scaled height; capture target is the native inner div) */}
      <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
        <div style={{ width: BG_W * scale, height: BG_H * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: BG_W, height: BG_H }}>
            <div
              ref={ref}
              style={{
                position: "relative",
                width: BG_W,
                height: BG_H,
                background: "#fff",
                fontFamily: "var(--font-hind), 'Hind Siliguri', sans-serif",
                boxShadow: "0 1px 8px rgba(0,0,0,.2)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/registration-form-bg.png"
                alt="form"
                width={BG_W}
                height={BG_H}
                style={{ position: "absolute", inset: 0, width: BG_W, height: BG_H }}
              />
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="member"
                  style={{ position: "absolute", left: 988, top: 366, width: 192, height: 232, objectFit: "cover" }}
                />
              )}
              {fields.map(([x, y, text], i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y - 24,
                    fontSize: 25,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    color: "#111",
                    fontWeight: 500,
                  }}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
