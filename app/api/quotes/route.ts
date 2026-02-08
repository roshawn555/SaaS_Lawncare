import { Prisma } from "@prisma/client";

import {
  createdResponse,
  errorResponse,
  handleApiError,
  paginationMeta,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteCreateSchema, quoteListQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requirePermission("quotes:read");
    const query = quoteListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const skip = (query.page - 1) * query.pageSize;

    const where: Prisma.QuoteWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                customer: {
                  firstName: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                customer: {
                  lastName: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [quotes, total] = await prisma.$transaction([
      prisma.quote.findMany({
        where,
        include: {
          customer: true,
          property: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      prisma.quote.count({ where }),
    ]);

    return successResponse(quotes, paginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleApiError(error, "Unable to fetch quotes.");
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
      return errorResponse(404, "Customer does not belong to this organization.");
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
        return errorResponse(
          404,
          "Property does not belong to this customer or organization.",
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

    return createdResponse(quote);
  } catch (error) {
    return handleApiError(error, "Unable to create quote.");
  }
}
