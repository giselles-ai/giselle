BEGIN;

-- Drop existing unique constraint
ALTER TABLE "github_repository_content_status" DROP CONSTRAINT "gh_content_status_unique";

-- Add new column with temporary default value
ALTER TABLE "github_repository_content_status" ADD COLUMN "embedding_profile_id" integer DEFAULT 1 NOT NULL;

-- Drop the default value
ALTER TABLE "github_repository_content_status" ALTER COLUMN "embedding_profile_id" DROP DEFAULT;

-- Add new unique constraint with embedding_profile_id
ALTER TABLE "github_repository_content_status" ADD CONSTRAINT "gh_content_status_unique" UNIQUE("repository_index_db_id","embedding_profile_id","content_type");

COMMIT;