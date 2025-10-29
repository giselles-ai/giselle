ALTER TABLE "agents" ALTER COLUMN "graphv2" SET DEFAULT '{"nodes":[],"connectors":[],"artifacts":[]}'::jsonb;

-- Migrate existing data

UPDATE "agents" SET "graphv2" = jsonb_set("graphv2", '{artifacts}', '[]'::jsonb);
