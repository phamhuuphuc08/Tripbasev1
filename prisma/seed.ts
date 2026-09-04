import "dotenv/config";
import { PlanStatus, PlanVisibility } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { prisma } from "../src/server/db/client";

/**
 * Dev seed data — a couple of demo users and a handful of PUBLIC trips
 * across different destinations, so the home page search
 * (src/server/services/marketplace.service.ts) has something real to
 * match against. Idempotent: safe to re-run.
 */

async function upsertDemoUser(email: string, name: string, password: string) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  });
}

async function seedPublicTrip(
  ownerId: string,
  data: {
    name: string;
    destination: string;
    startDate?: Date;
    endDate?: Date;
    status: PlanStatus;
    verifiedByAuthor?: boolean;
  },
) {
  const existing = await prisma.trip.findFirst({
    where: { ownerId, name: data.name },
  });
  if (existing) return existing;

  return prisma.trip.create({
    data: {
      ownerId,
      name: data.name,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      currency: "VND",
      visibility: PlanVisibility.PUBLIC,
      status: data.status,
      verifiedByAuthor: data.verifiedByAuthor ?? false,
    },
  });
}

async function main() {
  const demo = await upsertDemoUser(
    "demo@tripbase.vn",
    "TripBase Demo",
    "password123",
  );
  const linh = await upsertDemoUser(
    "linh@tripbase.vn",
    "Linh Creator",
    "password123",
  );

  await seedPublicTrip(demo.id, {
    name: "Seoul 5N4Đ cho gia đình có bé",
    destination: "Seoul, Hàn Quốc",
    startDate: new Date("2026-11-10"),
    endDate: new Date("2026-11-14"),
    status: PlanStatus.SCHEDULED,
  });

  await seedPublicTrip(linh.id, {
    name: "Đà Lạt 3N2Đ nhóm bạn 6 người",
    destination: "Đà Lạt, Việt Nam",
    startDate: new Date("2026-10-02"),
    endDate: new Date("2026-10-04"),
    status: PlanStatus.COMPLETED,
    verifiedByAuthor: true,
  });

  await seedPublicTrip(linh.id, {
    name: "Phú Quốc nghỉ dưỡng biển",
    destination: "Phú Quốc, Việt Nam",
    status: PlanStatus.IDEA,
  });

  await seedPublicTrip(demo.id, {
    name: "Hà Giang phượt xe máy 4 ngày",
    destination: "Hà Giang, Việt Nam",
    startDate: new Date("2026-12-01"),
    endDate: new Date("2026-12-04"),
    status: PlanStatus.SCHEDULED,
  });

  await seedPublicTrip(linh.id, {
    name: "Tokyo mùa hoa anh đào",
    destination: "Tokyo, Nhật Bản",
    status: PlanStatus.COMPLETED,
    verifiedByAuthor: true,
  });

  console.log("Seed xong: 2 user, 5 trip public.");
  console.log("Đăng nhập demo: demo@tripbase.vn / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
