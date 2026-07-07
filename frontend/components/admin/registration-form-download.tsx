"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Businessman, SiteSettings } from "@/lib/types";

const GREEN = "#147a3e";
const RED = "#d1232a";
const DARK = "#2b2b2b";

// Static form text (matches registration-form.pdf).
const OFFICE = "অফিস: নাঙ্গলকোট মধ্য বাজার, উপজেলা: নাঙ্গলকোট, জেলা: কুমিল্লা।";
const ESTLINE = "স্থাপিত: ০১.০৫.২০২৬ খ্রি.        ফোন: ০১৩৩৩০৮৭১৮০        রেজি: নং-";
const TITLE = "ভোটার তালিকা হাল নাগাদ-২০২৬";
const DECLARATION =
  "আমি এই মর্মে অঙ্গীকার করিতেছি যে, নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থার গঠনতন্ত্র অনুযায়ী সকল কার্যক্রম মানিয়া চলিবো। আমি বৈধ ব্যবসা করিব। কোন প্রকার রাষ্ট্রদ্রোহী কার্যক্রমে অংশগ্রহণ করিব না এবং সংস্থার সকল নিয়ম কানুন মানিয়া চলিবো। অন্যথায় নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থার গঠনতন্ত্রের অবাধ্য হলে আমার বিরুদ্ধে সংস্থার বা কর্তৃপক্ষের সিদ্ধান্তই চূড়ান্ত বলে গণ্য হইবে। এতে আমার কোন আপত্তি থাকিবে না।";

