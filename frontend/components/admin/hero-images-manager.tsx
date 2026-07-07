"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { HeroImage } from "@/lib/types";

export function HeroImagesManager({
  value,
  onChange,
}: {
  value: HeroImage[];
  onChange: (v: HeroImage[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await apiFetch<{ url: string; public_id?: string }>(
        "/admin/uploads/image?folder=hero",
        { method: "POST", body: fd },
      );
      onChange([...value, { url: res.data.url, public_id: res.data.public_id ?? null }]);
    } finally {
      setUploading(false);
    }
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= value.length) return;
    const arr = [...value];
    [arr[i], arr[t]] = [arr[t], arr[i]];
    onChange(arr);
  };

  const btn = "flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-foreground disabled:opacity-40 cursor-pointer";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((img, i) => (
          <div key={`${img.url}-${i}`} className="relative overflow-hidden rounded-lg border border-border">
            <div className="relative aspect-video bg-muted">
              <Image src={img.url} alt="" fill sizes="220px" className="object-cover" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 p-1.5">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btn} aria-label="up"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className={btn} aria-label="down"><ArrowDown className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={() => remove(i)} className={btn + " text-destructive"} aria-label="delete"><Trash2 className="h-4 w-4" /></button>
            </div>
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">প্রধান</span>}
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60 cursor-pointer"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="text-xs">ছবি যোগ করুন</span>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        হোম পেজের উপরের অংশে (হিরো সেকশন) এই ছবিগুলো কারুসেল আকারে দেখানো হবে। একাধিক ছবি দিলে স্বয়ংক্রিয়ভাবে পরিবর্তন হবে।
      </p>
    </div>
  );
}
