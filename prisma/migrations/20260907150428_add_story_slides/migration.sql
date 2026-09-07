-- CreateTable
CREATE TABLE "story_slides" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "day" INTEGER,
    "caption" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'SUNSET',
    "photo" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "story_slides_trip_id_idx" ON "story_slides"("trip_id");

-- AddForeignKey
ALTER TABLE "story_slides" ADD CONSTRAINT "story_slides_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
