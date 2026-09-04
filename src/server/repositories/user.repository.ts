import { prisma } from "@/server/db/client";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({ data });
}

export function updateUserProfile(
  id: string,
  data: {
    name: string;
    bio: string | null;
    travelStyle: string | null;
    budgetLevel: string | null;
    travelInterests: string[];
    image?: string;
  },
) {
  return prisma.user.update({ where: { id }, data });
}
