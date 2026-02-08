import { InvoiceStatus, QuoteStatus, VisitStatus } from "@prisma/client";

import {
  customerCreateSchema,
  customerListQuerySchema,
  invoiceCreateSchema,
  invoiceListQuerySchema,
  quoteCreateSchema,
  quoteListQuerySchema,
  visitsQuerySchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("validates customer create payload", () => {
    const payload = customerCreateSchema.parse({
      firstName: "Sam",
      lastName: "Green",
      email: "sam@example.com",
      phone: "555-1000",
    });

    expect(payload.firstName).toBe("Sam");
    expect(payload.email).toBe("sam@example.com");
  });

  it("applies list query defaults", () => {
    const query = customerListQuerySchema.parse({});

    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(20);
  });

  it("validates quote create payload", () => {
    const payload = quoteCreateSchema.parse({
      customerId: "cust_1",
      title: "Weekly Service",
      items: [{ name: "Mowing", quantity: 1, unitPrice: 45 }],
    });

    expect(payload.title).toBe("Weekly Service");
    expect(payload.items).toHaveLength(1);
    expect(payload.tax).toBe(0);
  });

  it("validates quote list filters", () => {
    const query = quoteListQuerySchema.parse({
      page: "2",
      pageSize: "15",
      status: QuoteStatus.SENT,
    });

    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(15);
    expect(query.status).toBe(QuoteStatus.SENT);
  });

  it("validates invoice create payload", () => {
    const payload = invoiceCreateSchema.parse({
      customerId: "cust_1",
      items: [{ name: "Service", quantity: 2, unitPrice: 60 }],
      dueDate: "2026-02-20",
    });

    expect(payload.customerId).toBe("cust_1");
    expect(payload.items[0]?.quantity).toBe(2);
  });

  it("validates invoice list filters", () => {
    const query = invoiceListQuerySchema.parse({
      status: InvoiceStatus.OVERDUE,
      page: "3",
    });

    expect(query.status).toBe(InvoiceStatus.OVERDUE);
    expect(query.page).toBe(3);
  });

  it("validates schedule range queries", () => {
    const query = visitsQuerySchema.parse({
      start: "2026-02-01",
      end: "2026-02-07",
      status: VisitStatus.SCHEDULED,
    });

    expect(query.status).toBe(VisitStatus.SCHEDULED);
    expect(query.start <= query.end).toBe(true);
  });
});
