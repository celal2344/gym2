import { z } from "zod";

export const bookingStatuses = ["reserved", "checked_in", "cancelled", "no_show"] as const;
export const bookingChannels = ["web", "mobile", "front_desk"] as const;

export const bookingCreateSchema = z.object({
  customerId: z.string().uuid(),
  slotId: z.string().uuid(),
  attendeeCount: z.number().int().min(1).max(10).default(1),
  channel: z.enum(bookingChannels).default("web"),
  externalPaymentReference: z.string().max(120).optional(),
});

export const bookingSchema = bookingCreateSchema.extend({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  status: z.enum(bookingStatuses),
  qrToken: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type BookingStatus = (typeof bookingStatuses)[number];
export type BookingChannel = (typeof bookingChannels)[number];
export type Booking = z.infer<typeof bookingSchema>;
