-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "budget_level" TEXT,
ADD COLUMN     "travel_interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "travel_style" TEXT;
