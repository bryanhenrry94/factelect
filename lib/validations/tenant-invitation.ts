import { z } from "zod";

export const TenantInvitationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  email: z.string().email(),
  token: z.string(),
  createdAt: z.coerce.date(),
});

export const createTenantInvitationSchema = TenantInvitationSchema.omit({
  id: true,
  createdAt: true,
});

export const updateTenantInvitationSchema = TenantInvitationSchema.partial();

export type CreateTenantInvitation = z.infer<
  typeof createTenantInvitationSchema
>;
export type UpdateTenantInvitation = z.infer<
  typeof updateTenantInvitationSchema
>;
export type TenantInvitation = z.infer<typeof TenantInvitationSchema>;
