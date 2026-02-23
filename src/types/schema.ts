import { z } from "zod";

// Ein Tenant ist eine Organisation. Ein User gehoert zu einer Organisation.
export const TenantSchema = z.object({
  id: z.string(), // Generierte ID (NICHT die uid des Users!)
  name: z.string(),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
});

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  tenantId: z.string(), // Verknuepfung zur Organisation
  role: z.enum(["owner", "editor"]),
});

export type Tenant = z.infer<typeof TenantSchema>;
export type User = z.infer<typeof UserSchema>;
