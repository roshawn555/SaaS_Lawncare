import { Role } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { hasPermission, isAllowedRole, Permission } from "@/lib/rbac";

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

function assert(value: unknown, message: string, status = 403): asserts value {
  if (!value) {
    throw new AuthorizationError(message, status);
  }
}

async function resolveOrganizationId(clerkOrgId: string | null) {
  if (clerkOrgId) {
    return clerkOrgId;
  }

  const requestHeaders = await headers();

  return (
    requestHeaders.get("x-organization-id") ??
    requestHeaders.get("x-org-id") ??
    null
  );
}

export async function requireAuthContext() {
  const { userId: clerkUserId, orgId } = await auth();
  const organizationId = await resolveOrganizationId(orgId);

  assert(clerkUserId, "You must be signed in.", 401);
  assert(
    organizationId,
    "Active organization is required. Pass x-organization-id if needed.",
    400,
  );

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, email: true },
  });

  assert(
    dbUser,
    "No application user record found for this Clerk user.",
    403,
  );

  const membership = await prisma.orgMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: dbUser.id,
      },
    },
    select: {
      role: true,
    },
  });

  assert(membership, "You are not a member of this organization.", 403);

  return {
    clerkUserId,
    userId: dbUser.id,
    email: dbUser.email,
    organizationId,
    role: membership.role,
  };
}

export async function requireRole(allowedRoles: Role[]) {
  const context = await requireAuthContext();

  assert(
    isAllowedRole(context.role, allowedRoles),
    `Role ${context.role} cannot access this resource.`,
    403,
  );

  return context;
}

export async function requirePermission(permission: Permission) {
  const context = await requireAuthContext();

  assert(
    hasPermission(context.role, permission),
    `Role ${context.role} lacks permission ${permission}.`,
    403,
  );

  return context;
}
