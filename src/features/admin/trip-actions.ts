"use server";

import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminTrip, listAdminTrips } from "@/server/admin/trip-admin.service";

export async function listAdminTripsAction(query = "") {
  await requireAdmin();
  return listAdminTrips(query);
}

export async function getAdminTripAction(tripId: string) {
  await requireAdmin();
  return getAdminTrip(tripId);
}