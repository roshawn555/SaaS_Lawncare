import { NextResponse } from "next/server";

import { AuthorizationError, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { organizationId } = await requirePermission("quotes:read");
    const { id } = await context.params;

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        customer: true,
        property: true,
        items: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    return NextResponse.json({ data: quote });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to fetch quote." }, { status: 500 });
  }
}
