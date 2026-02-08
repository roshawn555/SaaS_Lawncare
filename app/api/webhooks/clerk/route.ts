import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { prisma } from "@/lib/prisma";

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserPayload = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
};

type ClerkOrganizationPayload = {
  id: string;
  name: string;
  slug: string | null;
};

type ClerkMembershipPayload = {
  role: string | null;
  organization: {
    id: string;
    name?: string | null;
    slug?: string | null;
  };
  public_user_data: {
    user_id: string;
    first_name?: string | null;
    last_name?: string | null;
    identifier?: string | null;
  };
};

type ClerkEvent =
  | {
      type: "user.created" | "user.updated";
      data: ClerkUserPayload;
    }
  | {
      type: "organization.created" | "organization.updated" | "organization.deleted";
      data: ClerkOrganizationPayload;
    }
  | {
      type:
        | "organizationMembership.created"
        | "organizationMembership.updated"
        | "organizationMembership.deleted";
      data: ClerkMembershipPayload;
    };

function mapClerkRoleToRole(role: string | null | undefined) {
  if (!role) {
    return Role.DISPATCHER;
  }

  if (role.includes("admin")) {
    return Role.OWNER;
  }

  return Role.DISPATCHER;
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

function emailFromClerkUser(data: ClerkUserPayload) {
  const primary = data.email_addresses.find(
    (email) => email.id === data.primary_email_address_id,
  );

  return primary?.email_address ?? data.email_addresses.at(0)?.email_address ?? null;
}

async function ensureOrganization(
  clerkOrgId: string,
  name?: string | null,
  slug?: string | null,
) {
  const existing = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (existing) {
    await prisma.organization.update({
      where: { clerkOrgId },
      data: {
        ...(name ? { name } : {}),
      },
    });

    return existing;
  }

  const uniqueSlug = await uniqueOrganizationSlug(slug ?? clerkOrgId);

  const created = await prisma.organization.create({
    data: {
      clerkOrgId,
      name: name ?? `Organization ${clerkOrgId.slice(-8)}`,
      slug: uniqueSlug,
    },
    select: { id: true },
  });

  return created;
}

async function upsertUser(data: {
  clerkUserId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const email = data.email ?? `${data.clerkUserId}@placeholder.clerk`;

  return prisma.user.upsert({
    where: { clerkUserId: data.clerkUserId },
    update: {
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      email,
    },
    create: {
      clerkUserId: data.clerkUserId,
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      email,
    },
  });
}

async function verifyWebhook(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!secret) {
    throw new Error("CLERK_WEBHOOK_SIGNING_SECRET is not configured.");
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing Svix headers.");
  }

  const payload = await request.text();
  const webhook = new Webhook(secret);

  return webhook.verify(payload, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  }) as ClerkEvent;
}

export async function POST(request: Request) {
  try {
    const event = await verifyWebhook(request);

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const email = emailFromClerkUser(event.data);

        await upsertUser({
          clerkUserId: event.data.id,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          email,
        });
        break;
      }
      case "organization.created":
      case "organization.updated": {
        await ensureOrganization(event.data.id, event.data.name, event.data.slug);
        break;
      }
      case "organization.deleted": {
        await prisma.organization.updateMany({
          where: { clerkOrgId: event.data.id },
          data: { clerkOrgId: null },
        });
        break;
      }
      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const organization = await ensureOrganization(
          event.data.organization.id,
          event.data.organization.name,
          event.data.organization.slug,
        );
        const user = await upsertUser({
          clerkUserId: event.data.public_user_data.user_id,
          firstName: event.data.public_user_data.first_name,
          lastName: event.data.public_user_data.last_name,
          email: event.data.public_user_data.identifier,
        });

        await prisma.orgMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: user.id,
            },
          },
          update: {
            role: mapClerkRoleToRole(event.data.role),
          },
          create: {
            organizationId: organization.id,
            userId: user.id,
            role: mapClerkRoleToRole(event.data.role),
          },
        });
        break;
      }
      case "organizationMembership.deleted": {
        const user = await prisma.user.findUnique({
          where: {
            clerkUserId: event.data.public_user_data.user_id,
          },
          select: { id: true },
        });
        const organization = await prisma.organization.findUnique({
          where: {
            clerkOrgId: event.data.organization.id,
          },
          select: { id: true },
        });

        if (user && organization) {
          await prisma.orgMember.deleteMany({
            where: {
              organizationId: organization.id,
              userId: user.id,
            },
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid webhook request.",
      },
      { status: 400 },
    );
  }
}
