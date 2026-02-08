import { NextResponse } from "next/server";

import { AuthorizationError, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { organizationId } = await requirePermission("invoices:read");
    const { id } = await context.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        customer: true,
        property: true,
        job: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json({ data: invoice });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to fetch invoice." }, { status: 500 });
  }
}
