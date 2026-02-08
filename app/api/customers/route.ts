import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { AuthorizationError, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { organizationId } = await requirePermission("customers:read");

    const customers = await prisma.customer.findMany({
      where: { organizationId },
      include: {
        properties: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: customers });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to fetch customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requirePermission("customers:write");
    const payload = customerCreateSchema.parse(await request.json());

    const customer = await prisma.customer.create({
      data: {
        organizationId,
        ...payload,
      },
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid customer payload.", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to create customer." }, { status: 500 });
  }
}
