import "server-only";

export interface AdminAuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: Date;
}

export async function listAdminAuditLogs(): Promise<AdminAuditLogEntry[]> {
  // Audit persistence is not in the current Prisma schema.
  return [];
}