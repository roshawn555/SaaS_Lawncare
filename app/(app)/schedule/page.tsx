"use client";

import { useState } from "react";

type Visit = {
  id: string;
  status: string;
  scheduledFor: string;
  notes: string | null;
  job: {
    title: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  };
  property: {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
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

function toIsoDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
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

export default function SchedulePage() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [start, setStart] = useState(toIsoDateInput(today));
  const [end, setEnd] = useState(toIsoDateInput(nextWeek));
  const [status, setStatus] = useState("");
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchVisits(page = meta.page) {
    setLoading(true);
    setError(null);

    try {
      const query = toQueryString({
        start,
        end,
        status: status || undefined,
        page,
        pageSize: meta.pageSize,
      });

      const response = await fetch(`/api/visits?${query}`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<Visit[]>;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Unable to load visits." : payload.error.message);
      }

      setVisits(payload.data);
      setMeta(payload.meta ?? meta);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load visits.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-sm text-slate-600">
          Query crew visits by date range and status.
        </p>
      </div>

      <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => setStart(event.target.value)}
            type="date"
            value={start}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => setEnd(event.target.value)}
            type="date"
            value={end}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="EN_ROUTE">EN_ROUTE</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="SKIPPED">SKIPPED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
          <button
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={loading}
            onClick={() => void fetchVisits(1)}
            type="button"
          >
            {loading ? "Loading..." : "Run Query"}
          </button>
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {visits.length === 0 ? (
          <p className="text-sm text-slate-600">
            Run a query to load visits for the selected date range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4 font-medium">Scheduled</th>
                  <th className="py-2 pr-4 font-medium">Job</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Property</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr className="border-b border-slate-100" key={visit.id}>
                    <td className="py-3 pr-4">
                      {new Date(visit.scheduledFor).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">{visit.job.title}</td>
                    <td className="py-3 pr-4">
                      {visit.job.customer.firstName} {visit.job.customer.lastName}
                    </td>
                    <td className="py-3 pr-4">
                      {visit.property.addressLine1}, {visit.property.city},{" "}
                      {visit.property.state}
                    </td>
                    <td className="py-3 pr-4">{visit.status}</td>
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
              disabled={meta.page <= 1 || loading}
              onClick={() => void fetchVisits(meta.page - 1)}
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => void fetchVisits(meta.page + 1)}
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
