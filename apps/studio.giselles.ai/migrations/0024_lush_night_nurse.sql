ALTER TABLE "user_seat_usage_reports" ADD COLUMN "value" integer;
ALTER TABLE "user_seat_usage_reports" ADD COLUMN "is_delta" boolean;

UPDATE "user_seat_usage_reports"
SET "value" = array_length("user_db_id_list", 1),
    "is_delta" = false;

ALTER TABLE "user_seat_usage_reports" ALTER COLUMN "value" SET NOT NULL;
ALTER TABLE "user_seat_usage_reports" ALTER COLUMN "is_delta" SET NOT NULL;
