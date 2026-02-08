import { OrganizationSwitcher } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrganizationOnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
          Onboarding
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Select an Organization</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose an existing organization or create a new one to continue into
          your workspace.
        </p>

        <div className="mt-5">
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/onboarding/organization"
            afterSelectOrganizationUrl="/dashboard"
            hidePersonal
          />
        </div>

        <div className="mt-5">
          <Link
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
