import { beforeEach, vi } from "vitest";

const { requirePermission, prismaMock, AuthorizationError } = vi.hoisted(() => {
  const requirePermission = vi.fn();

  class AuthorizationError extends Error {
    status: number;

    constructor(message: string, status = 403) {
      super(message);
      this.status = status;
    }
  }

  const prismaMock = {
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    property: {
      findFirst: vi.fn(),
    },
    quote: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    job: {
      findFirst: vi.fn(),
    },
    visit: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return { requirePermission, prismaMock, AuthorizationError };
});

vi.mock("@/lib/auth", () => ({
  requirePermission,
  AuthorizationError,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { GET as getCustomers, POST as postCustomer } from "@/app/api/customers/route";
import { GET as getInvoiceById } from "@/app/api/invoices/[id]/route";
import { POST as postInvoice } from "@/app/api/invoices/route";
import { GET as getQuoteById } from "@/app/api/quotes/[id]/route";
import { POST as postQuote } from "@/app/api/quotes/route";
import { GET as getVisits } from "@/app/api/visits/route";

describe("api smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePermission.mockResolvedValue({
      organizationId: "org_db_1",
      role: "OWNER",
    });

    prismaMock.$transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations as Promise<unknown>[]),
    );
  });

  it("lists customers with pagination metadata", async () => {
    prismaMock.customer.findMany.mockResolvedValue([
      {
        id: "cust_1",
        firstName: "Sam",
        lastName: "Green",
        email: "sam@example.com",
        phone: null,
        notes: null,
        properties: [],
      },
    ]);
    prismaMock.customer.count.mockResolvedValue(1);

    const response = await getCustomers(
      new Request("http://localhost/api/customers?page=1&pageSize=10"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.meta.total).toBe(1);
  });

  it("creates a customer", async () => {
    prismaMock.customer.create.mockResolvedValue({
      id: "cust_2",
      firstName: "Alex",
      lastName: "Stone",
      email: "alex@example.com",
      phone: null,
      notes: null,
      properties: [],
    });

    const response = await postCustomer(
      new Request("http://localhost/api/customers", {
        method: "POST",
        body: JSON.stringify({
          firstName: "Alex",
          lastName: "Stone",
          email: "alex@example.com",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.id).toBe("cust_2");
  });

  it("creates and fetches quote detail", async () => {
    prismaMock.customer.findFirst.mockResolvedValue({ id: "cust_1" });
    prismaMock.quote.create.mockResolvedValue({
      id: "quote_1",
      title: "Weekly Mow",
      status: "DRAFT",
      subtotal: 45,
      tax: 0,
      total: 45,
      customer: { id: "cust_1", firstName: "Sam", lastName: "Green" },
      property: null,
      items: [],
    });

    const createResponse = await postQuote(
      new Request("http://localhost/api/quotes", {
        method: "POST",
        body: JSON.stringify({
          customerId: "cust_1",
          title: "Weekly Mow",
          items: [{ name: "Mow", quantity: 1, unitPrice: 45 }],
        }),
      }),
    );
    const createPayload = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createPayload.ok).toBe(true);
    expect(createPayload.data.id).toBe("quote_1");

    prismaMock.quote.findFirst.mockResolvedValue({
      id: "quote_1",
      title: "Weekly Mow",
      status: "DRAFT",
      subtotal: 45,
      tax: 0,
      total: 45,
      notes: null,
      customer: { id: "cust_1", firstName: "Sam", lastName: "Green" },
      property: null,
      items: [],
    });

    const detailResponse = await getQuoteById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "quote_1" }),
    });
    const detailPayload = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailPayload.ok).toBe(true);
    expect(detailPayload.data.id).toBe("quote_1");
  });

  it("creates and fetches invoice detail", async () => {
    prismaMock.customer.findFirst.mockResolvedValue({ id: "cust_1" });
    prismaMock.invoice.create.mockResolvedValue({
      id: "inv_1",
      status: "DRAFT",
      issueDate: new Date("2026-02-08"),
      dueDate: null,
      total: 55,
      balanceDue: 55,
      notes: null,
      customer: { id: "cust_1", firstName: "Sam", lastName: "Green" },
      property: null,
      job: null,
      items: [],
      payments: [],
    });

    const createResponse = await postInvoice(
      new Request("http://localhost/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          customerId: "cust_1",
          items: [{ name: "Service", quantity: 1, unitPrice: 55 }],
        }),
      }),
    );
    const createPayload = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createPayload.ok).toBe(true);
    expect(createPayload.data.id).toBe("inv_1");

    prismaMock.invoice.findFirst.mockResolvedValue({
      id: "inv_1",
      status: "DRAFT",
      issueDate: new Date("2026-02-08"),
      dueDate: null,
      total: 55,
      balanceDue: 55,
      notes: null,
      customer: { id: "cust_1", firstName: "Sam", lastName: "Green" },
      property: null,
      job: null,
      items: [],
      payments: [],
    });

    const detailResponse = await getInvoiceById(new Request("http://localhost"), {
      params: Promise.resolve({ id: "inv_1" }),
    });
    const detailPayload = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailPayload.ok).toBe(true);
    expect(detailPayload.data.id).toBe("inv_1");
  });

  it("lists visits for a date range", async () => {
    prismaMock.visit.findMany.mockResolvedValue([
      {
        id: "visit_1",
        status: "SCHEDULED",
        scheduledFor: new Date("2026-02-10T15:00:00.000Z"),
        notes: null,
        job: {
          title: "Weekly Mow",
          customer: { firstName: "Sam", lastName: "Green" },
        },
        property: {
          addressLine1: "123 Elm Street",
          city: "Nashville",
          state: "TN",
          postalCode: "37209",
        },
      },
    ]);
    prismaMock.visit.count.mockResolvedValue(1);

    const response = await getVisits(
      new Request(
        "http://localhost/api/visits?start=2026-02-01&end=2026-02-15&page=1&pageSize=20",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.meta.total).toBe(1);
  });
});
