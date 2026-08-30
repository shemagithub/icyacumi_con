"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { usePagination } from "@/lib/pagination";

type ClientRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pagination = usePagination(clients);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/clients", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    setClients(data.clients ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(client: ClientRow) {
    if (!confirm(`Delete client ${client.email}?`)) return;
    await fetch(`/api/admin/clients/${client.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await load();
  }

  const exportRows = useMemo(
    () =>
      clients.map((client) => ({
        name: client.name,
        email: client.email,
        joined: new Date(client.createdAt).toLocaleDateString("en-GB"),
      })),
    [clients],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            All shopper accounts on the marketplace.
          </p>
        </div>
        <ExportPdfButton
          title="Clients"
          columns={[
            { key: "name", label: "Name", width: 140 },
            { key: "email", label: "Email", width: 180 },
            { key: "joined", label: "Joined", width: 90 },
          ]}
          rows={exportRows}
        />
      </header>

      {error ? <p className="text-sm text-[var(--portal-accent)]">{error}</p> : null}

      <section className="portal-card overflow-hidden">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-[var(--portal-muted)]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((client) => (
              <tr key={client.id} className="border-t border-[var(--portal-line)]">
                <td className="px-5 py-3.5 font-medium">{client.name}</td>
                <td className="px-3 py-3.5 text-[var(--portal-muted)]">{client.email}</td>
                <td className="px-3 py-3.5 text-[var(--portal-muted)]">
                  {new Date(client.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => void remove(client)}
                    className="text-xs font-medium text-[var(--portal-accent)] hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-[var(--portal-muted)]">
                  No clients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
      </section>
    </div>
  );
}
