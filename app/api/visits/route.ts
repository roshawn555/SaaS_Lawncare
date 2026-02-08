import { Prisma } from "@prisma/client";

import {
  handleApiError,
  paginationMeta,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visitsQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requirePermission("schedule:read");
    const query = visitsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const skip = (query.page - 1) * query.pageSize;

    const where: Prisma.VisitWhereInput = {
      organizationId,
      scheduledFor: {
        gte: query.start,
        lte: query.end,
      },
      ...(query.status ? { status: query.status } : {}),
    };

    const [visits, total] = await prisma.$transaction([
      prisma.visit.findMany({
        where,
        include: {
          job: {
            include: {
              customer: true,
            },
          },
          property: true,
        },
        orderBy: {
          scheduledFor: "asc",
        },
        skip,
        take: query.pageSize,
      }),
      prisma.visit.count({ where }),
    ]);

    return successResponse(
      visits,
      paginationMeta(query.page, query.pageSize, total),
    );
  } catch (error) {
    return handleApiError(error, "Unable to fetch visits.");
  }
}
