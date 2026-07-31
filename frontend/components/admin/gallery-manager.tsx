"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { bustCache } from "@/lib/revalidate";
import { useTranslation } from "@/lib/i18n-context";
import { Input, Button, Card } from "@/components/ui";
import type { GalleryImage } from "@/lib/types";

type Caption = { bn: string; en: string };
type RowState = "idle" | "saving" | "saved";

const captionsFrom = (images: GalleryImage[]): Record<number, Caption> =>
  Object.fromEntries(images.map((i) => [i.id, { bn: i.caption_bn || "", en: i.caption_en || "" }]));

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [captions, setCaptions] = useState<Record<number, Caption>>(() => captionsFrom(images));
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const [error, setError] = useState("");

  // Re-seed captions whenever the server sends a new list (after upload, delete or reorder).
  // Without this the state kept its first-render value, so a freshly uploaded image had no
  // entry at all and editing it did nothing.
  useEffect(() => {
    setCaptions((prev) => {
      const next = captionsFrom(images);
      // Preserve anything the user is mid-way through typing.
      for (const [id, value] of Object.entries(prev)) {
        if (next[Number(id)]) next[Number(id)] = value;
      }
      return next;
    });
  }, [images]);

  async function refresh() {
    await bustCache("gallery");
    router.refresh();
  }

  function fail(e: unknown, fallback: string) {
    if (e instanceof ApiError && e.details?.length) setError(e.details.map((d) => d.message).join(" "));
    else setError(e instanceof ApiError ? e.message : fallback);
  }

  function markSaved(id: number) {
    setRowState((s) => ({ ...s, [id]: "saved" }));
    setTimeout(() => setRowState((s) => ({ ...s, [id]: "idle" })), 2000);
  }

  async function uploadToCloud(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const up = await apiFetch<{ url: string; public_id?: string }>(
      "/admin/uploads/image?folder=gallery",
      { method: "POST", body: fd },
    );
    return up.data;
  }

  async function addImage(file: File) {
    setError("");
    setUploading(true);
    try {
      const asset = await uploadToCloud(file);
      await apiFetch("/admin/gallery", {
        method: "POST",
        json: {
          image_url: asset.url,
          cloudinary_public_id: asset.public_id,
          sort_order: images.length + 1,
        },
      });
      await refresh();
    } catch (e) {
      fail(e, "ছবি যোগ করা যায়নি।");
    } finally {
      setUploading(false);
    }
  }

  /** Swap the picture on an existing gallery item, keeping its captions and position. */
  async function replaceImage(id: number, file: File) {
    setError("");
    setRowState((s) => ({ ...s, [id]: "saving" }));
    try {
      const asset = await uploadToCloud(file);
      await apiFetch(`/admin/gallery/${id}`, {
        method: "PATCH",
        json: { image_url: asset.url, cloudinary_public_id: asset.public_id ?? null },
      });
      await refresh();
      markSaved(id);
    } catch (e) {
      fail(e, "ছবি পরিবর্তন করা যায়নি।");
      setRowState((s) => ({ ...s, [id]: "idle" }));
    }
  }

  async function saveCaption(id: number) {
    setError("");
    setRowState((s) => ({ ...s, [id]: "saving" }));
    try {
      const c = captions[id] ?? { bn: "", en: "" };
      await apiFetch(`/admin/gallery/${id}`, {
        method: "PATCH",
        json: { caption_bn: c.bn, caption_en: c.en },
      });
      await refresh();
      markSaved(id);
    } catch (e) {
      fail(e, "সংরক্ষণ করা যায়নি।");
      setRowState((s) => ({ ...s, [id]: "idle" }));
    }
  }

  async function togglePublished(img: GalleryImage) {
    setError("");
    setRowState((s) => ({ ...s, [img.id]: "saving" }));
    try {
      await apiFetch(`/admin/gallery/${img.id}`, {
        method: "PATCH",
        json: { is_published: !img.is_published },
      });
      await refresh();
      markSaved(img.id);
    } catch (e) {
      fail(e, "পরিবর্তন করা যায়নি।");
      setRowState((s) => ({ ...s, [img.id]: "idle" }));
    }
  }

  async function remove(id: number) {
    if (!confirm("এই ছবিটি মুছে ফেলতে চান?")) return;
    setError("");
    try {
      await apiFetch(`/admin/gallery/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      fail(e, "মুছে ফেলা যায়নি।");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    setError("");
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      await apiFetch("/admin/gallery/reorder", {
        method: "PATCH",
        json: { items: reordered.map((img, i) => ({ id: img.id, sort_order: i + 1 })) },
      });
      await refresh();
    } catch (e) {
      fail(e, "ক্রম পরিবর্তন করা যায়নি।");
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Add new */}
      <Card className="flex flex-col items-center justify-center border-dashed p-8">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addImage(f);
            e.target.value = "";
          }}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? t("register.uploading") : "ছবি যোগ করুন"}
        </Button>
      </Card>

      {/* Hidden input reused for "replace picture" on whichever row asked for it */}
      <input
        ref={replaceRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && replaceTarget !== null) replaceImage(replaceTarget, f);
          e.target.value = "";
          setReplaceTarget(null);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => {
          const state = rowState[img.id] ?? "idle";
          const busy = state === "saving";
          return (
            <Card key={img.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                <Image src={img.image_url} alt="" fill sizes="300px" className="object-cover" />
                {!img.is_published && (
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white">
                    অপ্রকাশিত
                  </span>
                )}
                {busy && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <Input
                  value={captions[img.id]?.bn ?? ""}
                  placeholder="ক্যাপশন (বাংলা)"
                  onChange={(e) =>
                    setCaptions((c) => ({
                      ...c,
                      [img.id]: { bn: e.target.value, en: c[img.id]?.en ?? "" },
                    }))
                  }
                  className="h-9 text-sm"
                />
                <Input
                  value={captions[img.id]?.en ?? ""}
                  placeholder="Caption (English)"
                  onChange={(e) =>
                    setCaptions((c) => ({
                      ...c,
                      [img.id]: { bn: c[img.id]?.bn ?? "", en: e.target.value },
                    }))
                  }
                  className="h-9 text-sm"
                />

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || busy}
                      className="cursor-pointer rounded-md bg-surface-2 p-1.5 disabled:opacity-40"
                      aria-label="up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1 || busy}
                      className="cursor-pointer rounded-md bg-surface-2 p-1.5 disabled:opacity-40"
                      aria-label="down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setReplaceTarget(img.id);
                        replaceRef.current?.click();
                      }}
                      disabled={busy}
                      className="cursor-pointer rounded-md bg-surface-2 p-1.5 hover:bg-muted disabled:opacity-40"
                      title="ছবি পরিবর্তন করুন"
                      aria-label="replace"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => togglePublished(img)}
                      disabled={busy}
                      className="cursor-pointer rounded-md bg-surface-2 p-1.5 hover:bg-muted disabled:opacity-40"
                      title={img.is_published ? "লুকান" : "প্রকাশ করুন"}
                      aria-label="toggle-publish"
                    >
                      {img.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => saveCaption(img.id)}
                      disabled={busy}
                      className="cursor-pointer rounded-md bg-surface-2 p-1.5 hover:bg-muted disabled:opacity-40"
                      title="ক্যাপশন সংরক্ষণ"
                      aria-label="save"
                    >
                      {state === "saved" ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => remove(img.id)}
                      disabled={busy}
                      className="cursor-pointer rounded-md bg-surface-2 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      aria-label="delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
