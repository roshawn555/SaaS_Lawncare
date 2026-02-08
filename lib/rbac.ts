import { Role } from "@prisma/client";

export const PERMISSIONS = [
  "dashboard:view",
  "customers:read",
  "customers:write",
  "quotes:read",
  "quotes:write",
  "schedule:read",
  "schedule:write",
  "invoices:read",
  "invoices:write",
  "settings:read",
  "settings:write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const allPermissions = new Set<Permission>(PERMISSIONS);

const rolePermissionMap: Record<Role, Set<Permission>> = {
  OWNER: new Set(allPermissions),
  DISPATCHER: new Set([
    "dashboard:view",
    "customers:read",
    "customers:write",
    "quotes:read",
    "quotes:write",
    "schedule:read",
    "schedule:write",
    "invoices:read",
    "invoices:write",
    "settings:read",
  ]),
  CREW_LEAD: new Set([
    "dashboard:view",
    "customers:read",
    "quotes:read",
    "schedule:read",
    "schedule:write",
    "invoices:read",
  ]),
  CREW_TECH: new Set([
    "dashboard:view",
    "customers:read",
    "quotes:read",
    "schedule:read",
  ]),
  CUSTOMER: new Set(["quotes:read", "invoices:read"]),
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissionMap[role].has(permission);
}

export function isAllowedRole(role: Role, allowedRoles: Role[]) {
  return allowedRoles.includes(role);
}
