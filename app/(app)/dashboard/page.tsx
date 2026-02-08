const stats = [
  { label: "Open Quotes", value: "14" },
  { label: "Scheduled Visits", value: "28" },
  { label: "Outstanding Invoices", value: "9" },
  { label: "Monthly Revenue", value: "$42,850" },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600">
          High-level operational snapshot for your lawncare business.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            key={stat.label}
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Today&apos;s Focus</h2>
        <p className="mt-2 text-sm text-slate-600">
          Finish route assignments, send pending quotes, and reconcile invoice
          payments before end of day.
        </p>
      </article>
    </section>
  );
}
