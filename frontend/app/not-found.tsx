import Link from "next/link";
import { Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Store className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold text-foreground">৪০৪</h1>
      <p className="mt-2 text-muted-foreground">পৃষ্ঠাটি পাওয়া যায়নি। / Page not found.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110"
      >
        হোমে ফিরুন / Back to home
      </Link>
    </div>
  );
}
