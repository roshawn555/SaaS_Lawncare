import { Prisma } from "@prisma/client";

import {
  createdResponse,
  handleApiError,
  paginationMeta,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerCreateSchema, customerListQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requirePermission("customers:read");
    const query = customerListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const skip = (query.page - 1) * query.pageSize;

    const where: Prisma.CustomerWhereInput = {
      organizationId,
      ...(query.search
        ? {
            OR: [
              {
                firstName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        include: {
          properties: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return successResponse(
      customers,
      paginationMeta(query.page, query.pageSize, total),
    );
  } catch (error) {
    return handleApiError(error, "Unable to fetch customers.");
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
      include: {
        properties: true,
      },
    });

    return createdResponse(customer);
  } catch (error) {
    return handleApiError(error, "Unable to create customer.");
  }
}
