"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { addClientAction, removeClientAction } from "@/lib/actions/clients";
import type { Client } from "@/lib/db/queries/clients";
import { Button } from "@/components/ui/button";

interface ClientsViewProps {
  initialClients: Client[];
}

export function ClientsView({ initialClients }: ClientsViewProps) {
  const { t } = useTranslation();
  const [clients, setClients] = useState(initialClients);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleAdd() {
    if (!email.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      const result = await addClientAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEmail("");
      setShowForm(false);
      // Refresh via router is not needed here — server action called revalidatePath
      // The new client will appear on next navigation. For optimistic UX we'd need the returned data,
      // but addClientAction redirects on success. Instead just reload:
      window.location.reload();
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(clientId: string) {
    if (!confirm(t.clients.removeConfirm)) return;
    await removeClientAction(clientId);
    setClients((prev) => prev.filter((c) => c.client_id !== clientId));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.clients.title}
        </h1>
        <Button size="sm" onClick={() => { setShowForm(true); setError(null); }}>
          + {t.clients.addClient}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder={t.clients.clientEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              autoFocus
            />
            <Button size="sm" onClick={handleAdd} loading={adding} disabled={!email.trim()}>
              {t.common.add}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowForm(false); setError(null); setEmail(""); }}>
              {t.common.cancel}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}

      {clients.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t.clients.noClients}
        </p>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div
              key={client.client_id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                <p className="text-xs text-gray-400">
                  Added {new Date(client.assigned_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRemove(client.client_id)}
                className="rounded p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title={t.clients.removeConfirm}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
