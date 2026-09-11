-- CreateEnum
CREATE TYPE "TravelPace" AS ENUM ('RELAXED', 'NORMAL', 'BUSY');

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "budget_target" DECIMAL(65,30),
ADD COLUMN     "pace" "TravelPace" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "travel_style" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "traveler_count" INTEGER NOT NULL DEFAULT 1;
