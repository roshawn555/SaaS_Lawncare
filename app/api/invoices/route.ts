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
import { invoiceCreateSchema, invoiceListQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requirePermission("invoices:read");
    const query = invoiceListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const skip = (query.page - 1) * query.pageSize;

    const where: Prisma.InvoiceWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
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
              {
                notes: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          property: true,
          job: true,
          items: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return successResponse(
      invoices,
      paginationMeta(query.page, query.pageSize, total),
    );
  } catch (error) {
    return handleApiError(error, "Unable to fetch invoices.");
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requirePermission("invoices:write");
    const payload = invoiceCreateSchema.parse(await request.json());

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

    if (payload.jobId) {
      const job = await prisma.job.findFirst({
        where: {
          id: payload.jobId,
          organizationId,
          customerId: payload.customerId,
        },
        select: { id: true },
      });

      if (!job) {
        return errorResponse(404, "Job does not belong to this customer or organization.");
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

    const issueDate = payload.issueDate ?? new Date();
    const balanceDue = total;

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        propertyId: payload.propertyId,
        jobId: payload.jobId,
        issueDate,
        dueDate: payload.dueDate,
        notes: payload.notes,
        subtotal,
        tax,
        total,
        amountPaid: 0,
        balanceDue,
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
        job: true,
        items: true,
        payments: true,
      },
    });

    return createdResponse(invoice);
  } catch (error) {
    return handleApiError(error, "Unable to create invoice.");
  }
}
