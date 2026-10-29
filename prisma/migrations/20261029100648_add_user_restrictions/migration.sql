-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "suspended_until" TIMESTAMP(3),
ADD COLUMN     "suspension_reason" TEXT,
ADD COLUMN     "tag_block_reason" TEXT,
ADD COLUMN     "tag_create_blocked_until" TIMESTAMP(3),
ADD COLUMN     "trip_block_reason" TEXT,
ADD COLUMN     "trip_create_blocked_until" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_suspended_until_idx" ON "users"("suspended_until");

-- CreateIndex
CREATE INDEX "users_trip_create_blocked_until_idx" ON "users"("trip_create_blocked_until");

-- CreateIndex
CREATE INDEX "users_tag_create_blocked_until_idx" ON "users"("tag_create_blocked_until");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
