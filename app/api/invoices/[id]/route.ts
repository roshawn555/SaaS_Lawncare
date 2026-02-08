import {
  errorResponse,
  handleApiError,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
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
      return errorResponse(404, "Invoice not found.");
    }

    return successResponse(invoice);
  } catch (error) {
    return handleApiError(error, "Unable to fetch invoice.");
  }
}
