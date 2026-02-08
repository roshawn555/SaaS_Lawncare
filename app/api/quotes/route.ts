import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { AuthorizationError, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { organizationId } = await requirePermission("quotes:read");

    const quotes = await prisma.quote.findMany({
      where: { organizationId },
      include: {
        customer: true,
        property: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: quotes });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to fetch quotes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requirePermission("quotes:write");
    const payload = quoteCreateSchema.parse(await request.json());

    const customer = await prisma.customer.findFirst({
      where: {
        id: payload.customerId,
        organizationId,
      },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer does not belong to this organization." },
        { status: 404 },
      );
    }

    if (payload.propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: payload.propertyId,
          organizationId,
          customerId: payload.customerId,
        },
        select: { id: true },
      });

      if (!property) {
        return NextResponse.json(
          { error: "Property does not belong to this customer or organization." },
          { status: 404 },
        );
      }
    }

    const items = payload.items.map((item) => {
      const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));

      return {
        ...item,
        lineTotal,
      };
    });

    const subtotal = Number(
      items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );
    const tax = Number(payload.tax.toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const quote = await prisma.quote.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        propertyId: payload.propertyId,
        title: payload.title,
        notes: payload.notes,
        subtotal,
        tax,
        total,
        items: {
          create: items.map((item) => ({
            organizationId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        customer: true,
        property: true,
        items: true,
      },
    });

    return NextResponse.json({ data: quote }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid quote payload.", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to create quote." }, { status: 500 });
  }
}
