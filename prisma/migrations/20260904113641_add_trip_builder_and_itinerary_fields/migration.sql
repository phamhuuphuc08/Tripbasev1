-- CreateEnum
CREATE TYPE "TravelPace" AS ENUM ('RELAXED', 'NORMAL', 'BUSY');

-- AlterTable
ALTER TABLE "itinerary_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "budget_target" DECIMAL(65,30),
ADD COLUMN     "pace" "TravelPace" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "travel_style" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "traveler_count" INTEGER NOT NULL DEFAULT 1;
