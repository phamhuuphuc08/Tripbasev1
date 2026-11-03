import { prisma } from "@/server/db/client";

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildLast30Days() {
  const result: string[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    result.push(getDateKey(date));
  }

  return result;
}

export async function getAdminDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    userCount,
    tripCount,
    publicTripCount,
    tagCount,
    copyCount,
    pendingTagCount,
    suspendedUserCount,
    recentUsers,
    recentTrips,
    pendingTags,
    approvedTags,
    rejectedTags,
    ideaTrips,
    scheduledTrips,
    completedTrips,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { visibility: "PUBLIC" } }),
    prisma.locationTag.count(),
    prisma.planCopy.count(),
    prisma.locationTag.count({ where: { approvalStatus: "PENDING" } }),
    prisma.user.count({ where: { deletedAt: null, suspendedUntil: { gt: now } } }),
    prisma.user.findMany({
      where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.trip.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.locationTag.count({ where: { approvalStatus: "PENDING" } }),
    prisma.locationTag.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.locationTag.count({ where: { approvalStatus: "REJECTED" } }),
    prisma.trip.count({ where: { status: "IDEA" } }),
    prisma.trip.count({ where: { status: "SCHEDULED" } }),
    prisma.trip.count({ where: { status: "COMPLETED" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        description: true,
        action: true,
        createdAt: true,
        admin: { select: { name: true } },
      },
    }),
  ]);

  const dateKeys = buildLast30Days();
  const userMap = new Map<string, number>();
  const tripMap = new Map<string, number>();

  for (const key of dateKeys) {
    userMap.set(key, 0);
    tripMap.set(key, 0);
  }

  for (const user of recentUsers) {
    const key = getDateKey(user.createdAt);
    userMap.set(key, (userMap.get(key) ?? 0) + 1);
  }

  for (const trip of recentTrips) {
    const key = getDateKey(trip.createdAt);
    tripMap.set(key, (tripMap.get(key) ?? 0) + 1);
  }

  const usersByDay = dateKeys.map((date) => ({ date, users: userMap.get(date) ?? 0 }));
  const tripsByDay = dateKeys.map((date) => ({ date, trips: tripMap.get(date) ?? 0 }));

  const tagStatuses = [
    { status: "PENDING", count: pendingTags },
    { status: "APPROVED", count: approvedTags },
    { status: "REJECTED", count: rejectedTags },
  ];

  const tripStatuses = [
    { status: "IDEA", count: ideaTrips },
    { status: "SCHEDULED", count: scheduledTrips },
    { status: "COMPLETED", count: completedTrips },
  ];

  const recentActivities = recentAuditLogs.map((log) => ({
    id: log.id,
    description: log.description || log.action,
    adminName: log.admin?.name || null,
    createdAt: log.createdAt,
  }));

  return {
    userCount,
    tripCount,
    publicTripCount,
    tagCount,
    copyCount,
    pendingTagCount,
    suspendedUserCount,
    usersByDay,
    tripsByDay,
    tagStatuses,
    tripStatuses,
    recentActivities,
  };
}