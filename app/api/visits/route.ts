import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { AuthorizationError, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visitsQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requirePermission("schedule:read");
    const { searchParams } = new URL(request.url);
    const payload = visitsQuerySchema.parse({
      start: searchParams.get("start"),
      end: searchParams.get("end"),
    });

    const visits = await prisma.visit.findMany({
      where: {
        organizationId,
        scheduledFor: {
          gte: payload.start,
          lte: payload.end,
        },
      },
      include: {
        job: true,
        property: true,
      },
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return NextResponse.json({ data: visits });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid visit range query.", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to fetch visits." }, { status: 500 });
  }
}
