const kpis = [
  {
    label: "Open Quotes",
    value: "14",
    trend: "+11%",
    note: "7-day delta",
  },
  {
    label: "Scheduled Visits",
    value: "28",
    trend: "+6%",
    note: "today + tomorrow",
  },
  {
    label: "Outstanding Invoices",
    value: "9",
    trend: "-3%",
    note: "aging > 15 days",
  },
  {
    label: "Monthly Revenue",
    value: "$42,850",
    trend: "+18%",
    note: "vs prior month",
  },
];

const attentionQueue = [
  { type: "Dispatch", item: "Route 03 overlapping visit windows", priority: "High" },
  { type: "Billing", item: "Invoice #INV-1092 has no payment method", priority: "Medium" },
  { type: "Quotes", item: "5 quotes expire in the next 48 hours", priority: "High" },
  { type: "Quality", item: "2 completed visits missing crew notes", priority: "Low" },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
            Executive Overview
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--text-primary)]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-muted)]">
            Monitor quote velocity, dispatch execution, and revenue leakage from a
            single control surface.
          </p>
        </div>
        <span className="pill">Live snapshot</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article className="p-5" key={kpi.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
              {kpi.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">
              {kpi.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
                {kpi.trend}
              </span>
              <span className="text-xs text-[color:var(--text-muted)]">{kpi.note}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <article className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
              Revenue Pulse
            </h2>
            <span className="pill">92% to target</span>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                <span>Recurring Services</span>
                <span>$28,600</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[78%] rounded-full bg-[color:var(--brand)]" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                <span>One-time Cleanup</span>
                <span>$9,050</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[46%] rounded-full bg-[color:var(--success)]" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                <span>Add-ons and Upsells</span>
                <span>$5,200</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[32%] rounded-full bg-[color:var(--warning)]" />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[color:var(--line-subtle)] bg-white p-4">
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
              Today&apos;s Focus
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Finalize route assignments before 8:00 AM, close pending quotes over
              $500, and follow up on outstanding invoices over 21 days.
            </p>
          </div>
        </article>

        <article className="p-5">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
            SLA Snapshot
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-[color:var(--text-muted)]">
            <li className="flex items-center justify-between rounded-lg border border-[color:var(--line-subtle)] bg-white p-3">
              <span>On-time arrival rate</span>
              <span className="font-semibold text-[color:var(--text-primary)]">96.4%</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-[color:var(--line-subtle)] bg-white p-3">
              <span>Quote acceptance rate</span>
              <span className="font-semibold text-[color:var(--text-primary)]">64.2%</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-[color:var(--line-subtle)] bg-white p-3">
              <span>Invoice collection speed</span>
              <span className="font-semibold text-[color:var(--text-primary)]">11.8 days</span>
            </li>
          </ul>
        </article>
      </div>

      <article className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
            Attention Queue
          </h2>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
            Priority-driven
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-2 pr-4">Domain</th>
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Priority</th>
              </tr>
            </thead>
            <tbody>
              {attentionQueue.map((queueItem) => (
                <tr className="border-b border-[color:var(--line-subtle)]" key={queueItem.item}>
                  <td className="py-3 pr-4 font-semibold text-[color:var(--text-primary)]">
                    {queueItem.type}
                  </td>
                  <td className="py-3 pr-4 text-[color:var(--text-muted)]">
                    {queueItem.item}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="pill">{queueItem.priority}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
