"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { usePagination } from "@/lib/pagination";

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  maxUses: number | null;
  usesCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  description: string | null;
};

const EMPTY_FORM = {
  code: "",
  type: "percent" as Coupon["type"],
  value: "10",
  minSubtotal: "0",
  maxDiscount: "",
  maxUses: "",
  startsAt: "",
  endsAt: "",
  description: "",
  active: true,
};

function typeLabel(type: Coupon["type"]) {
  if (type === "percent") return "Percent off";
  if (type === "fixed") return "Fixed amount";
  return "Free shipping";
}

function valueLabel(coupon: Coupon) {
  if (coupon.type === "percent") return `${coupon.value}% off`;
  if (coupon.type === "fixed") return `${coupon.value.toLocaleString("en-US")} RWF off`;
  return "Free shipping";
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pagination = usePagination(coupons);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/coupons", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load coupons");
      return;
    }
    setCoupons((data.coupons as Coupon[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minSubtotal: String(coupon.minSubtotal),
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      maxUses: coupon.maxUses != null ? String(coupon.maxUses) : "",
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : "",
      endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 16) : "",
      description: coupon.description ?? "",
      active: coupon.active,
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minSubtotal: Number(form.minSubtotal),
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      description: form.description,
      active: form.active,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons",
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save coupon.");
        return;
      }
      setMessage(editingId ? "Coupon updated." : "Coupon created.");
      resetForm();
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  async function toggle(id: string) {
    setError(null);
    const response = await fetch(`/api/admin/coupons/${id}/toggle`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not update coupon.");
      return;
    }
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this coupon? This cannot be undone.")) return;
    setError(null);
    const response = await fetch(`/api/admin/coupons/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not delete coupon.");
      return;
    }
    if (editingId === id) resetForm();
    setMessage("Coupon deleted.");
    await load();
  }

  const exportRows = useMemo(
    () =>
      coupons.map((coupon) => ({
        code: coupon.code,
        type: typeLabel(coupon.type),
        value: valueLabel(coupon),
        minSubtotal: coupon.minSubtotal,
        uses: `${coupon.usesCount}${coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}`,
        active: coupon.active ? "Active" : "Inactive",
        description: coupon.description ?? "",
      })),
    [coupons],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Coupons</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Create promo codes for checkout · percent off, fixed RWF off, or free
            shipping. Shoppers apply them on the payment step.
          </p>
        </div>
        <ExportPdfButton
          title="Coupons"
          columns={[
            { key: "code", label: "Code", width: 90 },
            { key: "type", label: "Type", width: 90 },
            { key: "value", label: "Value", width: 100 },
            { key: "minSubtotal", label: "Min subtotal", width: 70 },
            { key: "uses", label: "Uses", width: 60 },
            { key: "active", label: "Status", width: 60 },
            { key: "description", label: "Description", width: 140 },
          ]}
          rows={exportRows}
        />
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <form onSubmit={onSubmit} className="portal-card space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">
            {editingId ? "Edit coupon" : "New coupon"}
          </h2>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Code</span>
            <input
              required
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  code: event.target.value.toUpperCase(),
                }))
              }
              className="portal-input uppercase tracking-[0.12em]"
              placeholder="WELCOME10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">Type</span>
            <select
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  type: event.target.value as Coupon["type"],
                  value:
                    event.target.value === "free_shipping" ? "0" : prev.value || "10",
                }))
              }
              className="portal-input appearance-none"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount (RWF)</option>
              <option value="free_shipping">Free shipping</option>
            </select>
          </label>

          {form.type !== "free_shipping" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                {form.type === "percent" ? "Percent (1-100)" : "Amount (RWF)"}
              </span>
              <input
                required
                type="number"
                min={1}
                max={form.type === "percent" ? 100 : undefined}
                value={form.value}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, value: event.target.value }))
                }
                className="portal-input"
              />
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Min subtotal (RWF)
              </span>
              <input
                type="number"
                min={0}
                value={form.minSubtotal}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, minSubtotal: event.target.value }))
                }
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Max uses (blank = unlimited)
              </span>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, maxUses: event.target.value }))
                }
                className="portal-input"
                placeholder="Unlimited"
              />
            </label>
          </div>

          {form.type === "percent" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Max discount cap (RWF, optional)
              </span>
              <input
                type="number"
                min={1}
                value={form.maxDiscount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, maxDiscount: event.target.value }))
                }
                className="portal-input"
                placeholder="No cap"
              />
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Starts (optional)
              </span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                }
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Ends (optional)
              </span>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                }
                className="portal-input"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Description (optional)
            </span>
            <input
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="portal-input"
              placeholder="Launch week promo"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, active: event.target.checked }))
              }
            />
            Active · shoppers can use this code
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="portal-btn portal-btn--accent disabled:opacity-60"
            >
              {pending ? "Saving…" : editingId ? "Save changes" : "Create coupon"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="portal-btn portal-btn--ghost"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <section className="portal-card overflow-hidden">
          <div className="border-b border-[var(--portal-line)] px-5 py-4">
            <h2 className="text-sm font-semibold">All coupons</h2>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              {coupons.length} code{coupons.length === 1 ? "" : "s"}
            </p>
          </div>
          {coupons.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--portal-muted)]">
              No coupons yet. Create WELCOME10 or FREESHIP to start.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--portal-line)]">
                {pagination.items.map((coupon) => (
                  <li key={coupon.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold tracking-[0.08em]">{coupon.code}</p>
                        <p className="mt-1 text-sm text-[var(--portal-muted)]">
                          {valueLabel(coupon)} · {typeLabel(coupon.type)}
                          {coupon.minSubtotal > 0
                            ? ` · min ${coupon.minSubtotal.toLocaleString("en-US")} RWF`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-[var(--portal-muted)]">
                          Used {coupon.usesCount}
                          {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
                          {" · "}
                          {coupon.active ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(coupon)}
                          className="portal-btn portal-btn--ghost !py-1.5 !text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggle(coupon.id)}
                          className="portal-btn portal-btn--ghost !py-1.5 !text-xs"
                        >
                          {coupon.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(coupon.id)}
                          className="portal-btn portal-btn--ghost !py-1.5 !text-xs text-[var(--portal-accent)]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <AdminPagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                totalPages={pagination.totalPages}
                start={pagination.start}
                end={pagination.end}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
