import { notFound, redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    notFound();
  }

  return user;
}