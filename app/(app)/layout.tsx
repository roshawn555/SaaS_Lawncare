import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppNavLinks } from "@/components/app-nav-links";
import { requireAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (clerkEnabled) {
    const { userId, orgId } = await auth();

    if (!userId) {
      redirect("/sign-in");
    }

    if (!orgId) {
      redirect("/onboarding/organization");
    }

    await requireAuthContext();
  }

  return (
    <div className="app-canvas">
      <div className="mx-auto flex min-h-screen max-w-[1520px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0c2034] text-slate-100 md:flex md:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-200/90">
              Lawncare OS
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Enterprise Suite
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Operations, dispatch, quoting, and billing in one workspace.
            </p>
          </div>

          <div className="flex-1 px-4 py-5">
            <AppNavLinks variant="dark" />
          </div>

          <div className="border-t border-white/10 px-6 py-4">
            <p className="text-xs font-medium text-slate-300">Region: US East</p>
            <p className="mt-1 text-xs text-slate-400">SLA: 99.95% uptime target</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[color:var(--line-subtle)] bg-white/82 backdrop-blur">
            <div className="flex min-h-18 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  Multi-tenant command center
                </p>
                <p className="mt-1 text-base font-semibold text-[color:var(--text-primary)]">
                  Lawncare Command Center
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="pill">Operational</span>
                {clerkEnabled ? (
                  <div className="flex items-center gap-2 rounded-xl border border-[color:var(--line-subtle)] bg-white px-2 py-1 shadow-[var(--shadow-card)]">
                    <OrganizationSwitcher
                      afterCreateOrganizationUrl="/dashboard"
                      afterLeaveOrganizationUrl="/dashboard"
                      afterSelectOrganizationUrl="/dashboard"
                      hidePersonal
                    />
                    <UserButton afterSignOutUrl="/" />
                  </div>
                ) : (
                  <span className="pill">Auth disabled</span>
                )}
              </div>
            </div>

            <div className="border-t border-[color:var(--line-subtle)] bg-[color:var(--surface-muted)] p-2 md:hidden">
              <AppNavLinks variant="light" />
            </div>
          </header>

          <main className="workspace flex-1 px-4 pb-8 pt-6 md:px-8">
            <div className="stagger-in">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
