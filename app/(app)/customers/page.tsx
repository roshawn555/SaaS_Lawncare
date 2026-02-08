export default function CustomersPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-slate-600">
            Manage customer contacts and service properties.
          </p>
        </div>
        <button
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          type="button"
        >
          Add Customer
        </button>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Customer table placeholder. Wire to `/api/customers` next.
        </p>
      </article>
    </section>
  );
}
