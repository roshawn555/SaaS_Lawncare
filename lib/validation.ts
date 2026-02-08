import { z } from "zod";

const moneySchema = z.coerce.number().finite().nonnegative();
const quantitySchema = z.coerce.number().finite().positive();

export const customerCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const customerUpdateSchema = customerCreateSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required.",
  });

export const quoteItemSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  quantity: quantitySchema,
  unitPrice: moneySchema,
});

export const quoteCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  propertyId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(255),
  notes: z.string().trim().max(5000).optional(),
  tax: moneySchema.optional().default(0),
  items: z.array(quoteItemSchema).min(1),
});

export const visitsQuerySchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine((value) => value.start <= value.end, {
    message: "start must be before end",
    path: ["start"],
  });

export const invoiceItemSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  quantity: quantitySchema,
  unitPrice: moneySchema,
});

export const invoiceCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  propertyId: z.string().trim().min(1).optional(),
  jobId: z.string().trim().min(1).optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().max(5000).optional(),
  tax: moneySchema.optional().default(0),
  items: z.array(invoiceItemSchema).min(1),
});