function Field({ label, value, grow = 1 }: { label: string; value?: string | null; grow?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", flex: grow, minWidth: 0, gap: 4 }}>
      <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, borderBottom: "1px dotted #555", paddingLeft: 4, minHeight: 20 }}>
        {value || ""}
      </span>
    </div>
  );
}

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
  const bn = (v?: string | null) => (v ? toBnDigits(v) : "");
  const orgName = settings?.org_name_bn || "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা";
  const fee = settings?.registration_fee ?? 500;

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
        imageTimeout: 15000,
      });
      const img = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      let w = pw;
      let h = (canvas.height * pw) / canvas.width;
      if (h > ph) {
        h = ph;
        w = (canvas.width * ph) / canvas.height;
      }
      pdf.addImage(img, "JPEG", (pw - w) / 2, 0, w, h);
      pdf.save(`registration-form-${b.unique_id}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  const lineGap = { display: "flex", gap: 24, marginTop: 10 } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#e9e7e2", paddingBottom: 40 }}>
      {/* Toolbar (not captured) */}
      <div
        style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #ddd" }}
        className="flex items-center justify-between px-4 py-3"
      >
        <Link href={`/admin/businessmen/${b.id}/edit`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
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

      {/* The form (captured) */}
      <div className="mx-auto my-6" style={{ width: 794 }}>
        <div
          ref={ref}
          style={{
            width: 794,
            background: "#fff",
            color: "#111",
            padding: "0 0 28px",
            fontFamily: "var(--font-hind), 'Hind Siliguri', sans-serif",
            fontSize: 14,
            lineHeight: 1.5,
            boxShadow: "0 1px 6px rgba(0,0,0,.15)",
          }}
        >
          {/* Top flag stripe */}
          <div style={{ display: "flex", height: 12 }}>
            <div style={{ flex: 2, background: GREEN }} />
            <div style={{ flex: 1, background: RED }} />
            <div style={{ flex: 2, background: GREEN }} />
          </div>

          <div style={{ padding: "16px 28px 0" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bazar-logo.png" alt="logo" style={{ width: 90, height: 82, objectFit: "contain" }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ color: GREEN, fontWeight: 800, fontSize: 30, lineHeight: 1.1 }}>{orgName}</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{OFFICE}</div>
                <div style={{ marginTop: 2, fontSize: 13 }}>{ESTLINE}</div>
              </div>
            </div>
            <div style={{ borderBottom: "2px solid #111", marginTop: 8 }} />

            {/* Ref / date */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 600 }}>
              <span>সূত্র:</span>
              <span>তারিখ: &nbsp; / &nbsp; /২০২৬ খ্রি.</span>
            </div>

            {/* Title + photo box */}
            <div style={{ position: "relative", marginTop: 6 }}>
              <div style={{ textAlign: "center", fontWeight: 800, fontSize: 20 }}>{TITLE}</div>
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <span style={{ background: DARK, color: "#fff", padding: "5px 26px", borderRadius: 6, fontWeight: 700, fontSize: 16 }}>
                  আবেদন ফরম
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: -4,
                  width: 104,
                  height: 116,
                  border: "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: "#fafafa",
                  textAlign: "center",
                  fontSize: 13,
                }}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>ছবি<br />২কপি</span>
                )}
              </div>
            </div>

            {/* Fee */}
            <div style={{ marginTop: 14 }}>
              <span style={{ background: "#2f5fa8", color: "#fff", padding: "3px 12px", borderRadius: 4, fontWeight: 700 }}>
                সদস্য ফরম ফি: {toBnDigits(fee)}/-
              </span>
            </div>

            {/* ID */}
            <div style={{ marginTop: 12, display: "flex", alignItems: "flex-end", gap: 4, maxWidth: 340 }}>
              <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>আইডি নং:-</span>
              <span style={{ flex: 1, borderBottom: "1px dotted #555", paddingLeft: 4, fontWeight: 700 }}>{bn(b.unique_id)}</span>
            </div>

            {/* Fields */}
            <div style={lineGap}>
              <Field label="সদস্যের নাম:" value={b.full_name} grow={2} />
              <Field label="মোবাইল নং:" value={bn(b.mobile_number)} />
            </div>
            <div style={lineGap}>
              <Field label="পিতার নাম:" value={b.father_name} />
              <Field label="মাতার নাম:" value={b.mother_name} />
            </div>
            <div style={lineGap}>
              <Field label="স্থায়ী ঠিকানা: গ্রাম:" value={b.village} />
              <Field label="ডাকঘর:" value={b.post_office} />
              <Field label="পৌরসভা/ইউনিয়ন:" value={b.municipality_or_union} />
            </div>
            <div style={lineGap}>
              <Field label="উপজেলা:" value={b.upazila} />
              <Field label="জেলা:" value={b.district} />
            </div>
            <div style={lineGap}>
              <Field label="বর্তমান ঠিকানা প্রতিষ্ঠানের নাম:" value={b.current_business_name_address} grow={1} />
            </div>
            <div style={lineGap}>
              <Field label="ব্যবসার ধরণ:" value={b.business_type} />
              <Field label="ট্রেড লাইসেন্স নং:" value={bn(b.trade_license_no)} />
              <Field label="টিআইএন নং:" value={bn(b.tin_no)} />
            </div>
            <div style={lineGap}>
              <Field label="মার্কেটের নাম:" value={b.market_name} />
              <Field label="মালিকের নাম:" value={b.owner_name} />
            </div>
            <div style={lineGap}>
              <Field label="পৌরসভা ওয়ার্ড নং:" value={bn(b.ward_no)} />
              <Field label="হোল্ডিং নং:" value={bn(b.holding_no)} />
              <div style={{ display: "flex", alignItems: "flex-end", flex: 1, gap: 4 }}>
                <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>ভোটারের ধরণ:</span>
                <span style={{ flex: 1, borderBottom: "1px dotted #555", paddingLeft: 4 }}>{b.voter_type || "ব্যবসায়ী"}</span>
              </div>
            </div>
            <div style={lineGap}>
              <Field label="জাতীয় পরিচয়পত্র নং:" value={bn(b.nid_no)} grow={2} />
              <Field label="রক্তের গ্রুপ:" value={b.blood_group} />
            </div>
            <div style={lineGap}>
              <Field label="নমিনীর নাম:" value={b.nominee_name} />
              <Field label="সম্পর্ক:" value={b.nominee_relation} />
            </div>
            <div style={lineGap}>
              <Field label="নমিনীর মোবাইল নং:" value={bn(b.nominee_mobile)} grow={1} />
            </div>

            {/* Declaration */}
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <span style={{ background: DARK, color: "#fff", padding: "4px 22px", borderRadius: 6, fontWeight: 700 }}>ঘোষণা পত্র</span>
            </div>
            <p style={{ marginTop: 10, textAlign: "justify" }}>{DECLARATION}</p>

            <div style={{ marginTop: 14, fontWeight: 600 }}>
              সংযুক্তি:- ১. জাতীয় পরিচয় পত্র ২. ট্রেড লাইসেন্স ৩. টিআইএন সার্টিফিকেট
            </div>

            <div style={{ textAlign: "right", marginTop: 26, fontWeight: 700 }}>ব্যবসায়ীর স্বাক্ষর</div>

            {/* Officials */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1px solid #333", paddingTop: 4, fontWeight: 700 }}>এম আরিফুল আলম নোমান</div>
                <div>সদস্য সচিব</div>
                <div>{orgName}</div>
                <div>মোবাইল ০১৭১১১৬৬০২৯</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1px solid #333", paddingTop: 4, fontWeight: 700 }}>মোঃ আনোয়ার হোসেন মুকুল</div>
                <div>আহ্বায়ক</div>
                <div>{orgName}</div>
                <div>মোবাইল ০১৭১৬৩৫৯৫৬৪</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
