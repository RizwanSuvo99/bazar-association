"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { bustCache } from "@/lib/revalidate";
import { useTranslation } from "@/lib/i18n-context";
import { Input, Button, Card } from "@/components/ui";
import type { GalleryImage } from "@/lib/types";

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [captions, setCaptions] = useState<Record<number, { bn: string; en: string }>>(
    Object.fromEntries(images.map((i) => [i.id, { bn: i.caption_bn || "", en: i.caption_en || "" }])),
  );

  async function refresh() {
    await bustCache("gallery");
    router.refresh();
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const up = await apiFetch<{ url: string; public_id?: string }>("/admin/uploads/image?folder=gallery", { method: "POST", body: fd });
      await apiFetch("/admin/gallery", { method: "POST", json: { image_url: up.data.url, cloudinary_public_id: up.data.public_id, sort_order: images.length + 1 } });
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  async function saveCaption(id: number) {
    const c = captions[id];
    await apiFetch(`/admin/gallery/${id}`, { method: "PATCH", json: { caption_bn: c.bn, caption_en: c.en } });
    await refresh();
  }

  async function remove(id: number) {
    await apiFetch(`/admin/gallery/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await apiFetch("/admin/gallery/reorder", {
      method: "PATCH",
      json: { items: reordered.map((img, i) => ({ id: img.id, sort_order: i + 1 })) },
    });
    await refresh();
  }

  return (
    <div className="space-y-5">
      <Card className="flex flex-col items-center justify-center border-dashed p-8">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? t("register.uploading") : "ছবি যোগ করুন"}
        </Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <Card key={img.id} className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              <Image src={img.image_url} alt="" fill sizes="300px" className="object-cover" />
            </div>
            <div className="space-y-2 p-3">
              <Input value={captions[img.id]?.bn ?? ""} placeholder="ক্যাপশন (বাংলা)"
                onChange={(e) => setCaptions((c) => ({ ...c, [img.id]: { ...c[img.id], bn: e.target.value } }))} className="h-9 text-sm" />
              <Input value={captions[img.id]?.en ?? ""} placeholder="Caption (English)"
                onChange={(e) => setCaptions((c) => ({ ...c, [img.id]: { ...c[img.id], en: e.target.value } }))} className="h-9 text-sm" />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md border border-border p-1.5 disabled:opacity-40 cursor-pointer" aria-label="up"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded-md border border-border p-1.5 disabled:opacity-40 cursor-pointer" aria-label="down"><ArrowDown className="h-4 w-4" /></button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => saveCaption(img.id)} className="rounded-md border border-border p-1.5 hover:bg-muted cursor-pointer" aria-label="save"><Save className="h-4 w-4" /></button>
                  <button onClick={() => remove(img.id)} className="rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer" aria-label="delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
