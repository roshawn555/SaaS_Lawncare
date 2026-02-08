"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/quotes", label: "Quotes" },
  { href: "/schedule", label: "Schedule" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings" },
];

function navClass(isActive: boolean) {
  return [
    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-emerald-100 text-emerald-900"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export function AppNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link className={navClass(isActive)} href={item.href} key={item.href}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
