import { Role } from "@prisma/client";

import { createPrismaClient } from "../lib/prisma-client";

const prisma = createPrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "green-acres-lawncare" },
    update: {
      name: "Green Acres Lawncare",
    },
    create: {
      name: "Green Acres Lawncare",
      slug: "green-acres-lawncare",
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { clerkUserId: "seed_owner_clerk" },
    update: {
      email: "owner@greenacres.test",
      firstName: "Olivia",
      lastName: "Owner",
    },
    create: {
      clerkUserId: "seed_owner_clerk",
      email: "owner@greenacres.test",
      firstName: "Olivia",
      lastName: "Owner",
    },
  });

  await prisma.orgMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: ownerUser.id,
      },
    },
    update: {
      role: Role.OWNER,
    },
    create: {
      organizationId: organization.id,
      userId: ownerUser.id,
      role: Role.OWNER,
    },
  });

  let sampleCustomer = await prisma.customer.findFirst({
    where: {
      organizationId: organization.id,
      email: "sarah.williams@example.com",
    },
  });

  if (!sampleCustomer) {
    sampleCustomer = await prisma.customer.create({
      data: {
        organizationId: organization.id,
        firstName: "Sarah",
        lastName: "Williams",
        email: "sarah.williams@example.com",
        phone: "555-0101",
        notes: "Weekly mow and edging service.",
      },
    });
  }

  let sampleProperty = await prisma.property.findFirst({
    where: {
      organizationId: organization.id,
      customerId: sampleCustomer.id,
      addressLine1: "123 Elm Street",
    },
  });

  if (!sampleProperty) {
    sampleProperty = await prisma.property.create({
      data: {
        organizationId: organization.id,
        customerId: sampleCustomer.id,
        name: "Primary Residence",
        addressLine1: "123 Elm Street",
        city: "Nashville",
        state: "TN",
        postalCode: "37209",
      },
    });
  }

  const existingQuote = await prisma.quote.findFirst({
    where: {
      organizationId: organization.id,
      customerId: sampleCustomer.id,
      title: "Spring Cleanup Package",
    },
    include: {
      items: true,
    },
  });

  if (!existingQuote) {
    await prisma.quote.create({
      data: {
        organizationId: organization.id,
        customerId: sampleCustomer.id,
        propertyId: sampleProperty.id,
        title: "Spring Cleanup Package",
        notes: "Includes leaf removal, mulch refresh, and first mow.",
        subtotal: 240,
        tax: 0,
        total: 240,
        items: {
          create: [
            {
              organizationId: organization.id,
              name: "Leaf Cleanup",
              quantity: 1,
              unitPrice: 120,
              lineTotal: 120,
            },
            {
              organizationId: organization.id,
              name: "Mulch Refresh",
              quantity: 1,
              unitPrice: 80,
              lineTotal: 80,
            },
            {
              organizationId: organization.id,
              name: "First Lawn Mow",
              quantity: 1,
              unitPrice: 40,
              lineTotal: 40,
            },
          ],
        },
      },
    });
  }

  console.info("Seed completed.");
  console.info(`Organization: ${organization.name} (${organization.id})`);
  console.info(`Owner user: ${ownerUser.email} (${ownerUser.id})`);
  console.info(`Customer: ${sampleCustomer.firstName} ${sampleCustomer.lastName}`);
}

main()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
