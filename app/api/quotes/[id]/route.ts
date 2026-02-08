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
      return errorResponse(404, "Quote not found.");
    }

    return successResponse(quote);
  } catch (error) {
    return handleApiError(error, "Unable to fetch quote.");
  }
}
