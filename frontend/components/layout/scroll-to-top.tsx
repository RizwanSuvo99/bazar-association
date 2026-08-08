"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/** Floating "back to top" button, revealed once the page has been scrolled a screenful. */
export function ScrollToTop() {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 400);
    onScroll(); // handle a restored scroll position on load
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    // Honour the OS "reduce motion" setting rather than always animating.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t("common.backToTop")}
      title={t("common.backToTop")}
      // Kept out of the tab order and hidden from screen readers while invisible,
      // so it is never a focus target that cannot be seen.
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={cn(
        "fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg shadow-black/20",
        "transition-all duration-200 hover:brightness-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Sits above the iOS home indicator / Android gesture bar on phones.
        "[bottom:calc(1.25rem+env(safe-area-inset-bottom))]",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
