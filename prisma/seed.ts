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

async function seedLocationTag(
  ownerId: string,
  data: {
    title: string;
    category:
      | "RESTAURANT"
      | "ATTRACTION"
      | "HOTEL"
      | "CAR_RENTAL"
      | "TRANSPORT"
      | "SIM";
    content: string;
    citeTrustScore?: number;
    // Approximate real-world coordinates so Map Planner (M03) has
    // something to plot out of the box — not surveyed, just close enough
    // for a demo pin.
    latitude?: number;
    longitude?: number;
  },
) {
  const payload = {
    category: data.category,
    content: data.content,
    citeTrustScore: data.citeTrustScore ?? 0,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
  };

  const existing = await prisma.locationTag.findFirst({
    where: { title: data.title },
  });
  if (existing) {
    return prisma.locationTag.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.locationTag.create({
    data: { ownerId, title: data.title, ...payload },
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

  await seedLocationTag(linh.id, {
    title: "Bánh Xèo Bà Dưỡng",
    category: "RESTAURANT",
    content: "Quán bánh xèo lâu năm ở Đà Nẵng, ăn kèm rau sống rất ngon.",
    citeTrustScore: 14,
    latitude: 16.047079,
    longitude: 108.20623,
  });
  await seedLocationTag(demo.id, {
    title: "Phở Thìn Lò Đúc",
    category: "RESTAURANT",
    content: "Phở bò tái lăn nổi tiếng Hà Nội.",
    citeTrustScore: 3,
    latitude: 21.019814,
    longitude: 105.855747,
  });
  await seedLocationTag(linh.id, {
    title: "Phố cổ Hội An",
    category: "ATTRACTION",
    content: "Đèn lồng, phố đi bộ, đẹp nhất lúc chập tối.",
    citeTrustScore: 22,
    latitude: 15.876789,
    longitude: 108.326675,
  });
  await seedLocationTag(demo.id, {
    title: "Vịnh Hạ Long",
    category: "ATTRACTION",
    content: "Đi tour tàu 1 ngày hoặc ngủ đêm trên vịnh.",
    latitude: 20.910998,
    longitude: 107.183929,
  });
  await seedLocationTag(linh.id, {
    title: "Muong Thanh Grand Đà Nẵng",
    category: "HOTEL",
    content: "View biển, gần cầu Rồng, giá tầm trung.",
    citeTrustScore: 5,
    latitude: 16.054407,
    longitude: 108.246898,
  });
  await seedLocationTag(demo.id, {
    title: "Thuê xe máy Đà Lạt - Easy Rider",
    category: "CAR_RENTAL",
    content: "Xe số/tay ga, giao tận nơi, có bảo hiểm.",
    latitude: 11.940419,
    longitude: 108.458313,
  });
  await seedLocationTag(linh.id, {
    title: "Xe khách Phương Trang",
    category: "TRANSPORT",
    content: "Tuyến Sài Gòn - Đà Lạt/Nha Trang, có giường nằm.",
    citeTrustScore: 8,
    latitude: 11.947778,
    longitude: 108.441944,
  });
  await seedLocationTag(demo.id, {
    title: "eSIM Viettel Du Lịch",
    category: "SIM",
    content: "Kích hoạt ngay tại sân bay, 4G tốc độ cao.",
    latitude: 10.818799,
    longitude: 106.659538,
  });

  console.log("Seed xong: 2 user, 5 trip public, 8 location tag.");
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
