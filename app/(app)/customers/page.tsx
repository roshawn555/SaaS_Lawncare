"use client";

import { FormEvent, useEffect, useState } from "react";

type Property = {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
};

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  properties: Property[];
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: PaginationMeta;
};

type ApiFailure = {
  ok: false;
  error: {
    message: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

function toQueryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && `${value}`.length > 0) {
      params.set(key, `${value}`);
    }
  });

  return params.toString();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchCustomers(page = meta.page, nextSearch = search) {
    setLoading(true);
    setError(null);

    try {
      const query = toQueryString({
        page,
        pageSize: meta.pageSize,
        search: nextSearch || undefined,
      });

      const response = await fetch(`/api/customers?${query}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse<Customer[]>;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok ? "Failed to load customers." : payload.error.message,
        );
      }

      setCustomers(payload.data);
      setMeta(payload.meta ?? meta);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCustomers(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const method = editingId ? "PATCH" : "POST";
      const endpoint = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        }),
      });
      const payload = (await response.json()) as ApiResponse<Customer>;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok ? "Unable to save customer." : payload.error.message,
        );
      }

      setForm(defaultForm);
      setEditingId(null);
      await fetchCustomers(meta.page, search);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save customer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      notes: customer.notes ?? "",
    });
  }

  async function onDelete(customerId: string) {
    const shouldDelete = window.confirm("Delete this customer?");

    if (!shouldDelete) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok ? "Unable to delete customer." : payload.error.message,
        );
      }

      await fetchCustomers(meta.page, search);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete customer.",
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-slate-600">
            Manage customer contacts and service properties.
          </p>
        </div>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, firstName: event.target.value }))
            }
            placeholder="First name"
            required
            value={form.firstName}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, lastName: event.target.value }))
            }
            placeholder="Last name"
            required
            value={form.lastName}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email"
            type="email"
            value={form.email}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Phone"
            value={form.phone}
          />
          <textarea
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Notes"
            rows={2}
            value={form.notes}
          />
          <div className="flex items-center gap-2 md:col-span-2">
            <button
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update Customer"
                  : "Create Customer"}
            </button>
            {editingId ? (
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingId(null);
                  setForm(defaultForm);
                }}
                type="button"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by customer name, email, or phone"
            value={searchDraft}
          />
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setSearch(searchDraft.trim())}
            type="button"
          >
            Search
          </button>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSearchDraft("");
              setSearch("");
            }}
            type="button"
          >
            Clear
          </button>
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="text-sm text-slate-600">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 pr-4 font-medium">Properties</th>
                  <th className="py-2 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr className="border-b border-slate-100" key={customer.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">
                        {customer.firstName} {customer.lastName}
                      </p>
                      {customer.notes ? (
                        <p className="text-xs text-slate-500">{customer.notes}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      <p>{customer.email ?? "No email"}</p>
                      <p>{customer.phone ?? "No phone"}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {customer.properties.length}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => startEdit(customer)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(customer.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={meta.page <= 1 || loading}
              onClick={() => void fetchCustomers(meta.page - 1, search)}
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => void fetchCustomers(meta.page + 1, search)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
