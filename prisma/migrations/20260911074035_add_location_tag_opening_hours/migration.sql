-- Drop old itinerary index no longer declared in schema.prisma
DROP INDEX "itinerary_items_trip_id_day_idx";

-- LocationTag opening hours
ALTER TABLE "location_tags"
ADD COLUMN "opening_hours" TEXT;

-- Vote lookup index
CREATE INDEX "votes_target_type_item_id_user_id_idx"
ON "votes"("target_type", "item_id", "user_id");

-- Comment timeline index
CREATE INDEX "comments_item_id_created_at_idx"
ON "comments"("item_id", "created_at");

-- Convert old itinerary times anchored at 1970-01-01
-- to real timestamps based on Trip.startDate + (day - 1).
UPDATE "itinerary_items" AS i
SET "start_time" =
  (
    (
      t."start_date"::date + (i."day" - 1)
    )::timestamp + i."start_time"::time
  )
FROM "trips" AS t
WHERE i."trip_id" = t."id"
  AND t."start_date" IS NOT NULL
  AND i."start_time" IS NOT NULL
  AND EXTRACT(YEAR FROM i."start_time") = 1970;

UPDATE "itinerary_items" AS i
SET "end_time" =
  (
    (
      t."start_date"::date + (i."day" - 1)
    )::timestamp + i."end_time"::time
  )
FROM "trips" AS t
WHERE i."trip_id" = t."id"
  AND t."start_date" IS NOT NULL
  AND i."end_time" IS NOT NULL
  AND EXTRACT(YEAR FROM i."end_time") = 1970;