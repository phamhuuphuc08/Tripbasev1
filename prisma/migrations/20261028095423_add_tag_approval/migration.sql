-- CreateEnum
CREATE TYPE "TagApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "location_tags"
ADD COLUMN "approval_status" "TagApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "review_note" TEXT,
ADD COLUMN "reviewed_at" TIMESTAMP(3);

-- Existing tags were already visible before moderation was introduced,
-- so keep them approved.
UPDATE "location_tags"
SET "approval_status" = 'APPROVED';

-- CreateIndex
CREATE INDEX "location_tags_approval_status_idx"
ON "location_tags"("approval_status");