"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Variant = "dark" | "light";

type AppNavLinksProps = {
  variant?: Variant;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", code: "DB" },
  { href: "/customers", label: "Customers", code: "CU" },
  { href: "/quotes", label: "Quotes", code: "QT" },
  { href: "/schedule", label: "Schedule", code: "SC" },
  { href: "/invoices", label: "Invoices", code: "IN" },
  { href: "/settings", label: "Settings", code: "ST" },
];

function navClass(isActive: boolean, variant: Variant) {
  if (variant === "dark") {
    return [
      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
      isActive
        ? "bg-gradient-to-r from-cyan-300/20 to-blue-300/16 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
        : "text-slate-300 hover:bg-white/8 hover:text-slate-100",
    ].join(" ");
  }

  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
    isActive
      ? "bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_18%,transparent)]"
      : "text-slate-600 hover:bg-white/90 hover:text-slate-900",
  ].join(" ");
}

function codeClass(isActive: boolean, variant: Variant) {
  if (variant === "dark") {
    return [
      "flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide",
      isActive
        ? "bg-cyan-100/22 text-cyan-100"
        : "bg-slate-300/12 text-slate-300 group-hover:bg-slate-200/18 group-hover:text-slate-100",
    ].join(" ");
  }

  return [
    "flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide",
    isActive
      ? "bg-[color:var(--brand)] text-white"
      : "bg-slate-200 text-slate-600 group-hover:bg-slate-300",
  ].join(" ");
}

export function AppNavLinks({ variant = "light" }: AppNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link className={navClass(isActive, variant)} href={item.href} key={item.href}>
            <span className={codeClass(isActive, variant)}>{item.code}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
