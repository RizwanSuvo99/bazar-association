"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  endpoint = "/uploads/registration-photo",
  size = 128,
  className,
}: {
  value?: string;
  onChange: (url: string) => void;
  endpoint?: string;
  size?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await apiFetch<{ url: string }>(endpoint, { method: "POST", body: fd });
      onChange(res.data.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="preview"
            width={size}
            height={size}
            style={{ width: size, height: size }}
            className="rounded-xl border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow cursor-pointer"
            aria-label="remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ width: size, height: size }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors",
            "hover:border-primary hover:text-primary disabled:opacity-60 cursor-pointer",
          )}
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="px-2 text-center text-xs">
            {uploading ? t("register.uploading") : t("register.uploadPhoto")}
          </span>
        </button>
      )}
      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 block text-xs font-medium text-primary hover:underline cursor-pointer"
        >
          {t("register.changePhoto")}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
