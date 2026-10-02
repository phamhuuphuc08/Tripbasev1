-- CreateTable
CREATE TABLE "plan_reputations" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "copyplan_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligible_copy_count" INTEGER NOT NULL DEFAULT 0,
    "adjusted_copy_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_post_trip_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diversity_bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_copy_at" TIMESTAMP(3),
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_reputations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_reputations_plan_id_key" ON "plan_reputations"("plan_id");

-- CreateIndex
CREATE INDEX "plan_reputations_copyplan_score_idx" ON "plan_reputations"("copyplan_score");

-- AddForeignKey
ALTER TABLE "plan_reputations" ADD CONSTRAINT "plan_reputations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
