export default function InvoicesPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-600">
            Track billing, payment status, and aging balances.
          </p>
        </div>
        <button
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          type="button"
        >
          Create Invoice
        </button>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Invoice list placeholder. Wire to `/api/invoices`.
        </p>
      </article>
    </section>
  );
}
