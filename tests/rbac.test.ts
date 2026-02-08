import { Role } from "@prisma/client";

import { hasPermission, isAllowedRole } from "@/lib/rbac";

describe("rbac", () => {
  it("grants owner full management permissions", () => {
    expect(hasPermission(Role.OWNER, "settings:write")).toBe(true);
    expect(hasPermission(Role.OWNER, "invoices:write")).toBe(true);
    expect(hasPermission(Role.OWNER, "schedule:write")).toBe(true);
  });

  it("restricts crew tech from write actions", () => {
    expect(hasPermission(Role.CREW_TECH, "schedule:read")).toBe(true);
    expect(hasPermission(Role.CREW_TECH, "schedule:write")).toBe(false);
    expect(hasPermission(Role.CREW_TECH, "customers:write")).toBe(false);
  });

  it("checks role allow-lists", () => {
    expect(isAllowedRole(Role.DISPATCHER, [Role.OWNER, Role.DISPATCHER])).toBe(
      true,
    );
    expect(isAllowedRole(Role.CUSTOMER, [Role.OWNER, Role.DISPATCHER])).toBe(
      false,
    );
  });
});
