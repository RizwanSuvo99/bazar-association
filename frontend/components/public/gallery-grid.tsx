"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { GalleryImage, Lang } from "@/lib/types";

export function GalleryGrid({ images, lang }: { images: GalleryImage[]; lang: Lang }) {
  const [active, setActive] = useState<number | null>(null);
  const caption = (img: GalleryImage) =>
    (lang === "en" ? img.caption_en || img.caption_bn : img.caption_bn || img.caption_en) || "";

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className="group block w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card text-left cursor-pointer"
          >
            <div className="overflow-hidden">
              <Image
                src={img.image_url}
                alt={caption(img)}
                width={800}
                height={600}
                className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              />
            </div>
            {caption(img) && <p className="p-3 text-sm text-muted-foreground">{caption(img)}</p>}
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
        >
          <button className="absolute right-4 top-4 text-white/80 hover:text-white cursor-pointer" aria-label="close">
            <X className="h-7 w-7" />
          </button>
          <Image
            src={images[active].image_url}
            alt={caption(images[active])}
            width={1200}
            height={900}
            className="max-h-[82vh] w-auto rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {caption(images[active]) && (
            <p className="mt-3 text-center text-sm text-white/90">{caption(images[active])}</p>
          )}
        </div>
      )}
    </>
  );
}
