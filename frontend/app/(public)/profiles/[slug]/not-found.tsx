"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/public/empty-state";
import { useTranslation } from "@/lib/i18n-context";

export default function ProfileNotFound() {
  const { t } = useTranslation();
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <EmptyState title={t("profile.notFound")} hint={t("profile.notFoundHint")} />
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            {t("common.backToList")}
          </Link>
        </div>
      </div>
    </Container>
  );
}
