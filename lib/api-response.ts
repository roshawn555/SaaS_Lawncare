import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError } from "@/lib/auth";

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: PaginationMeta;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

const ERROR_CODE_BY_STATUS: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  500: "INTERNAL_SERVER_ERROR",
};

function codeFromStatus(status: number) {
  return ERROR_CODE_BY_STATUS[status] ?? "ERROR";
}

export function paginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function successResponse<T>(data: T, meta?: PaginationMeta) {
  return NextResponse.json<ApiSuccess<T>>({
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function createdResponse<T>(data: T) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      ok: true,
      data,
    },
    { status: 201 },
  );
}

export function errorResponse(
  status: number,
  message: string,
  details?: unknown,
  explicitCode?: string,
) {
  const payload: ApiFailure = {
    ok: false,
    error: {
      code: explicitCode ?? codeFromStatus(status),
      message,
      ...(details ? { details } : {}),
    },
  };

  return NextResponse.json(payload, { status });
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthorizationError) {
    return errorResponse(error.status, error.message);
  }

  if (error instanceof ZodError) {
    return errorResponse(400, "Validation failed.", error.issues);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorResponse(409, "A unique constraint was violated.");
    }

    return errorResponse(400, "Database request failed.");
  }

  return errorResponse(500, fallbackMessage);
}
