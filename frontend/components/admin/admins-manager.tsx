"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, ShieldCheck, Trash2, KeyRound, Check, ShieldAlert } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { Input, Button, Label, Card, Select, Badge } from "@/components/ui";
import type { AdminAccount, AdminRole } from "@/lib/types";

interface NewAdminValues {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

const roleLabel = (role: string) => (role === "superadmin" ? "সুপার অ্যাডমিন" : "অ্যাডমিন");

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminsManager({
  admins,
  currentAdminId,
}: {
  admins: AdminAccount[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<NewAdminValues>({ defaultValues: { name: "", email: "", password: "", role: "admin" } });

  function report(e: unknown, fallback: string) {
    if (e instanceof ApiError && e.details?.length) setError(e.details.map((d) => d.message).join(" "));
    else setError(e instanceof ApiError ? e.message : fallback);
  }

  function flash(message: string) {
    setNotice(message);
    setError("");
    setTimeout(() => setNotice(""), 4000);
  }

  async function createAdmin(values: NewAdminValues) {
    setError("");
    try {
      await apiFetch("/admin/admins", { method: "POST", json: values });
      reset();
      flash(`${values.name} যুক্ত হয়েছে।`);
      router.refresh();
    } catch (e) {
      report(e, "অ্যাডমিন যোগ করা যায়নি।");
    }
  }

  async function patchAdmin(id: string, body: Record<string, unknown>, message: string) {
    setError("");
    setBusyId(id);
    try {
      await apiFetch(`/admin/admins/${id}`, { method: "PATCH", json: body });
      flash(message);
      router.refresh();
    } catch (e) {
      report(e, "পরিবর্তন করা যায়নি।");
    } finally {
      setBusyId(null);
    }
  }

  async function removeAdmin(admin: AdminAccount) {
    if (!confirm(`${admin.name}-কে মুছে ফেলতে চান? এটি ফেরানো যাবে না।`)) return;
    setError("");
    setBusyId(String(admin.id));
    try {
      await apiFetch(`/admin/admins/${admin.id}`, { method: "DELETE" });
      flash(`${admin.name} মুছে ফেলা হয়েছে।`);
      router.refresh();
    } catch (e) {
      report(e, "মুছে ফেলা যায়নি।");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(admin: AdminAccount) {
    const pw = prompt(`${admin.name}-এর জন্য নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর, একটি অক্ষর ও একটি সংখ্যা):`);
    if (!pw) return;
    setError("");
    setBusyId(String(admin.id));
    try {
      await apiFetch(`/admin/admins/${admin.id}/password`, { method: "POST", json: { new_password: pw } });
      flash(`${admin.name}-এর পাসওয়ার্ড পরিবর্তন হয়েছে।`);
    } catch (e) {
      report(e, "পাসওয়ার্ড পরিবর্তন করা যায়নি।");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {notice && (
        <p className="flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary">
          <Check className="h-4 w-4" /> {notice}
        </p>
      )}

      {/* ---- Add new admin ---- */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <UserPlus className="h-5 w-5 text-primary" /> নতুন অ্যাডমিন যোগ করুন
        </h2>
        <form onSubmit={handleSubmit(createAdmin)} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>নাম</Label>
            <Input {...register("name", { required: "নাম আবশ্যক।" })} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label>ইমেইল</Label>
            <Input type="email" {...register("email", { required: "ইমেইল আবশ্যক।" })} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <Label>পাসওয়ার্ড</Label>
            <Input
              type="password"
              autoComplete="new-password"
              {...register("password", {
                required: "পাসওয়ার্ড আবশ্যক।",
                minLength: { value: 8, message: "কমপক্ষে ৮ অক্ষর দিন।" },
              })}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">কমপক্ষে ৮ অক্ষর, একটি অক্ষর ও একটি সংখ্যা।</p>
            )}
          </div>
          <div>
            <Label>ভূমিকা</Label>
            <Select {...register("role")}>
              <option value="admin">অ্যাডমিন</option>
              <option value="superadmin">সুপার অ্যাডমিন</option>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              সুপার অ্যাডমিন অন্য অ্যাডমিন যোগ ও মুছতে পারেন।
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "যোগ হচ্ছে…" : "অ্যাডমিন যোগ করুন"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ---- Existing admins ---- */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">নাম</th>
                <th className="px-4 py-3">ইমেইল</th>
                <th className="px-4 py-3">ভূমিকা</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3">সর্বশেষ লগইন</th>
                <th className="px-4 py-3 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const id = String(a.id);
                const isSelf = id === currentAdminId;
                const busy = busyId === id;
                return (
                  <tr key={id} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">
                      {a.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(আপনি)</span>}
                    </td>
                    <td className="px-4 py-3 break-all text-muted-foreground">{a.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {a.role === "superadmin" ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                        {roleLabel(a.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={a.is_active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}>
                        {a.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => resetPassword(a)}
                          title="পাসওয়ার্ড রিসেট"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || isSelf}
                          onClick={() =>
                            patchAdmin(
                              id,
                              { role: a.role === "superadmin" ? "admin" : "superadmin" },
                              `${a.name} এখন ${a.role === "superadmin" ? "অ্যাডমিন" : "সুপার অ্যাডমিন"}।`,
                            )
                          }
                          title={isSelf ? "নিজের ভূমিকা পরিবর্তন করা যাবে না" : "ভূমিকা পরিবর্তন"}
                        >
                          {a.role === "superadmin" ? "অ্যাডমিন করুন" : "সুপার করুন"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || isSelf}
                          onClick={() =>
                            patchAdmin(
                              id,
                              { is_active: !a.is_active },
                              `${a.name} ${a.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"} করা হয়েছে।`,
                            )
                          }
                          title={isSelf ? "নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না" : ""}
                        >
                          {a.is_active ? "নিষ্ক্রিয়" : "সক্রিয়"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy || isSelf}
                          onClick={() => removeAdmin(a)}
                          title={isSelf ? "নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না" : "মুছে ফেলুন"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
