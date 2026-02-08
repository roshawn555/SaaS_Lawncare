import { Role } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function uniqueOrganizationSlug(seed: string) {
  const base = toSlug(seed) || "lawncare-org";
  let candidate = base;
  let suffix = 1;

  while (true) {
    const exists = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function mapClerkOrgRoleToRole(clerkOrgRole: string | null | undefined): Role {
  if (!clerkOrgRole) {
    return Role.DISPATCHER;
  }

  if (clerkOrgRole.includes("admin")) {
    return Role.OWNER;
  }

  return Role.DISPATCHER;
}

async function ensureUser(clerkUserId: string) {
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses.at(0)?.emailAddress;

  assert(email, "No email found for this Clerk user.", 400);

  return prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
    },
    create: {
      clerkUserId,
      email,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
    },
  });
}

async function ensureOrganization(clerkOrgId: string) {
  const existing = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    return existing;
  }

  const slug = await uniqueOrganizationSlug(clerkOrgId);

  return prisma.organization.create({
    data: {
      clerkOrgId,
      name: `Organization ${clerkOrgId.slice(-8)}`,
      slug,
    },
    select: { id: true, name: true, slug: true },
  });
}

async function ensureMembership(
  organizationId: string,
  userId: string,
  clerkOrgRole: string | null | undefined,
) {
  return prisma.orgMember.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    update: {},
    create: {
      organizationId,
      userId,
      role: mapClerkOrgRoleToRole(clerkOrgRole),
    },
    select: {
      role: true,
    },
  });
}

export async function requireAuthContext() {
  const { userId: clerkUserId, orgId: clerkOrgId, orgRole: clerkOrgRole } =
    await auth();

  assert(clerkUserId, "You must be signed in.", 401);
  assert(
    clerkOrgId,
    "An active Clerk organization is required. Select an organization and try again.",
    400,
  );

  const user = await ensureUser(clerkUserId);
  const organization = await ensureOrganization(clerkOrgId);
  const membership = await ensureMembership(
    organization.id,
    user.id,
    clerkOrgRole ?? null,
  );

  return {
    clerkUserId,
    clerkOrgId,
    userId: user.id,
    email: user.email,
    organizationId: organization.id,
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
