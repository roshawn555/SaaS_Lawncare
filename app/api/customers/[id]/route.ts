import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
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
      return errorResponse(404, "Customer not found.");
    }

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error, "Unable to fetch customer.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { organizationId } = await requirePermission("customers:write");
    const { id } = await context.params;
    const payload = customerUpdateSchema.parse(await request.json());

    const result = await prisma.customer.updateMany({
      where: { id, organizationId },
      data: payload,
    });

    if (result.count === 0) {
      return errorResponse(404, "Customer not found.");
    }

    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: { properties: true },
    });

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error, "Unable to update customer.");
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
      return errorResponse(404, "Customer not found.");
    }

    return successResponse({ id });
  } catch (error) {
    return handleApiError(error, "Unable to delete customer.");
  }
}
