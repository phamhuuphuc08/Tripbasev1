import { prisma } from "@/server/db/client";

// Comment itself has no create/read UI yet (that's M06/M07 — checklist and
// collaboration aren't built) — this only backs the profile card's
// contribution count, which is honestly 0 for everyone until those ship.
export function countCommentsByUser(userId: string) {
  return prisma.comment.count({ where: { userId } });
}
