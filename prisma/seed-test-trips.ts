import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Thiếu DATABASE_URL trong file .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const trips = [
  {
    name: "Khám phá Vạn Lý Trường Thành",
    destination: "Bắc Kinh, Trung Quốc",
    startDate: new Date("2026-12-10"),
    endDate: new Date("2026-12-13"),
    travelerCount: 2,
    budgetTarget: 18000000,
    currency: "VND",
    coverImageUrl: "/uploads/upload_image/van-ly-truong-thanh.jpg",
    itinerary: [
      {
        day: 1,
        sortOrder: 1,
        title: "Đến Bắc Kinh và nhận phòng",
      },
      {
        day: 1,
        sortOrder: 2,
        title: "Dạo phố Vương Phủ Tỉnh",
      },
      {
        day: 2,
        sortOrder: 1,
        title: "Tham quan Vạn Lý Trường Thành",
      },
      {
        day: 2,
        sortOrder: 2,
        title: "Tham quan khu vực Mộ Điền Dục",
      },
      {
        day: 3,
        sortOrder: 1,
        title: "Tham quan Tử Cấm Thành",
      },
      {
        day: 3,
        sortOrder: 2,
        title: "Quảng trường Thiên An Môn",
      },
      {
        day: 4,
        sortOrder: 1,
        title: "Mua sắm và trở về",
      },
    ],
  },
  {
    name: "Du lịch Phượng Hoàng Cổ Trấn",
    destination: "Hồ Nam, Trung Quốc",
    startDate: new Date("2027-01-15"),
    endDate: new Date("2027-01-18"),
    travelerCount: 2,
    budgetTarget: 16000000,
    currency: "VND",
    coverImageUrl: "/uploads/upload_image/phuong-hoang-co-tran.jpg",
    itinerary: [
      {
        day: 1,
        sortOrder: 1,
        title: "Đến Phượng Hoàng Cổ Trấn",
      },
      {
        day: 1,
        sortOrder: 2,
        title: "Dạo phố cổ buổi tối",
      },
      {
        day: 2,
        sortOrder: 1,
        title: "Tham quan cầu Hồng Kiều",
      },
      {
        day: 2,
        sortOrder: 2,
        title: "Đi thuyền trên sông Đà Giang",
      },
      {
        day: 3,
        sortOrder: 1,
        title: "Khám phá khu phố cổ",
      },
      {
        day: 3,
        sortOrder: 2,
        title: "Thưởng thức ẩm thực địa phương",
      },
      {
        day: 4,
        sortOrder: 1,
        title: "Trả phòng và trở về",
      },
    ],
  },
  {
    name: "Hành trình Núi Phú Sĩ",
    destination: "Yamanashi, Nhật Bản",
    startDate: new Date("2027-03-20"),
    endDate: new Date("2027-03-23"),
    travelerCount: 2,
    budgetTarget: 30000000,
    currency: "VND",
    coverImageUrl: "/uploads/upload_image/nui-phu-si.jpg",
    itinerary: [
      {
        day: 1,
        sortOrder: 1,
        title: "Đến khu vực Yamanashi",
      },
      {
        day: 1,
        sortOrder: 2,
        title: "Nhận phòng và nghỉ ngơi",
      },
      {
        day: 2,
        sortOrder: 1,
        title: "Tham quan Núi Phú Sĩ",
      },
      {
        day: 2,
        sortOrder: 2,
        title: "Khám phá hồ Kawaguchi",
      },
      {
        day: 3,
        sortOrder: 1,
        title: "Tham quan Oshino Hakkai",
      },
      {
        day: 3,
        sortOrder: 2,
        title: "Trải nghiệm onsen",
      },
      {
        day: 4,
        sortOrder: 1,
        title: "Trở về Tokyo",
      },
    ],
  },
  {
    name: "Khám phá Tokyo",
    destination: "Tokyo, Nhật Bản",
    startDate: new Date("2027-04-10"),
    endDate: new Date("2027-04-14"),
    travelerCount: 2,
    budgetTarget: 35000000,
    currency: "VND",
    coverImageUrl: "/uploads/upload_image/thap-tokyo-tower.jpg",
    itinerary: [
      {
        day: 1,
        sortOrder: 1,
        title: "Đến Tokyo và nhận phòng",
      },
      {
        day: 1,
        sortOrder: 2,
        title: "Khám phá Shibuya",
      },
      {
        day: 2,
        sortOrder: 1,
        title: "Tham quan Tokyo Tower",
      },
      {
        day: 2,
        sortOrder: 2,
        title: "Khám phá Roppongi",
      },
      {
        day: 3,
        sortOrder: 1,
        title: "Tham quan Asakusa",
      },
      {
        day: 3,
        sortOrder: 2,
        title: "Đền Sensō-ji",
      },
      {
        day: 4,
        sortOrder: 1,
        title: "Khám phá Shinjuku",
      },
      {
        day: 4,
        sortOrder: 2,
        title: "Mua sắm tại Akihabara",
      },
      {
        day: 5,
        sortOrder: 1,
        title: "Trả phòng và trở về",
      },
    ],
  },
  {
    name: "Paris – Thành phố ánh sáng",
    destination: "Paris, Pháp",
    startDate: new Date("2027-05-05"),
    endDate: new Date("2027-05-09"),
    travelerCount: 2,
    budgetTarget: 50000000,
    currency: "VND",
    coverImageUrl: "/uploads/upload_image/thap-eiffel.jpg",
    itinerary: [
      {
        day: 1,
        sortOrder: 1,
        title: "Đến Paris và nhận phòng",
      },
      {
        day: 1,
        sortOrder: 2,
        title: "Dạo sông Seine",
      },
      {
        day: 2,
        sortOrder: 1,
        title: "Tham quan Tháp Eiffel",
      },
      {
        day: 2,
        sortOrder: 2,
        title: "Quảng trường Trocadéro",
      },
      {
        day: 3,
        sortOrder: 1,
        title: "Bảo tàng Louvre",
      },
      {
        day: 3,
        sortOrder: 2,
        title: "Khải Hoàn Môn",
      },
      {
        day: 4,
        sortOrder: 1,
        title: "Nhà thờ Sacré-Cœur",
      },
      {
        day: 4,
        sortOrder: 2,
        title: "Khám phá Montmartre",
      },
      {
        day: 5,
        sortOrder: 1,
        title: "Mua sắm và trở về",
      },
    ],
  },
  {
    name: "Versailles trong ngày",
    destination: "Versailles, Pháp",
    startDate: new Date("2027-05-10"),
    endDate: new Date("2027-05-11"),
    travelerCount: 2,
    budgetTarget: 12000000,
    currency: "VND",
    coverImageUrl: "/uploads/upload_image/cung-dien-versailles.jpg",
    itinerary: [
      {
        day: 1,
        sortOrder: 1,
        title: "Di chuyển từ Paris đến Versailles",
      },
      {
        day: 1,
        sortOrder: 2,
        title: "Tham quan Cung điện Versailles",
      },
      {
        day: 1,
        sortOrder: 3,
        title: "Khám phá Hall of Mirrors",
      },
      {
        day: 1,
        sortOrder: 4,
        title: "Tham quan khu vườn Versailles",
      },
      {
        day: 2,
        sortOrder: 1,
        title: "Tham quan Grand Trianon",
      },
      {
        day: 2,
        sortOrder: 2,
        title: "Trở về Paris",
      },
    ],
  },
];

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: "testtrip@gmail.com",
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error(
      "Không tìm thấy tài khoản testtrip@gmail.com trong database.",
    );
  }

  console.log(
    `Đang tạo Trip cho: ${user.name} (${user.email})`,
  );

  for (const trip of trips) {
    const existing = await prisma.trip.findFirst({
  where: {
    ownerId: user.id,
    name: trip.name,
  },
  select: {
    id: true,
  },
});

    if (existing) {
      console.log(
        `Bỏ qua vì đã tồn tại: ${trip.name}`,
      );

      continue;
    }

    const created =
      await prisma.trip.create({
        data: {
          ownerId: user.id,
          name: trip.name,
          destination:
            trip.destination,
          startDate:
            trip.startDate,
          endDate:
            trip.endDate,
          travelerCount:
            trip.travelerCount,
          budgetTarget:
            trip.budgetTarget,
          currency:
            trip.currency,
          status:
            "SCHEDULED",
          visibility:
            "PUBLIC",
          coverImageUrl:
            trip.coverImageUrl,

          itineraryItems: {
            create:
              trip.itinerary.map(
                (item) => ({
                  day:
                    item.day,
                  sortOrder:
                    item.sortOrder,
                  title:
                    item.title,
                }),
              ),
          },
        },

        select: {
          id: true,
          name: true,
        },
      });

    console.log(
      `Đã tạo: ${created.name} - ${created.id}`,
    );
  }

  console.log(
    "Hoàn tất tạo 6 Trip mẫu.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Seed thất bại:",
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });