/*
  Warnings:

  - Added the required column `title` to the `itinerary_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `itinerary_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "itinerary_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "itinerary_items_trip_id_day_sort_order_idx" ON "itinerary_items"("trip_id", "day", "sort_order");
