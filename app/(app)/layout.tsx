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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-screen w-64 border-r border-slate-200 bg-white p-5 md:block">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            SaaS Lawncare
          </p>
          <h1 className="mb-6 text-xl font-semibold">Operations</h1>
          <AppNavLinks />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Multi-tenant workspace
              </p>
              <p className="text-sm font-semibold">Lawncare Command Center</p>
            </div>
            {clerkEnabled ? (
              <div className="flex items-center gap-3">
                <OrganizationSwitcher
                  afterCreateOrganizationUrl="/dashboard"
                  afterLeaveOrganizationUrl="/dashboard"
                  afterSelectOrganizationUrl="/dashboard"
                  hidePersonal
                />
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <span className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-500">
                Auth disabled
              </span>
            )}
          </header>

          <div className="border-b border-slate-200 bg-white p-2 md:hidden">
            <AppNavLinks />
          </div>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
