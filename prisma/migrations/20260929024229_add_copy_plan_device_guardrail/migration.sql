-- AlterTable
ALTER TABLE "plan_copies" ADD COLUMN     "copier_device_hash" TEXT;

-- CreateIndex
CREATE INDEX "plan_copies_original_plan_id_copier_device_hash_idx" ON "plan_copies"("original_plan_id", "copier_device_hash");
