"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
};

type QuoteItem = {
  id?: string;
  name: string;
  description?: string | null;
  quantity: number | string;
  unitPrice: number | string;
  lineTotal: number | string;
};

type QuoteSummary = {
  id: string;
  title: string;
  status: string;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  createdAt: string;
  customer: Customer;
};

type QuoteDetail = QuoteSummary & {
  notes: string | null;
  items: QuoteItem[];
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

const blankLineItem = {
  name: "",
  description: "",
  quantity: "1",
  unitPrice: "0",
};

function formatMoney(value: number | string) {
  return Number(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function toQueryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && `${value}`.length > 0) {
      params.set(key, `${value}`);
    }
  });

  return params.toString();
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    notes: "",
    tax: "0",
    items: [blankLineItem],
  });

  const availableStatuses = useMemo(
    () => ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"],
    [],
  );

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers?page=1&pageSize=100", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse<
        Array<Customer & { email?: string }>
      >;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok ? "Unable to load customers." : payload.error.message,
        );
      }

      setCustomers(
        payload.data.map((customer) => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
        })),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load customers.",
      );
    }
  }, []);

  const fetchQuotes = useCallback(
    async (page = 1) => {
      setLoadingList(true);
      setError(null);

      try {
        const query = toQueryString({
          page,
          pageSize: meta.pageSize,
          search: search || undefined,
          status: status || undefined,
        });
        const response = await fetch(`/api/quotes?${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiResponse<QuoteSummary[]>;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.ok ? "Unable to load quotes." : payload.error.message);
        }

        setQuotes(payload.data);
        setMeta((current) => payload.meta ?? current);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load quotes.",
        );
      } finally {
        setLoadingList(false);
      }
    },
    [meta.pageSize, search, status],
  );

  async function fetchQuoteDetail(quoteId: string) {
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse<QuoteDetail>;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Unable to load quote detail." : payload.error.message);
      }

      setSelectedQuote(payload.data);
      setSelectedQuoteId(payload.data.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load quote detail.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    void fetchQuotes(1);
  }, [fetchQuotes]);

  async function onCreateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          title: form.title,
          notes: form.notes || undefined,
          tax: Number(form.tax),
          items: form.items.map((item) => ({
            name: item.name,
            description: item.description || undefined,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      });
      const payload = (await response.json()) as ApiResponse<QuoteDetail>;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Unable to create quote." : payload.error.message);
      }

      setForm({
        customerId: form.customerId,
        title: "",
        notes: "",
        tax: "0",
        items: [blankLineItem],
      });
      await fetchQuotes(1);
      await fetchQuoteDetail(payload.data.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create quote.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-slate-600">
            Create, track, and review proposal pipelines.
          </p>
        </div>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Create Quote</h2>
          <form className="mt-3 space-y-3" onSubmit={onCreateQuote}>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) =>
                setForm((current) => ({ ...current, customerId: event.target.value }))
              }
              required
              value={form.customerId}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Quote title"
              required
              value={form.title}
            />
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Notes"
              rows={2}
              value={form.notes}
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              min="0"
              onChange={(event) =>
                setForm((current) => ({ ...current, tax: event.target.value }))
              }
              placeholder="Tax amount"
              step="0.01"
              type="number"
              value={form.tax}
            />

            <div className="space-y-2 rounded-md border border-slate-200 p-3">
              <p className="text-sm font-medium">Line items</p>
              {form.items.map((item, index) => (
                <div className="grid gap-2 md:grid-cols-4" key={`${item.name}-${index}`}>
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, name: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                    placeholder="Name"
                    required
                    value={item.name}
                  />
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    min="0.01"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, quantity: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                    placeholder="Qty"
                    step="0.01"
                    type="number"
                    value={item.quantity}
                  />
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        items: current.items.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, unitPrice: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                    placeholder="Unit price"
                    step="0.01"
                    type="number"
                    value={item.unitPrice}
                  />
                  <button
                    className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 disabled:opacity-50"
                    disabled={form.items.length === 1}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        items: current.items.filter((_, entryIndex) => entryIndex !== index),
                      }))
                    }
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="rounded-md border border-slate-300 px-2 py-1 text-sm font-medium text-slate-700"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: [...current.items, blankLineItem],
                  }))
                }
                type="button"
              >
                Add item
              </button>
            </div>

            <button
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Create Quote"}
            </button>
          </form>
        </article>

        <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search title or customer"
              value={searchDraft}
            />
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => setSearch(searchDraft.trim())}
              type="button"
            >
              Search
            </button>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="">All statuses</option>
              {availableStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {loadingList ? (
            <p className="text-sm text-slate-600">Loading quotes...</p>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-slate-600">No quotes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Customer</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">View</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr className="border-b border-slate-100" key={quote.id}>
                      <td className="py-3 pr-4">{quote.title}</td>
                      <td className="py-3 pr-4">
                        {quote.customer.firstName} {quote.customer.lastName}
                      </td>
                      <td className="py-3 pr-4">{quote.status}</td>
                      <td className="py-3 pr-4">{formatMoney(quote.total)}</td>
                      <td className="py-3 pr-4">
                        <button
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => void fetchQuoteDetail(quote.id)}
                          type="button"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
                disabled={meta.page <= 1 || loadingList}
                onClick={() => void fetchQuotes(meta.page - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
                disabled={meta.page >= meta.totalPages || loadingList}
                onClick={() => void fetchQuotes(meta.page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </article>
      </div>

      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Quote Detail</h2>
        {loadingDetail ? (
          <p className="mt-3 text-sm text-slate-600">Loading quote...</p>
        ) : selectedQuote ? (
          <div className="mt-3 space-y-3 text-sm">
            <p className="font-medium text-slate-900">{selectedQuote.title}</p>
            <p className="text-slate-600">
              {selectedQuote.customer.firstName} {selectedQuote.customer.lastName}
            </p>
            <p className="text-slate-600">Status: {selectedQuote.status}</p>
            <p className="text-slate-600">Subtotal: {formatMoney(selectedQuote.subtotal)}</p>
            <p className="text-slate-600">Tax: {formatMoney(selectedQuote.tax)}</p>
            <p className="font-medium text-slate-900">Total: {formatMoney(selectedQuote.total)}</p>
            {selectedQuote.notes ? (
              <p className="rounded-md bg-slate-50 p-2 text-slate-700">
                {selectedQuote.notes}
              </p>
            ) : null}
            <div className="space-y-2">
              <p className="font-medium text-slate-900">Items</p>
              {selectedQuote.items.map((item) => (
                <div className="rounded-md border border-slate-200 p-2" key={item.id ?? item.name}>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-slate-600">
                    {item.quantity} x {formatMoney(item.unitPrice)} ={" "}
                    {formatMoney(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Select a quote from the list to view detail.
          </p>
        )}
        {selectedQuoteId ? (
          <p className="mt-3 text-xs text-slate-500">Quote ID: {selectedQuoteId}</p>
        ) : null}
      </aside>
    </section>
  );
}
