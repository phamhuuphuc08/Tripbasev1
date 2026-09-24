-- AlterTable
ALTER TABLE "itinerary_items" ADD COLUMN     "copied_from_item_id" TEXT;

-- AlterTable
ALTER TABLE "plan_copies" ADD COLUMN     "initial_item_count" INTEGER NOT NULL DEFAULT 0;
