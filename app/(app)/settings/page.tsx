export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-600">
          Configure organization preferences, crew roles, and integrations.
        </p>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Organization Profile</h2>
        <p className="mt-2 text-sm text-slate-600">
          Settings form placeholder for organization info and defaults.
        </p>
      </article>
    </section>
  );
}
