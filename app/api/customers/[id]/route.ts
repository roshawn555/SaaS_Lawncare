import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { AuthorizationError, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { organizationId } = await requirePermission("customers:read");
    const { id } = await context.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        properties: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to fetch customer." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { organizationId } = await requirePermission("customers:write");
    const { id } = await context.params;
    const payload = customerUpdateSchema.parse(await request.json());

    const customer = await prisma.customer.updateMany({
      where: { id, organizationId },
      data: payload,
    });

    if (customer.count === 0) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const updatedCustomer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: { properties: true },
    });

    return NextResponse.json({ data: updatedCustomer });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid customer update payload.", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to update customer." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { organizationId } = await requirePermission("customers:write");
    const { id } = await context.params;

    const result = await prisma.customer.deleteMany({
      where: {
        id,
        organizationId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to delete customer." }, { status: 500 });
  }
}
