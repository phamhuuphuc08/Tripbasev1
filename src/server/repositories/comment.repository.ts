import { prisma } from "@/server/db/client";

// Backs the Creator Profile card's contribution count (src/server/services/
// creator-profile.service.ts) across every comment a user has made,
// regardless of target type.
export function countCommentsByUser(userId: string) {
  return prisma.comment.count({ where: { userId } });
}
